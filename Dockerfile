# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies for SvelteKit build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the SvelteKit app (using adapter-node)
RUN npm run build

# Remove devDependencies to keep the production image small
RUN npm prune --production

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production
# The app will bind to 0.0.0.0 to be accessible outside the container
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built assets and production node_modules from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port 3000
EXPOSE 3000

# Run the app
CMD ["node", "build/index.js"]
