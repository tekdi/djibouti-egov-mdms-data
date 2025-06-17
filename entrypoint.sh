#!/bin/sh
set -e
REPO_URL="${REPO_URL:-https://github.com/$(basename $(pwd)).git}"
WORKDIR="/tmp/repo"
CACHEFILE="/app/git_changes_cache.txt"

update_cache() {
  rm -rf "$WORKDIR"
  if git clone --depth=50 "$REPO_URL" "$WORKDIR"; then
    python3 "$WORKDIR/tools/scripts/git_changes.py" 30 > "$CACHEFILE" || echo "Failed to run git_changes.py"
    rm -rf "$WORKDIR"
  else
    echo "Git clone failed, using existing cache if available."
  fi
}

# Run once at startup
update_cache

# Setup cron job to update cache daily at 2am
echo "0 2 * * * /bin/sh -c 'REPO_URL=$REPO_URL /app/entrypoint.sh --cron'" | crontab -
crond

# If called with --cron, just update cache and exit
if [ "$1" = "--cron" ]; then
  update_cache
  exit 0
fi

# Start the Express server
exec node tools/viz/server.js 