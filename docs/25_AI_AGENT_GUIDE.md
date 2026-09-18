# 25_AI_AGENT_GUIDE.md — AI Agent Operating Protocols

This document provides mandatory guidelines and operational constraints for AI coding agents working on **Private Chat**.

---

## 1. Mandatory Operating Protocols

1. **Inspect Before Acting:** Always inspect existing code files and migration scripts before writing or refactoring code.
2. **Preserve E2EE Boundaries:** NEVER add plaintext fallback columns or log decrypted message strings.
3. **No Unrequested Functional Changes:** Do not alter existing feature behaviors or remove security tests unless explicitly instructed by the user.
4. **Mandatory Non-Mutating Validation Commands:**
   After writing or editing code, ALWAYS execute the following verification suite:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run test
   npm run build
   ```

---

## 2. Standard 9-Step AI Execution Protocol

1. **Inspect:** Examine codebase files and migration scripts.
2. **Plan:** Formulate an implementation plan.
3. **Identify:** Determine affected files and change impact.
4. **Implement:** Write minimal, clean, type-safe TypeScript code.
5. **Test:** Run `npm run test` to verify Vitest test suites.
6. **Security-Check:** Inspect RLS and service role usages.
7. **Build:** Run `npx tsc --noEmit` and `npm run build`.
8. **Review Diff:** Inspect git diff for unintended side effects.
9. **Update Docs:** Update corresponding documents in `/docs`.
