#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo ">> stopping containers..."
sudo docker compose down

echo ">> rebuilding and starting..."
sudo docker compose up --build -d

echo ">> waiting for services..."
sudo docker compose logs -f --tail=0 &
LOG_PID=$!

# wait until nginx is responding (up to 60s)
for i in $(seq 1 60); do
  if curl -sf http://localhost > /dev/null 2>&1; then
    echo ""
    echo ">> ready at http://localhost"
    kill $LOG_PID 2>/dev/null || true
    exit 0
  fi
  sleep 1
done

echo ""
echo ">> timed out waiting for http://localhost"
kill $LOG_PID 2>/dev/null || true
sudo docker compose ps
exit 1
