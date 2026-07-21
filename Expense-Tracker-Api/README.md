# Expense Tracker API

Express + Prisma API for the Expense Tracker app.

## Setup

```bash
npm install
npm run prisma:migrate
npm run dev
```

Default local URL: `http://localhost:4000`.

## Local testing without Neon/Railway

For day-to-day local testing, use a local PostgreSQL database so production Railway/Neon data is never touched.

Create a local database named:

```text
expense_tracker_local_dev
```

Copy the example env file:

```bash
copy .env.local.example .env.local
```

Default local API env:

```env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/expense_tracker_local_dev?schema=public"
JWT_SECRET="local-development-secret-change-before-production"
JWT_EXPIRES_IN="7d"
PORT=3108
CLIENT_ORIGIN="http://localhost:5190,http://127.0.0.1:5190"
TRUST_PROXY="false"
```

Then run from the repository root:

```bash
npm run dev
```

This applies Prisma migrations to the local PostgreSQL database, starts the API on `http://127.0.0.1:3108`, and starts the Vite app on `http://127.0.0.1:5190`.

If you do not have PostgreSQL installed locally, `npm run dev:sqlite` remains available inside `Expense-Tracker-Api` as a fallback, but the recommended local setup is PostgreSQL.

## Environment

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_HOST/DB?sslmode=require"
JWT_SECRET="replace-with-a-long-random-production-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
TRUST_PROXY="false"
```

## Database

This API uses PostgreSQL through Prisma. Neon PostgreSQL is recommended for testing and production because it keeps data outside the web service container.

## Railway deployment

This API is ready to deploy on Railway using the root `Dockerfile` and `railway.json`. Neon PostgreSQL is recommended for persistent data.

Recommended settings:

```text
Builder: Dockerfile
Public domain port: 8080
Health check path: /health
Custom build command: leave empty
Custom start command: leave empty
Pre-deploy step in Railway UI: leave empty
```

Environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@DIRECT_HOST/DB?sslmode=require
JWT_SECRET=<use a unique random secret of at least 32 characters>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-netlify-site.netlify.app
TRUST_PROXY=true
```

For Neon, use the pooled connection string for `DATABASE_URL` and the direct, non-pooled connection string for `DIRECT_URL`. Prisma Migrate needs the direct URL when applying migrations.

## Smoke test

After deployment, verify the API with:

```bash
API_URL=https://your-railway-domain.up.railway.app npm run smoke:api
```

The smoke test registers a disposable user, checks `/me`, loads categories, creates one transaction, and checks the monthly summary.

## Production security checklist

- Set `NODE_ENV=production`.
- Replace `JWT_SECRET` with a unique random value of at least 32 characters.
- Set `CLIENT_ORIGIN` to the deployed frontend origin only.
- Set `TRUST_PROXY=true` only when the API is behind a trusted reverse proxy.
- Serve the API and app only over HTTPS.
- Keep `.env` and database credentials out of version control.
- Use password reset email delivery in production; development reset tokens are intentionally omitted when `NODE_ENV=production`.
