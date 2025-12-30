# CineCloud Backend - AWS Lambda Deployment Guide

This guide covers deploying the CineCloud backend API to AWS Lambda using AWS SAM (Serverless Application Model).

## Prerequisites

1. **AWS CLI**: Install and configure with your AWS credentials

   ```bash
   aws configure
   ```

2. **AWS SAM CLI**: Install the SAM CLI

   ```bash
   # Windows (using Chocolatey)
   choco install aws-sam-cli

   # macOS (using Homebrew)
   brew install aws-sam-cli

   # Or download from: https://aws.amazon.com/serverless/sam/
   ```

3. **Docker**: Required for local testing with SAM

   - Download from: https://www.docker.com/products/docker-desktop

4. **Node.js 20.x**: Required for Lambda runtime
   - Download from: https://nodejs.org/

## Project Structure

```
backend/
├── src/
│   ├── index.ts       # Unified entry point (handles both local dev and Lambda)
│   ├── routes/        # API route handlers
│   ├── db/            # DynamoDB client and utilities
│   └── types/         # TypeScript type definitions
├── template.yaml      # AWS SAM template (infrastructure as code)
├── samconfig.toml     # SAM CLI configuration for different environments
└── package.json       # Dependencies and scripts
```

## Available Scripts

| Script                   | Description                             |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | Start local development server with Bun |
| `npm run build:lambda`   | Build Lambda function using SAM         |
| `npm run local:api`      | Start local API Gateway emulator        |
| `npm run local:invoke`   | Invoke Lambda function locally          |
| `npm run validate`       | Validate SAM template                   |
| `npm run deploy`         | Deploy to AWS (dev environment)         |
| `npm run deploy:staging` | Deploy to staging environment           |
| `npm run deploy:prod`    | Deploy to production environment        |

## Local Development

### Option 1: Bun Server (Recommended for Development)

```bash
# Start local DynamoDB
docker compose up -d

# Start the development server
bun run dev
```

The API will be available at `http://localhost:3001`

### Option 2: SAM Local (Simulates Lambda Environment)

```bash
# Build the Lambda function
npm run build:lambda

# Start local API Gateway
npm run local:api
```

The API will be available at `http://localhost:3000`

## Deployment

### First-Time Setup

1. **Validate the template**:

   ```bash
   npm run validate
   ```

2. **Build the application**:

   ```bash
   npm run build:lambda
   ```

3. **Deploy to dev environment**:

   ```bash
   npm run deploy
   ```

   Follow the prompts to confirm the deployment. SAM will:

   - Create an S3 bucket for deployment artifacts
   - Create all DynamoDB tables
   - Create the Lambda function
   - Create API Gateway endpoints

### Deployment Environments

| Environment | Command                  | Stack Name                |
| ----------- | ------------------------ | ------------------------- |
| Development | `npm run deploy`         | cinecloud-backend         |
| Staging     | `npm run deploy:staging` | cinecloud-backend-staging |
| Production  | `npm run deploy:prod`    | cinecloud-backend-prod    |

### Updating an Existing Deployment

Simply run the deploy command again:

```bash
npm run deploy
```

SAM will create a changeset showing what will be modified before applying changes.

## AWS Resources Created

The SAM template (`template.yaml`) creates:

### Lambda Function

- **Name**: `cinecloud-api-{environment}`
- **Runtime**: Node.js 20.x
- **Memory**: 256 MB
- **Timeout**: 30 seconds

### API Gateway

- **Type**: REST API
- **CORS**: Enabled for all origins
- **Endpoints**: All HTTP methods on `/{proxy+}`

### DynamoDB Tables

| Table     | Primary Key   | Secondary Indexes                  |
| --------- | ------------- | ---------------------------------- |
| Movies    | `id` (String) | -                                  |
| Showtimes | `id` (String) | `movieId-index`                    |
| Bookings  | `id` (String) | `showtimeId-index`, `userId-index` |
| Rooms     | `id` (String) | -                                  |
| Ratings   | `id` (String) | `movieId-index`, `userId-index`    |

## Monitoring & Debugging

### View Logs

```bash
# Tail logs for the Lambda function
sam logs -n CineCloudFunction --stack-name cinecloud-backend --tail
```

### CloudWatch Metrics

Access CloudWatch in the AWS Console to view:

- Invocation count
- Duration
- Error rate
- Throttles

## Cost Optimization

The deployment uses:

- **Lambda**: Pay per invocation (first 1M requests/month free)
- **DynamoDB**: On-demand billing (pay per request)
- **API Gateway**: Pay per request (first 1M requests/month free)

## Troubleshooting

### Common Issues

1. **SAM build fails**:

   - Ensure Node.js 20.x is installed
   - Run `npm install` to ensure dependencies are up to date

2. **Local API not starting**:

   - Ensure Docker is running
   - Check if port 3000 is available

3. **Deployment permission errors**:

   - Verify AWS credentials are configured correctly
   - Ensure IAM user has required permissions (CloudFormation, Lambda, DynamoDB, API Gateway, IAM, S3)

4. **Cold starts are slow**:
   - Consider using Provisioned Concurrency for production
   - Optimize bundle size by excluding unused dependencies

## Security Best Practices

1. **Enable API Key** (optional): Add API key authentication in API Gateway
2. **Add Cognito Authorizer**: Integrate with Amazon Cognito for user authentication
3. **VPC Configuration**: Place Lambda in a VPC for enhanced security
4. **Encryption**: Enable encryption at rest for DynamoDB tables

## Next Steps

- [ ] Set up CI/CD with AWS CodePipeline
- [ ] Configure custom domain for API Gateway
- [ ] Add CloudWatch alarms for monitoring
- [ ] Implement request throttling
- [ ] Add WAF for API protection
