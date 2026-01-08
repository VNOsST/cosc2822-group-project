# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock ./
# Copy all workspace package.json files (needed for the workspace graph)
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY database/package.json ./database/

# Install dependencies from the root lockfile
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .


# Set working directory to frontend for the build
WORKDIR /app/frontend

# REQUIRED: Build-time arguments for Cognito config
# These are embedded into the client bundle by Vite and cannot be changed at runtime
ARG VITE_AWS_REGION
ARG VITE_AWS_USER_POOL_ID
ARG VITE_AWS_USER_POOL_CLIENT_ID

# Set as environment variables for Vite to bundle
ENV VITE_AWS_REGION=$VITE_AWS_REGION
ENV VITE_AWS_USER_POOL_ID=$VITE_AWS_USER_POOL_ID
ENV VITE_AWS_USER_POOL_CLIENT_ID=$VITE_AWS_USER_POOL_CLIENT_ID

# Build the application
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs tanstack

# Copy built application from builder
COPY --from=builder --chown=tanstack:nodejs /app/frontend/.output ./.output
COPY --from=builder --chown=tanstack:nodejs /app/frontend/package.json ./package.json

# Switch to non-root user
USER tanstack

# Expose the port
EXPOSE 3000

# Start the application
CMD ["bun", "start"]

