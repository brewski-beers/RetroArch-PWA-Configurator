# Composite Actions Architecture

This directory contains reusable composite actions for the RetroArch PWA Configurator CI/CD pipeline.

## Available Actions

### 1. `setup-node-env`
Sets up Node.js environment with intelligent caching.

**Inputs:**
- `node-version` (optional): Node.js version, default: `20.x`
- `install-dependencies` (optional): Whether to install deps, default: `true`

**Outputs:**
- `cache-hit`: Whether node_modules was restored from cache

**Usage:**
```yaml
- uses: ./.github/actions/setup-node-env
  with:
    node-version: '20.x'
    install-dependencies: 'true'
```

### 2. `build-typescript`
Builds TypeScript project with caching.

**Inputs:**
- `upload-artifacts` (optional): Upload build artifacts, default: `true`

**Outputs:**
- `cache-hit`: Whether build was restored from cache

**Usage:**
```yaml
- uses: ./.github/actions/build-typescript
  with:
    upload-artifacts: 'true'
```

### 3. `install-playwright`
Installs Playwright browsers with caching.

**Inputs:**
- `browser` (optional): Browser to install (chromium/firefox/webkit/all), default: `chromium`

**Usage:**
```yaml
- uses: ./.github/actions/install-playwright
  with:
    browser: 'chromium'
```

### 4. `run-tests`
Runs test suite with optional build artifacts.

**Inputs:**
- `test-type` (required): Type of tests (unit/e2e/policy/all)
- `download-build` (optional): Download build artifacts, default: `false`

**Usage:**
```yaml
- uses: ./.github/actions/run-tests
  with:
    test-type: 'unit'
    download-build: 'false'
```

## Benefits of Composite Actions

1. **DRY Principle**: Define once, use everywhere
2. **Consistency**: Same setup across all workflows
3. **Maintainability**: Update in one place
4. **Reusability**: Easy to add new workflows
5. **Scalability**: Prepare for future growth

## Creating New Workflows

When creating new workflows, follow this pattern:

```yaml
name: My Workflow

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Reuse composite actions
      - uses: ./.github/actions/setup-node-env
      - uses: ./.github/actions/build-typescript
      - uses: ./.github/actions/run-tests
        with:
          test-type: 'all'
```

## Future Enhancements

Consider adding these composite actions as the project grows:

- `deploy-application` - Deployment logic
- `security-scan` - Security vulnerability scanning
- `performance-test` - Performance benchmarking
- `docker-build` - Container image building
- `notify-status` - Notification handling

## Testing Composite Actions

Test composite actions locally before committing:

```bash
# Install act (GitHub Actions local runner)
# brew install act  # macOS
# choco install act  # Windows

# Run workflow locally
act pull_request
```

## Troubleshooting

**Issue**: Action not found
- Ensure you're using relative path: `./.github/actions/action-name`
- Check action directory structure matches

**Issue**: Caching not working
- Verify cache keys are unique and specific
- Check cache size limits (10GB per repo)

**Issue**: Composite action fails
- Test individual steps in isolation
- Check shell requirements (use `shell: bash`)
- Verify all required inputs are provided

## Documentation

See example workflows:
- `.github/workflows/deploy.yml.example` - Deployment example
- `.github/workflows/nightly.yml.example` - Scheduled tests example

---

**Maintained by**: TechByBrewski  
**Last Updated**: 2024-12-21
