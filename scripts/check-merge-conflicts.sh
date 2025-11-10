#!/bin/bash

# Merge Conflict Detection
# Addresses Forensic Flaw: Branch context documentation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVIDENCE_FILE="$PROJECT_ROOT/verification-evidence/merge-conflicts-$(date +%Y%m%d-%H%M%S).txt"

mkdir -p "$PROJECT_ROOT/verification-evidence"

cd "$PROJECT_ROOT"

echo "=========================================" | tee "$EVIDENCE_FILE"
echo "MERGE CONFLICT DETECTION REPORT" | tee -a "$EVIDENCE_FILE"
echo "Timestamp: $(date)" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current Branch: $CURRENT_BRANCH" | tee -a "$EVIDENCE_FILE"

# Get merge base
MERGE_BASE=$(git merge-base HEAD origin/main 2>/dev/null || echo "unknown")
echo "Merge Base: $MERGE_BASE" | tee -a "$EVIDENCE_FILE"

# Run merge-tree to detect conflicts
echo "Running merge-tree simulation..." | tee -a "$EVIDENCE_FILE"
MERGE_TREE_OUTPUT=$(git merge-tree $MERGE_BASE HEAD origin/main 2>&1 || echo "merge-tree failed")

# Save raw output
echo "$MERGE_TREE_OUTPUT" > "$EVIDENCE_FILE.raw"

# Count conflicts
CONFLICT_COUNT=$(echo "$MERGE_TREE_OUTPUT" | grep -c "^<<<<<<<" || echo 0)
echo "Conflicts detected: $CONFLICT_COUNT" | tee -a "$EVIDENCE_FILE"

if [ "$CONFLICT_COUNT" -gt 0 ]; then
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Conflicting sections:" | tee -a "$EVIDENCE_FILE"
  echo "$MERGE_TREE_OUTPUT" | grep -B 5 -A 5 "^<<<<<<<" | tee -a "$EVIDENCE_FILE"
fi

echo "" | tee -a "$EVIDENCE_FILE"

# Determine status
if [ "$CONFLICT_COUNT" -eq 0 ]; then
  echo "Status: ✓ PASS - No merge conflicts detected" | tee -a "$EVIDENCE_FILE"
  rm -f "$EVIDENCE_FILE.raw"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 0
else
  echo "Status: ✗ FAIL - $CONFLICT_COUNT merge conflicts detected" | tee -a "$EVIDENCE_FILE"
  echo "Raw merge-tree output saved to: $EVIDENCE_FILE.raw" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 1
fi
