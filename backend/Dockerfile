FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (including sqlite3 for backups and curl for health checks)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make scripts executable
RUN chmod +x backup_db.sh restore_db.sh cleanup_analytics.py

# Create necessary directories
RUN mkdir -p uploads exports data

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
