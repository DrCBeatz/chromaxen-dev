# frontend/Dockerfile

# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend application code
COPY . .

# Expose the port Vite uses (default is 5173)
EXPOSE 5173

# Set environment variable for Docker's file change notifications (optional but recommended)
ENV CHOKIDAR_USEPOLLING=true

# Command to run the Vite development server
CMD ["npm", "run", "dev", "--", "--host"]
