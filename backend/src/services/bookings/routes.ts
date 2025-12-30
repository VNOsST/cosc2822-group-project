import { Hono } from "hono";
import { z } from "zod";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../../shared/db/client";
import type { Booking, Showtime, Movie } from "../../shared/types/entities";

const bookings = new Hono();

// Validation schemas
const createBookingSchema = z.object({
  user_email: z.string().email(),
  user_id: z.string(),
  showtime_id: z.string(),
  movie_id: z.string(),
  seats: z.array(z.string()).min(1),
  total_amount: z.number().positive(),
});

// GET /bookings - Get user's bookings
bookings.get("/", async (c) => {
  const userEmail = c.req.query("user_email");

  if (!userEmail) {
    return c.json({ success: false, error: "user_email is required" }, 400);
  }

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        KeyConditionExpression: "user_email = :email",
        ExpressionAttributeValues: {
          ":email": userEmail,
        },
      }),
    );

    return c.json({
      success: true,
      data: result.Items as Booking[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[bookings]", "Error fetching bookings:", error);
    return c.json({ success: false, error: "Failed to fetch bookings" }, 500);
  }
});

// GET /bookings/showtime/:showtimeId - Get bookings for a showtime (admin)
bookings.get("/showtime/:showtimeId", async (c) => {
  const { showtimeId } = c.req.param();

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": showtimeId,
        },
      }),
    );

    return c.json({
      success: true,
      data: result.Items as Booking[],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error("[bookings]", "Error fetching showtime bookings:", error);
    return c.json({ success: false, error: "Failed to fetch bookings" }, 500);
  }
});

// POST /bookings - Create a new booking
bookings.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validationResult = createBookingSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // First, get the showtime to check seat availability
    const showtimeResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": data.showtime_id,
        },
      }),
    );

    if (!showtimeResult.Items || showtimeResult.Items.length === 0) {
      return c.json({ success: false, error: "Showtime not found" }, 404);
    }

    const showtime = showtimeResult.Items[0] as Showtime;
    const occupiedSeats = new Set(showtime.occupied_seats || []);

    // Check if any requested seats are already occupied
    const conflictingSeats = data.seats.filter((seat) => occupiedSeats.has(seat));
    if (conflictingSeats.length > 0) {
      return c.json(
        {
          success: false,
          error: "Some seats are already booked",
          conflicting_seats: conflictingSeats,
        },
        409,
      );
    }

    // Create the booking
    const booking: Booking = {
      user_email: data.user_email,
      booking_id: bookingId,
      user_id: data.user_id,
      showtime_id: data.showtime_id,
      movie_id: data.movie_id,
      seats: data.seats,
      total_amount: data.total_amount,
      status: "confirmed",
      booking_date: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        Item: booking,
      }),
    );

    // Update showtime with occupied seats
    const newOccupiedSeats = [...occupiedSeats, ...data.seats];

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        Key: {
          movie_id: showtime.movie_id,
          start_time: showtime.start_time,
        },
        UpdateExpression: "SET occupied_seats = :seats",
        ExpressionAttributeValues: {
          ":seats": newOccupiedSeats,
        },
      }),
    );

    return c.json(
      {
        success: true,
        data: booking,
        message: "Booking created successfully",
      },
      201,
    );
  } catch (error) {
    console.error("[bookings]", "Error creating booking:", error);
    return c.json({ success: false, error: "Failed to create booking" }, 500);
  }
});

// DELETE /bookings/:userEmail/:bookingId - Cancel a booking
bookings.delete("/:userEmail/:bookingId", async (c) => {
  const { userEmail, bookingId } = c.req.param();

  try {
    // Get the booking first
    const bookingResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        Key: {
          user_email: userEmail,
          booking_id: bookingId,
        },
      }),
    );

    if (!bookingResult.Item) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }

    const booking = bookingResult.Item as Booking;

    // Get the showtime to release seats
    const showtimeResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": booking.showtime_id,
        },
      }),
    );

    if (showtimeResult.Items && showtimeResult.Items.length > 0) {
      const showtime = showtimeResult.Items[0] as Showtime;
      const occupiedSeats = showtime.occupied_seats || [];
      const seatsToRelease = new Set(booking.seats);
      const updatedSeats = occupiedSeats.filter((seat) => !seatsToRelease.has(seat));

      // Update showtime to release seats
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAMES.SHOWTIMES,
          Key: {
            movie_id: showtime.movie_id,
            start_time: showtime.start_time,
          },
          UpdateExpression: "SET occupied_seats = :seats",
          ExpressionAttributeValues: {
            ":seats": updatedSeats,
          },
        }),
      );
    }

    // Update booking status to cancelled
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        Key: {
          user_email: userEmail,
          booking_id: bookingId,
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "cancelled",
        },
      }),
    );

    return c.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("[bookings]", "Error cancelling booking:", error);
    return c.json({ success: false, error: "Failed to cancel booking" }, 500);
  }
});

// GET /bookings/:userEmail/:bookingId - Get booking details
bookings.get("/:userEmail/:bookingId", async (c) => {
  const { userEmail, bookingId } = c.req.param();

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.BOOKINGS,
        Key: {
          user_email: userEmail,
          booking_id: bookingId,
        },
      }),
    );

    if (!result.Item) {
      return c.json({ success: false, error: "Booking not found" }, 404);
    }

    const booking = result.Item as Booking;

    // Fetch showtime details
    const showtimeResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.SHOWTIMES,
        IndexName: "showtime_id-index",
        KeyConditionExpression: "showtime_id = :showtimeId",
        ExpressionAttributeValues: {
          ":showtimeId": booking.showtime_id,
        },
      }),
    );

    const showtime = showtimeResult.Items?.[0] as Showtime | undefined;

    // Fetch movie details
    let movie: Movie | undefined;
    if (booking.movie_id) {
      const movieResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.MOVIES,
          Key: { id: booking.movie_id },
        }),
      );
      movie = movieResult.Item as Movie | undefined;
    }

    return c.json({
      success: true,
      data: {
        ...booking,
        showtime,
        movie,
      },
    });
  } catch (error) {
    console.error("[bookings]", "Error fetching booking details:", error);
    return c.json({ success: false, error: "Failed to fetch booking details" }, 500);
  }
});

// GET /bookings/stats - Get booking statistics (admin)
bookings.get("/stats", async (c) => {
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.BOOKINGS,
      }),
    );

    let bookings = result.Items as Booking[];

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      bookings = bookings.filter((b) => {
        const bookingTime = new Date(b.booking_date).getTime();
        return bookingTime >= start && bookingTime <= end;
      });
    }

    // Calculate statistics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
    const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
    const totalRevenue = bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.total_amount, 0);
    const averageBookingValue = confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0;

    // Movie popularity (by booking count)
    const movieBookings: Record<string, number> = {};
    bookings.forEach((b) => {
      if (b.status === "confirmed") {
        movieBookings[b.movie_id] = (movieBookings[b.movie_id] || 0) + 1;
      }
    });

    const topMovies = Object.entries(movieBookings)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([movieId, count]) => ({
        movie_id: movieId,
        booking_count: count,
      }));

    return c.json({
      success: true,
      data: {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        cancelled_bookings: cancelledBookings,
        total_revenue: Math.round(totalRevenue * 100) / 100,
        average_booking_value: Math.round(averageBookingValue * 100) / 100,
        top_movies: topMovies,
      },
    });
  } catch (error) {
    console.error("[bookings]", "Error fetching booking statistics:", error);
    return c.json({ success: false, error: "Failed to fetch booking statistics" }, 500);
  }
});

export default bookings;
