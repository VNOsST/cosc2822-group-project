# Production Seeding Guide

This guide explains how to seed your production DynamoDB tables with initial data.

## Prerequisites

1.  **AWS Credentials**: Ensure you have AWS credentials configured in your environment that have `dynamodb:PutItem` permissions on the target tables.
2.  **Environment Variables**: You need to specify the table names as they appear in your production environment (e.g., `cinecloud-movies-prod`).

## Step 1: Install Dependencies

If you haven't already, install the dependencies in the `database` directory:

```bash
cd database
bun install
```

## Step 2: Configure Environment Variables

Create a temporary script or set environment variables in your terminal. For example, if your environment is `prod`:

### Windows (PowerShell)
```powershell
$env:DYNAMODB_REGION = "us-east-1" # Replace with your region
$env:MOVIES_TABLE = "cinecloud-movies-prod"
$env:SHOWTIMES_TABLE = "cinecloud-showtimes-prod"
$env:BOOKINGS_TABLE = "cinecloud-bookings-prod"
$env:ROOMS_TABLE = "cinecloud-rooms-prod"
$env:RATINGS_TABLE = "cinecloud-ratings-prod"
# The following tables are optional/extra in the seed script:
$env:USERS_TABLE = "Users" # Or actual prod name if it exists
$env:NOTIFICATIONS_TABLE = "Notifications" 
```

### macOS / Linux
```bash
export DYNAMODB_REGION="us-east-1"
export MOVIES_TABLE="cinecloud-movies-prod"
export SHOWTIMES_TABLE="cinecloud-showtimes-prod"
export BOOKINGS_TABLE="cinecloud-bookings-prod"
export ROOMS_TABLE="cinecloud-rooms-prod"
export RATINGS_TABLE="cinecloud-ratings-prod"
```

## Step 3: Run the Seed Script

Run the seeding command:

```bash
bun run seed
```

## Important Considerations

- **Data Overwrite**: The seed script uses `PutCommand`, which will overwrite items with the same partition/sort key if they already exist.
- **Costs**: Seeding a production database incurs DynamoDB write costs. Ensure you are aware of the volume of data being pushed.
- **Permissions**: If you are running this from a local machine, ensure your AWS CLI is authenticated with sufficient permissions.
