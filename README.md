# Flowboard

A dark, developer-focused Kanban workspace built with Next.js App Router, Prisma 7, PostgreSQL, Zod, Framer Motion, and dnd-kit. Board data is rendered from PostgreSQL on the server. All writes use validated Next.js Server Actions; there are no REST routes or client-side data store.

## Local setup

1. Install Node.js 22.18+ and start a local PostgreSQL server.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
3. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   npm run db:generate
   ```

4. Create and apply the initial migration:

   ```bash
   npm run db:migrate -- --name init
   ```

5. Start Next.js:

   ```bash
   npm run dev
   ```

The app creates a fixed demo user (`demo@flowboard.local`) on first load. This is only a development identity; authentication and tenant isolation are not implemented.

## Structure

- `prisma/schema.prisma` — User, Board, Column, and Task models with ordering and timestamps.
- `prisma/migrations/` — Initial PostgreSQL schema migration.
- `lib/db.ts` — Reusable Prisma 7 client with the PostgreSQL driver adapter.
- `lib/validation.ts` — Zod request schemas.
- `app/actions/kanban.ts` — CRUD and task movement Server Actions.
- `lib/queries.ts` — Server-side nested board → column → task query.
- `components/kanban/` — Server-fed workspace and interactive client components.

Task moves update the UI optimistically and then persist the ordering in a transaction. Other mutations refresh from the database after the Server Action succeeds.
