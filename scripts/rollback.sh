#!/bin/bash

# Automated Rollback Script
# Emergency rollback procedure for production issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVIDENCE_FILE="$PROJECT_ROOT/verification-evidence/rollback-$(date +%Y%m%d-%H%M%S).txt"

mkdir -p "$PROJECT_ROOT/verification-evidence"

cd "$PROJECT_ROOT"

echo "=========================================" | tee "$EVIDENCE_FILE"
echo "EMERGENCY ROLLBACK PROCEDURE" | tee -a "$EVIDENCE_FILE"
echo "Timestamp: $(date)" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"

# Get current state
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git branch --show-current)
echo "Current Commit: $CURRENT_COMMIT" | tee -a "$EVIDENCE_FILE"
echo "Current Branch: $CURRENT_BRANCH" | tee -a "$EVIDENCE_FILE"

# Get previous version
PREVIOUS_COMMIT=$(git rev-parse HEAD~1 2>/dev/null || echo "No previous commit available")
echo "Previous Commit: $PREVIOUS_COMMIT" | tee -a "$EVIDENCE_FILE"

if [ "$PREVIOUS_COMMIT" = "No previous commit available" ]; then
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Status: ✗ FAIL - Cannot rollback, no previous commit" | tee -a "$EVIDENCE_FILE"
  exit 1
fi

echo "" | tee -a "$EVIDENCE_FILE"
echo "Initiating rollback to: $PREVIOUS_COMMIT" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"

# Checkout previous version
echo "Step 1: Checking out previous version..." | tee -a "$EVIDENCE_FILE"
if git checkout $PREVIOUS_COMMIT 2>&1 | tee -a "$EVIDENCE_FILE"; then
  echo "  ✓ Checkout successful" | tee -a "$EVIDENCE_FILE"
else
  echo "  ✗ Checkout failed" | tee -a "$EVIDENCE_FILE"
  exit 1
fi

# Reinstall dependencies
echo "Step 2: Reinstalling dependencies..." | tee -a "$EVIDENCE_FILE"
if npm ci 2>&1 | tee -a "$EVIDENCE_FILE"; then
  echo "  ✓ Dependencies installed" | tee -a "$EVIDENCE_FILE"
else
  echo "  ✗ Dependency installation failed" | tee -a "$EVIDENCE_FILE"
  git checkout $CURRENT_BRANCH
  exit 1
fi

# Rebuild
echo "Step 3: Rebuilding application..." | tee -a "$EVIDENCE_FILE"
if NODE_ENV=production npm run build 2>&1 | tee -a "$EVIDENCE_FILE"; then
  echo "  ✓ Build successful" | tee -a "$EVIDENCE_FILE"
else
  echo "  ✗ Build failed" | tee -a "$EVIDENCE_FILE"
  git checkout $CURRENT_BRANCH
  exit 1
fi

# Verify build artifacts
echo "Step 4: Verifying build artifacts..." | tee -a "$EVIDENCE_FILE"
if [ -d "build" ]; then
  echo "  ✓ Build directory exists" | tee -a "$EVIDENCE_FILE"
else
  echo "  ✗ Build directory missing" | tee -a "$EVIDENCE_FILE"
  git checkout $CURRENT_BRANCH
  exit 1
fi

echo "" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "ROLLBACK SUMMARY" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "Previous Commit: $CURRENT_COMMIT" | tee -a "$EVIDENCE_FILE"
echo "Rolled Back To: $PREVIOUS_COMMIT" | tee -a "$EVIDENCE_FILE"
echo "Status: ✓ ROLLBACK SUCCESSFUL" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"
echo "Evidence file: $EVIDENCE_FILE" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"
echo "IMPORTANT: This is a detached HEAD state." | tee -a "$EVIDENCE_FILE"
echo "To make this permanent, run: git checkout -b rollback-$(date +%Y%m%d-%H%M%S)" | tee -a "$EVIDENCE_FILE"

exit 0
