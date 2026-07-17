# Expense Tracker App

Vite React frontend for the Expense Tracker project.

## Local development

```bash
npm install
npm run dev
```

## Netlify deployment

This app is ready to deploy to Netlify.

Recommended settings:

```text
Base directory: Expense-Tracker-App
Build command: npm run build
Publish directory: dist
```

Environment variable:

```env
VITE_API_URL=https://your-render-api.onrender.com
```

After the backend is deployed, set `VITE_API_URL` to your Render API URL and redeploy the Netlify site.
