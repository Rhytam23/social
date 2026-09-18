# 12_GITHUB_ACTIONS.md — CI/CD & GitHub Actions Specification

No GitHub Actions workflows currently exist in `.github/workflows`.

---

## Recommended CI/CD Configuration

Future CI/CD integration should create `.github/workflows/ci.yml` running:
1. `npx tsc --noEmit` (TypeScript static type checking).
2. `npm run lint` (ESLint code quality checks).
3. `npm run test` (Vitest unit and security test suite execution).
4. `npm run build` (Next.js production build validation).
