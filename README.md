# ✈️ Jack's Flight Club

![Jack's Flight Club — Landing screen](docs/images/landing-screen.png)

![Jack's Flight Club — In-game screen](docs/images/game-screen.png)

Play now: https://flight-club-game.netlify.app/

**The niche airline routing quiz game for frequent flyers and aviation fanatics.**

Jack’s Flight Club is a browser game where each run gives you airport-to-airport routing challenges constrained by airline groups and alliances. You build valid multi-leg itineraries using real-world airport and airline references.

## How it works

- Each run has **10 levels**.
- Difficulty increases as you progress.
- Later levels use more niche and restrictive airline groupings, making route construction harder.
- You can play in Normal or Hard mode (IATA-focused prompts).
- Scores are recorded on a **global leaderboard** for competitive replay.

---

## 📡 Data source credit

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
