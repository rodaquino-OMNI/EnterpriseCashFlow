#!/bin/bash

# Master Gate Verification Script
# Usage: ./scripts/verify-gate.sh <gate-number> [options]

set -e

GATE=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVIDENCE_DIR="$PROJECT_ROOT/verification-evidence"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"

# Initialize report
REPORT_FILE="$EVIDENCE_DIR/gate${GATE}-report-${TIMESTAMP}.txt"

echo "========================================" | tee "$REPORT_FILE"
echo "GATE $GATE VERIFICATION REPORT" | tee -a "$REPORT_FILE"
echo "Timestamp: $(date)" | tee -a "$REPORT_FILE"
echo "Git Branch: $(git branch --show-current)" | tee -a "$REPORT_FILE"
echo "Git Commit: $(git rev-parse HEAD)" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Function to run check and record result
run_check() {
  local name=$1
  local command=$2

  echo -e "${YELLOW}Running: $name${NC}"
  echo "Check: $name" >> "$REPORT_FILE"

  if eval "$command" >> "$REPORT_FILE" 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}: $name" | tee -a "$REPORT_FILE"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}: $name" | tee -a "$REPORT_FILE"
    return 1
  fi
}

# Track failures
TOTAL_CHECKS=0
FAILED_CHECKS=0

case $GATE in
  gate1|1)
    echo "Verifying Gate 1: Feature Specification → Code Development" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"

    run_check "Branch naming convention" "git branch --show-current | grep -E '^(feature|bugfix|hotfix|claude)/'"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    run_check "Git repository valid" "git rev-parse --git-dir > /dev/null 2>&1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))
    ;;

  gate2|2)
    echo "Verifying Gate 2: Code Development → Pre-Merge" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"

    # Lint check
    run_check "Linting (ESLint)" "cd $PROJECT_ROOT && npm run lint"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Build check
    run_check "Build" "cd $PROJECT_ROOT && npm run build"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Test check
    run_check "Tests with coverage" "cd $PROJECT_ROOT && npm run test:coverage"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Security check
    run_check "Security audit (critical)" "cd $PROJECT_ROOT && npm audit --audit-level=critical"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # File count verification
    run_check "File count verification" "$SCRIPT_DIR/verify-file-count.sh"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))
    ;;

  gate3|3)
    echo "Verifying Gate 3: Pre-Merge → Integration Branch" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"

    # Fetch latest
    run_check "Git fetch" "git fetch origin main"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Check branch sync
    run_check "Branch sync check" "$SCRIPT_DIR/check-branch-sync.sh"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Merge conflict check
    run_check "Merge conflict detection" "$SCRIPT_DIR/check-merge-conflicts.sh"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Re-run tests
    run_check "Re-run tests" "cd $PROJECT_ROOT && npm run test:coverage"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    # Calculate confidence score
    run_check "Confidence score calculation" "$SCRIPT_DIR/calculate-confidence.sh gate3"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))
    ;;

  gate4|4)
    echo "Verifying Gate 4: Integration Branch → Staging Environment" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"

    run_check "Staging build" "cd $PROJECT_ROOT && NODE_ENV=staging npm run build"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    run_check "Tests passing" "cd $PROJECT_ROOT && npm run test:coverage"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))
    ;;

  gate5|5)
    echo "Verifying Gate 5: Staging → Production Deployment" | tee -a "$REPORT_FILE"
    echo "" | tee -a "$REPORT_FILE"

    run_check "Pre-deployment checklist" "$SCRIPT_DIR/pre-deployment-checklist.sh"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))

    run_check "Production build" "cd $PROJECT_ROOT && NODE_ENV=production npm run build"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    [ $? -ne 0 ] && FAILED_CHECKS=$((FAILED_CHECKS + 1))
    ;;

  *)
    echo -e "${RED}Error: Invalid gate number. Use 1-5 or gate1-gate5${NC}"
    exit 1
    ;;
esac

# Generate summary
echo "" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "GATE $GATE VERIFICATION SUMMARY" | tee -a "$REPORT_FILE"
echo "========================================" | tee -a "$REPORT_FILE"
echo "Total Checks: $TOTAL_CHECKS" | tee -a "$REPORT_FILE"
echo "Passed: $((TOTAL_CHECKS - FAILED_CHECKS))" | tee -a "$REPORT_FILE"
echo "Failed: $FAILED_CHECKS" | tee -a "$REPORT_FILE"

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}Status: PASS${NC}" | tee -a "$REPORT_FILE"
  echo "Gate $GATE verification completed successfully!" | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"
  echo "Evidence file: $REPORT_FILE" | tee -a "$REPORT_FILE"
  exit 0
else
  echo -e "${RED}Status: FAIL${NC}" | tee -a "$REPORT_FILE"
  echo "Gate $GATE verification failed. Please review the report." | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"
  echo "Evidence file: $REPORT_FILE" | tee -a "$REPORT_FILE"
  exit 1
fi
