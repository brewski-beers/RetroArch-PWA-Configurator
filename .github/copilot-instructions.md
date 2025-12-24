# Copilot AI Instructions — RetroArch PWA Configurator

**NOTE:** This file is exclusively for Copilot/AI agent instruction. For developer onboarding, workflows, and troubleshooting, refer to `README.md` or `/docs/`. All project policy details are found in `config/`.

---

## 🟢 AI Behavior Fast Path

- **Accept only single, focused, concrete actions per prompt.**
- **Reject ambiguous, multi-task, or full-file requests.** If unclear, respond:
  > "Prompt too broad/ambiguous. Please rephrase as a single, focused action. See canonical examples below."
- **Default to non-premium models.** Escalate to premium only on explicit, justified request for multi-file/advanced reasoning.
- **Use config and policy as source of truth.** Query `config/*.config.ts` for rules/policies (not this file).
- **Always reference specific policy IDs in output and code suggestions (e.g. POL-018, TEST-001).**
- **Follow YAGNI (POL-018) and KISS (POL-019) principles:** Don't build what you don't need. Simple solutions beat complex ones. Never generate code outside the provided context/snippet unless directed. Do not write new abstraction layers unless justified by YAGNI/config-first.

---

## 🧩 Canonical Prompt Cheat Sheet

- “Refactor function `foo` in `bar.ts` for testability. Cite policy POL-001. Output only changed lines.”
- “Add E2E test for ActionButton using `tests/factories/`. Reference TEST-001.”
- “Update `pages.config.ts` to add new page config. No side effects.”
- “List critical policies in `config/unified-policy.config.ts` affecting this file.”
- “Add a config-driven attribute per E2E-001. Output relevant code only.”

_Always one atomic action per prompt. No multipart or “and also” requests._

---

## 🏷️ Output & Context Rules

- **Output only diffs or updated code blocks—never regenerate whole files unless explicitly required.**
- **Minimize use of surrounding explanations; label all responses by relevant config/policy number.**
- **Never load unrelated files or context unless explicitly instructed (token efficiency).**
- **If prompt exceeds allowed context or invites token bloat, halt and request a smaller or more targeted input.**

---

## ✅ Verification Requirements

- **ALWAYS run `npm run ci:verify` after making code changes.** This ensures policy compliance and regression-free refactors.
- **ci:verify includes:** YAGNI check, format check, lint, type-check, build, policy coverage, policy check, test coverage, and E2E tests.
- **Do NOT commit changes that break ci:verify.** Fix issues before committing.
- **Pre-existing failures:** If ci:verify fails on checks unrelated to your changes, document them but do not fix unrelated issues.

---

## 🧹 Formatting & Lint Policy (POL-005, POL-019, POL-002)

- **Local:** VS Code auto-formats on save + ESLint auto-fixes on save (see `.vscode/settings.json`). No guard scripts needed.
- **Dev workflow:** Just run `npm run dev`, `npm run test`, `npm run serve`. Format/lint happens automatically via editor.
- **Pre-Commit (Husky):** Formats changed files + runs cached lint to catch issues before commit.
- **Pre-Push (Husky):** Runs full `ci:verify` locally before allowing push.
- **CI:** `npm run ci:verify` enforces zero errors on full repo (no cache) before merge.
- **Prod builds:** `npm run prebuild` (format + lint:fix) then `npm run build` ensures clean artifacts.
- Copilot must suggest plain scripts (`npm run dev`, `npm run test`) not guard scripts. Format/lint are handled by IDE and Husky.

---

## 🔄 Continuous Improvement

- **Review these instructions after project policy/config changes or upon unusual Copilot billing.**
- **For all contributor questions, reference `README.md` or `/docs/` for human onboarding.**

---

## 📝 Git Workflow (POL-008)

### Commit Message Format

- Use conventional commit format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- Example: `feat: add rate limiting middleware`, `fix: resolve null reference in validator`
- Keep commits atomic and focused on a single change

### Branch Naming

- Use descriptive branch names with prefixes: `feature/`, `fix/`, `docs/`, `test/`
- Example: `feature/rate-limiting`, `fix/validation-error`, `docs/api-guide`

### Pull Request Requirements

- All changes must go through Pull Request review
- PR must pass all CI checks before merging
- Reference related issues in PR description
- Ensure tests are included for new features

---

## 🧪 TDD Approach (POL-009)

### Test-Driven Development Workflow

- Follow Red → Green → Refactor cycle
- Write tests first before implementation
- Ensure all new code has corresponding test coverage
- Run tests frequently during development

### Test First Principles

- Write tests that define expected behavior before writing code
- Use test factories (TEST-001) for consistent test data
- Maintain high test coverage (POL-002) across all modules
- Tests should be clear, focused, and maintainable

---

\*\*This is a config/policy-driven repo: encode all extensibility, rules, and logic in config files. Copilot must never 'guess' — always query or reference config."
