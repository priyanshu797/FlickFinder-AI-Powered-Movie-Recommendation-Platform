# Backend/Dockerfile
FROM python:3.10-slim

# allow Python to write bytecode & avoid buffering in logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create app user
RUN groupadd -r cineai && useradd -r -g cineai cineai

WORKDIR /app

# system deps for building wheels if needed (keep minimal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements (ensure you have this file)
COPY requirements.txt /app/requirements.txt

# Install python deps
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY . /app

# Ensure non-root runtime user owns the files
RUN chown -R cineai:cineai /app

# Switch to non-root user
USER cineai

# Expose port
EXPOSE 5000

# Use gunicorn in production to run Flask app
ENV FLASK_APP=main.py
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--threads", "2", "main:app"]
