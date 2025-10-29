# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY dist ./dist

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs
RUN adduser -S emailservice -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R emailservice:nodejs /app
USER emailservice

# Expose the port the app runs on
EXPOSE 3005

# Define the command to run the application
CMD ["node", "dist/app.js"]