#!/bin/bash

# File Count Verification Script
# Addresses Forensic Flaw: File counts had 3-9% errors

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVIDENCE_FILE="$PROJECT_ROOT/verification-evidence/file-count-$(date +%Y%m%d-%H%M%S).txt"

mkdir -p "$PROJECT_ROOT/verification-evidence"

cd "$PROJECT_ROOT"

echo "=========================================" | tee "$EVIDENCE_FILE"
echo "FILE COUNT VERIFICATION REPORT" | tee -a "$EVIDENCE_FILE"
echo "Timestamp: $(date)" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"

# Function to count files with verification
count_and_verify() {
  local pattern=$1
  local description=$2

  # Count using find
  local find_count=$(find . -type f -name "$pattern" ! -path "*/node_modules/*" ! -path "*/build/*" ! -path "*/.git/*" 2>/dev/null | wc -l)

  # Count using ls and grep (as verification)
  local grep_count=$(find . -type f ! -path "*/node_modules/*" ! -path "*/build/*" ! -path "*/.git/*" 2>/dev/null | grep -c "$pattern" || echo 0)

  # Calculate difference
  local diff=$((find_count - grep_count))
  if [ $diff -lt 0 ]; then
    diff=$((diff * -1))
  fi

  local diff_pct=0
  if [ $find_count -gt 0 ]; then
    diff_pct=$(awk "BEGIN {printf \"%.2f\", ($diff / $find_count) * 100}")
  fi

  echo "$description:" | tee -a "$EVIDENCE_FILE"
  echo "  Find count: $find_count" | tee -a "$EVIDENCE_FILE"
  echo "  Grep count: $grep_count" | tee -a "$EVIDENCE_FILE"
  echo "  Difference: $diff (${diff_pct}%)" | tee -a "$EVIDENCE_FILE"

  # Verify difference is within acceptable range (< 3%)
  local is_pass=$(awk "BEGIN {print ($diff_pct < 3.0) ? 1 : 0}")
  if [ "$is_pass" -eq 1 ]; then
    echo "  Status: ✓ PASS (within 3% tolerance)" | tee -a "$EVIDENCE_FILE"
    echo "" | tee -a "$EVIDENCE_FILE"
    return 0
  else
    echo "  Status: ✗ FAIL (exceeds 3% tolerance)" | tee -a "$EVIDENCE_FILE"
    echo "" | tee -a "$EVIDENCE_FILE"
    return 1
  fi
}

# Count various file types
PASS_COUNT=0
FAIL_COUNT=0

count_and_verify "*.js" "JavaScript files"
[ $? -eq 0 ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))

count_and_verify "*.jsx" "JSX files"
[ $? -eq 0 ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))

count_and_verify "*.test.js" "Test files"
[ $? -eq 0 ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))

count_and_verify "*.json" "JSON files"
[ $? -eq 0 ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))

count_and_verify "*.md" "Markdown files"
[ $? -eq 0 ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))

# Summary
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "SUMMARY" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "Checks Passed: $PASS_COUNT" | tee -a "$EVIDENCE_FILE"
echo "Checks Failed: $FAIL_COUNT" | tee -a "$EVIDENCE_FILE"

if [ $FAIL_COUNT -eq 0 ]; then
  echo "Status: ✓ ALL CHECKS PASSED" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 0
else
  echo "Status: ✗ SOME CHECKS FAILED" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 1
fi
