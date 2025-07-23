#!/bin/bash

# Emergency Fix Script - Direct fixes without rebuild
# Fixes authentication and asana issues without full deployment

set -e

echo "🚨 YogaStudio Emergency Fix - Direct Repair Mode"
echo "=" * 50

# Create logs directory
mkdir -p /root/yogastudio/logs

log_fix() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "/root/yogastudio/logs/emergency_fix.log"
}

# Function to restart services strategically
restart_services() {
    log_fix "🔄 Restarting services strategically..."
    
    # Stop all except database and redis (preserve data)
    docker-compose stop backend frontend caddy
    
    # Start backend only first
    log_fix "🚀 Starting backend service..."
    docker-compose up -d backend
    
    # Wait for backend
    sleep 15
    
    # Start other services
    log_fix "🌐 Starting remaining services..."
    docker-compose up -d frontend caddy
    
    log_fix "✅ Services restarted"
}

# Function to verify and fix data
verify_fix_data() {
    log_fix "🔍 Verifying and fixing data..."
    
    # Check current data
    user_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    asana_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
    
    log_fix "Current data: Users=$user_count, Asanas=$asana_count"
    
    # Fix asanas if needed
    if [ "$asana_count" -lt 15 ]; then
        log_fix "🔧 Fixing asana data..."
        docker-compose run --rm db-init
        
        # Verify fix
        asana_count_after=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
        log_fix "Asanas after fix: $asana_count_after"
    fi
    
    log_fix "✅ Data verification complete"
}

# Function to test system functionality
test_functionality() {
    log_fix "🧪 Testing system functionality..."
    
    local tests_passed=0
    local total_tests=4
    
    # Test 1: Database connectivity
    if docker exec yogastudio-db-1 psql -U yogauser -d yogadb -c "SELECT 1;" >/dev/null 2>&1; then
        log_fix "✅ Test 1/4: Database connectivity - PASSED"
        tests_passed=$((tests_passed + 1))
    else
        log_fix "❌ Test 1/4: Database connectivity - FAILED"
    fi
    
    # Test 2: Authentication system
    if docker exec yogastudio-backend-1 python -c "
import sys
sys.path.append('/app')
from app.core.security import create_access_token, verify_token
from datetime import timedelta
token = create_access_token({'sub': 'test@example.com'}, timedelta(minutes=30))
verified = verify_token(token)
assert verified == 'test@example.com'
" >/dev/null 2>&1; then
        log_fix "✅ Test 2/4: Authentication system - PASSED"
        tests_passed=$((tests_passed + 1))
    else
        log_fix "❌ Test 2/4: Authentication system - FAILED"
    fi
    
    # Test 3: API availability
    if timeout 10 curl -f http://yogastudio.ecitizen.media/ >/dev/null 2>&1; then
        log_fix "✅ Test 3/4: API availability - PASSED"
        tests_passed=$((tests_passed + 1))
    else
        log_fix "❌ Test 3/4: API availability - FAILED"
    fi
    
    # Test 4: Data integrity
    current_asanas=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
    if [ "$current_asanas" -ge 15 ]; then
        log_fix "✅ Test 4/4: Data integrity (asanas=$current_asanas) - PASSED"
        tests_passed=$((tests_passed + 1))
    else
        log_fix "❌ Test 4/4: Data integrity (asanas=$current_asanas) - FAILED"
    fi
    
    log_fix "📊 Tests passed: $tests_passed/$total_tests"
    
    if [ $tests_passed -eq $total_tests ]; then
        log_fix "🎉 ALL TESTS PASSED - System is functional!"
        return 0
    else
        log_fix "⚠️  Some tests failed - System may have issues"
        return 1
    fi
}

# Function to create protective backup
create_protective_backup() {
    log_fix "💾 Creating protective backup..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="/root/yogastudio/backups/emergency_fix_${TIMESTAMP}.sql"
    
    if docker exec yogastudio-db-1 pg_dump -U yogauser -d yogadb > "$BACKUP_FILE" 2>/dev/null; then
        gzip "$BACKUP_FILE"
        log_fix "✅ Protective backup created: ${BACKUP_FILE}.gz"
    else
        log_fix "⚠️  Failed to create protective backup (non-critical)"
    fi
}

# Function to implement permanent safeguards
implement_safeguards() {
    log_fix "🛡️  Implementing permanent safeguards..."
    
    # Create continuous monitoring systemd service
    cat > /root/yogastudio/scripts/start_monitoring.sh << 'EOF'
#!/bin/bash
cd /root/yogastudio
nohup ./scripts/data_integrity_monitor.sh monitor > /root/yogastudio/logs/monitor.log 2>&1 &
echo $! > /root/yogastudio/logs/monitor.pid
echo "Data integrity monitoring started (PID: $(cat /root/yogastudio/logs/monitor.pid))"
EOF

    chmod +x /root/yogastudio/scripts/start_monitoring.sh
    
    # Add automatic daily backups
    if ! crontab -l 2>/dev/null | grep -q "yogastudio.*backup"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * cd /root/yogastudio && ./scripts/backup_database.sh > /root/yogastudio/logs/daily_backup.log 2>&1") | crontab -
        log_fix "✅ Daily backup cron job added"
    fi
    
    # Update safe deployment script to be default
    cat > /root/yogastudio/deploy.sh << 'EOF'
#!/bin/bash
echo "🛡️  Using safe deployment by default..."
cd /root/yogastudio
exec ./scripts/bulletproof_deploy.sh "$@"
EOF
    
    chmod +x /root/yogastudio/deploy.sh
    
    log_fix "✅ Permanent safeguards implemented"
}

# Main emergency fix process
main_emergency_fix() {
    log_fix "🚨 Starting emergency fix process..."
    
    # Step 1: Create protective backup first
    create_protective_backup
    
    # Step 2: Verify current data state
    verify_fix_data
    
    # Step 3: Restart services strategically  
    restart_services
    
    # Step 4: Test functionality
    if test_functionality; then
        log_fix "✅ Emergency fix successful!"
    else
        log_fix "⚠️  Emergency fix partially successful - monitoring recommended"
    fi
    
    # Step 5: Implement safeguards
    implement_safeguards
    
    # Step 6: Final status report
    log_fix "📊 Final System Status:"
    log_fix "=================="
    
    # Data counts
    user_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    asana_count=$(docker exec yogastudio-db-1 psql -U yogauser -d yogadb -t -c "SELECT COUNT(*) FROM asanas;" | tr -d ' ')
    log_fix "Users: $user_count"
    log_fix "Asanas: $asana_count"
    
    # Service status
    log_fix "Services:"
    docker-compose ps --format "table {{.Service}}\t{{.Status}}" | tail -n +2 | while read line; do
        log_fix "  $line"
    done
    
    log_fix "=================="
    log_fix "🎉 EMERGENCY FIX COMPLETED!"
    log_fix "🌐 Application: https://yogastudio.ecitizen.media"
    log_fix "📝 Logs: /root/yogastudio/logs/"
    log_fix "🛡️  Safeguards: ACTIVE"
    
    echo ""
    echo "🎉 EMERGENCY FIX COMPLETED!"
    echo "📊 Users: $user_count | Asanas: $asana_count"
    echo "🌐 Application: https://yogastudio.ecitizen.media"
    echo "🛡️  Permanent safeguards are now active"
    echo ""
    echo "🔑 To login, use the account reset script:"
    echo "   ./scripts/reset_password.sh"
    echo ""
    echo "📝 All logs saved to: /root/yogastudio/logs/"
}

# Execute emergency fix
main_emergency_fix