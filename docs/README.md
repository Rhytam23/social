# Documentation

Start with the [project README](../README.md) for what Nook is and how to run it.

**New to the project, or returning after a long time? Read the [Maintainer guide](MAINTAINER_GUIDE.md) first.** It explains the ideas, the layout, how to rebuild everything from scratch, and what to check as the underlying products age.

## Guides

| Document | Read it when you want to |
|---|---|
| [Maintainer guide](MAINTAINER_GUIDE.md) | Understand the project quickly: ideas, map, glossary, rebuild, runbook, what ages |
| [Setup](SETUP.md) | Get the app running against your own Supabase project, including migrations, auth settings and Google sign-in |
| [Deployment](DEPLOYMENT.md) | Publish it (Vercel), configure production, run the release checklist, roll back |
| [Troubleshooting](TROUBLESHOOTING.md) | Fix an error message you are looking at |
| [Contributing](CONTRIBUTING.md) | Make a change: workflow, database and security rules, keeping docs current |

## Reference

| Document | Contents |
|---|---|
| [Architecture](ARCHITECTURE.md) | Modules, message flows, state, routes |
| [E2EE](E2EE.md) | The cryptographic design, and where its protection ends |
| [Database](DATABASE.md) | Final schema, functions, security rules, storage, migrations |
| [API](API.md) | Every route: inputs, outputs, errors, limits |
| [Security](SECURITY.md) | Threat model, controls, contributor rules, known gaps |
| [Testing](TESTING.md) | Automated tests and the manual checklist |

## Project

| Document | Contents |
|---|---|
| [Roadmap](ROADMAP.md) | What is done, planned, and missing |
| [Decisions](DECISIONS.md) | Why things are built the way they are |
| [Changelog](CHANGELOG.md) | What changed and when |
| [V1 status](V1_STATUS.md) | The audit report from the V1 rebuild (a snapshot) |
| [Security audit](../SECURITY_AUDIT.md) | The September 2026 security review: vulnerabilities found, fixes, tests, remaining risks, credentials to rotate (a dated snapshot) |

## Keeping these accurate

These pages describe the code as it is, not as it was planned. When you change behaviour, update the page in the same pull request. If something has not been tested against a real backend, the page should say so.
