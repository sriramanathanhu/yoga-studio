#!/bin/bash

# Comprehensive Data Integrity Monitoring System
# Prevents data loss and ensures system reliability

set -e

echo "🛡️  YogaStudio Data Integrity Monitor"
echo "=" * 50

# Configuration
BACKUP_DIR="/root/yogastudio/backups"
ALERT_LOG="/root/yogastudio/logs/data_alerts.log"
INTEGRITY_LOG="/root/yogastudio/logs/integrity_checks.log"

# Create required directories
mkdir -p ${BACKUP_DIR}
mkdir -p /root/yogastudio/logs

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$INTEGRITY_LOG"
}

# Function to alert critical issues
alert_critical() {
    echo "[CRITICAL] [$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$ALERT_LOG"
    echo "🚨 CRITICAL ALERT: $1"
}

# Function to check database connectivity
check_database_connectivity() {
    log_message "Checking database connectivity..."
    
    if ! docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT 1;" >/dev/null 2>&1; then
        alert_critical "Database connectivity lost!"
        return 1
    fi
    
    log_message "✅ Database connectivity OK"
    return 0
}

# Function to check critical data counts
check_data_integrity() {
    log_message "Checking data integrity..."
    
    # Check users count
    user_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    
    # Check asanas count
    asana_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
    
    log_message "Current data counts - Users: $user_count, Asanas: $asana_count"
    
    # Critical checks
    if [ "$asana_count" -lt 15 ]; then
        alert_critical "Asana data loss detected! Expected ≥15, found: $asana_count"
        return 1
    fi
    
    if [ "$user_count" -lt 1 ]; then
        alert_critical "User data loss detected! No users found in database"
        return 1
    fi
    
    log_message "✅ Data integrity checks passed"
    return 0
}

# Function to check backend service health
check_backend_health() {
    log_message "Checking backend service health..."
    
    # Check if backend container is running
    if ! docker ps | grep -q "yogastudio-backend.*healthy\|yogastudio-backend.*Up"; then
        alert_critical "Backend service is not healthy!"
        return 1
    fi
    
    # Check internal health endpoint with timeout
    if ! timeout 10 docker exec yogastudio-backend-1 curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        log_message "⚠️  Backend health endpoint not responding, checking alternative..."
        # Alternative check - just verify process is running
        if ! docker exec yogastudio-backend-1 pgrep -f "uvicorn" >/dev/null 2>&1; then
            alert_critical "Backend process not running!"
            return 1
        fi
        log_message "ℹ️  Backend process running (health endpoint may be initializing)"
    fi
    
    log_message "✅ Backend service health OK"
    return 0
}

# Function to check authentication system
check_auth_system() {
    log_message "Checking authentication system..."
    
    # Test token generation (without actual user)
    if ! docker exec yogastudio-backend-1 python -c "
import sys
sys.path.append('/app')
from app.core.security import create_access_token, verify_token
from datetime import timedelta

# Test token creation and verification
token = create_access_token({'sub': 'test@example.com'}, timedelta(minutes=30))
verified = verify_token(token)
if verified != 'test@example.com':
    exit(1)
print('✅ Token system working')
" 2>/dev/null; then
        alert_critical "Authentication token system failing!"
        return 1
    fi
    
    log_message "✅ Authentication system OK"
    return 0
}

# Function to auto-recover asana data
auto_recover_asanas() {
    log_message "Attempting automatic asana data recovery..."
    
    # Run the database initialization to restore asanas
    if docker-compose run --rm db-init >/dev/null 2>&1; then
        log_message "✅ Asana data recovery completed"
        return 0
    else
        alert_critical "Failed to recover asana data automatically!"
        return 1
    fi
}

# Function to create emergency backup
create_emergency_backup() {
    log_message "Creating emergency backup..."
    
    if ./scripts/backup_database.sh >/dev/null 2>&1; then
        log_message "✅ Emergency backup created"
        return 0
    else
        alert_critical "Failed to create emergency backup!"
        return 1
    fi
}

# Function to run comprehensive integrity check
run_integrity_check() {
    local issues=0
    
    log_message "Starting comprehensive integrity check..."
    
    # Database connectivity
    if ! check_database_connectivity; then
        issues=$((issues + 1))
    fi
    
    # Data integrity  
    if ! check_data_integrity; then
        issues=$((issues + 1))
        
        # Attempt auto-recovery for asanas
        if [ "$asana_count" -lt 15 ]; then
            log_message "Attempting asana data recovery..."
            auto_recover_asanas
        fi
    fi
    
    # Backend health
    if ! check_backend_health; then
        issues=$((issues + 1))
    fi
    
    # Authentication system
    if ! check_auth_system; then
        issues=$((issues + 1))
    fi
    
    # Final status
    if [ $issues -eq 0 ]; then
        log_message "🎉 All integrity checks passed!"
        return 0
    else
        alert_critical "Integrity check failed with $issues issues!"
        
        # Create emergency backup on any failure
        create_emergency_backup
        return 1
    fi
}

# Function to run continuous monitoring
continuous_monitor() {
    log_message "Starting continuous monitoring mode..."
    
    while true; do
        run_integrity_check
        sleep 300  # Check every 5 minutes
    done
}

# Function to fix authentication issues
fix_auth_system() {
    log_message "Attempting to fix authentication system..."
    
    # Restart backend service to clear any token cache issues
    log_message "Restarting backend service..."
    docker-compose restart backend
    
    # Wait for service to be healthy
    sleep 10
    
    # Check if fix worked
    if check_auth_system && check_backend_health; then
        log_message "✅ Authentication system fixed!"
        return 0
    else
        alert_critical "Failed to fix authentication system!"
        return 1
    fi
}

# Main execution logic
case "${1:-check}" in
    check)
        run_integrity_check
        ;;
    monitor)
        continuous_monitor
        ;;
    fix-auth)
        fix_auth_system
        ;;
    recover-asanas)
        auto_recover_asanas
        ;;
    emergency-backup)
        create_emergency_backup
        ;;
    --help|-h)
        echo "Usage: $0 [check|monitor|fix-auth|recover-asanas|emergency-backup]"
        echo ""
        echo "Commands:"
        echo "  check            Run single integrity check (default)"
        echo "  monitor          Run continuous monitoring"
        echo "  fix-auth         Fix authentication system issues"
        echo "  recover-asanas   Recover missing asana data"
        echo "  emergency-backup Create emergency backup"
        echo "  --help, -h       Show this help message"
        ;;
    *)
        run_integrity_check
        ;;
esac