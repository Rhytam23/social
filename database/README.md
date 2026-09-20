# Database

This folder is the **only definition of the schema**. There is no migration tool: each file in `migrations/` is a plain SQL script that a person pastes into the Supabase **SQL Editor** and runs once, in numeric order (`001` to `021` at the time of writing).

- **Order matters.** Each migration assumes the ones before it. Running a later one early fails with "function ... does not exist" or "relation ... does not exist".
- **Never edit an applied migration.** Add a new numbered file instead, and make it safe to run twice (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS` before `CREATE POLICY`). `002` and `003` are older and are **not** re-runnable.
- **Security rules live here.** Row level security policies, triggers and `SECURITY DEFINER` helpers are what actually protect the data. `017` and `018` contain the September 2026 security fixes and limits, `019` the admin error log and `020` a one-query "latest message per conversation" function (an optimisation; the app works without it) and `021` signed-only attachment uploads (deploy the matching app first).
- **The tests run these files.** `tests/security/rls.test.ts` executes every migration on an in-process Postgres and attacks it as different users. If you change a migration or add one, add a case there.

Full documentation: [`docs/DATABASE.md`](../docs/DATABASE.md) (tables, functions, policies, storage, realtime) and [`docs/SETUP.md`](../docs/SETUP.md) (how to apply them and check what is applied).
