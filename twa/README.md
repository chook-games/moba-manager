# Publishing to Google Play (TWA)

The game is a PWA, so it can be wrapped as a **Trusted Web Activity (TWA)** and shipped to the
Play Store. Two easy routes:

## Option A — PWABuilder (no tooling)

1. Go to <https://www.pwabuilder.com> and enter `https://chook-games.github.io/moba-manager/`.
2. Choose **Package for stores → Android**.
3. Set **Package ID** `io.github.chookgames.mobamanager`, keep the generated signing key.
4. Download the `.aab` (Android App Bundle) + `assetlinks.json`.
5. Upload the `.aab` to the Play Console. Before it goes live, complete step **Digital Asset Links**
   below, otherwise the app shows a browser bar.

## Option B — Bubblewrap CLI

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest ../manifest.webmanifest
# or use the prepared config:
bubblewrap init --manifest twa/twa-manifest.json
bubblewrap build          # produces app-release-bundle.aab + assetlinks.json
```

`twa-manifest.json` in this folder is a ready template (update `appVersionName`/`appVersionCode`
each release and keep the generated `android.keystore` safe).

## Digital Asset Links (required)

TWA needs `https://<domain>/.well-known/assetlinks.json` verifying your app's signing key.

⚠️ **Important:** the site lives at a *project* path (`/moba-manager/`), but `assetlinks.json`
must be served from the **domain root** `https://chook-games.github.io/.well-known/assetlinks.json`.

Pick one:

- **Custom domain (recommended):** point a domain at GitHub Pages (Settings → Pages → Custom
  domain). Then this repo can serve `/.well-known/assetlinks.json` at its root.
- **User Pages repo:** create the repo `chook-games.github.io` and put the file at
  `<repo>/.well-known/assetlinks.json` (GitHub Pages serves it at the domain root).

Use `assetlinks.template.json` from this folder: replace the fingerprint with the **SHA-256** of
the signing key you used (Play Console → Release → Setup → App signing, or
`keytool -list -v -keystore android.keystore`).

## Play Console checklist

- App name, short & full description → see `store/listing.md`.
- Icon 512×512, feature graphic 1024×500 → `store/`.
- At least 2 phone screenshots → `store/screenshots/` (8 provided).
- Privacy policy URL: `https://chook-games.github.io/moba-manager/privacy.html`.
- Content rating questionnaire (Everyone), Data safety: **no data collected**.
