
# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine

# Set working directory

# Build stage
FROM node:18-alpine as build


WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .


# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose Vite port
EXPOSE 5173

# Start the development server with host binding for container network
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
