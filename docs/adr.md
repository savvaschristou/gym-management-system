# Architecture Decision Records

Owner: Sawyer. Four decisions, all accepted Oct 14, 2026.

## ADR-001: Layered architecture with repositories

Context: Four students, about eight weeks, and an undecided backend. The `src/domain`, `src/data`, `src/services` and `src/ui` folders already exist.

Decision: Pages call services, services use domain types, and storage hides behind repositories (`UserRepository`, `LocalStorageRepository`). Pages never touch localStorage.

Consequences: Storage can change later without touching pages or services, and services can be tested without React. The cost is a few more files than a quick prototype would need.

Alternatives: MVC; building a REST backend now; microservices. All are heavier than this project needs.

## ADR-002: localStorage until the backend decision

Context: Setting up a server and database now would eat a sprint before any features exist.

Decision: Store everything in browser localStorage, one key per table (for example `gym.exercises`). Decide in the week of Nov 30 whether to move to PostgreSQL using `db/schema.sql`.

Consequences: No hosting and no setup for anyone. Data lives in one browser and isn't secure, so demo accounts are created on startup. Moving to a server later means new repository classes, not new features.

Alternatives: Firebase or Supabase (ties us to a vendor); IndexedDB (harder to use, more than we need).

## ADR-003: Store facts, compute everything else

Context: Membership status, personal records, one-rep maxes and streaks can all be calculated from other data. Storing them risks numbers that disagree.

Decision: Save only what a person enters or decides: sets, dates, and whether a membership is active, frozen or cancelled. Calculate expired and grace status, PRs, one-rep maxes and streaks when they're needed.

Consequences: The database stays in 3NF and can't contradict itself. Recalculating is instant at this scale.

Alternatives: A `personal_records` table, which would need updating every time a set is edited or deleted.

## ADR-004: Role checks in the routes, then in the services

Context: Members and staff see different pages. A check in the UI alone is easy to get around.

Decision: This sprint, `ProtectedRoute` redirects anyone with the wrong role. When staff tools are built (week of Oct 26), each staff-only service method also checks the user's role, so the rule holds even if a page is bypassed.

Consequences: The rule lives in two places once staff tools exist, so both must change together if roles change.

Alternatives: Route checks only (the rule disappears once there's a backend); a permissions table (overkill for two roles).
