# Yoga AI Web Application

A comprehensive AI-personalized Yoga & Wellness web application that generates personalized yoga routines based on user goals, fitness level, time availability, and physical limitations.

## Architecture

- **Frontend**: React.js web application
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **Reverse Proxy**: Caddy with automatic HTTPS
- **Deployment**: Docker Compose

## Domain

https://yogastudio.ecitizen.media

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Project Structure

```
yogastudio/
├── frontend/          # React.js web app
├── backend/           # FastAPI application
├── data/             # Yoga asana datasets
├── docker/           # Docker configuration files
├── docker-compose.yml
├── Caddyfile
└── README.md
```

## Features

- User authentication and onboarding
- AI-powered personalized yoga routine generation
- 12-component asana display system
- Progress tracking and analytics
- 500+ yoga asanas with detailed instructions
- Responsive web design# Test change
