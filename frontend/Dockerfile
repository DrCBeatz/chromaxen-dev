# frontend/Dockerfile

FROM node:14-alpine

WORKDIR /app

# Install live-server globally
RUN npm install -g live-server

# Expose port 8080
EXPOSE 8080

# Copy your frontend files into the container
COPY . /app

# Command to run live-server with CORS enabled
CMD ["live-server", "--host=0.0.0.0", "--port=8080", "--no-browser", "--watch=/app", "--cors"]
