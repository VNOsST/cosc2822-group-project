# Frontend ECS Deployment Guide

This guide covers deploying the CineCloud frontend to AWS ECS (EC2) using CloudFormation templates and GitHub Actions workflow.

## Architecture Overview

- **VPC**: Dedicated VPC (10.0.0.0/16) with 2 public subnets across 2 AZs
- **Container Registry**: **Shared** Amazon ECR repository (`cinecloud-frontend`)
- **Compute**: ECS with EC2 launch type (t3.micro instances)
- **Load Balancer**: Application Load Balancer (ALB)
- **Configuration**: SSM Parameter Store
- **CI/CD**: GitHub Actions

## Infrastructure Stacks

The infrastructure is split into two CloudFormation stacks:

| Stack                          | Template                       | Purpose                             |
| ------------------------------ | ------------------------------ | ----------------------------------- |
| **Base Infrastructure**        | `base-infrastructure.yaml`     | Shared ECR repository (deploy once) |
| **Environment Infrastructure** | `frontend-infrastructure.yaml` | VPC, ECS, ALB per environment       |

This separation solves the chicken-and-egg problem where ECS services would hang waiting for images that don't exist yet.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with secrets configured
3. **Backend Deployed** (for Cognito User Pool and API Gateway endpoints)

## Initial Setup

### 1. Configure GitHub Secrets

Add these secrets to your GitHub repository (**Settings** > **Secrets and variables** > **Actions**):

```bash
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_SESSION_TOKEN=<your-session-token>
```

### 2. Configure AWS Region

`AWS_REGION` is configured as a **GitHub Actions Variable** (not a secret).

1. Go to repository **Settings** > **Secrets and variables** > **Actions**.
2. Switch to the **Variables** tab.
3. Click **New repository variable**.
4. Name: `AWS_REGION`, Value: `us-east-1` (or your chosen region).

The workflow will use this variable, defaulting to `us-east-1` if not found.

### 3. Deploy Base Infrastructure (Shared ECR)

Deploy the shared ECR repository first. **This only needs to be done once:**

```bash
cd frontend/infrastructure

aws cloudformation deploy \
  --template-file base-infrastructure.yaml \
  --stack-name cinecloud-frontend-base \
  --capabilities CAPABILITY_NAMED_IAM
```

Verify the ECR repository was created:

```bash
aws ecr describe-repositories --repository-names cinecloud-frontend
```

### 4. Deploy Environment Infrastructure

Deploy the environment-specific infrastructure (VPC, ECS, ALB):

```bash
cd frontend/infrastructure

# Deploy to dev environment
aws cloudformation deploy \
  --template-file frontend-infrastructure.yaml \
  --stack-name cinecloud-frontend-dev \
  --parameter-overrides \
      Environment=dev \
      CognitoRegion=us-east-1 \
      CognitoUserPoolId=<from-backend-stack> \
      CognitoClientId=<from-backend-stack> \
      ApiEndpoint=https://xxx.execute-api.us-east-1.amazonaws.com/dev \
  --capabilities CAPABILITY_NAMED_IAM
```

**Note**: The ECS service starts with `DesiredCount: 0` so CloudFormation completes immediately without waiting for an image.

If you don't provide the Cognito/API parameters, the stack will create SSM parameters with `PLACEHOLDER_UPDATE_ME` values. You can update them later:

```bash
aws ssm put-parameter \
  --name /cinecloud/dev/cognito/user-pool-id \
  --value us-east-1_XXXXXXXXX \
  --type String \
  --overwrite

aws ssm put-parameter \
  --name /cinecloud/dev/cognito/client-id \
  --value XXXXXXXXXXXXXXXXXXXXXXXXXX \
  --type String \
  --overwrite

aws ssm put-parameter \
  --name /cinecloud/dev/api/endpoint \
  --value https://xxx.execute-api.us-east-1.amazonaws.com/dev \
  --type String \
  --overwrite
```

### 5. Verify Stack Outputs

Get important outputs from the deployed stack:

```bash
aws cloudformation describe-stacks \
  --stack-name cinecloud-frontend-dev \
  --query 'Stacks[0].Outputs'
```

Key outputs:

- `LoadBalancerDNS` - ALB DNS name (access your frontend here)
- `ECSClusterName` - ECS cluster name
- `ECSServiceName` - ECS service name

## Deployment

### Automatic Deployment (Push to main)

When you push changes to the `frontend/` directory on the `main` branch, GitHub Actions will automatically:

1. Fetch configuration from SSM Parameter Store for the `dev` environment
2. Build the Docker image with Vite environment variables
3. Push to shared ECR with environment-prefixed tags (e.g., `dev-abc123`, `dev-latest`)
4. Update ECS task definition
5. Deploy to ECS service
6. **Scale up the service to 1 if it was at 0** (first deployment)

### Manual Deployment (Choose Environment)

To deploy to a specific environment:

1. Go to **Actions** tab in GitHub
2. Select **Deploy Frontend to ECS** workflow
3. Click **Run workflow**
4. Choose environment: `dev`, `staging`, or `prod`
5. Click **Run workflow**

## Image Tagging Strategy

All environments share a single ECR repository with environment-prefixed tags:

```bash
cinecloud-frontend:dev-abc1234      # Dev commit
cinecloud-frontend:dev-latest       # Latest dev build
cinecloud-frontend:staging-abc1234  # Staging commit
cinecloud-frontend:staging-latest   # Latest staging build
cinecloud-frontend:prod-abc1234     # Prod commit
cinecloud-frontend:prod-latest      # Latest prod build
```

This allows:

- Easy identification of which image is in each environment
- Lifecycle policies to keep recent images per environment
- Future image promotion workflows (promote dev image to staging)

## Environment-Specific Deployments

To deploy to multiple environments, deploy the environment stack for each:

```bash
# Staging
aws cloudformation deploy \
  --template-file frontend-infrastructure.yaml \
  --stack-name cinecloud-frontend-staging \
  --parameter-overrides Environment=staging ... \
  --capabilities CAPABILITY_NAMED_IAM

# Production
aws cloudformation deploy \
  --template-file frontend-infrastructure.yaml \
  --stack-name cinecloud-frontend-prod \
  --parameter-overrides Environment=prod ... \
  --capabilities CAPABILITY_NAMED_IAM
```

Each environment will have:

- Separate ECS cluster and service
- Separate VPC and ALB
- Separate SSM parameters: `/cinecloud/{env}/*`
- **Shared ECR repository** with environment-prefixed image tags

## Accessing the Application

After deployment, access your frontend at the ALB DNS name:

```bash
# Get ALB DNS
aws cloudformation describe-stacks \
  --stack-name cinecloud-frontend-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

Visit: `http://<alb-dns-name>`

## Monitoring

### View Logs

```bash
# View ECS task logs
aws logs tail /ecs/cinecloud-frontend-dev --follow
```

### Check Service Status

```bash
# Get ECS service status
aws ecs describe-services \
  --cluster cinecloud-frontend-dev \
  --services cinecloud-frontend-dev
```

### View Running Tasks

```bash
# List running tasks
aws ecs list-tasks \
  --cluster cinecloud-frontend-dev \
  --service-name cinecloud-frontend-dev
```

### View ECR Images

```bash
# List all images in shared repository
aws ecr describe-images \
  --repository-name cinecloud-frontend \
  --query 'imageDetails[*].[imageTags,imagePushedAt]' \
  --output table
```

## Troubleshooting

### Task Not Starting

1. Check EC2 instance is running and registered with ECS cluster
2. Verify security group allows ALB > EC2 traffic on port 3000
3. Check CloudWatch logs for container errors
4. **Verify image exists**: `aws ecr describe-images --repository-name cinecloud-frontend --image-ids imageTag=dev-latest`

### Cannot Access via ALB

1. Verify ALB security group allows inbound traffic on port 80
2. Check target group health status
3. Ensure task is healthy and registered with target group

### SSM Parameter Errors

If GitHub Actions fails fetching SSM parameters:

1. Verify parameters exist:

   ```bash
   aws ssm get-parameters-by-path --path /cinecloud/dev
   ```

2. Ensure AWS credentials in GitHub have SSM read permissions

### Service Stuck at 0 Tasks

If the service remains at 0 desired count after deployment:

1. Manually scale up:

   ```bash
   aws ecs update-service \
     --cluster cinecloud-frontend-dev \
     --service cinecloud-frontend-dev \
     --desired-count 1
   ```

2. Check if image exists in ECR with the expected tag

## Cleanup

To delete all resources:

```bash
# Delete environment stacks first
aws cloudformation delete-stack --stack-name cinecloud-frontend-dev
aws cloudformation delete-stack --stack-name cinecloud-frontend-staging
aws cloudformation delete-stack --stack-name cinecloud-frontend-prod

# Wait for stacks to delete...

# Delete base infrastructure (shared ECR) last
# WARNING: This deletes all images!
aws cloudformation delete-stack --stack-name cinecloud-frontend-base
```

To delete specific images from ECR:

```bash
aws ecr batch-delete-image \
  --repository-name cinecloud-frontend \
  --image-ids imageTag=dev-latest imageTag=dev-abc1234
```
