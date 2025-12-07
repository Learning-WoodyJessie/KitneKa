FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# Playwright needs these if we ever enable it, but for now we skip to keep image small
# RUN apt-get update && apt-get install -y wget

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port (Render uses 10000 by default, but we can make it configurable)
ENV PORT=10000
EXPOSE 10000

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
