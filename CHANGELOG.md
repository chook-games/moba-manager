# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/). Versioning: [SemVer](https://semver.org/).

## [0.2.0] — Phase 0: Stability & QA

### Added
- Continuous integration: GitHub Actions runs syntax checks + smoke tests on every push/PR.
  A non-blocking headless-Chrome e2e job verifies the full game flow.
- `tests/check-syntax.mjs` — `node --check` across the whole codebase.
- `tests/smoke.mjs` — imports the full module graph and validates game logic,
  data integrity and **save migration** from old/corrupt saves.
- `tests/browser.mjs` — portable (Win/mac/Linux) DevTools-Protocol e2e test: home → mode →
  squad → game, hero selection, pause/resume, resize, console-error detection.
- `tests/serve.mjs` — tiny local static server (`npm run serve`).
- `package.json` with test/serve scripts.
- `APP_VERSION` constant (shown in Settings).
- `CHANGELOG.md`.

## [0.1.1] — Selection fix

### Fixed
- Hero selection lag: switching between champions now reacts instantly.
  - Squad dock selection uses `pointerdown` (no tap delay).
  - Squad dock no longer rebuilds its DOM every refresh (incremental updates).
  - 3D selection uses large invisible hitboxes and picks the closest champion to the camera.

## [0.1.0] — Gameplay simplification & desktop

### Added
- Responsive desktop layout (wider shell, more grid columns); camera starts zoomed out.

### Changed
- Orders reduced to `Farm / Push / Defend / Retreat` (removed `Gank` and `Fight`).
- Support escort chooser moved into the Tactics tab (shows only when a Support is selected);
  removed the separate Support tab.

## [0.0.0] — Initial release

### Added
- 3D MOBA-manager gameplay (Three.js), 12 champions, item shop, tactics, meta progression,
  unlocks, 3 modes (ARAM / Blitz / Titan Siege), PWA (offline + installable), mobile + desktop.
