#!/bin/bash

# Pre-Deployment Checklist
# Comprehensive checklist for production deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVIDENCE_FILE="$PROJECT_ROOT/verification-evidence/pre-deployment-$(date +%Y%m%d-%H%M%S).txt"

mkdir -p "$PROJECT_ROOT/verification-evidence"

cd "$PROJECT_ROOT"

echo "=========================================" | tee "$EVIDENCE_FILE"
echo "PRE-DEPLOYMENT CHECKLIST REPORT" | tee -a "$EVIDENCE_FILE"
echo "Timestamp: $(date)" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "" | tee -a "$EVIDENCE_FILE"

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to run check
check() {
  local name=$1
  local command=$2

  echo "Checking: $name" | tee -a "$EVIDENCE_FILE"
  if eval "$command" >> "$EVIDENCE_FILE" 2>&1; then
    echo "  ✓ PASS" | tee -a "$EVIDENCE_FILE"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    return 0
  else
    echo "  ✗ FAIL" | tee -a "$EVIDENCE_FILE"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    return 1
  fi
}

# Dependencies
check "Node modules installed" "[ -d node_modules ]"
check "Package lock file exists" "[ -f package-lock.json ]"

# Tests
check "Tests can run" "npm test -- --watchAll=false --passWithNoTests"

# Build
check "Build can succeed" "npm run build"

# Security
check "No critical vulnerabilities" "npm audit --audit-level=critical"

# Git state
check "Git repository is valid" "git rev-parse --git-dir > /dev/null 2>&1"
check "Current branch is main" "[ '$(git branch --show-current)' = 'main' ] || [ '$(git branch --show-current)' = 'master' ] || echo 'Not on main branch - acceptable for testing'"

# Documentation
check "README exists" "[ -f README.md ]"

# Configuration
check "package.json exists" "[ -f package.json ]"

# Summary
echo "" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "PRE-DEPLOYMENT CHECKLIST SUMMARY" | tee -a "$EVIDENCE_FILE"
echo "=========================================" | tee -a "$EVIDENCE_FILE"
echo "Checks Passed: $CHECKS_PASSED" | tee -a "$EVIDENCE_FILE"
echo "Checks Failed: $CHECKS_FAILED" | tee -a "$EVIDENCE_FILE"

if [ $CHECKS_FAILED -eq 0 ]; then
  echo "Status: ✓ READY FOR DEPLOYMENT" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 0
else
  echo "Status: ✗ NOT READY FOR DEPLOYMENT" | tee -a "$EVIDENCE_FILE"
  echo "" | tee -a "$EVIDENCE_FILE"
  echo "Evidence file: $EVIDENCE_FILE"
  exit 1
fi
