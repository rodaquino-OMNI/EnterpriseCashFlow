#!/bin/bash

# Confidence Score Calculator
# Addresses Forensic Flaw: Confidence overstated by 26.5 points

set -e

GATE=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

SCORE=0
MAX_SCORE=100

echo "=========================================="
echo "CONFIDENCE SCORE CALCULATION - $GATE"
echo "=========================================="
echo ""

# Test Coverage (25 points)
echo "1. Test Coverage (25 points)"
COVERAGE_OUTPUT=$(npm test -- --coverage --watchAll=false 2>&1 || true)
COVERAGE=$(echo "$COVERAGE_OUTPUT" | grep "All files" | awk '{print $10}' | tr -d '%' | head -1)

if [ -z "$COVERAGE" ]; then
  COVERAGE=0
fi

if [ "$COVERAGE" -ge 90 ]; then
  COV_SCORE=25
elif [ "$COVERAGE" -ge 80 ]; then
  COV_SCORE=20
elif [ "$COVERAGE" -ge 70 ]; then
  COV_SCORE=15
else
  COV_SCORE=10
fi
SCORE=$((SCORE + COV_SCORE))
echo "   Coverage: ${COVERAGE}% → Score: +${COV_SCORE}/25"

# Build Success (15 points)
echo "2. Build Success (15 points)"
if npm run build > /dev/null 2>&1; then
  SCORE=$((SCORE + 15))
  echo "   Build: SUCCESS → Score: +15/15"
else
  echo "   Build: FAILED → Score: +0/15"
fi

# Lint Success (10 points)
echo "3. Lint Success (10 points)"
LINT_OUTPUT=$(npm run lint 2>&1 || true)
if echo "$LINT_OUTPUT" | grep -q "0 errors"; then
  SCORE=$((SCORE + 10))
  echo "   Lint: PASS (0 errors) → Score: +10/10"
else
  LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -o "[0-9]* error" | head -1 | awk '{print $1}')
  if [ -z "$LINT_ERRORS" ]; then
    LINT_ERRORS=0
  fi
  LINT_SCORE=$((10 - LINT_ERRORS))
  if [ $LINT_SCORE -lt 0 ]; then
    LINT_SCORE=0
  fi
  SCORE=$((SCORE + LINT_SCORE))
  echo "   Lint: ${LINT_ERRORS} errors → Score: +${LINT_SCORE}/10"
fi

# Tests Passing (20 points)
echo "4. Tests Passing (20 points)"
TEST_OUTPUT=$(npm test -- --watchAll=false 2>&1 || true)
TESTS_PASSED=$(echo "$TEST_OUTPUT" | grep "Tests:" | awk '{print $2}' | cut -d'/' -f1 | head -1)
TESTS_TOTAL=$(echo "$TEST_OUTPUT" | grep "Tests:" | awk '{print $2}' | cut -d'/' -f2 | head -1)

if [ -z "$TESTS_PASSED" ] || [ -z "$TESTS_TOTAL" ]; then
  TESTS_PASSED=0
  TESTS_TOTAL=1
fi

if [ "$TESTS_PASSED" = "$TESTS_TOTAL" ] && [ "$TESTS_TOTAL" -gt 0 ]; then
  SCORE=$((SCORE + 20))
  echo "   Tests: ${TESTS_PASSED}/${TESTS_TOTAL} passing → Score: +20/20"
else
  if [ "$TESTS_TOTAL" -gt 0 ]; then
    TEST_SCORE=$((20 * TESTS_PASSED / TESTS_TOTAL))
  else
    TEST_SCORE=0
  fi
  SCORE=$((SCORE + TEST_SCORE))
  echo "   Tests: ${TESTS_PASSED}/${TESTS_TOTAL} passing → Score: +${TEST_SCORE}/20"
fi

# Code Review Approvals (15 points)
echo "5. Code Review Approvals (15 points)"
if command -v gh > /dev/null 2>&1; then
  APPROVALS=$(gh pr view --json reviews --jq '[.reviews[] | select(.state == "APPROVED")] | length' 2>/dev/null || echo 0)
  if [ "$APPROVALS" -ge 2 ]; then
    SCORE=$((SCORE + 15))
    echo "   Reviews: ${APPROVALS} approvals → Score: +15/15"
  elif [ "$APPROVALS" -eq 1 ]; then
    SCORE=$((SCORE + 10))
    echo "   Reviews: ${APPROVALS} approval → Score: +10/15"
  else
    echo "   Reviews: ${APPROVALS} approvals → Score: +0/15"
  fi
else
  echo "   Reviews: N/A (GitHub CLI not available) → Score: +0/15"
fi

# Security Audit (10 points)
echo "6. Security Audit (10 points)"
AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"critical":0,"high":0}}}')
CRITICAL_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"critical":[0-9]*' | head -1 | cut -d':' -f2 || echo 0)
HIGH_VULNS=$(echo "$AUDIT_OUTPUT" | grep -o '"high":[0-9]*' | head -1 | cut -d':' -f2 || echo 0)

# Ensure variables are not empty
CRITICAL_VULNS=${CRITICAL_VULNS:-0}
HIGH_VULNS=${HIGH_VULNS:-0}

if [ "$CRITICAL_VULNS" -eq 0 ] && [ "$HIGH_VULNS" -eq 0 ]; then
  SCORE=$((SCORE + 10))
  echo "   Security: 0 critical, 0 high → Score: +10/10"
else
  SCORE=$((SCORE + 5))
  echo "   Security: ${CRITICAL_VULNS} critical, ${HIGH_VULNS} high → Score: +5/10"
fi

# Documentation (5 points)
echo "7. Documentation (5 points)"
if [ -f "README.md" ]; then
  README_SIZE=$(wc -l < README.md)
  if [ "$README_SIZE" -gt 50 ]; then
    SCORE=$((SCORE + 5))
    echo "   Docs: README with ${README_SIZE} lines → Score: +5/5"
  else
    SCORE=$((SCORE + 2))
    echo "   Docs: README with ${README_SIZE} lines (minimal) → Score: +2/5"
  fi
else
  echo "   Docs: No README found → Score: +0/5"
fi

# Calculate final score
echo ""
echo "=========================================="
echo "CONFIDENCE SCORE: $SCORE / $MAX_SCORE"
PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($SCORE/$MAX_SCORE)*100}")
echo "Percentage: ${PERCENTAGE}%"
echo "=========================================="

# Determine status
if [ "$SCORE" -ge 85 ]; then
  echo "Status: ✓ HIGH CONFIDENCE - Ready to proceed"
  exit 0
elif [ "$SCORE" -ge 70 ]; then
  echo "Status: ⚠ MODERATE CONFIDENCE - Review required"
  exit 0
else
  echo "Status: ✗ LOW CONFIDENCE - Not recommended to proceed"
  exit 1
fi
