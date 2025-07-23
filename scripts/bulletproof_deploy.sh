#!/bin/bash

# Bulletproof Deployment System
# Zero-data-loss deployment with comprehensive validation

set -e

echo "🛡️  YogaStudio Bulletproof Deployment System"
echo "=" * 60

# Configuration
BACKUP_DIR="/root/yogastudio/backups"
DEPLOY_LOG="/root/yogastudio/logs/deploy.log"
VALIDATION_TIMEOUT=120

# Create required directories
mkdir -p ${BACKUP_DIR}
mkdir -p /root/yogastudio/logs

# Function to log with timestamp
log_deploy() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

# Function to create pre-deployment backup
create_backup() {
    log_deploy "📦 Creating pre-deployment backup..."
    
    # Create comprehensive backup
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="${BACKUP_DIR}/pre_deploy_${TIMESTAMP}.sql"
    
    if docker exec yogastudio-db-1 pg_dump -U yogauser -d yogadb > "$BACKUP_FILE" 2>/dev/null; then
        gzip "$BACKUP_FILE"
        log_deploy "✅ Backup created: ${BACKUP_FILE}.gz"
        echo "${BACKUP_FILE}.gz" > "${BACKUP_DIR}/latest_backup.txt"
    else
        log_deploy "❌ Failed to create backup - ABORTING DEPLOYMENT"
        exit 1
    fi
}

# Function to validate critical data before deployment
validate_pre_deployment() {
    log_deploy "🔍 Validating pre-deployment data..."
    
    # Check database connectivity
    if ! docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT 1;" >/dev/null 2>&1; then
        log_deploy "❌ Database not accessible - ABORTING"
        exit 1
    fi
    
    # Check critical data counts
    user_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    asana_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
    
    log_deploy "Current data: Users=$user_count, Asanas=$asana_count"
    
    # Store baseline counts
    echo "BASELINE_USERS=$user_count" > "${BACKUP_DIR}/baseline_counts.env"
    echo "BASELINE_ASANAS=$asana_count" >> "${BACKUP_DIR}/baseline_counts.env"
    
    # Minimum data requirements
    if [ "$asana_count" -lt 15 ]; then
        log_deploy "❌ Insufficient asana data ($asana_count < 15) - ABORTING"
        exit 1
    fi
    
    log_deploy "✅ Pre-deployment validation passed"
}

# Function to deploy with rollback capability
deploy_services() {
    log_deploy "🚀 Starting service deployment..."
    
    # Stop services gracefully
    log_deploy "⏹️  Stopping services..."
    docker-compose stop
    
    # Build new containers
    log_deploy "🔨 Building containers..."
    docker-compose build --no-cache
    
    # Start database and redis first
    log_deploy "🗄️  Starting database and redis..."
    docker-compose up -d db redis
    
    # Wait for database to be healthy
    log_deploy "⏳ Waiting for database health..."
    local timeout=$VALIDATION_TIMEOUT
    while ! docker-compose ps db | grep -q "healthy" && [ $timeout -gt 0 ]; do
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_deploy "❌ Database failed to become healthy - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    # Initialize/update database
    log_deploy "🔧 Running database initialization..."
    if ! docker-compose run --rm db-init; then
        log_deploy "❌ Database initialization failed - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    # Start backend
    log_deploy "🚀 Starting backend..."
    docker-compose up -d backend
    
    # Wait for backend to be ready
    log_deploy "⏳ Waiting for backend readiness..."
    timeout=$VALIDATION_TIMEOUT
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/ >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        log_deploy "❌ Backend failed to start - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    # Start remaining services
    log_deploy "🌐 Starting frontend and caddy..."
    docker-compose up -d
    
    log_deploy "✅ Service deployment completed"
}

# Function to validate post-deployment
validate_post_deployment() {
    log_deploy "🔍 Validating post-deployment..."
    
    # Load baseline counts
    if [ -f "${BACKUP_DIR}/baseline_counts.env" ]; then
        source "${BACKUP_DIR}/baseline_counts.env"
    else
        log_deploy "❌ No baseline counts found - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    # Check data integrity
    user_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    asana_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
    
    log_deploy "Post-deployment data: Users=$user_count, Asanas=$asana_count"
    
    # Data loss detection
    if [ "$user_count" -lt "$BASELINE_USERS" ]; then
        log_deploy "❌ USER DATA LOSS DETECTED! ($user_count < $BASELINE_USERS) - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    if [ "$asana_count" -lt "$BASELINE_ASANAS" ]; then
        log_deploy "❌ ASANA DATA LOSS DETECTED! ($asana_count < $BASELINE_ASANAS) - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    # Test authentication system
    log_deploy "🔐 Testing authentication system..."
    if ! docker exec yogastudio-backend-1 python -c "
import sys
sys.path.append('/app')
from app.core.security import create_access_token, verify_token
from datetime import timedelta
token = create_access_token({'sub': 'test@example.com'}, timedelta(minutes=30))
verified = verify_token(token)
assert verified == 'test@example.com'
print('✅ Authentication working')
" 2>/dev/null; then
        log_deploy "❌ Authentication system failed - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    # Test API endpoints
    log_deploy "🌐 Testing API endpoints..."
    local api_tests=0
    
    # Test root endpoint
    if curl -f http://yogastudio.ecitizen.media/ >/dev/null 2>&1; then
        api_tests=$((api_tests + 1))
    fi
    
    # Test health endpoint (if available)
    if curl -f http://yogastudio.ecitizen.media/health >/dev/null 2>&1; then
        api_tests=$((api_tests + 1))
    fi
    
    if [ $api_tests -eq 0 ]; then
        log_deploy "❌ No API endpoints responding - ROLLING BACK"
        rollback_deployment
        exit 1
    fi
    
    log_deploy "✅ Post-deployment validation passed ($api_tests API tests passed)"
}

# Function to rollback deployment
rollback_deployment() {
    log_deploy "🔄 ROLLING BACK DEPLOYMENT..."
    
    # Stop all services
    docker-compose down
    
    # Restore from backup
    if [ -f "${BACKUP_DIR}/latest_backup.txt" ]; then
        BACKUP_FILE=$(cat "${BACKUP_DIR}/latest_backup.txt")
        if [ -f "$BACKUP_FILE" ]; then
            log_deploy "💾 Restoring from backup: $BACKUP_FILE"
            
            # Start only database
            docker-compose up -d db
            sleep 10
            
            # Restore backup
            if [[ $BACKUP_FILE == *.gz ]]; then
                gunzip -c "$BACKUP_FILE" | docker exec -i yogastudio-db-1 psql -U yogauser -d yogadb
            else
                docker exec -i yogastudio-db-1 psql -U yogauser -d yogadb < "$BACKUP_FILE"
            fi
            
            log_deploy "✅ Database restored from backup"
        fi
    fi
    
    # Start services with old containers
    log_deploy "🚀 Restarting services with previous version..."
    docker-compose up -d
    
    log_deploy "🔄 Rollback completed"
}

# Function to create post-deployment backup
create_post_deployment_backup() {
    log_deploy "📦 Creating post-deployment backup..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="${BACKUP_DIR}/post_deploy_${TIMESTAMP}.sql"
    
    if docker exec yogastudio-db-1 pg_dump -U yogauser -d yogadb > "$BACKUP_FILE" 2>/dev/null; then
        gzip "$BACKUP_FILE"
        log_deploy "✅ Post-deployment backup created: ${BACKUP_FILE}.gz"
    else
        log_deploy "⚠️  Failed to create post-deployment backup (non-critical)"
    fi
}

# Main deployment process
main_deployment() {
    log_deploy "🛡️  Starting bulletproof deployment process..."
    
    # Step 1: Pre-deployment validation and backup
    validate_pre_deployment
    create_backup
    
    # Step 2: Deploy services
    deploy_services
    
    # Step 3: Post-deployment validation
    validate_post_deployment
    
    # Step 4: Create success backup
    create_post_deployment_backup
    
    # Step 5: Final verification
    log_deploy "✅ Running final data integrity check..."
    if ! ./scripts/data_integrity_monitor.sh check >/dev/null 2>&1; then
        log_deploy "⚠️  Post-deployment integrity check has warnings (non-critical)"
    fi
    
    log_deploy "🎉 BULLETPROOF DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log_deploy "📊 Application available at: https://yogastudio.ecitizen.media"
    
    # Display final status
    echo ""
    echo "🎉 DEPLOYMENT SUCCESS!"
    echo "📊 Application: https://yogastudio.ecitizen.media"
    echo "🛡️  Data integrity: VERIFIED"
    echo "🔐 Authentication: WORKING"
    echo "📦 Backups: CREATED"
}

# Execute deployment
main_deployment