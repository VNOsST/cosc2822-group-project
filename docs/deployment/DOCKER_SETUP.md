# Docker Setup Guide

Guide for using Docker and Docker Compose with CineCloud.

## Overview

CineCloud uses Docker Compose to run DynamoDB Local and its admin UI for local development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- Docker Compose (included with Docker Desktop)

## Configuration

The `docker-compose.yml` file in the project root defines two services:

### Services

#### 1. DynamoDB Local

- **Image**: `amazon/dynamodb-local:latest`
- **Port**: `8000`
- **Purpose**: Local DynamoDB instance for development
- **Data**: Persisted in `dynamodb-data` volume

#### 2. DynamoDB Admin

- **Image**: `aaronshaf/dynamodb-admin`
- **Port**: `8001`
- **Purpose**: Web UI for managing DynamoDB tables
- **Access**: http://localhost:8001

## Quick Start

### Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:

```
NAME                      STATUS          PORTS
cinecloud-dynamodb        Up (healthy)    0.0.0.0:8000->8000/tcp
cinecloud-dynamodb-admin  Up              0.0.0.0:8001->8001/tcp
```

### Stop Services

```bash
# Stop services (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

## Managing Services

### View Logs

```bash
# All services
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Specific service
docker-compose logs dynamodb-local
docker-compose logs dynamodb-admin
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart dynamodb-local
```

### Check Service Status

```bash
# Show running containers
docker-compose ps

# Show detailed service info
docker-compose ps -a
```

## Data Persistence

### Volume Management

Data is stored in a Docker volume named `dynamodb-data`:

```bash
# List volumes
docker volume ls | grep dynamodb

# Inspect volume
docker volume inspect cosc2822-group-project_dynamodb-data

# Remove volume (WARNING: deletes all data)
docker volume rm cosc2822-group-project_dynamodb-data
```

### Backup Data

```bash
# Export data from running container
docker exec cinecloud-dynamodb tar czf /tmp/dynamodb-backup.tar.gz /home/dynamodblocal/data

# Copy to host
docker cp cinecloud-dynamodb:/tmp/dynamodb-backup.tar.gz ./dynamodb-backup.tar.gz
```

### Restore Data

```bash
# Copy backup to container
docker cp ./dynamodb-backup.tar.gz cinecloud-dynamodb:/tmp/

# Extract in container
docker exec cinecloud-dynamodb tar xzf /tmp/dynamodb-backup.tar.gz -C /home/dynamodblocal/
```

## Accessing DynamoDB

### Admin UI

Open http://localhost:8001 in your browser to:

- View all tables
- Browse table data
- Create/delete tables
- Query and scan operations

### AWS CLI

```bash
# List tables
aws dynamodb list-tables \
  --endpoint-url http://localhost:8000 \
  --region local

# Scan table
aws dynamodb scan \
  --table-name Movies \
  --endpoint-url http://localhost:8000 \
  --region local
```

### Application Access

Update your application's environment variables:

```bash
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_REGION=local
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

## Configuration Customization

### Change Ports

Edit `docker-compose.yml`:

```yaml
services:
  dynamodb-local:
    ports:
      - "8888:8000" # Change 8888 to desired port

  dynamodb-admin:
    ports:
      - "8889:8001" # Change 8889 to desired port
```

### Adjust Resources

```yaml
services:
  dynamodb-local:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
```

### Add Environment Variables

```yaml
services:
  dynamodb-local:
    environment:
      - JAVA_OPTS=-Xmx256m
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port (Windows)
netstat -ano | findstr :8000

# Check what's using the port (Mac/Linux)
lsof -i :8000

# Kill the process or change the port in docker-compose.yml
```

### Service Won't Start

```bash
# Check logs
docker-compose logs dynamodb-local

# Remove containers and recreate
docker-compose down
docker-compose up -d

# Pull latest images
docker-compose pull
docker-compose up -d
```

### Health Check Failing

```bash
# Check health status
docker inspect cinecloud-dynamodb | grep -A 10 Health

# Test manually
curl http://localhost:8000

# Restart service
docker-compose restart dynamodb-local
```

### Data Corruption

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm cosc2822-group-project_dynamodb-data

# Restart and recreate tables
docker-compose up -d
cd database && bun run reset
```

## Best Practices

### Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Setup database**: `cd database && bun run setup`
3. **Seed data**: `bun run seed`
4. **Develop**: Work on your code
5. **Reset if needed**: `bun run reset`
6. **Stop when done**: `docker-compose stop`

### Clean Slate

```bash
# Complete reset
docker-compose down -v
docker-compose up -d
cd database && bun run reset
```

### Before Committing

```bash
# Don't commit with services running on non-standard ports
# Don't commit volume data
# Ensure docker-compose.yml uses standard ports
```

## Production Considerations

**Note**: This Docker setup is for **local development only**.

For production:

- Use AWS DynamoDB (managed service)
- Don't run DynamoDB Local in production
- Remove docker-compose.yml from production deployments
- Use proper AWS credentials and regions

## Additional Resources

- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [DynamoDB Admin GitHub](https://github.com/aaronshaf/dynamodb-admin)

## Common Commands Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Clean everything
docker-compose down -v && docker-compose up -d

# Check status
docker-compose ps

# Execute command in container
docker-compose exec dynamodb-local sh
```
