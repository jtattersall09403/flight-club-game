# ✈️ Jack's Flight Club

**Think you can route like an airline ops controller?**

Jack’s Flight Club is a fast, high-pressure aviation puzzle where each round drops you between two airports and a global alliance challenge. Your job: build a valid multi-leg route using alliance member airlines before your streak breaks.

## Why it’s fun

- **Real-world flavor**: airport + airline catalogs grounded in real aviation data.
- **Two play styles**: 
  - **Normal** mode for fast strategic routing
  - **Hard** mode for IATA-first purists
- **Streak-based tension**: clear all 10 levels with no mistakes to climb the leaderboard.
- **Competitive replayability**: keep your pilot name and chase better runs.

---

## 📡 Data source credit (important)

**Primary source:**
- **airline-route-data (GitHub):** https://github.com/Jonty/airline-route-data

**Upstream/fallback source:**
- **OpenFlights (GitHub):** https://github.com/jpatokal/openflights

Major credit to **Jonty/airline-route-data** as the main dataset used by this project.
That dataset in turn pulls from FlightsFrom, with OpenFlights used as a backup source.

---

## Quick technical info

- **Frontend:** React + TypeScript + Vite (`/frontend`)
- **Deployment target:** Netlify (`netlify.toml` is configured)
- **API base URL:** provided via `VITE_API_BASE_URL` in production
- **Dev API proxy:** `/api/*` proxied to `http://127.0.0.1:8765`

### Run locally

```bash
cd frontend
npm install
npm run dev
```

### Build locally

```bash
cd frontend
npm run build
```

---

## Contributing

Contributions are welcome — gameplay ideas, UX polish, bug fixes, and data-quality improvements all help.

1. Fork the repo
2. Create a feature branch
3. Make focused, reviewable changes
4. Run local checks (`npm run build` at minimum)
5. Open a PR with:
   - what changed
   - why it changed
   - screenshots for UI changes

If you change data assumptions, please include notes on source compatibility and any implications for route validation/leaderboards.
