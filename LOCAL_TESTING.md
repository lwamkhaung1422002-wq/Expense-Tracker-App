# Local Testing

This setup lets you test the Expense Tracker locally without touching Railway, Neon production data, or Netlify.

## Ports

- API: `http://127.0.0.1:3108`
- App: `http://127.0.0.1:5190`

## 1. Create a Local PostgreSQL Database

Create this database in your local PostgreSQL server:

```text
expense_tracker_local_dev
```

Use your real local PostgreSQL username and password in:

```text
Expense-Tracker-Api/.env.local
```

Default example:

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/expense_tracker_local_dev?schema=public"
```

If your password is not `postgres`, change only that password part.

## 2. Check Frontend Local Env

The app local env is:

```text
Expense-Tracker-App/.env.local
```

It should contain:

```env
VITE_API_BASE_URL=http://127.0.0.1:3108
```

## 3. Run the Project

From the repository root:

```bash
npm run dev
```

This runs:

- API migrations against the local PostgreSQL database
- API server on `127.0.0.1:3108`
- Vite app on `127.0.0.1:5190`

## 4. Verify

Open:

```text
http://127.0.0.1:5190
```

API health:

```text
http://127.0.0.1:3108/health
```

## Safety

- `.env.local` files are ignored by Git.
- Production deploy config still uses Railway/Netlify variables.
- Production database is not touched by this local setup.
- SQLite local fallback still exists with `npm run dev:sqlite` inside `Expense-Tracker-Api`, but PostgreSQL local testing is the recommended workflow.
