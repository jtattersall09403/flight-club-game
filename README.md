# Jack's Flight Club — Frontend

Vite + React + TypeScript. Deployed on Netlify.

## Deploy on Netlify

1. Create a new site from this repo.
2. Build settings auto-detect from `netlify.toml`:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. Set env var `VITE_API_BASE_URL` in Site settings → Environment variables,
   e.g. `https://flight-club-api.onrender.com`.
4. Trigger a deploy.

## Local dev

```
cd frontend
npm install
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:8765` in dev. In production,
fetches go to `VITE_API_BASE_URL` (set at build time on Netlify).
