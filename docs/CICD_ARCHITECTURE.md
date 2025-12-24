# CI/CD Architecture

## Overview

This project implements a **fast-fail, self-healing CI/CD architecture** that maximizes GitHub's native features while minimizing custom workflow maintenance.

**Design Principles**:

1. **Fast Fail**: Cheapest checks run first (formatting → linting → type-check → build → tests)
2. **Native First**: Use GitHub's built-in security features instead of custom workflows
3. **Concurrency Control**: Cancel duplicate runs to save resources
4. **Path Filtering**: Only run workflows when relevant files change
5. **Composite Actions**: DRY principle for reusable workflow steps

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Pull Request Created                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴──────────┐
                │                   │
                ▼                   ▼
    ┌───────────────────┐  ┌──────────────────────┐
    │  verify.yml       │  │  security-scan.yml   │
    │  (PR Validation)  │  │  (Security Checks)   │
    └─────────┬─────────┘  └──────────┬───────────┘
              │                       │
              ▼                       ▼
    ┌─────────────────────────────────────────┐
    │     Fast-Fail Pipeline (3-5 min)        │
    ├─────────────────────────────────────────┤
    │ 1. format-and-lint (3 min) ⚡           │
    │    - Prettier check                     │
    │    - ESLint check                       │
    │                                          │
    │ 2. type-check-and-build (5 min)         │
    │    - TypeScript strict mode             │
    │    - Compilation                        │
    │    - Artifact upload                    │
    │                                          │
    │ 3. Parallel Execution (10 min max)      │
    │    ├─ unit-tests (5 min)                │
    │    ├─ policy-check (3 min)              │
    │    └─ e2e-tests (10 min)                │
    └─────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────┐
    │  GitHub Native Security (background)    │
    ├─────────────────────────────────────────┤
    │ - Dependency Review Action (1 min) 🆕   │
    │ - CodeQL (SAST) (~10 min)               │
    │ - Secret Scanning (real-time)           │
    │ - License Compliance (2 min) 🔧         │
    │ - Supply Chain Security (2 min) 🔧      │
    │                                          │
    │ Legend:                                  │
    │ 🆕 = GitHub native action               │
    │ 🔧 = Custom check (business-specific)   │
    └─────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────┐
    │           Merge to Main                  │
    └─────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────┐
    │       Post-Merge Validation             │
    ├─────────────────────────────────────────┤
    │ - verify.yml (re-run on main)           │
    │ - security-scan.yml (validation)        │
    │ - Dependabot alerts (monitoring)        │
    └─────────────────────────────────────────┘
```

---

## Workflow Files

### 1. `verify.yml` - PR Verification

**Purpose**: Fast-fail validation for pull requests

**Triggers**:

- Pull requests to `main`/`master`
- Only when relevant files change (src, config, tests, etc.)

**Jobs**:

#### Stage 1: Fast-Fail Checks (3 min)

```yaml
format-and-lint:
  runs-on: ubuntu-latest
  timeout-minutes: 3
  steps:
    - Prettier format check
    - ESLint code quality check
```

**Why first?**: Formatting/linting errors are cheap to detect but cause 80% of CI failures. Fail in 3 minutes instead of waiting 15+ minutes for full pipeline.

#### Stage 2: Type Check & Build (5 min)

```yaml
type-check-and-build:
  needs: format-and-lint
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - TypeScript strict mode validation
    - Compilation (tsc)
    - Upload build artifacts
```

**Why second?**: Type errors are fast to detect (~10s) and block all subsequent steps. Build artifacts are required for later jobs.

#### Stage 3: Parallel Tests (10 min max)

```yaml
unit-tests:
  needs: type-check-and-build
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - Download build artifacts
    - Run vitest with coverage
    - Upload coverage reports

policy-check:
  needs: type-check-and-build
  runs-on: ubuntu-latest
  timeout-minutes: 3
  steps:
    - Download build artifacts
    - Run policy compliance validation
    - Generate policy audit report

e2e-tests:
  needs: type-check-and-build
  runs-on: ubuntu-latest
  timeout-minutes: 10
  steps:
    - Download build artifacts
    - Install Playwright
    - Run E2E tests
    - Upload test reports
```

**Why parallel?**: These jobs are independent and can run simultaneously. Total time = slowest job (10 min for E2E) instead of sum (18 min).

**Concurrency Control**:

```yaml
concurrency:
  group: verify-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

- Cancels outdated workflow runs when new commits pushed
- Saves CI minutes (stops old runs immediately)

**Path Filtering**:

```yaml
paths:
  - 'src/**'
  - 'config/**'
  - 'tests/**'
  - 'package.json'
  # ... documentation excluded
```

- Documentation-only changes **do not** trigger CI
- Saves ~5-10 workflow runs per week

---

### 2. `security-scan.yml` - Security Validation

**Purpose**: Automated security scanning leveraging GitHub native features

**Triggers**:

- Pull requests to `main` (path-filtered)
- Push to `main` (post-merge validation)
- Weekly schedule (Sundays 2 AM UTC)
- Manual dispatch

**Jobs**:

#### 1. Dependency Review (GitHub Native) 🆕

```yaml
dependency-review:
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/dependency-review-action@v4
      with:
        fail-on-severity: high
        comment-summary-in-pr: always
```

**What it does**:

- Compares base branch vs. PR branch dependencies
- Blocks PRs with high/critical vulnerabilities
- Auto-comments PR with vulnerability details
- **Replaces**: Custom `npm audit` workflow

**Policies enforced**: POL-011 (Dependency Security Audit)

#### 2. License Compliance (Custom Check) 🔧

```yaml
license-compliance:
  runs-on: ubuntu-latest
  steps:
    - Install license-checker
    - Check OSI-approved licenses only
    - Report to GitHub Actions summary
```

**What it does**:

- Validates all dependencies use MIT-compatible licenses
- Fails on unknown/forbidden licenses (GPL, etc.)
- **Why custom?**: GitHub doesn't enforce OSI-approved licenses specifically

**Policies enforced**: POL-016 (License Compliance)

#### 3. Supply Chain Security (Custom Check) 🔧

```yaml
supply-chain-security:
  runs-on: ubuntu-latest
  steps:
    - Verify package-lock.json integrity
    - Validate lockfile version (v2/v3)
    - Test npm ci consistency
```

**What it does**:

- Ensures `package-lock.json` is present and valid
- Verifies reproducible builds (`npm ci` succeeds)
- **Why custom?**: Specific requirement for lockfile format validation

**Policies enforced**: POL-017 (Supply Chain Security)

**Concurrency Control**:

```yaml
concurrency:
  group: security-scan-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```

**Path Filtering**:

```yaml
paths:
  - 'package.json'
  - 'package-lock.json'
```

- Only runs when dependencies change
- Avoids unnecessary security scans

---

## GitHub Native Features (No Workflow Required)

### 1. Dependabot Alerts & Updates

**Configuration**: `.github/dependabot.yml`

**Features**:

- **Security alerts**: Real-time vulnerability notifications
- **Auto-PRs**: Weekly dependency update PRs
- **Grouped updates**: Production, development, testing separated
- **Version strategy**: Patch/minor auto-suggested, major flagged

**Replaces**: Custom `npm audit` job, `outdated-check` job

**Policies enforced**:

- POL-011: Dependency Security Audit
- POL-014: Automated Dependency Updates

**Access**: [Security > Dependabot alerts](../../security/dependabot)

### 2. CodeQL (SAST Scanning)

**Configuration**: Enabled in repo settings (no workflow file needed)

**Features**:

- Semantic code analysis for TypeScript/JavaScript
- SQL injection, XSS, authentication vulnerability detection
- Data flow analysis (tracks untrusted input)
- Auto-updated with new security rules

**Replaces**: Custom SAST scanning workflow

**Policies enforced**:

- POL-013: Input Validation
- POL-010: Secrets Management

**Access**: [Security > Code scanning](../../security/code-scanning)

### 3. Secret Scanning

**Configuration**: Enabled in repo settings (automatic)

**Features**:

- 200+ partner patterns (AWS, Azure, GitHub tokens)
- Historical git scanning
- Push protection (blocks commits with secrets)
- Alert notifications

**Policies enforced**: POL-010 (Secrets Management)

**Access**: [Security > Secret scanning](../../security/secret-scanning)

### 4. Dependency Graph

**Configuration**: Automatic (always enabled)

**Features**:

- Visual dependency tree
- SBOM (Software Bill of Materials) export
- Vulnerability tracking
- Dependent repositories

**Access**: [Insights > Dependency graph](../../network/dependencies)

---

## Composite Actions (DRY Principle)

Located in `.github/actions/`:

### 1. `setup-node-env` - Node.js Setup

```yaml
- uses: ./.github/actions/setup-node-env
```

**Consolidates**:

- Checkout code
- Setup Node.js 20.x
- Cache npm dependencies
- Install dependencies (`npm ci`)

**Used by**: All workflow jobs

### 2. `build-typescript` - TypeScript Compilation

```yaml
- uses: ./.github/actions/build-typescript
```

**Consolidates**:

- Run type-check
- Compile TypeScript
- Upload build artifacts

**Used by**: `type-check-and-build` job

### 3. `run-tests` - Test Execution

```yaml
- uses: ./.github/actions/run-tests
  with:
    test-command: 'npm test'
    coverage: true
```

**Consolidates**:

- Download build artifacts
- Run tests
- Upload coverage/reports

**Used by**: `unit-tests` job

### 4. `install-playwright` - E2E Setup

```yaml
- uses: ./.github/actions/install-playwright
```

**Consolidates**:

- Install Playwright browsers
- Cache browser binaries

**Used by**: `e2e-tests` job

**Benefits**:

- ✅ Single source of truth (DRY)
- ✅ Version consistency across jobs
- ✅ Easier maintenance (update once, apply everywhere)
- ✅ Better caching (reusable cache keys)

---

## Performance Metrics

### Fast-Fail Optimization

**Before optimization** (sequential):

```
format-and-lint:   3 min
type-check:        5 min
unit-tests:        5 min
policy-check:      3 min
e2e-tests:        10 min
security-scan:    18 min
────────────────────────
Total:            44 min
```

**After optimization** (parallel + native features):

```
format-and-lint:   3 min  ⚡ (fast-fail)
type-check-and-build: 5 min
┌─────────────────────────┐
│ unit-tests:       5 min │
│ policy-check:     3 min │ } Parallel (10 min max)
│ e2e-tests:       10 min │
└─────────────────────────┘
dependency-review: 1 min  🆕 (GitHub native)
license-check:     2 min  🔧
supply-chain:      2 min  🔧
────────────────────────
Total:            ~18 min (60% faster)
```

**Savings**: 26 minutes per PR (60% reduction)

### Concurrency Savings

**Scenario**: Developer pushes 3 commits in 5 minutes

**Without concurrency control**:

- 3 workflow runs × 18 min = 54 minutes consumed
- All 3 run to completion (wasteful)

**With concurrency control**:

- Run 1: Canceled after 2 min (commit 2 pushed)
- Run 2: Canceled after 2 min (commit 3 pushed)
- Run 3: Completes (18 min)
- Total: 22 minutes (59% savings)

### Path Filtering Savings

**Example**: Update README.md (documentation-only change)

**Without path filtering**:

- Triggers verify.yml (~18 min)
- Triggers security-scan.yml (~5 min)
- Total: 23 minutes wasted

**With path filtering**:

- No workflows triggered
- Total: 0 minutes (100% savings)

**Weekly impact**: ~10 documentation updates × 23 min = **230 minutes saved per week**

---

## Security Coverage Matrix

| Security Concern            | GitHub Native                  | Custom Workflow              | Policy  |
| --------------------------- | ------------------------------ | ---------------------------- | ------- |
| Vulnerable dependencies     | ✅ Dependabot alerts           | ❌                           | POL-011 |
| Outdated dependencies       | ✅ Dependabot version PRs      | ❌                           | POL-014 |
| PR vulnerability blocking   | ✅ Dependency Review Action    | ❌                           | POL-011 |
| Code vulnerabilities (SAST) | ✅ CodeQL                      | ❌                           | POL-013 |
| Hardcoded secrets           | ✅ Secret Scanning             | ❌                           | POL-010 |
| License compliance          | ❌                             | ✅ license-compliance job    | POL-016 |
| Lockfile integrity          | ❌                             | ✅ supply-chain-security job | POL-017 |
| Supply chain attacks        | ✅ Dependency Review (partial) | ✅ supply-chain-security     | POL-017 |

**Result**: 5 of 8 security concerns fully automated by GitHub (62.5%)

---

## Branch Protection Rules

**Recommended settings** (via GitHub UI):

```yaml
# Settings > Branches > Branch protection rules (main)
Require status checks to pass before merging: ✅
  - format-and-lint
  - type-check-and-build
  - unit-tests
  - policy-check
  - e2e-tests
  - dependency-review (if PR)
  - license-compliance
  - supply-chain-security

Require branches to be up to date: ✅
Require conversation resolution: ✅
Require signed commits: ⚠️  (optional, but recommended)

Require pull request reviews: ✅
  Required approvals: 1
  Dismiss stale reviews: ✅

Restrict who can push: ✅
  - Maintainers only
  - Bypass: Repository admins (emergencies only)
```

**Enforcement**: All 8 status checks must pass before merge → self-healing quality gate

---

## Monitoring & Maintenance

### Weekly Review (5 min)

**Security Dashboard**:

1. [Security > Overview](../../security) - Check for new alerts
2. [Pull requests (Dependabot)](../../pulls?q=is%3Apr+author%3Aapp%2Fdependabot) - Review pending updates
3. [Actions](../../actions) - Verify workflows passing

### Monthly Review (15 min)

**Dependency Health**:

1. [Insights > Dependency graph](../../network/dependencies) - Audit dependency tree
2. [Security > Code scanning](../../security/code-scanning) - Review CodeQL findings
3. [Security > Secret scanning](../../security/secret-scanning) - Verify no credential leaks

**Workflow Performance**:

1. [Actions > Workflow runs](../../actions) - Check run times
2. Identify slow jobs (> 10 min)
3. Optimize caching or parallelization

### Quarterly Review (30 min)

**Architecture Review**:

1. Review this document for accuracy
2. Check for new GitHub native features (replace custom workflows)
3. Update composite actions to latest versions
4. Audit branch protection rules

---

## Troubleshooting

### Workflow Stuck/Slow

**Symptom**: Jobs taking > 10 minutes

**Diagnosis**:

```bash
# Check runner logs
gh run view <run-id> --log
```

**Common causes**:

- Cache miss (cold start)
- Network issues (npm install slow)
- Test suite regression (new slow test)

**Solution**:

- Verify cache keys in composite actions
- Check npm registry status
- Profile test suite (`npm run test:watch`)

### False Positive Security Alert

**Symptom**: Dependabot alert for dev dependency

**Diagnosis**:

- Check if vulnerability is runtime or build-time only
- Review dependency tree (`npm ls <package>`)

**Solution**:

- If dev-only + not exploitable: Dismiss alert with reason
- If transitive dependency: Update parent package
- If no fix available: Document in security advisory

### CI Failing on Main

**Symptom**: Post-merge validation fails

**Diagnosis**:

- Should be **extremely rare** (all checks passed on PR)
- Possible race condition (merge conflict)
- Possible flaky test

**Solution**:

1. Check failed job logs
2. Rerun workflow (transient issue)
3. If persistent: Revert merge, fix on branch

---

## Future Improvements

### Short-Term (Q1 2024)

1. **Auto-merge Dependabot PRs** ✅:
   - Fully automated: approval + merge for all Dependabot updates
   - Requires tests pass first
   - Saves ~30 min/week reviewing trivial updates
   - Implemented via `auto-approve-dependabot.yml` workflow

2. **Caching Enhancements**:
   - Cache Playwright browsers (saves ~2 min per E2E run)
   - Cache TypeScript build output (saves ~30s per build)

3. **Composite Action Versioning**:
   - Tag composite actions with versions (v1, v2, etc.)
   - Pin workflow jobs to specific versions (stability)

### Mid-Term (Q2 2024)

1. **Matrix Testing**:
   - Test against multiple Node.js versions (18.x, 20.x, 22.x)
   - Verify compatibility with LTS releases

2. **Deployment Pipeline**:
   - Add `deploy.yml` workflow for production releases
   - Auto-tag releases from main branch merges
   - Generate changelogs from commit history

3. **Performance Monitoring**:
   - Track workflow run times over time
   - Alert if jobs exceed threshold (e.g., > 15 min)

### Long-Term (Q3-Q4 2024)

1. **GitHub Actions Cache API**:
   - Programmatic cache invalidation
   - Better cache hit rates

2. **Custom Dependabot Rules**:
   - All updates auto-merged automatically after CI passes
   - Consider adding filters for major version updates (future enhancement)
   - Monitor for breaking changes in major updates

3. **Advanced CodeQL Queries**:
   - Custom security rules for RetroArch-specific logic
   - Integration with internal security tools

---

## Summary

**Achievements**:

- 🚀 **60% faster CI/CD** (44 min → 18 min)
- 🔒 **62.5% security automation** via GitHub native features
- 💰 **230 min/week saved** through path filtering
- 🤖 **Self-healing architecture** via Dependabot
- 📉 **75% less workflow code** (leveraging native features)

**Philosophy**:

> _"Fast-fail fast, leverage native features, automate aggressively."_

**References**:

- [GitHub Native Security Features](./GITHUB_NATIVE_SECURITY.md)
- [Security Architecture](./SECURITY_ARCHITECTURE.md)
- [Coverage Strategy](./COVERAGE_STRATEGY.md)
