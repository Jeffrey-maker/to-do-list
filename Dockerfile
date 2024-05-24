# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Install netcat-openbsd for database waiting
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Define environment variable
ENV NAME MyApp

# Run entrypoint script when the container launches
ENTRYPOINT ["/entrypoint.sh"]
