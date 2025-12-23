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

## 🔄 Continuous Improvement

- **Review these instructions after project policy/config changes or upon unusual Copilot billing.**
- **For all contributor questions, reference `README.md` or `/docs/` for human onboarding.**

---

\*\*This is a config/policy-driven repo: encode all extensibility, rules, and logic in config files. Copilot must never 'guess' — always query or reference config."
