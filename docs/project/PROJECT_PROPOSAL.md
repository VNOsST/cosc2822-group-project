**COSC2822** \- CLOUD DEVELOPING

# **ASSIGNMENT 3** **PROJECT PROPOSAL**

**\_\_\_**

## **By Team 3**

Ton That Huu Luan \- s3958304

Tran Manh Cuong \- s3974735

Tutorial Lecturer & Course Coordinator: Mr. Long Nguyen

# **Background**

The modern cinema-going experience often suffers from significant inefficiencies in the booking process, resulting in customer frustration and substantial revenue loss for theater operators. Patrons regularly face outdated or inconsistent showtime information, booking conflicts when multiple users attempt to reserve the same seats simultaneously, and a lack of timely screening reminders that contribute to no-shows and underfilled auditoriums.

These challenges are not hypothetical \- they have been highlighted on a global scale during major blockbuster releases. For example, during the pre-sale launch of _Avengers: Endgame_, demand was so overwhelming that multiple ticketing platforms crashed, leaving customers unable to complete purchases and creating widespread dissatisfaction \[1,2\]. A similar scenario unfolded with _Spider-Man: No Way Home_, where unprecedented traffic again caused major box office websites and apps to fail during peak demand \[3\].

Meanwhile, theater administrators struggle with fragmented and outdated management systems that complicate scheduling, inventory control, and customer engagement tracking. Without a unified and responsive platform, cinemas are unable to adapt quickly to demand spikes, manage seat allocation efficiently, or deliver a seamless booking experience, ultimately hurting both operational performance and customer satisfaction.

This project proposes a comprehensive cinema management and booking platform designed to streamline the entire moviegoing experience for both customers and theater operators.

The system will provide real-time movie information and scheduling through integration with industry-standard film databases, ensuring accurate and up-to-date content.

Customers will benefit from an intuitive seat selection interface with temporary reservation locks to prevent double-booking, automated reminder notifications to reduce missed screenings, and the ability to provide post-viewing feedback that contributes to community-driven film recommendations.

For theater administrators, the platform offers centralized control over venue configuration, screening schedules, and booking oversight, with insights into customer preferences and occupancy patterns.

# **Features**

This product aims to have the following features:

## **Movie Discovery & Ranking**

- **Browse Movies**: Display current and upcoming movies sorted by composite ranking and audience counts.
- **Movies Details**: Present detailed information, including poster, synopsis, casts, runtime, genres, and release date.
- **Hybrid Ranking Model**: Combine local user ratings with external API popularity scores to generate a composite ranking.
- **Showtime Listings**: List all scheduled screenings for each movie across cinemas and rooms, with date and time filters.
- **Daily Data Synchronization**: Refresh movie information and popularity metrics daily via the external API to ensure up-to-date details and accuracy.

## **Automated User Notifications**

- **Showtime Reminders**: Send automated reminders 1 day and 1 hour before a user’s booked screening.
- **Showtime Update / Cancellation Alerts**: Notify affected users when a booked showtime is changed or cancelled.
- **Post-Show Rating Prompt**: Deliver a follow-up notification 1 hour after the scheduled showtime to request a rating and optional review.

## **Booking System**

- **Browse Available Showtimes**: Display all scheduled screenings with movie details, venue information, and available seat counts
- **Interactive Seat Map**: Visual representation of theater room layout showing available, occupied, and selected seats
- **Temporary Seat Locking**: Reserve selected seats for 10 minutes during the checkout process to prevent conflicts
- **Multi-Seat Selection**: Allow users to book multiple seats in a single transaction for group bookings
- **Booking Confirmation**: Finalize the reservation with the user's details
- **Booking Summary**: Display confirmation details, including movie, showtime, seat numbers, and total price
- **View My Bookings**: Personal dashboard showing all current and past reservations
- **Booking Cancellation**: Cancel reservations up to 6 hours before showtime with automatic seat release
- **Automatic Lock Release**: Clear expired seat locks after timeout or upon successful booking by another user

## **Admin Management**

- **Room Configuration**: Define screening rooms with seating layouts, capacity
- **Movie Library Management**: Add, edit, or remove movies with manual entry or synchronized external data
- **Showtime Scheduling**: Create screening schedules by assigning movies to rooms with specific dates and times
- **Bulk Schedule Creation**: Generate multiple showtimes for recurring screenings (e.g., daily showings for a week)
- **Booking Overview**: View all bookings across theaters with filtering by date, movie, or status
- **Booking Details**: Access individual booking information, including customer details and seat assignments
- **Schedule Conflict Prevention**: Validation to prevent double-booking of rooms at overlapping times
- **Review Management:** Remove spam-like reviews.

# **Technologies & System Architecture**

## **AWS Services**

| Service            | Purpose / Use Case in the System                                                                                                                                                    |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Amazon API Gateway | Provides a managed REST API layer with built-in load balancing, request throttling, and secure routing of client requests to backend services.                                      |
| AWS Lambda         | Implements serverless backend microservices for movie discovery, booking, seat management, reviews, and administrative operations with automatic scaling and multi-AZ availability. |
| Amazon DynamoDB    | Serves as the primary NoSQL data store for movies, showtimes, bookings, seats, and user ratings, supporting high-concurrency access patterns with built-in fault tolerance.         |
| Amazon ECS & ECR   | Stores frontend and admin applications as container images in ECR and runs them on ECS with service-level load balancing and automatic scaling.                                     |
| AWS Step Functions | Orchestrates multi-step workflows such as seat booking, lock expiration, and notification scheduling with retry and error-handling mechanisms.                                      |
| AWS CodePipeline   | Automates the build and deployment of containerized applications and serverless components to ensure consistent and reliable releases.                                              |
| Amazon ElastiCache | Provides in-memory caching for frequently accessed data and manages temporary seat locks to prevent double booking and reduce database load.                                        |
| Amazon S3          | Stores static assets such as movie posters, images, and logos with high durability and availability.                                                                                |
| Amazon Cognito     | Manages secure authentication and authorization for users and administrators.                                                                                                       |
| Amazon SQS         | Enables asynchronous processing of booking-related events, decoupling services and improving system resilience during traffic spikes.                                               |
| Amazon SNS         | Sends automated notifications including booking confirmations, reminders, showtime updates, and post-show rating prompts.                                                           |

## **Architecture Diagram**

![][image1]

Figure 1\. Architecture Diagram

# **References**

\[1\] F. Pallotta, “‘Avengers: Endgame’ ticket pre-sale is chaos | CNN Business,” CNN, Apr. 02, 2019\. Available: https://www.cnn.com/2019/04/02/media/avengers-endgame-pre-sale-tickets. \[Accessed: Dec. 03, 2025\]

\[2\] X, “‘Avengers: Endgame’ advance ticket sales are already crashing websites,” Los Angeles Times, Apr. 02, 2019\. Available: https://www.latimes.com/entertainment/movies/la-et-mn-avengers-endgame-ticket-sales-20190402-story.html. \[Accessed: Dec. 03, 2025\]

\[3\] S. Whitten, “‘Spider-Man: No Way Home’ ticket demand crashed box office sites, and that’s a good thing,” CNBC, Nov. 29, 2021\. Available: https://www.cnbc.com/2021/11/29/spider-man-no-way-home-ticket-demand-crashed-box-office-sites.html. \[Accessed: Dec. 03, 2025\]
