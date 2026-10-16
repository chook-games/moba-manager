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
- **Real-time tactical management** — per-hero orders: `Farm / Push / Defend / Retreat`, target priority (`Lowest HP / Carry / Nearest / Turret`) and a team-wide macro order.
- **Ultimates** — each champion has a role-defining ability with a cooldown you trigger manually.
- **Support escort system** — select a Support hero and choose which ally they follow, heal and shield (the chooser appears inside Tactics whenever a Support is selected).
- **In-match item shop** — 12 items, 6 slots, instant purchase.
- **Meta progression** — account level & XP, Gold, champion mastery, win stats.
- **Missions** — rotating daily quests, 8 lifetime achievements, and an escalating daily-login Gold streak.
- **Champion roster & unlocks** — 18 champions (5 free, 13 unlockable with Gold).
- **4 modes** — `ARAM`, `Blitz` (team deathmatch), `Titan Siege` (hard mode), `Sudden Death` (fast).
- **Calmer pacing** — the match starts at **0.5x** speed by default (cycle: `0.5x → 1x → 1.5x → Pause`).
- **Starts zoomed out** — the camera opens on the wide **Map** view; zoom in with the tabs or pinch/wheel.
- **Game feel** — generated WebAudio SFX, vibration, kill feed, screen flash & camera shake, plus a **first-match tutorial** and an in-game **help** panel.
- **English + Greek** localization (auto-detected, switchable), **reduce-motion** accessibility option, next-minion-wave HUD timer and landscape support.
- **Mobile + desktop** — the UI adapts: a phone column on mobile, a wider centered layout with more grid columns on desktop. Tap/drag/pinch on touch, mouse drag + wheel zoom on desktop.
- **Offline PWA** — service worker caches the app; installable from the browser.

---

## Play locally

This project uses **ES modules**, so it must be served over HTTP (not opened via `file://`).

Pick any one:

```powershell
# Option A — built-in Node server (no dependencies)
node tests/serve.mjs        # or: npm run serve
# then open http://localhost:8000

# Option B — Python (usually preinstalled)
python -m http.server 8000

# Option C — any static server
npx serve .
```

Or in VS Code: install **Live Server**, right-click `index.html` → *Open with Live Server*.

## Testing

No dependencies required (plain Node ≥ 18):

```powershell
node tests/check-syntax.mjs   # node --check on every JS file
node tests/smoke.mjs          # imports the whole module graph + logic + save-migration tests
node tests/browser.mjs        # headless-Chrome e2e (needs Chrome; set CHROME_PATH to override)
# or simply: npm test
```

`npm test` runs syntax + smoke (fast, no browser). The browser test drives the full game
flow (menu → mode → squad → match, hero selection, pause/resume, resize) and fails on any
console error.

CI runs these automatically on every push/PR (see `.github/workflows/ci.yml`).

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
- **Tactics tab**: choose the hero's stance (`Farm / Push / Defend / Retreat`), set target
  priority, then fire the **Ultimate**. If the selected hero is a **Support**, a panel appears
  to choose which ally they escort, heal & shield.
- **Shop tab**: tap items to buy instantly with that hero's gold.
- **⚡ Team** (top bar): apply one order to the whole squad.
- **Camera**: `🗺️ Map` (wide overview, the default), `🎯 Hero` (follow), `🔍 Fight` (close-up).
  Drag to pan, pinch / wheel / slider to zoom.

**Order meanings**
- `Farm` — safely clear minions near mid, stay back.
- `Push` — advance down the lane, take objectives and fight anything in the way.
- `Defend` — hold near your own turret and fight enemies that approach.
- `Retreat` — fall back to base and heal up.
- **Speed**: the `0.5x` button cycles `0.5x → 1x → 1.5x → Pause`. It starts at **0.5x**.

**Goal:** destroy the enemy **Nexus** (ARAM / Titan Siege) or reach **25 kills** first (Blitz).
Win matches to earn **Gold** and **Account XP**; spend Gold in **Champions** to unlock new heroes.

---

## Project structure

```
index.html                 App shell + all screen markup
manifest.webmanifest       PWA manifest
service-worker.js          Offline cache
package.json               Test/serve scripts (no runtime deps)
CHANGELOG.md               Version history
.github/workflows/ci.yml   CI: syntax + smoke + e2e tests
tests/
  check-syntax.mjs         node --check across the codebase
  smoke.mjs                import graph + logic + save-migration tests
  browser.mjs              headless-Chrome e2e
  serve.mjs                local static server
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

## Distribution (Google Play / stores)

The game is a PWA and ships to the Play Store as a **Trusted Web Activity (TWA)**.

- **Store assets:** `store/` (1024 icon, 1024×500 feature graphic, bilingual listing copy, 8 real screenshots).
- **Screenshots:** regenerate anytime with `node tests/screenshots.mjs`.
- **TWA/Bubblewrap:** ready template + step-by-step guide in [`twa/README.md`](twa/README.md).
- **Privacy policy:** https://chook-games.github.io/moba-manager/privacy.html (also `privacy.html`).

> TWA verification needs `/.well-known/assetlinks.json` at the **domain root**. Since this is a
> project page, either use a custom domain or host that file in a `chook-games.github.io` repo
> (details in `twa/README.md`).

## Advanced configuration (all optional)

- **Save transfer (works out of the box):** Settings → Transfer Save exports a portable code you
  can import on another device. No backend required.
- **Remote balance:** set `window.__MOBA_REMOTE_CONFIG = true` in `index.html` and publish a
  `balance.json` (top-level `CONFIG` keys) to tweak balance in production without redeploying.
- **Cloud save:** fill `src/core/cloud.js` (or `window.__MOBA_CLOUD`) with a Supabase URL/anon key
  and a `saves` table.
- **Analytics:** set `ENDPOINT` in `src/core/analytics.js`; users opt in from Settings (off by default).

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
