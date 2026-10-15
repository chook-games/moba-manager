# MOBA Manager — Tactical Esports Sim

A **real-time MOBA *manager*** game. You don't control one hero — you command a whole
**5-champion squad**: set stances, pick target priorities, assign the Support escort, buy
items on the fly and fire ultimates. Win by destroying the enemy Nexus (or, in Blitz, by
reaching the kill target).

Built as a **Progressive Web App (PWA)** so it runs as a web page **and** installs as a
fullscreen app on **Android** (and desktop) — offline included.

---

## Features

- **3D battlefield** (Three.js) — a single diagonal ARAM bridge with champions, minions, turrets and Nexuses.
- **Real-time tactical management** — per-hero orders: `Farm / Push / Defend / Gank / Fight / Retreat`, target priority (`Lowest HP / Carry / Nearest / Turret`) and a team-wide macro order.
- **Ultimates** — each champion has a role-defining ability with a cooldown you trigger manually.
- **Support escort system** — assign which ally your Support follows and heals/shields.
- **In-match item shop** — 8 items, 6 slots, instant purchase.
- **Meta progression** — account level & XP, Gold, champion mastery, win stats.
- **Champion roster & unlocks** — 5 free champions, 7 more unlockable with Gold.
- **3 modes** — `ARAM`, `Blitz` (team deathmatch), `Titan Siege` (hard mode).
- **Calmer pacing** — the match starts at **0.5x** speed by default (cycle: `0.5x → 1x → 1.5x → Pause`).
- **Mobile + desktop controls** — tap/drag/pinch on touch, mouse drag + wheel zoom on desktop.
- **Offline PWA** — service worker caches the app; installable from the browser.

---

## Play locally

This project uses **ES modules**, so it must be served over HTTP (not opened via `file://`).

Pick any one:

```powershell
# Option A — Python (usually preinstalled)
python -m http.server 8000
# then open http://localhost:8000

# Option B — Node
npx serve .
```

Or in VS Code: install **Live Server**, right-click `index.html` → *Open with Live Server*.

---

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `moba-manager`).
2. Push this folder to the default branch:

   ```powershell
   git init
   git add .
   git commit -m "Initial commit: MOBA Manager PWA"
   git branch -M main
   git remote add origin https://github.com/<your-username>/moba-manager.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   select **`main`** and **`/ (root)`**, then **Save**.
4. Wait ~1 minute. Your game is live at:

   ```
   https://<your-username>.github.io/moba-manager/
   ```

> The app uses only relative paths (`./...`), so it works from a project sub-path with no changes.

---

## Install as an Android app

The game ships a web manifest + service worker, so it installs without any store or build step.

1. Open the GitHub Pages URL in **Chrome on Android**.
2. Tap the **⋮** menu → **Add to Home screen / Install app** (or use the in-game
   **“⬇️ INSTALL APP”** button on the home screen).
3. Launch it from the home screen — it opens **fullscreen**, works **offline**, and behaves
   like a native app.

On desktop Chrome/Edge you can also click the install icon in the address bar.

---

## How to play

- **Select a hero**: tap a champion in the 3D view, or tap a card in the bottom squad dock.
- **Tactics tab**: choose the hero's stance and target priority, then fire the **Ultimate**.
- **Support tab**: choose which ally the Support escorts & heals.
- **Shop tab**: tap items to buy instantly with that hero's gold.
- **⚡ Team** (top bar): apply one order to the whole squad.
- **Camera**: `🔍 Fight` (close-up), `🎯 Hero` (follow), `🗺️ Map` (overview). Drag to pan,
  pinch / wheel / slider to zoom.
- **Speed**: the `0.5x` button cycles `0.5x → 1x → 1.5x → Pause`. It starts at **0.5x**.

**Goal:** destroy the enemy **Nexus** (ARAM / Titan Siege) or reach **25 kills** first (Blitz).
Win matches to earn **Gold** and **Account XP**; spend Gold in **Champions** to unlock new heroes.

---

## Project structure

```
index.html                 App shell + all screen markup
manifest.webmanifest       PWA manifest
service-worker.js          Offline cache
css/
  base.css                 Reset, variables, layout, buttons
  components.css           Screen-specific styling
src/
  main.js                  Bootstrap + game loop + input wiring
  config.js                All tunable constants & game speeds
  state.js                 Single runtime state bag
  storage.js               Save/load profile (localStorage) + rewards
  utils.js                 Math & lane helpers
  pwa.js                   Service worker registration + install prompt
  data/                    champions, items, abilities, modes, progression
  three/                   scene, meshes, camera, floating labels
  game/                    match setup, simulation, combat, ai, abilities
  ui/                      nav, squad, hud, command-sheet, gameover, menu
assets/icons/              PWA icons
```

Everything is split into small, single-responsibility modules (well under ~1000 lines each).

## Tech

- Vanilla ES modules (no build step, no npm required)
- [Three.js r128](https://threejs.org/) (CDN, cached offline)
- Plain CSS design system
- `localStorage` for saves · Service Worker for offline · Web App Manifest for install

## Development notes

- **Balance / pacing** lives in `src/config.js`.
- If you change any cached file, bump `VERSION` in `service-worker.js` so clients refresh.
- Save data is versioned in `src/storage.js` (`SAVE_VERSION` + `migrate()`); the extra
  champions always stay grantable so old saves keep working.

## License

MIT — free to use, modify and publish.
