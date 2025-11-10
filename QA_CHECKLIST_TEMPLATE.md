# QA Verification Checklist Template

Use this template for manual verification when automated checks are not sufficient.

---

## Gate 1: Feature Specification → Code Development

**Feature ID**: _________
**Developer**: _________
**Date**: _________

### Specification Review
- [ ] Business requirements documented
- [ ] Technical requirements documented
- [ ] Success criteria defined (measurable)
- [ ] Edge cases identified
- [ ] Dependencies listed
- [ ] Technical risks assessed
- [ ] Mitigation strategies defined

### Architecture Review
- [ ] Architecture Decision Record (ADR) created
- [ ] Component diagram created (if needed)
- [ ] Data flow documented
- [ ] API contracts defined
- [ ] Security considerations documented
- [ ] Performance requirements documented

### Test Strategy
- [ ] Unit test plan defined
- [ ] Integration test plan defined
- [ ] E2E test scenarios defined
- [ ] Coverage targets set
- [ ] Test data strategy defined

### Approvals
- [ ] Product Owner: _________ (signature/date)
- [ ] Tech Lead: _________ (signature/date)
- [ ] Security Lead: _________ (signature/date - if required)

**Gate 1 Status**: ☐ PASS  ☐ FAIL
**Next Gate**: Gate 2

---

## Gate 2: Code Development → Pre-Merge

**Feature ID**: _________
**Developer**: _________
**Branch**: _________
**Date**: _________

### Automated Checks (via script)
```bash
./scripts/verify-gate.sh gate2
```
- [ ] Script executed successfully
- [ ] Evidence file generated: _________

### Code Quality
- [ ] No console.log in production code
- [ ] No console.error without error handling
- [ ] No debugger statements
- [ ] No TODO comments (or tracked in backlog)
- [ ] Commented code removed
- [ ] Files < 500 lines (exceptions documented)
- [ ] Functions < 50 lines (exceptions documented)
- [ ] Meaningful variable names
- [ ] DRY principle followed

### Testing
- [ ] Unit tests written for new code
- [ ] Integration tests written (if applicable)
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Tests are deterministic (no flaky tests)
- [ ] Test names are descriptive
- [ ] Coverage: ____% (target: 80%+)

### Security
- [ ] No hardcoded secrets
- [ ] No sensitive data in logs
- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] Authentication checked (if applicable)
- [ ] Authorization checked (if applicable)

### Documentation
- [ ] Inline comments for complex logic
- [ ] Function documentation (JSDoc)
- [ ] README updated (if public API changed)
- [ ] Migration guide (if breaking changes)
- [ ] ADR updated (if architectural changes)

### Self-Review
- [ ] Self-review completed
- [ ] All files reviewed
- [ ] Commit messages clear and descriptive
- [ ] Branch follows naming convention

**Gate 2 Status**: ☐ PASS  ☐ FAIL
**Next Gate**: Gate 3 (Create PR)

---

## Gate 3: Pre-Merge → Integration Branch

**PR Number**: _________
**Developer**: _________
**Date**: _________

### Automated Checks (via script)
```bash
./scripts/verify-gate.sh gate3
```
- [ ] Script executed successfully
- [ ] Evidence file generated: _________

### Branch Status
- [ ] Branch synced with main (< 10 commits behind)
- [ ] No merge conflicts
- [ ] Git fetch completed successfully
- [ ] Branch context documented in evidence

### PR Quality
- [ ] PR title descriptive
- [ ] PR description complete
  - [ ] What changed
  - [ ] Why it changed
  - [ ] How to test
- [ ] Related issues linked
- [ ] Breaking changes documented
- [ ] Screenshots included (if UI changes)

### Code Review
- [ ] Review #1: _________ (reviewer name) - ☐ APPROVED  ☐ CHANGES REQUESTED
- [ ] Review #2: _________ (reviewer name) - ☐ APPROVED  ☐ CHANGES REQUESTED
- [ ] CODEOWNERS approval (if required)
- [ ] All comments addressed or explicitly deferred
- [ ] No unresolved conversations

### CI/CD Pipeline
- [ ] All CI jobs passing
- [ ] Build successful
- [ ] Tests passing
- [ ] Lint passing
- [ ] Security scan passing

### Confidence Score
```bash
./scripts/calculate-confidence.sh gate3
```
- [ ] Confidence score: ____/100 (target: ≥ 85)

### Integration Testing
- [ ] Integration tests passing
- [ ] Performance tests passing (no regression > 10%)
- [ ] Accessibility tests passing

**Gate 3 Status**: ☐ PASS  ☐ FAIL
**Next Gate**: Gate 4 (Merge to main)

---

## Gate 4: Integration Branch → Staging Environment

**Deployment ID**: _________
**Deploy Engineer**: _________
**Date**: _________

### Automated Checks (via script)
```bash
./scripts/verify-gate.sh gate4
```
- [ ] Script executed successfully
- [ ] Evidence file generated: _________

### Build & Deployment
- [ ] Staging build successful
- [ ] Deployment to staging successful
- [ ] Deployment time: ______ minutes (target: < 10)
- [ ] No deployment errors

### Health Checks
- [ ] Health endpoint responding (HTTP 200)
- [ ] All services healthy
- [ ] Database connections established
- [ ] External integrations responding

### Smoke Tests
- [ ] Critical path #1: Manual data entry - ☐ PASS  ☐ FAIL
- [ ] Critical path #2: Excel upload - ☐ PASS  ☐ FAIL
- [ ] Critical path #3: PDF AI extraction - ☐ PASS  ☐ FAIL
- [ ] Critical path #4: Report generation - ☐ PASS  ☐ FAIL

### Performance Validation
- [ ] Page load time: ______ seconds (target: < 3s)
- [ ] API response time (p95): ______ ms (target: < 500ms)
- [ ] No memory leaks detected
- [ ] Error rate: ______% (target: < 0.1%)

### Integration Validation
- [ ] AI service integration working
- [ ] Excel parser working
- [ ] PDF parser working
- [ ] Export services working
- [ ] Chart rendering working

### Security Validation
- [ ] Security headers present
- [ ] HTTPS enabled
- [ ] API authentication working
- [ ] No new vulnerabilities detected

### Manual Testing
- [ ] Exploratory testing completed
- [ ] User flows validated
- [ ] Browser compatibility checked (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness checked

### Rollback Preparation
- [ ] Rollback procedure tested
- [ ] Previous version identified
- [ ] Rollback script ready
- [ ] Rollback time: ______ minutes (target: < 5)

### QA Sign-off
- [ ] QA Engineer: _________ (signature/date)

**Gate 4 Status**: ☐ PASS  ☐ FAIL
**Next Gate**: Gate 5 (Production deployment)

---

## Gate 5: Staging → Production Deployment

**Deployment ID**: _________
**Incident Commander**: _________
**Date/Time**: _________

### Pre-Deployment

#### Automated Checks (via script)
```bash
./scripts/pre-deployment-checklist.sh
./scripts/verify-gate.sh gate5
```
- [ ] Pre-deployment script passed
- [ ] Gate 5 script passed
- [ ] Evidence files generated

#### Staging Validation
- [ ] Final validation in staging completed
- [ ] All smoke tests passing
- [ ] Performance acceptable
- [ ] No critical issues

#### Change Management
- [ ] Change ticket created: _________
- [ ] Deployment window scheduled: _________
- [ ] Stakeholders notified
- [ ] Maintenance window announced (if applicable)

#### Team Readiness
- [ ] On-call engineer assigned: _________
- [ ] Incident commander assigned: _________
- [ ] Communication channels ready
- [ ] Escalation path documented

#### Backup & Rollback
- [ ] Database backup completed (< 1 hour old)
- [ ] Backup verified and restorable
- [ ] Rollback plan documented
- [ ] Rollback script tested
- [ ] Blue-green deployment ready (if applicable)

#### Production Readiness
- [ ] Production build successful
- [ ] Bundle size: ______ MB (target: < 5MB)
- [ ] Security headers verified
- [ ] Environment variables verified
- [ ] Monitoring configured
- [ ] Alerting configured

### Approvals
- [ ] Tech Lead: _________ (signature/time)
- [ ] Security Lead: _________ (signature/time)
- [ ] Product Owner: _________ (signature/time)
- [ ] DevOps Lead: _________ (signature/time)

### Go/No-Go Decision
**Decision**: ☐ GO  ☐ NO-GO
**Decision Time**: _________

---

### Deployment Execution

#### Deploy Steps
- [ ] Step 1: Pre-deployment checks complete
- [ ] Step 2: Traffic redirected (if blue-green)
- [ ] Step 3: Database migrations executed
- [ ] Step 4: Application deployed
- [ ] Step 5: Health checks verified

**Deployment Start Time**: _________
**Deployment End Time**: _________
**Total Duration**: ______ minutes

---

### Post-Deployment Validation

#### Immediate Checks (0-5 minutes)
- [ ] Health endpoint: HTTP ______ (target: 200)
- [ ] Error rate: ______% (target: < 0.1%)
- [ ] Response time: ______ ms (target: < 500ms)
- [ ] No 5xx errors

#### Smoke Tests (5-15 minutes)
- [ ] Critical path #1: Manual data entry - ☐ PASS  ☐ FAIL
- [ ] Critical path #2: Excel upload - ☐ PASS  ☐ FAIL
- [ ] Critical path #3: PDF AI extraction - ☐ PASS  ☐ FAIL
- [ ] Critical path #4: Report generation - ☐ PASS  ☐ FAIL

#### Monitoring (15-60 minutes)
- [ ] Error rate stable: ______%
- [ ] Response times acceptable: ______ ms (p95)
- [ ] CPU usage: ______% (target: < 80%)
- [ ] Memory usage: ______% (target: < 80%)
- [ ] No alerts triggered

#### Extended Monitoring (1-24 hours)
- [ ] 1 hour: No issues detected
- [ ] 4 hours: Metrics stable
- [ ] 24 hours: Full validation complete

---

### Post-Deployment

#### Documentation
- [ ] Deployment runbook updated
- [ ] Change ticket updated
- [ ] Stakeholders notified of success
- [ ] Release notes published

#### Retrospective
- [ ] What went well: _________________
- [ ] What could improve: _________________
- [ ] Action items: _________________

**Gate 5 Status**: ☐ PASS  ☐ FAIL
**Production Status**: ☐ HEALTHY  ☐ MONITORING  ☐ ROLLBACK INITIATED

---

## Emergency Rollback Checklist

**Triggered by**: _________
**Time**: _________
**Incident Commander**: _________

### Rollback Decision
- [ ] Error rate > 1%
- [ ] Response time > 1000ms (p95)
- [ ] Health check failing
- [ ] Critical functionality broken
- [ ] Security incident

**Rollback Decision**: ☐ YES  ☐ NO
**Decision Time**: _________

### Rollback Execution
```bash
./scripts/rollback.sh
```
- [ ] Rollback script executed
- [ ] Previous version deployed
- [ ] Health checks passing
- [ ] Error rate acceptable

**Rollback Start**: _________
**Rollback Complete**: _________
**Duration**: ______ minutes

### Post-Rollback
- [ ] Stakeholders notified
- [ ] Incident ticket created
- [ ] Root cause analysis scheduled
- [ ] Fix-forward plan created

---

## Notes and Observations

### Issues Encountered
1. _________________
2. _________________
3. _________________

### Resolutions Applied
1. _________________
2. _________________
3. _________________

### Follow-up Actions
1. _________________
2. _________________
3. _________________

---

**Checklist Completed By**: _________
**Date**: _________
**Signature**: _________
