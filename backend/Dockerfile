# Use Python base image
FROM python:3.11-slim AS base

# Set work directory
WORKDIR /app

# Builder stage
FROM base AS builder

COPY requirements.txt requirements-win.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn==23.0.0

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh

# Set PATH for user-installed packages
ENV PATH=/root/.local/bin:$PATH

# Expose ports used by api/worker (gunicorn defaults to 5000)
EXPOSE 5000

# Default command is to run entrypoint (allow override via docker-compose)
ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]