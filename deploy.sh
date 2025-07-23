#!/bin/bash
echo "🛡️  Using safe deployment by default..."
cd /root/yogastudio
exec ./scripts/bulletproof_deploy.sh "$@"
