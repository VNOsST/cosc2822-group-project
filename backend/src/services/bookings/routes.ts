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
import { requireAuth, requireRole, getUser } from "../../shared/middleware";
import { validateLocks, releaseLocksForBooking } from "../../shared/cache/redis-client";
import type { Booking, Showtime, Movie, User, Room } from "../../shared/types/entities";
import { notifyAdmins } from "../../shared/notifications/sns-client";
import { LOW_SEAT_THRESHOLD_PERCENT } from "../../shared/notifications/types";

const bookings = new Hono();

// Validation schemas
const createBookingSchema = z.object({
  user_email: z.string().email(),
  user_id: z.string(),
  showtime_id: z.string(),
  movie_id: z.string(),
  seats: z.array(z.string()).min(1),
  total_amount: z.number().positive(),
  lock_id: z.string().optional(), // Optional lock_id for seat lock validation
});

// GET /bookings - Get user's bookings with details
bookings.get("/", requireAuth(), async (c) => {
  const user = getUser(c);
  const userEmail = user.email;

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

    const bookings = result.Items as Booking[];

    // Fetch related data for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Fetch movie
        let movie;
        try {
          const movieResult = await docClient.send(
            new GetCommand({
              TableName: TABLE_NAMES.MOVIES,
              Key: { id: booking.movie_id },
            }),
          );
          movie = movieResult.Item as Movie | undefined;
        } catch (error) {
          console.error(`Error fetching movie ${booking.movie_id}:`, error);
        }

        // Fetch showtime
        let showtime;
        let room;
        try {
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
          showtime = showtimeResult.Items?.[0] as Showtime | undefined;

          // Fetch room if showtime exists
          if (showtime?.room_id) {
            const roomResult = await docClient.send(
              new GetCommand({
                TableName: TABLE_NAMES.ROOMS,
                Key: { room_id: showtime.room_id },
              }),
            );
            room = roomResult.Item;
          }
        } catch (error) {
          console.error(`Error fetching showtime ${booking.showtime_id}:`, error);
        }

        return {
          ...booking,
          movie,
          showtime,
          room,
        };
      }),
    );

    return c.json({
      success: true,
      data: bookingsWithDetails,
      count: bookingsWithDetails.length,
    });
  } catch (error) {
    console.error("[bookings]", "Error fetching bookings:", error);
    return c.json({ success: false, error: "Failed to fetch bookings" }, 500);
  }
});

// GET /bookings/showtime/:showtimeId - Get bookings for a showtime (admin)
bookings.get("/showtime/:showtimeId", requireRole(["Admins"]), async (c) => {
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

// GET /bookings/admin/all - Get all bookings with filters (admin)
bookings.get("/admin/all", requireRole(["Admins"]), async (c) => {
  const status = c.req.query("status");
  const date = c.req.query("date");
  const movieId = c.req.query("movie_id");
  const search = c.req.query("search");

  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAMES.BOOKINGS,
      }),
    );

    let bookings = result.Items as Booking[];

    // Apply filters
    if (status && status !== "all") {
      bookings = bookings.filter((b) => b.status === status);
    }

    if (date) {
      const targetDate = new Date(date).toISOString().split("T")[0];
      bookings = bookings.filter((b) => {
        const bookingDate = new Date(b.booking_date).toISOString().split("T")[0];
        return bookingDate === targetDate;
      });
    }

    if (movieId) {
      bookings = bookings.filter((b) => b.movie_id === movieId);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.user_email.toLowerCase().includes(searchLower) ||
          b.user_id.toLowerCase().includes(searchLower),
      );
    }

    // Fetch related data for each booking
    const bookingsWithDetails = await Promise.all(
      bookings.map(async (booking) => {
        // Fetch user
        let user;
        try {
          const userResult = await docClient.send(
            new GetCommand({
              TableName: TABLE_NAMES.USERS,
              Key: { id: booking.user_id },
            }),
          );
          user = userResult.Item as User | undefined;
        } catch (error) {
          console.error(`Error fetching user ${booking.user_id}:`, error);
        }

        // Fetch movie
        let movie;
        try {
          const movieResult = await docClient.send(
            new GetCommand({
              TableName: TABLE_NAMES.MOVIES,
              Key: { id: booking.movie_id },
            }),
          );
          movie = movieResult.Item as Movie | undefined;
        } catch (error) {
          console.error(`Error fetching movie ${booking.movie_id}:`, error);
        }

        // Fetch showtime
        let showtime;
        let room;
        try {
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
          showtime = showtimeResult.Items?.[0] as Showtime | undefined;

          // Fetch room if showtime exists
          if (showtime?.room_id) {
            const roomResult = await docClient.send(
              new GetCommand({
                TableName: TABLE_NAMES.ROOMS,
                Key: { room_id: showtime.room_id },
              }),
            );
            room = roomResult.Item;
          }
        } catch (error) {
          console.error(`Error fetching showtime ${booking.showtime_id}:`, error);
        }

        return {
          ...booking,
          user,
          movie,
          showtime,
          room,
        };
      }),
    );

    return c.json({
      success: true,
      data: bookingsWithDetails,
      count: bookingsWithDetails.length,
    });
  } catch (error) {
    console.error("[bookings]", "Error fetching all bookings:", error);
    return c.json({ success: false, error: "Failed to fetch bookings" }, 500);
  }
});

// POST /bookings - Create a new booking
bookings.post("/", requireAuth(), async (c) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const validationResult = createBookingSchema.safeParse(body);

    if (!validationResult.success) {
      return c.json({ success: false, error: validationResult.error.errors }, 400);
    }

    const data = validationResult.data;
    const bookingId = crypto.randomUUID();

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

    // Validate seat locks if lock_id is provided
    if (data.lock_id) {
      try {
        const lockValidation = await validateLocks(
          data.showtime_id,
          data.seats,
          user.sub,
          data.lock_id,
        );
        if (!lockValidation.valid) {
          return c.json(
            {
              success: false,
              error: "Seat lock validation failed. Your locks may have expired.",
              invalid_seats: lockValidation.invalidSeats,
            },
            409,
          );
        }
      } catch (lockError) {
        console.warn("[bookings]", "Lock validation skipped (Redis unavailable):", lockError);
        // Continue without lock validation if Redis is unavailable
      }
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

    // Fetch movie and room details for notification
    let movieTitle = "Unknown Movie";
    let roomName = "Unknown Room";
    let totalCapacity = 0;

    try {
      const movieResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.MOVIES,
          Key: { id: data.movie_id },
        }),
      );
      if (movieResult.Item) {
        movieTitle = (movieResult.Item as Movie).title;
      }

      const roomResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.ROOMS,
          Key: { room_id: showtime.room_id, sk: "METADATA" },
        }),
      );
      if (roomResult.Item) {
        const room = roomResult.Item as Room;
        roomName = room.name;
        totalCapacity =
          room.layout_config.rows * room.layout_config.columns - (room.unavailable?.length || 0);
      }
    } catch (error) {
      console.error("[bookings] Error fetching details for notification:", error);
    }

    // Send admin notification for new booking
    await notifyAdmins({
      type: "booking_created",
      bookingId,
      userEmail: data.user_email,
      movieTitle,
      showtime: showtime.start_time,
      roomName,
      seats: data.seats,
      totalAmount: data.total_amount,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error("[bookings] Failed to send booking notification:", err));

    // Check for low seat availability and send alert if threshold reached
    if (totalCapacity > 0) {
      const occupiedCount = newOccupiedSeats.length;
      const percentageFilled = (occupiedCount / totalCapacity) * 100;

      if (percentageFilled >= LOW_SEAT_THRESHOLD_PERCENT) {
        const remainingSeats = totalCapacity - occupiedCount;

        await notifyAdmins({
          type: "low_seat_availability",
          showtimeId: data.showtime_id,
          movieTitle,
          showtime: showtime.start_time,
          roomName,
          remainingSeats,
          totalCapacity,
          percentageFilled: Math.round(percentageFilled),
          timestamp: new Date().toISOString(),
        }).catch((err) => console.error("[bookings] Failed to send low seat notification:", err));

        console.log(
          `[bookings] Low seat availability alert: ${movieTitle} at ${showtime.start_time} - ${remainingSeats}/${totalCapacity} seats remaining (${Math.round(percentageFilled)}% filled)`,
        );
      }
    }
    // Release seat locks after successful booking
    if (data.lock_id) {
      try {
        await releaseLocksForBooking(data.showtime_id, data.seats);
      } catch (lockError) {
        console.warn("[bookings]", "Failed to release locks (non-critical):", lockError);
        // Non-critical error - booking was successful, locks will expire automatically
      }
    }

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
bookings.delete("/:userEmail/:bookingId", requireAuth(), async (c) => {
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

    // Check if booking is already cancelled
    if (booking.status === "cancelled") {
      return c.json({ success: false, error: "Booking is already cancelled" }, 400);
    }

    // Validate 6-hour cancellation window
    const bookingTime = new Date(booking.booking_date).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceBooking = (currentTime - bookingTime) / (1000 * 60 * 60);

    if (hoursSinceBooking > 6) {
      return c.json(
        {
          success: false,
          error: "Booking can only be cancelled within 6 hours of booking time",
        },
        400,
      );
    }

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

    // Fetch movie and room details for cancellation notification
    let movieTitle = "Unknown Movie";
    let roomName = "Unknown Room";
    let showtimeStr = "Unknown";

    try {
      const movieResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.MOVIES,
          Key: { id: booking.movie_id },
        }),
      );
      if (movieResult.Item) {
        movieTitle = (movieResult.Item as Movie).title;
      }

      if (showtimeResult.Items && showtimeResult.Items.length > 0) {
        const showtime = showtimeResult.Items[0] as Showtime;
        showtimeStr = showtime.start_time;

        const roomResult = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAMES.ROOMS,
            Key: { room_id: showtime.room_id, sk: "METADATA" },
          }),
        );
        if (roomResult.Item) {
          roomName = (roomResult.Item as Room).name;
        }
      }
    } catch (error) {
      console.error("[bookings] Error fetching details for cancellation notification:", error);
    }

    // Send admin notification for booking cancellation
    await notifyAdmins({
      type: "booking_cancelled",
      bookingId: booking.booking_id,
      userEmail: booking.user_email,
      movieTitle,
      showtime: showtimeStr,
      roomName,
      seats: Array.isArray(booking.seats) ? booking.seats : Array.from(booking.seats || []),
      refundAmount: booking.total_amount,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error("[bookings] Failed to send cancellation notification:", err));

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
bookings.get("/:userEmail/:bookingId", requireAuth(), async (c) => {
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
