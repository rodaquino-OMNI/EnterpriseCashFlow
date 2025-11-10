# QA Quick Reference Guide

## Quality Gate Commands

### Gate 1: Feature Specification → Code Development
```bash
./scripts/verify-gate.sh gate1
```
**Pass Criteria:** Complete spec, branch naming convention followed

---

### Gate 2: Code Development → Pre-Merge
```bash
./scripts/verify-gate.sh gate2
```
**Pass Criteria:** Lint pass, build pass, tests pass, 80% coverage

---

### Gate 3: Pre-Merge → Integration Branch
```bash
./scripts/verify-gate.sh gate3
```
**Pass Criteria:** No conflicts, CI pass, 2+ approvals, confidence ≥ 85

---

### Gate 4: Integration → Staging
```bash
./scripts/verify-gate.sh gate4
```
**Pass Criteria:** Staging deploy successful, smoke tests pass

---

### Gate 5: Staging → Production
```bash
./scripts/verify-gate.sh gate5
```
**Pass Criteria:** Pre-deployment checks pass, prod build successful

---

## Common Workflows

### Before Creating PR
```bash
# 1. Run Gate 2 verification
./scripts/verify-gate.sh gate2

# 2. Check confidence score
./scripts/calculate-confidence.sh gate2

# 3. Verify branch sync
./scripts/check-branch-sync.sh

# If all pass, create PR
```

### Before Merging PR
```bash
# 1. Run Gate 3 verification
./scripts/verify-gate.sh gate3

# 2. Check for merge conflicts
./scripts/check-merge-conflicts.sh

# 3. Calculate final confidence
./scripts/calculate-confidence.sh gate3

# If all pass, merge PR
```

### Before Deployment
```bash
# 1. Run pre-deployment checklist
./scripts/pre-deployment-checklist.sh

# 2. Run Gate 5 verification
./scripts/verify-gate.sh gate5

# If all pass, deploy
```

---

## Quick Checks

### Build Check
```bash
npm run build
```

### Test Check
```bash
npm run test:coverage
```

### Lint Check
```bash
npm run lint
```

### Security Check
```bash
npm audit --audit-level=critical
```

### Coverage Check
```bash
npm test -- --coverage --watchAll=false | grep "All files"
```

---

## Confidence Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 85-100 | ✓ High | Proceed confidently |
| 70-84 | ⚠ Moderate | Review and approve |
| 0-69 | ✗ Low | Do not proceed |

---

## Emergency Procedures

### Rollback Production
```bash
./scripts/rollback.sh
```

### Check Application Health
```bash
curl https://enterprisecashflow.com/health
```

### View Recent Logs
```bash
git log --oneline -10
```

---

## Evidence Locations

All verification evidence stored in:
```
/home/user/EnterpriseCashFlow/verification-evidence/
```

Evidence retention:
- **Active**: 30 days
- **Archived**: 1 year

---

## Failure Handling

### Build Failure
1. Check error message in evidence file
2. Fix build errors
3. Re-run gate verification
4. Commit fixes

### Test Failure
1. Identify failing tests
2. Fix test or code
3. Run tests locally
4. Re-run gate verification

### Merge Conflict
1. Review conflict details in evidence
2. Sync branch with main: `git pull origin main`
3. Resolve conflicts
4. Re-run conflict check
5. Commit resolution

### Low Confidence Score
1. Review score breakdown
2. Address lowest-scoring areas
3. Re-calculate confidence
4. Repeat until ≥ 85

---

## Acceptance Thresholds

### Code Quality
- Lint: 0 errors
- Build: Success
- Type Check: 0 errors

### Testing
- Coverage: ≥ 80% (≥ 100% critical paths)
- Tests Passing: 100%
- Integration Tests: Pass

### Security
- Critical Vulnerabilities: 0
- High Vulnerabilities: 0

### Performance
- Build Time: < 5 minutes
- Test Time: < 3 minutes
- Bundle Size: < 5MB

---

## Git Workflow

### Feature Branch
```bash
git checkout -b feature/my-feature
# ... make changes ...
./scripts/verify-gate.sh gate2
git push -u origin feature/my-feature
# ... create PR ...
```

### Before Merge
```bash
git fetch origin main
./scripts/check-branch-sync.sh
./scripts/check-merge-conflicts.sh
./scripts/verify-gate.sh gate3
# ... merge PR ...
```

### After Merge
```bash
git checkout main
git pull origin main
./scripts/verify-gate.sh gate4
```

---

## Troubleshooting

### "Permission denied" error
```bash
chmod +x scripts/*.sh
```

### "Command not found" error
```bash
# Ensure you're in project root
cd /home/user/EnterpriseCashFlow

# Or use absolute path
/home/user/EnterpriseCashFlow/scripts/verify-gate.sh gate2
```

### Evidence directory missing
```bash
mkdir -p verification-evidence
```

### Git commands fail
```bash
# Ensure git repo is valid
git status

# Fetch latest
git fetch origin main
```

---

## CI/CD Integration

GitHub Actions example:
```yaml
- name: Gate 2 Verification
  run: ./scripts/verify-gate.sh gate2
```

---

## Contact Information

- **QA Lead**: [Name]
- **DevOps Lead**: [Name]
- **On-Call Engineer**: Check schedule

---

## Related Documents

- [QA Architecture Framework](/home/user/EnterpriseCashFlow/QA_ARCHITECTURE.md)
- [Scripts README](/home/user/EnterpriseCashFlow/scripts/README.md)
- [Testing Summary](/home/user/EnterpriseCashFlow/TESTING_SUMMARY.md)
- [SPARC Methodology](/home/user/EnterpriseCashFlow/CLAUDE.md)

---

**Last Updated**: 2025-11-10
**Version**: 1.0.0
