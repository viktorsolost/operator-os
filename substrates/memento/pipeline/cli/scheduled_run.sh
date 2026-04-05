#!/bin/bash
# Memento scheduled pipeline run
# Usage: scheduled_run.sh [full|sync]
# "full" = sync + enrich + derive + morning_digest (6am Dubai run only)
# "sync" = sync + enrich + derive (all other runs)

set -u

[ -f "$HOME/VIK/.vik_env.sh" ] && . "$HOME/VIK/.vik_env.sh"
VIK_ROOT="${VIK_ROOT:-$HOME/VIK}"
MEMENTO_DIR="${MEMENTO_DIR:-$VIK_ROOT/Coding/Memento}"
LOG_DIR="$MEMENTO_DIR/state/logs"
TIMESTAMP=$(date -u +%Y-%m-%d_%H-%M)
LOG_FILE="$LOG_DIR/pipeline_${TIMESTAMP}.log"
RUN_TYPE="${1:-sync}"
NODE_BIN="$(command -v node || true)"

mkdir -p "$LOG_DIR"

if [ "$RUN_TYPE" != "sync" ] && [ "$RUN_TYPE" != "full" ]; then
  echo "Invalid run type: $RUN_TYPE. Use sync or full." | tee -a "$LOG_FILE"
  exit 2
fi

if [ ! -d "$MEMENTO_DIR" ]; then
  echo "Memento directory not found: $MEMENTO_DIR" | tee -a "$LOG_FILE"
  exit 2
fi

if [ -z "$NODE_BIN" ]; then
  echo "node binary not found in PATH" | tee -a "$LOG_FILE"
  exit 2
fi

cd "$MEMENTO_DIR"

{
  echo "=== Memento pipeline run: $RUN_TYPE at $TIMESTAMP ==="
  echo "node: $NODE_BIN"

  if [ "$RUN_TYPE" = "full" ]; then
    MEMENTO_TRIGGERED_BY=scheduled "$NODE_BIN" pipeline/cli/run.js full
  else
    MEMENTO_TRIGGERED_BY=scheduled "$NODE_BIN" pipeline/cli/run.js sync
  fi
  EXIT_CODE=$?

  echo "=== Complete: $RUN_TYPE at $(date -u +%Y-%m-%d_%H-%M) exit=$EXIT_CODE ==="
} >> "$LOG_FILE" 2>&1

# Clean logs older than 14 days
find "$LOG_DIR" -name "pipeline_*.log" -mtime +14 -delete 2>/dev/null

exit $EXIT_CODE
