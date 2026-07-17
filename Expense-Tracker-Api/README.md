# Expense Tracker API

Express + Prisma API for the Expense Tracker app.

## Setup

```bash
npm install
npm run prisma:migrate
npm run dev
```

Default local URL: `http://localhost:4000`.

## Environment

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="replace-with-a-long-random-production-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
TRUST_PROXY="false"
```

## Database

This API uses PostgreSQL through Prisma. Neon PostgreSQL is recommended for testing and production because it keeps data outside the web service container.

## Render deployment

This API is ready to deploy on Render as a Node web service using an external PostgreSQL database such as Neon.

Recommended settings:

```text
Root directory: Expense-Tracker-Api
Build command: npm run render:build
Pre-deploy command: npm run render:predeploy
Start command: npm start
Health check path: /health
```

Environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=<Render can generate this, or use your own long random secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-netlify-site.netlify.app
TRUST_PROXY=true
```

If you use the included `render.yaml`, Render will prompt you for `DATABASE_URL` and `CLIENT_ORIGIN`.

For Neon, copy the pooled or direct connection string from your Neon dashboard and keep `sslmode=require`.

## Production security checklist

- Set `NODE_ENV=production`.
- Replace `JWT_SECRET` with a unique random value of at least 32 characters.
- Set `CLIENT_ORIGIN` to the deployed frontend origin only.
- Set `TRUST_PROXY=true` only when the API is behind a trusted reverse proxy.
- Serve the API and app only over HTTPS.
- Keep `.env` and database credentials out of version control.
- Use password reset email delivery in production; development reset tokens are intentionally omitted when `NODE_ENV=production`.
