#!/bin/sh
echo "START SCRIPT"
# Wait for the database to be ready
while ! nc -z db 5432; do
    echo "Waiting for the database..."
    sleep 1
done

# Initialize and run database migrations
flask db init || true
flask db migrate -m "Initial migration."
flask db upgrade

# Start the Flask application
flask run --host=0.0.0.0 --debug
