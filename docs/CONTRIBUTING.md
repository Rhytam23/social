# Contributing

## License

The project is under a non-commercial, learning-only license ([LICENSE](../LICENSE)). By sending a contribution you agree to the contributions clause in it. Do not copy code into the project from a source whose license forbids it.

## Getting started

Follow [Setup](SETUP.md). You can work on most of the UI without a backend in demo mode (`npm run dev` with no Supabase variables), but anything involving accounts, Realtime or row level security needs a real Supabase project.

## Workflow

1. Branch from `main`: `feat/...`, `fix/...`, `docs/...` (the maintainers also use one long-running `test-branch` that is merged into `main` by a pull request the owner merges).
2. Make the smallest change that solves the problem. Do not mix unrelated cleanup into a feature.
3. Run the checks (all four must pass):
   ```bash
   npx tsc --noEmit && npm run lint && npm test && npm run build
   ```
   and `npm audit` should report nothing new.
4. Open a pull request against `main`. In the description say what changed and why, what you tested, and **what you could not verify**. Never claim something was tested when it was not.
5. Update the documentation in the same pull request (see below).

Commit messages follow the conventional style already in the history: `feat(auth): ...`, `fix(auth): ...`, `docs: ...`.

## Database changes

- Add a new numbered file in `database/migrations/`. Never edit a migration that has been applied anywhere.
- Make it safe to run twice (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS` before `CREATE POLICY`).
- Update `types/database.ts` to match, and add or adjust tests in `tests/security/`. **Add a case to `tests/security/rls.test.ts`**: it runs every migration on a real Postgres, so your new rule is proven to hold (and to fail before your migration, if it is a fix).
- Update [Database](DATABASE.md) and the migration table in [Setup](SETUP.md).
- Remember `handle_new_user()` is replaced by several migrations; the newest one wins.

## Security rules

Read [Security](SECURITY.md#rules-for-contributors). In short: no plaintext message content on the server, service-role key never in browser code, admin from `profiles.is_admin` only, no fake success states, no weakening or deleting security tests.

## Code

- TypeScript with `strict`; avoid `any`.
- Match the surrounding style; keep comments for non-obvious reasons only.
- Client state changes go through `ChatStore`; do not mutate `this.state` without going through `notify()` (see [Architecture](ARCHITECTURE.md#state-management)).
- New environment variables must be added to `.env.example` and documented.
- New API routes must use `lib/api/security.ts` (authentication, UUID validation, size caps, per-address and per-account limits, Origin check, generic errors), and need tests in `tests/integration/apiRoutes.test.ts` and `tests/security/apiSecurity.test.ts`. Route files may export only HTTP handlers.

## Documentation

Docs live in `docs/` and the root `README.md`. A pull request that changes behaviour, routes, schema, environment variables or setup steps must update the matching page:

| If you change | Update |
|---|---|
| Setup steps, env vars, migrations list | `README.md`, [Setup](SETUP.md), [Deployment](DEPLOYMENT.md) |
| Routes or request/response shapes | [API](API.md) |
| Tables, policies, functions, storage | [Database](DATABASE.md) |
| Cryptography | [E2EE](E2EE.md), [Security](SECURITY.md) |
| Components, flows, state | [Architecture](ARCHITECTURE.md) |
| Anything user-visible or notable | [Changelog](CHANGELOG.md) |
| A design choice | [Decisions](DECISIONS.md) |
| A fixed or discovered gap | [Security](SECURITY.md#known-gaps) or [Roadmap](ROADMAP.md) |

Write what the code does, not what it is meant to do. If something is unverified, say so.

## Notes for AI coding assistants

- Read the relevant code before changing it; do not trust documentation over the source.
- Run the four checks after every change.
- Do not commit or push unless asked, and do not skip hooks.
- Server errors go through `serverError()`, browser errors through `userError()` or `reportClientError()`: that is what feeds the admin error log. Never write message content, keys, tokens or request bodies to logs or `console`.
- Never show raw error text to users: use `lib/ui/errors.ts` (see [Security](SECURITY.md#rules-for-contributors)).
- Never claim the application is "completely secure" or that something is tested when it was not.
- Never log or print decrypted message content, keys or secrets.
