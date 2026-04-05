#!/bin/bash
# Install cron schedule for Memento pipeline
# 21 runs/day: hourly 6:45am-midnight Dubai + 3 overnight + 1 digest at 6am Dubai

[ -f "$HOME/VIK/.vik_env.sh" ] && . "$HOME/VIK/.vik_env.sh"
VIK_ROOT="${VIK_ROOT:-$HOME/VIK}"
MEMENTO_DIR="${MEMENTO_DIR:-$VIK_ROOT/Coding/Memento}"
SCRIPT="$MEMENTO_DIR/pipeline/cli/scheduled_run.sh"

# Build crontab entries
CRON_ENTRIES=""

# Hourly daytime runs (sync only): 02:45-20:00 UTC
for HOUR in 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19; do
  CRON_ENTRIES="$CRON_ENTRIES\n45 $HOUR * * * $SCRIPT sync"
done
CRON_ENTRIES="$CRON_ENTRIES\n0 20 * * * $SCRIPT sync"

# Overnight runs (sync only): 22:00, 00:00 UTC
CRON_ENTRIES="$CRON_ENTRIES\n0 22 * * * $SCRIPT sync"
CRON_ENTRIES="$CRON_ENTRIES\n0 0 * * * $SCRIPT sync"

# Morning digest run (full): 02:00 UTC = 6am Dubai
CRON_ENTRIES="$CRON_ENTRIES\n0 2 * * * $SCRIPT full"

# Install (preserve existing non-Memento crontab entries)
(crontab -l 2>/dev/null | grep -v "$SCRIPT"; echo -e "$CRON_ENTRIES") | crontab -

echo "Cron schedule installed (21 runs/day). Verify with: crontab -l"
