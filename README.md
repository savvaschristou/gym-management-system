# Gym Management System

A web app where gym members track their membership and their lifts, and staff manage members and check-ins. Built with React and TypeScript for a software engineering course.

Team: Savvas Christou, Elif Akcivi, Chinguun, Sawyer Hess.

## What you need

Node.js 24, the same version CI uses. Older versions ship an npm that rejects our lockfile.

## Run it

```bash
npm install
npm start
```

Then open http://localhost:3000.

## Demo logins

| Email | Password | Role |
| --- | --- | --- |
| member@demo.gym | demo123 | Member |
| staff@demo.gym | demo123 | Staff |

The app keeps its data in your browser. To start fresh, clear the site data in your browser's developer tools.

## Test it

```bash
npm test -- --watchAll=false   # all unit and integration tests
npm run test:coverage          # tests plus a coverage report in coverage/
npm run lint                   # ESLint
```

## Database

The `server/` folder holds the database layer: Sequelize models, migrations and seed data, using SQLite (a single file, `server/gym.sqlite`, so there's nothing to install). The React app doesn't use it yet; it still stores data in the browser.

```bash
cd server
npm install
npm run db:reset   # build every table from scratch, then fill it with test data
npm run db:check   # row counts, relationships and constraint checks
```

The reference PostgreSQL schema is in [db/schema.sql](db/schema.sql).

## How we work

- [Git workflow](docs/git-workflow.md): branches, commit messages, pull requests and merging
- [Project documents](docs/): architecture and design, testing strategy, decision records
