#!/bin/bash

# Auto-Git Script for Continuous Development
# Automatically commits and pushes changes every few minutes

WATCH_DIR="/root/yogastudio"
CHECK_INTERVAL=300  # 5 minutes

echo "🔄 Auto-Git monitoring started for Yoga Studio"
echo "📁 Watching: $WATCH_DIR"
echo "⏰ Check interval: ${CHECK_INTERVAL}s (5 minutes)"
echo "🛑 Press Ctrl+C to stop"

cd "$WATCH_DIR"

while true; do
    # Check if there are changes
    if ! git diff --quiet || ! git diff --staged --quiet; then
        echo "📝 Changes detected at $(date)"
        
        # Use the git-push script
        ./git-push.sh "Auto-commit: Development progress $(date '+%H:%M')"
        
        echo "✅ Auto-commit completed"
    else
        echo "⏳ No changes at $(date '+%H:%M:%S')"
    fi
    
    sleep $CHECK_INTERVAL
done