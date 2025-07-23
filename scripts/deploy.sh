#!/bin/bash

# Yoga AI Deployment Script
set -e

echo "🧘‍♀️ Starting Yoga AI deployment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/postgres
mkdir -p logs

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Initialize database with sample data
echo "🗄️ Initializing database..."
docker-compose run --rm db-init

# Check service health
echo "🔍 Checking service health..."
sleep 5

# Test backend health
if docker-compose exec backend curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    docker-compose logs backend
fi

# Test frontend
if docker-compose exec frontend wget --spider --quiet http://localhost:80; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    docker-compose logs frontend
fi

# Show running services
echo "📊 Running services:"
docker-compose ps

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🌐 Your Yoga AI app should be available at:"
echo "   https://yogastudio.ecitizen.media"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose logs -f [service_name]"
echo "   Stop app: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Update: docker-compose pull && docker-compose up -d"
echo ""