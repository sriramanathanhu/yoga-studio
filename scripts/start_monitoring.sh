#!/bin/bash
cd /root/yogastudio
nohup ./scripts/data_integrity_monitor.sh monitor > /root/yogastudio/logs/monitor.log 2>&1 &
echo $! > /root/yogastudio/logs/monitor.pid
echo "Data integrity monitoring started (PID: $(cat /root/yogastudio/logs/monitor.pid))"
