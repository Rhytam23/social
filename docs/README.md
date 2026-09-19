# Documentation

Start with the [project README](../README.md) for what Private Chat is and how to run it.

## Guides

| Document | Read it when you want to |
|---|---|
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

## Keeping these accurate

These pages describe the code as it is, not as it was planned. When you change behaviour, update the page in the same pull request. If something has not been tested against a real backend, the page should say so.
