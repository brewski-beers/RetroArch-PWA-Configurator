# Self-Healing Architecture: Dependency Security & Compatibility

## Overview

This project implements a **self-healing architecture** for dependency management, ensuring security, compatibility, and automated remediation of vulnerabilities.

## Architecture Components

### 🛡️ Policy Framework (POL-011, POL-014, POL-015, POL-016, POL-017)

**17 automated policies** enforce security and quality standards:

| Policy      | Name                         | Severity | Description                                            |
| ----------- | ---------------------------- | -------- | ------------------------------------------------------ |
| **POL-011** | Dependency Security Audit    | High     | npm audit with zero high/critical vulnerabilities      |
| **POL-014** | Automated Dependency Updates | High     | Fully automated approval and merge via workflow_run    |
| **POL-015** | Version Compatibility Policy | Medium   | Controlled version ranges (caret/tilde)                |
| **POL-016** | License Compliance           | Medium   | OSI-approved licenses only (MIT, Apache-2.0, BSD, ISC) |
| **POL-017** | Supply Chain Security        | Critical | Lockfile integrity, npm ci enforcement                 |

### 🤖 Automated Security Scanning

#### 1. **Dependabot** (`.github/dependabot.yml`)

- **Weekly automated updates** (Mondays at 9 AM ET)
- **Grouped PRs** for related dependencies
- **Security patches** auto-applied
- **Version strategy**: Increase patch/minor, manual major

#### 2. **Security Scan Workflow** (`.github/workflows/security-scan.yml`)

Runs on:

- Every push to `main` or `feature/**`
- Every pull request
- Weekly scheduled scan (Sundays at 2 AM UTC)
- Manual trigger via GitHub Actions UI

Checks:

- ✅ **npm audit** (high/critical vulnerabilities)
- ✅ **CodeQL analysis** (code-level vulnerabilities)
- ✅ **License compliance** (via `license-checker`)
- ✅ **Supply chain security** (lockfile integrity)

### 📊 Monitoring & Alerting

#### Real-Time Alerts

```yaml
# GitHub Security Alerts (automatic)
- Dependabot alerts for vulnerable dependencies
- CodeQL alerts for code vulnerabilities
- Supply chain security alerts
```

#### Weekly Reports

```bash
# Run manually or via CI
npm run security:audit  # npm audit with high/critical threshold
npm run policy:check    # All 17 policies
```

## Self-Healing Mechanisms

### 1. **Automated Dependency Updates**

**How it works**:

1. Dependabot detects outdated dependency
2. Creates PR with grouped updates (patch/minor)
3. PR Verification workflow runs full test suite
4. Auto-approve-dependabot workflow triggers on successful completion
5. PR is automatically approved and merged (squash method)
6. No manual intervention required

**Workflow sequence**:
```
Dependabot PR → CI Checks Pass → Auto-Approve → Auto-Merge → Done
```

**Configuration**:

```yaml
# .github/workflows/auto-approve-dependabot.yml
on:
  workflow_run:
    workflows: ['PR Verification']
    types: [completed]
```

**Security safeguards**:
- Only runs for `dependabot[bot]` PRs (author verification)
- Requires `workflow_run.conclusion == 'success'`
- All CI checks must pass before merge
- Uses squash merge to maintain clean history

### 2. **Vulnerability Remediation**

**How it works**:

1. Security vulnerability detected (GitHub/npm audit)
2. Dependabot creates **priority PR** with fix
3. Security scan workflow validates fix
4. Auto-approve-dependabot workflow approves and merges if tests pass
5. Changes deployed to main automatically
6. Notification sent via PR comment

**Manual remediation** (if auto-merge fails):

```bash
# Fix automatically (patch/minor updates)
npm audit fix

# Fix with breaking changes (requires review)
npm audit fix --force

# View details
npm audit --json > audit-report.json
```

### 3. **Version Compatibility Enforcement**

**Rules (POL-015)**:

- **Production dependencies**: Use caret (`^`) for controlled updates
- **Critical dependencies**: Lock exact versions
- **Major updates**: Require manual review
- **Wildcard versions**: Forbidden (`*`, `latest`)

**Example**:

```json
{
  "dependencies": {
    "express": "^4.21.2", // ✅ Caret: 4.21.x → 4.x.x
    "cors": "^2.8.5", // ✅ Caret: 2.8.x → 2.x.x
    "zod": "^4.2.1" // ✅ Caret: 4.2.x → 4.x.x
  },
  "devDependencies": {
    "typescript": "^5.3.0", // ✅ Caret: 5.3.x → 5.x.x
    "vitest": "^1.0.0" // ✅ Caret: 1.0.x → 1.x.x
  }
}
```

### 4. **License Compliance**

**Allowed licenses** (POL-016):

- ✅ MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC
- ✅ 0BSD, CC0-1.0, Unlicense, WTFPL

**Forbidden licenses**:

- ❌ GPL, AGPL (copyleft restrictions)
- ❌ Proprietary, custom licenses

**Check compliance**:

```bash
# Install license-checker globally
npm install -g license-checker

# Run compliance check
license-checker --summary --onlyAllow "MIT;Apache-2.0;BSD;ISC"
```

### 5. **Supply Chain Security**

**Protections (POL-017)**:

- ✅ **Lockfile integrity**: package-lock.json v3 format
- ✅ **Reproducible builds**: Use `npm ci` (not `npm install`)
- ✅ **Package provenance**: Verify signatures when available
- ✅ **Audit on install**: Fail CI on high/critical vulnerabilities

**CI/CD enforcement**:

```yaml
# Always use npm ci for reproducibility
- run: npm ci

# Verify lockfile integrity
- run: npm ci --dry-run
```

## Usage

### Daily Development

```bash
# Normal development workflow
npm install                # Install dependencies
npm run dev:server         # Start dev server
npm run test:watch         # Run tests in watch mode
```

### Before Committing

```bash
# Pre-commit hook automatically runs:
npm run format:check       # Prettier validation
npm run lint               # ESLint validation

# Full validation (recommended)
npm run ci:verify          # Runs all checks
```

### Security Maintenance

```bash
# Weekly security audit (automated via Dependabot)
npm audit --audit-level=high

# Manual security patch
npm audit fix

# Generate security report
npm audit --json > security-report.json

# Check for outdated dependencies
npm outdated
```

### Policy Compliance

```bash
# Check all 17 policies
npm run policy:check

# Expected output:
# ✓ POL-011: Dependency Security Audit
# ✓ POL-014: Automated Dependency Updates
# ✓ POL-015: Version Compatibility Policy
# ✓ POL-016: License Compliance
# ✓ POL-017: Supply Chain Security
```

## Incident Response

### High/Critical Vulnerability Detected

1. **Immediate notification** via GitHub Security Alert
2. **Dependabot PR** created within hours
3. **Automated testing** runs on PR
4. **Manual review** if breaking changes
5. **Merge and deploy** after validation

### License Compliance Violation

1. **Detection** via `license-checker` in CI
2. **Fail CI pipeline** immediately
3. **Notification** to maintainers
4. **Remediation**:
   - Replace dependency with compatible alternative
   - Request license change from upstream
   - Remove dependency if not critical

### Supply Chain Attack

1. **Detection** via npm audit or CodeQL
2. **Lock dependencies** immediately
3. **Investigate** package provenance
4. **Rollback** to last known good version
5. **Report** to npm security team

## Metrics & Reporting

### Security Dashboard (GitHub)

- **Security Overview**: github.com/[org]/[repo]/security
- **Dependabot Alerts**: Vulnerabilities + auto-updates
- **Code Scanning**: CodeQL analysis results
- **Supply Chain**: Dependency graph + alerts

### Weekly Reports

Automated via GitHub Actions (Sundays at 2 AM UTC):

- npm audit report (JSON)
- License compliance report
- Outdated dependencies list
- Supply chain integrity check

### Continuous Monitoring

```bash
# Run policy checker in CI (every commit)
npm run policy:check

# Expected result: 17/17 policies passing
```

## Best Practices

### ✅ DO

- **Use `npm ci`** in CI/CD (not `npm install`)
- **Review Dependabot PRs** within 24-48 hours
- **Run `npm audit`** before every release
- **Keep lockfile committed** to version control
- **Update dependencies weekly** (automated)

### ❌ DON'T

- **Use `npm install` in CI** (breaks reproducibility)
- **Ignore security alerts** (fix ASAP)
- **Use wildcard versions** (`*`, `latest`)
- **Commit node_modules** (use lockfile instead)
- **Manually edit lockfile** (always regenerate)

## Troubleshooting

### Dependabot PR Failures

```bash
# Locally test Dependabot PR
git fetch origin pull/[PR_NUMBER]/head:dependabot-test
git checkout dependabot-test
npm ci
npm run ci:verify
```

### npm audit Failures

```bash
# View detailed audit report
npm audit --json

# Fix automatically (safe)
npm audit fix

# Fix with breaking changes (requires review)
npm audit fix --force

# Skip specific vulnerabilities (temporary)
npm audit --audit-level=high
```

### License Compliance Failures

```bash
# Identify violating packages
license-checker --summary

# Check specific package license
npm view [package-name] license

# Find alternative packages
npm search [package-name] --searchlimit=20
```

## References

- **Dependabot Documentation**: https://docs.github.com/en/code-security/dependabot
- **npm Audit**: https://docs.npmjs.com/cli/v10/commands/npm-audit
- **CodeQL**: https://codeql.github.com/docs/
- **OWASP Dependency Check**: https://owasp.org/www-project-dependency-check/
- **npm Security Best Practices**: https://docs.npmjs.com/security-advisories

## Policy Enforcement

All policies are automatically enforced via:

- **Pre-commit hooks** (format, lint)
- **GitHub Actions CI** (test, build, policy check)
- **Branch protection rules** (require CI pass)
- **Dependabot alerts** (security vulnerabilities)

---

**Last Updated**: 2024-12-22  
**Policy Version**: 17 policies (POL-001 to POL-017)  
**Compliance**: ✅ 100% (17/17 passing)
