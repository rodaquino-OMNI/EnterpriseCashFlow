# QA Verification Scripts

This directory contains automated verification scripts for quality gates in the Enterprise CashFlow Analytics Platform.

## Overview

These scripts implement the Quality Assurance Architecture Framework defined in `/home/user/EnterpriseCashFlow/QA_ARCHITECTURE.md`.

## Scripts

### Core Verification Scripts

#### `verify-gate.sh`
Master gate verification script that orchestrates all quality gate checks.

**Usage:**
```bash
./scripts/verify-gate.sh <gate-number>
```

**Examples:**
```bash
./scripts/verify-gate.sh gate1  # Verify Gate 1: Feature Spec → Code Dev
./scripts/verify-gate.sh gate2  # Verify Gate 2: Code Dev → Pre-Merge
./scripts/verify-gate.sh gate3  # Verify Gate 3: Pre-Merge → Integration
./scripts/verify-gate.sh gate4  # Verify Gate 4: Integration → Staging
./scripts/verify-gate.sh gate5  # Verify Gate 5: Staging → Production
```

**Output:**
- Creates timestamped report in `verification-evidence/`
- Exits with code 0 (pass) or 1 (fail)
- Displays pass/fail status for each check

---

#### `calculate-confidence.sh`
Calculates objective confidence score for proceeding to next phase.

**Usage:**
```bash
./scripts/calculate-confidence.sh <gate-name>
```

**Scoring:**
- Test Coverage: 25 points
- Build Success: 15 points
- Lint Success: 10 points
- Tests Passing: 20 points
- Code Reviews: 15 points
- Security Audit: 10 points
- Documentation: 5 points

**Thresholds:**
- ≥ 85: High confidence (ready to proceed)
- 70-84: Moderate confidence (review required)
- < 70: Low confidence (not recommended)

---

#### `verify-file-count.sh`
Verifies file counts using dual counting mechanism to prevent counting errors.

**Usage:**
```bash
./scripts/verify-file-count.sh
```

**Verification:**
- Counts files using `find` command
- Cross-verifies using `grep` method
- Ensures difference < 3%
- Addresses Forensic Flaw: File counts had 3-9% errors

---

#### `check-branch-sync.sh`
Verifies branch is synchronized with origin/main.

**Usage:**
```bash
./scripts/check-branch-sync.sh
```

**Checks:**
- Fetches latest from origin/main
- Counts commits ahead/behind
- Identifies last merge commit
- Threshold: ≤ 10 commits behind

---

#### `check-merge-conflicts.sh`
Detects merge conflicts before attempting merge.

**Usage:**
```bash
./scripts/check-merge-conflicts.sh
```

**Verification:**
- Runs git merge-tree simulation
- Detects conflicts without modifying working tree
- Lists conflicting files
- Saves raw output for analysis

---

#### `pre-deployment-checklist.sh`
Comprehensive pre-deployment verification checklist.

**Usage:**
```bash
./scripts/pre-deployment-checklist.sh
```

**Checks:**
- Dependencies installed
- Tests passing
- Build successful
- No critical security vulnerabilities
- Git repository state valid
- Documentation present

---

#### `rollback.sh`
Emergency rollback procedure for production issues.

**Usage:**
```bash
./scripts/rollback.sh
```

**Procedure:**
1. Captures current state
2. Identifies previous commit
3. Checks out previous version
4. Reinstalls dependencies
5. Rebuilds application
6. Verifies build artifacts

**WARNING:** Creates detached HEAD state. Follow instructions in output to make permanent.

---

## Evidence Collection

All scripts generate timestamped evidence files in:
```
/home/user/EnterpriseCashFlow/verification-evidence/
```

**Evidence Files:**
- `gate{N}-report-YYYYMMDD-HHMMSS.txt` - Gate verification reports
- `file-count-YYYYMMDD-HHMMSS.txt` - File count verifications
- `branch-sync-YYYYMMDD-HHMMSS.txt` - Branch sync reports
- `merge-conflicts-YYYYMMDD-HHMMSS.txt` - Merge conflict reports
- `pre-deployment-YYYYMMDD-HHMMSS.txt` - Pre-deployment checklists
- `rollback-YYYYMMDD-HHMMSS.txt` - Rollback procedure logs

## Safeguards Against Known Flaws

These scripts implement safeguards for 10 systematic flaws identified in forensic analysis:

1. **Git Fetch Verification**: Mandatory fetch with exit code checking
2. **Confidence Calculation**: Objective scoring with documented methodology
3. **File Count Accuracy**: Dual counting with < 3% tolerance
4. **QA Checklist Enforcement**: Automated checklist execution
5. **Branch Context Documentation**: Git context captured in all evidence
6. **Timeline Verification**: Git history validation
7. **Evidence Artifacts**: Timestamped evidence for all checks
8. **Automated Verification**: Scripts replace manual processes
9. **Failure Handling**: Clear exit codes and error messages
10. **Reproducibility**: Standardized commands and evidence format

## Integration with CI/CD

These scripts can be integrated into GitHub Actions workflow:

```yaml
- name: Run Gate 2 Verification
  run: ./scripts/verify-gate.sh gate2

- name: Calculate Confidence Score
  run: ./scripts/calculate-confidence.sh gate2

- name: Upload Evidence
  uses: actions/upload-artifact@v3
  with:
    name: gate2-evidence
    path: verification-evidence/
```

## Exit Codes

All scripts follow standard exit code conventions:
- `0` - Success/Pass
- `1` - Failure/Fail

## Requirements

- Git
- Node.js & npm
- Bash 4.0+
- Standard Unix utilities (find, grep, wc, awk)
- Optional: GitHub CLI (`gh`) for PR checks

## Troubleshooting

### Script fails with "permission denied"
```bash
chmod +x scripts/*.sh
```

### Evidence directory not created
```bash
mkdir -p verification-evidence
```

### Git commands fail
Ensure you're in a valid git repository:
```bash
git status
```

### npm commands fail
Ensure dependencies are installed:
```bash
npm install
```

## Testing the Scripts

Test each script individually:

```bash
# Test Gate 2 verification
./scripts/verify-gate.sh gate2

# Test confidence calculation
./scripts/calculate-confidence.sh gate2

# Test file count verification
./scripts/verify-file-count.sh

# Test branch sync
./scripts/check-branch-sync.sh

# Test merge conflict detection
./scripts/check-merge-conflicts.sh

# Test pre-deployment checklist
./scripts/pre-deployment-checklist.sh
```

## Support

For questions or issues with these scripts, refer to:
- QA Architecture Framework: `/home/user/EnterpriseCashFlow/QA_ARCHITECTURE.md`
- Project Documentation: `/home/user/EnterpriseCashFlow/README.md`
- SPARC Methodology: `/home/user/EnterpriseCashFlow/CLAUDE.md`

## Maintenance

Scripts should be reviewed and updated:
- After major framework changes
- When new failure modes are discovered
- Quarterly as part of QA review process
- When CI/CD pipeline changes

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-10 | Initial script suite |
