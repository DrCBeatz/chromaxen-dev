# frontend/Dockerfile

FROM python:3.9-slim

WORKDIR /app

# Install watchdog for hot reloading (optional)
RUN pip install watchdog

# Expose port 8000
EXPOSE 8080 

# Copy the frontend files into the container
COPY . /app

# Command to run the server
CMD ["python", "-m", "http.server", "8080", "--bind", "0.0.0.0"]

