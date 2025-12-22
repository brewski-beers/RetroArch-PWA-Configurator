# GitHub Native Security Features

## Overview

This project leverages **GitHub's built-in security features** to minimize custom workflow maintenance while maximizing security coverage. By using native platform capabilities, we achieve:

- ✅ **Less maintenance burden**: GitHub maintains and updates these features
- ✅ **Better performance**: Native features are optimized for GitHub's infrastructure
- ✅ **Richer insights**: Integrated security dashboard and alerts
- ✅ **Automatic updates**: Security rules and checks updated by GitHub

---

## Enabled Features

### 🤖 Dependabot Alerts & Updates

**Replaces**: Custom `npm audit` workflow jobs

**What it does**:

- **Vulnerability scanning**: Automatic detection of vulnerable dependencies
- **Security updates**: Auto-generated PRs to fix vulnerabilities
- **Version updates**: Weekly PRs for dependency updates (configured in `.github/dependabot.yml`)
- **Grouped updates**: Production, development, and testing dependencies grouped separately

**Configuration**:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
    groups:
      production-dependencies:
        dependency-type: 'production'
      development-dependencies:
        dependency-type: 'development'
      testing-dependencies:
        patterns: ['*test*', '*playwright*']
```

**Access**:

- View alerts: [Security > Dependabot alerts](../../security/dependabot)
- View PRs: [Pull requests](../../pulls?q=is%3Apr+author%3Aapp%2Fdependabot)

**Policies enforced**:

- POL-011: Dependency Security Audit (high/critical vulnerabilities)
- POL-014: Automated Dependency Updates

---

### 🔍 Dependency Review Action

**Replaces**: Custom `npm audit` on pull requests

**What it does**:

- **PR-level vulnerability blocking**: Prevents merging PRs with vulnerable dependencies
- **License compliance**: Flags non-compliant licenses (configurable)
- **Supply chain attacks**: Detects suspicious package changes
- **PR comments**: Automatic summary in PR conversations

**How it works**:

```yaml
# .github/workflows/security-scan.yml
dependency-review:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/dependency-review-action@v4
      with:
        fail-on-severity: high
        comment-summary-in-pr: always
```

**Features**:

- ✅ Fails fast (before running expensive test suites)
- ✅ Automatic PR comments with vulnerability details
- ✅ Compares base branch vs. PR branch dependencies
- ✅ Integrated with GitHub Security Advisory Database

**Policies enforced**:

- POL-011: Dependency Security Audit (PR-level gating)
- POL-017: Supply Chain Security (suspicious package detection)

---

### 🛡️ CodeQL (Static Application Security Testing)

**Replaces**: Custom SAST scanning workflows

**What it does**:

- **Semantic code analysis**: Deep analysis of TypeScript/JavaScript code
- **Security vulnerability detection**: SQL injection, XSS, authentication issues, etc.
- **Data flow analysis**: Tracks untrusted data through the codebase
- **Regular updates**: New security rules added by GitHub automatically

**Configuration**:

- Enabled via: [Settings > Code security and analysis](../../settings/security_analysis)
- Runs on: Push to main, pull requests, weekly schedule
- Languages: JavaScript/TypeScript (auto-detected)

**Dashboard**:

- [Security > Code scanning alerts](../../security/code-scanning)

**Policies enforced**:

- POL-013: Input Validation (detects missing sanitization)
- POL-010: Secrets Management (detects hardcoded credentials)

---

### 🔐 Secret Scanning

**Replaces**: Custom credential leak detection

**What it does**:

- **Automatic credential detection**: API keys, tokens, passwords in code
- **Partner patterns**: 200+ patterns for AWS, Azure, GitHub, etc.
- **Push protection**: Blocks commits with secrets (if enabled)
- **Historical scanning**: Scans entire git history

**Configuration**:

- Enabled via: [Settings > Code security and analysis](../../settings/security_analysis)
- Push protection: [Settings > Code security and analysis > Secret scanning](../../settings/security_analysis)

**Access**:

- [Security > Secret scanning alerts](../../security/secret-scanning)

**Policies enforced**:

- POL-010: Secrets Management (critical)

---

### 📊 Dependency Graph & Insights

**What it does**:

- **Visual dependency tree**: Understand your dependency relationships
- **Vulnerability tracking**: See which dependencies have known CVEs
- **Dependents**: Track which packages depend on your project
- **Export**: SBOM (Software Bill of Materials) generation

**Access**:

- [Insights > Dependency graph](../../network/dependencies)

**Uses**:

- Audit supply chain risks
- Plan dependency upgrades
- Generate compliance reports

---

## Custom Workflow Jobs (Still Required)

While GitHub's native features cover most security scanning, we maintain **2 custom checks** for project-specific policies:

### 1. License Compliance (POL-016)

**Why custom?**

- GitHub's native license detection doesn't enforce **OSI-approved licenses only**
- We require MIT-compatible licenses for legal compliance

**What it does**:

```bash
# .github/workflows/security-scan.yml (license-compliance job)
license-checker --onlyunknown --exclude "MIT,Apache-2.0,BSD,..."
```

**Enforcement**:

- Fails if non-OSI-approved licenses detected
- Reports summary to GitHub Actions summary
- Weekly scheduled scan

---

### 2. Supply Chain Security (POL-017)

**Why custom?**

- Verifies `package-lock.json` integrity (lockfile version, consistency)
- Ensures `npm ci` enforcement (reproducible builds)

**What it does**:

```bash
# .github/workflows/security-scan.yml (supply-chain-security job)
npm ci --dry-run --ignore-scripts  # Verify consistency
jq -r '.lockfileVersion' package-lock.json  # Verify format
```

**Enforcement**:

- Fails if lockfile is missing or outdated (< v2)
- Fails if `package-lock.json` doesn't match `package.json`
- Weekly scheduled scan

---

## Migration Summary

### ❌ Removed Custom Workflows

| Old Job                       | Replaced By                                  | Reason                                                    |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| `npm-audit`                   | Dependabot alerts + Dependency Review Action | GitHub's native scanning is faster and more comprehensive |
| `codeql-analysis.yml`         | CodeQL (repo-level enablement)               | Enabled in repo settings, no workflow needed              |
| `outdated-dependencies-check` | Dependabot version updates                   | Weekly PRs auto-generated by Dependabot                   |

### ✅ Retained Custom Checks

| Custom Job              | Reason                           | Policy  |
| ----------------------- | -------------------------------- | ------- |
| `license-compliance`    | OSI-approved license enforcement | POL-016 |
| `supply-chain-security` | Lockfile integrity validation    | POL-017 |

---

## CI/CD Performance Improvements

**Before optimization**:

```
├─ npm-audit (3 min)           ❌ Replaced by Dependabot
├─ license-check (2 min)       ✅ Kept (custom requirement)
├─ supply-chain-check (2 min)  ✅ Kept (custom requirement)
├─ outdated-check (1 min)      ❌ Replaced by Dependabot
└─ codeql (10 min)             ❌ Moved to repo-level
Total: ~18 minutes
```

**After optimization**:

```
├─ dependency-review (1 min)   🆕 Native GitHub action (PRs only)
├─ license-compliance (2 min)  ✅ Custom check
└─ supply-chain-security (2 min) ✅ Custom check
Total: ~5 minutes (PRs), ~4 minutes (push to main)
```

**Savings**: ~13 minutes per workflow run (72% faster)

---

## Best Practices

### 1. Trust GitHub's Native Features

**DO**:

- ✅ Enable all available security features in repo settings
- ✅ Configure Dependabot to match your update cadence
- ✅ Review Dependabot PRs promptly (auto-merge low-risk updates)
- ✅ Monitor the Security tab dashboard regularly

**DON'T**:

- ❌ Duplicate native features with custom workflows
- ❌ Disable security features to "pass CI faster"
- ❌ Ignore Dependabot PRs (defeats self-healing architecture)

### 2. Keep Custom Checks Minimal

**Principle**: Only write custom checks for **business-specific requirements** not covered by GitHub.

**Examples**:

- ✅ Custom: OSI-approved license enforcement (legal requirement)
- ✅ Custom: Lockfile integrity (reproducibility requirement)
- ❌ Custom: Vulnerability scanning (use Dependabot)
- ❌ Custom: SAST scanning (use CodeQL)

### 3. Configure Dependabot Strategically

**Weekly updates**:

```yaml
schedule:
  interval: 'weekly'
  day: 'monday' # Start week with updates
```

**Grouped PRs**:

- Reduces PR noise (3 PRs instead of 50)
- Easier to review related dependencies together
- Faster merge cycles

**Auto-merge rules** (via branch protection):

- Patch/minor updates: Auto-merge if tests pass
- Major updates: Require manual review

### 4. Monitor Security Dashboard

**Weekly review**:

- [Security > Overview](../../security) - Check for new alerts
- [Pull requests (Dependabot)](../../pulls?q=is%3Apr+author%3Aapp%2Fdependabot) - Review pending updates
- [Actions](../../actions) - Verify workflows passing

**Monthly review**:

- [Insights > Dependency graph](../../network/dependencies) - Audit dependency health
- [Security > Code scanning](../../security/code-scanning) - Review CodeQL findings
- [Security > Secret scanning](../../security/secret-scanning) - Verify no credential leaks

---

## Policy Mapping

| Policy                                | GitHub Feature                        | Custom Check                   |
| ------------------------------------- | ------------------------------------- | ------------------------------ |
| POL-010: Secrets Management           | Secret Scanning                       | ❌ None                        |
| POL-011: Dependency Security Audit    | Dependabot alerts + Dependency Review | ❌ None                        |
| POL-014: Automated Dependency Updates | Dependabot version updates            | ❌ None                        |
| POL-015: Version Compatibility        | Dependabot (respects semver)          | ❌ None                        |
| POL-016: License Compliance           | ❌ Not covered                        | ✅ `license-compliance` job    |
| POL-017: Supply Chain Security        | Dependency Review (partial)           | ✅ `supply-chain-security` job |

**Result**: 4 of 6 security policies fully automated by GitHub, 2 require minimal custom checks.

---

## Further Reading

- [GitHub Security Features Overview](https://docs.github.com/en/code-security/getting-started/github-security-features)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependency Review Action](https://github.com/actions/dependency-review-action)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

## Summary

By leveraging GitHub's native security features, we've achieved:

- 🚀 **72% faster security scans** (18 min → 5 min)
- 🔒 **Comprehensive coverage** (6 policies, 4 fully automated)
- 🤖 **Self-healing architecture** (Dependabot auto-updates)
- 📉 **Reduced maintenance** (2 custom jobs instead of 5)
- 💰 **Free tier friendly** (native features included in all plans)

**Philosophy**: _"Let GitHub do what GitHub does best, focus custom workflows on business-specific requirements."_
