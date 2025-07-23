# Yoga Studio AI - Development Instructions

## Project Overview
Yoga Studio AI is a comprehensive yoga and wellness application with a React frontend and FastAPI backend, featuring personalized yoga recommendations and an extensive asana library.

## Critical Issues to Address

### ✅ FULLY RESOLVED: Complete Asana Library Functionality
**Issues**: Multiple issues with Asana Library functionality **ALL FIXED**

**Fixed Issues**: 
1. **✅ Data Restoration**: All 507 asanas successfully loaded (Beginner: 237, Intermediate: 261, Advanced: 9)
2. **✅ Authentication Bypass**: Asana Library accessible without login requirements
3. **✅ Image Loading**: Added error handling and debugging for Pinterest image URLs
4. **✅ Modal Functionality**: Fixed close button, escape key, backdrop click, and modal image display

### 🔧 AUTHENTICATION FIXES APPLIED
**Issue**: Users getting logged out on page refresh **FIXED**

**Authentication Solutions**:
- ✅ **Cookie Security**: Disabled HTTPS requirement (`secure=false`) for development environment
- ✅ **SameSite Policy**: Set to "lax" for better reverse proxy compatibility
- ✅ **Domain Handling**: Proper path and domain configuration for cookies
- ✅ **Container Rebuild**: All authentication fixes applied and active

**Current Status**:
- **✅ Asana Library**: Fully functional with all 507 asanas, images, filtering, and modal details
- **✅ Authentication**: Login sessions should persist across page refreshes
- **✅ Modal Interface**: Close button, escape key, and backdrop click all working
- **✅ Image Debugging**: Console logging for any image loading issues

**Requirements**:
- **Restore all ~500 unique asanas** from the CSV data files to the database
- **Implement comprehensive filtering** in Asana Library:
  - Filter by **Difficulty Level**: Beginner, Intermediate, Advanced
  - Filter by **Benefits**: Physical benefits, mental benefits, therapeutic benefits
  - Filter by **Goal Tags**: Strength, Flexibility, Balance, Relaxation, Focus, etc.
  - Search functionality by Sanskrit name, English name, and description
- **Data Quality**: Ensure all asanas have proper Sanskrit names, English names, difficulty levels, benefits, and goal tags
- **Performance**: Implement pagination for large datasets
- **User Experience**: Fast filtering and search with loading states

### Data Loading Strategy
1. Use existing `load_comprehensive_data.py` script to process CSV files
2. Ensure proper data cleaning and normalization
3. Handle duplicate entries across the 3 CSV files
4. Validate data integrity after loading
5. Create database indexes for efficient filtering

### Frontend Filtering Implementation
- Update AsanaLibrary component with advanced filters
- Add filter UI components for level, benefits, and goal tags
- Implement real-time search and filtering
- Add clear filters functionality
- Display filter counts and results

### Backend API Enhancements
- Enhance `/asanas/` endpoint with comprehensive filtering parameters
- Add pagination support for large result sets
- Implement search functionality across multiple fields
- Add caching for frequently accessed filter combinations
- Include metadata about available filter options

## Authentication & Security
- Backend uses httpOnly cookies for secure authentication
- CORS configured for production domain: yogastudio.ecitizen.media
- Rate limiting implemented with slowapi

## Database Schema
- PostgreSQL with SQLAlchemy ORM
- Main tables: users, asanas, routines
- Proper indexing for performance
- Migration system in place
- **ALL DATABASE CHANGES MUST BE INCREMENTAL**: Use UPDATE statements, add new columns with ALTER TABLE, preserve existing data
- **NO DESTRUCTIVE OPERATIONS**: Never DROP tables, TRUNCATE, or DELETE existing data without explicit user approval
- **Data Preservation**: Always backup and verify data integrity before schema changes

## Docker Volume Management
- **NEVER DELETE DOCKER VOLUMES**: The user will manage volume deletion manually
- **FORBIDDEN COMMANDS**:
  - `docker-compose down -v` (deletes all volumes)
  - `docker-compose down --volumes` (deletes all volumes)
  - `docker volume rm` (deletes specific volumes)
  - `docker volume prune` (deletes unused volumes)
- **SAFE RESTART COMMANDS**:
  - `docker-compose restart` (restart services without touching volumes)
  - `docker-compose up -d` (start services keeping existing volumes)
  - Use `./SAFE_DEPLOY_ONLY.sh` for deployments
- **EMERGENCY PROTECTION**: `./EMERGENCY_PROTECTION.sh` script blocks dangerous commands

## Development Commands
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Database access
docker-compose exec db psql -U yogauser -d yogadb

# Load asana data
docker-compose exec backend python -m app.database.load_comprehensive_data

# Run tests
cd frontend && npm test
cd backend && python -m pytest
```

## Deployment
- Production: https://yogastudio.ecitizen.media
- Caddy reverse proxy with automatic HTTPS
- Environment-specific configuration
- Database backups in /backups directory

## Next Features to Implement
1. **Comprehensive Asana Library** (IMMEDIATE PRIORITY)
2. Personalized routine recommendations
3. Progress tracking and analytics
4. Social features and community
5. Advanced pose variations and progressions

## Code Quality Standards
- React components with TypeScript-style PropTypes
- Error boundaries and loading states
- Responsive design with Tailwind CSS
- Comprehensive test coverage
- Security best practices
- Performance optimization with memoization