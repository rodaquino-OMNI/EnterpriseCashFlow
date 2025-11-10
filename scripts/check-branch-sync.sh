#!/bin/bash

# Branch Sync Verification
# Addresses Forensic Flaw: Git fetch verification

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVIDENCE_FILE="$PROJECT_ROOT/verification-evidence/branch-sync-$(date +%Y%m%d-%H%M%S).txt"

mkdir -p "$PROJECT_ROOT/verification-evidence"

cd "$PROJECT_ROOT"

echo "=========================================" | tee "$EVIDENCE_FILE"
echo "BRANCH SYNC VERIFICATION REPORT" | tee -a "$EVIDENCE_FILE"
echo "Timestamp: $(date)" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"

# Current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current Branch: $CURRENT_BRANCH" | tee -a "$EVIDENCE_FILE"

# Fetch latest from origin
echo "Fetching latest from origin/main..." | tee -a "$EVIDENCE_FILE"
if ! git fetch origin main 2>&1 | tee -a "$EVIDENCE_FILE"; then
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Status: ✗ FAIL - git fetch failed" | tee -a "$EVIDENCE_FILE"
  exit 1
fi

# Check commits behind
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
echo "Commits behind origin/main: $BEHIND" | tee -a "$EVIDENCE_FILE"

# Check commits ahead
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
echo "Commits ahead of origin/main: $AHEAD" | tee -a "$EVIDENCE_FILE"

# Last sync time
LAST_MERGE=$(git log --grep="Merge" --format="%h %s (%ar)" -1 2>/dev/null || echo "No merge commits found")
echo "Last merge: $LAST_MERGE" | tee -a "$EVIDENCE_FILE"

# Last commit info
LAST_COMMIT=$(git log --format="%h %s (%ar)" -1)
echo "Last commit: $LAST_COMMIT" | tee -a "$EVIDENCE_FILE"

echo "" | tee -a "$EVIDENCE_FILE"

# Determine status
if [ "$BEHIND" -eq 0 ]; then
  echo "Status: ✓ PASS - Branch is up-to-date with origin/main" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 0
elif [ "$BEHIND" -le 10 ]; then
  echo "Status: ⚠ WARNING - Branch is $BEHIND commits behind (acceptable within threshold)" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 0
else
  echo "Status: ✗ FAIL - Branch is $BEHIND commits behind (exceeds 10 commit threshold)" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 1
fi
