# Movie Sync Scheduled Job

This module contains the scheduled Lambda function that syncs movie data from TMDB (The Movie Database) API.

## Overview

The Movie Sync job runs daily at 2:00 AM UTC (12:00 PM AEST) and performs two main tasks:

1. **Fetch New Movies**: Retrieves now playing and upcoming movies from TMDB and creates them in DynamoDB if they don't already exist.

2. **Update Ratings**: Updates the rating and popularity score for movies released within the last 30 days. Movies older than one month are skipped to reduce API calls.

## Files

- `index.ts` - Main Lambda handler with sync logic
- `tmdb-client.ts` - TMDB API client wrapper

## Configuration

### Environment Variables

| Variable       | Description                     | Required              |
| -------------- | ------------------------------- | --------------------- |
| `TMDB_API_KEY` | TMDB API key for authentication | Yes                   |
| `MOVIES_TABLE` | DynamoDB Movies table name      | Yes (auto-set by SAM) |

### Getting a TMDB API Key

1. Create an account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to Settings > API
3. Request an API key (choose "Developer" option)
4. Copy the API Key (v3 auth)

### Deploying with TMDB API Key

```bash
# Deploy with API key
sam deploy --parameter-overrides TMDBApiKey=your_api_key_here

# Or add to samconfig.toml
# [default.deploy.parameters]
# parameter_overrides = "TMDBApiKey=your_api_key_here"
```

## Schedule

The job runs on a cron schedule: `cron(0 2 * * ? *)`

- **Time**: 2:00 AM UTC daily
- **Australian Time**: 12:00 PM AEST / 1:00 PM AEDT

## What Gets Synced

### New Movies

- Movies currently playing in theaters (AU region)
- Upcoming movies (AU region)
- Up to 2 pages from each category (~40 movies total)

### Movie Data Stored

| Field                   | Source                |
| ----------------------- | --------------------- |
| `tmdb_id`               | TMDB movie ID         |
| `title`                 | Movie title           |
| `synopsis`              | Overview/description  |
| `runtime`               | Duration in minutes   |
| `release_date`          | Release date          |
| `poster_url`            | Poster image URL      |
| `image_urls`            | Backdrop images       |
| `genres`                | Genre names           |
| `cast`                  | Top 10 cast members   |
| `rating`                | TMDB vote average     |
| `tmdb_popularity_score` | TMDB popularity score |

### Rating Updates

Movies are eligible for rating updates if:

- Released within the last 30 days
- Already exists in the database

This ensures newly released movies get accurate ratings as more users review them.

## Testing Locally

You can invoke the function locally using SAM:

```bash
# Build first
sam build

# Invoke locally (requires TMDB_API_KEY env var)
sam local invoke MovieSyncFunction --env-vars env.json
```

Create `env.json`:

```json
{
    "MovieSyncFunction": {
        "TMDB_API_KEY": "your_api_key_here"
    }
}
```

## Manual Invocation

To manually trigger the sync in AWS:

```bash
aws lambda invoke \
  --function-name cinecloud-movie-sync-dev \
  --payload '{}' \
  response.json
```

## Monitoring

Check CloudWatch Logs for execution details:

- Log Group: `/aws/lambda/cinecloud-movie-sync-{environment}`

The function logs:

- Number of movies found from TMDB
- New movies created
- Ratings updated
- Any errors encountered

## Rate Limiting

The function includes 250ms delays between API calls to respect TMDB's rate limits (40 requests per 10 seconds for free tier).
