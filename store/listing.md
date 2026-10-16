# Store listing — MOBA Manager

Copy/paste text for the Google Play Store (and other stores). The app is a PWA/TWA.

## App identity

- **App name:** MOBA Manager
- **Package / Application ID (suggested):** `io.github.chookgames.mobamanager`
- **Category:** Games → Strategy
- **Content rating:** Everyone / 3+ (no violence beyond stylized combat, no ads, no IAP)
- **Contains ads:** No
- **In-app purchases:** No
- **Privacy policy URL:** https://chook-games.github.io/moba-manager/privacy.html

## Short description (≤ 80 chars)

```
Manage a 5-champion MOBA squad in real time. Draft, command, fire ultimates!
```

## Full description (EN)

```
Take charge of a full 5-champion MOBA squad — you don't control one hero, you manage the whole team.

Set stances, choose target priorities, buy items on the fly and unleash ultimates in real-time 3D battles. Destroy the enemy Nexus, or win the kill race in Blitz.

FEATURES
• Real-time tactical management of 5 champions
• 18 champions across 6 roles (Marksman, Mage, Tank, Assassin, Support, Fighter)
• 4 game modes: ARAM, Blitz, Titan Siege, Sudden Death
• 12 items, ultimates, support escort system
• Meta progression: account level, Gold, champion unlocks, mastery
• Daily quests, achievements and login rewards
• 3D battlefield (Three.js)
• English & Greek
• Works offline — install it as an app

Playable on phone and desktop. No accounts, no ads, no tracking.
```

## Full description (EL)

```
Ανέλαβε μια πλήρη ομάδα 5 ηρώων MOBA — δεν ελέγχεις έναν ήρωα, αλλά όλη την ομάδα.

Βάλε στάσεις, διάλεξε προτεραιότητες στόχου, αγόρασε items και ρίξε ultimates σε 3D μάχες πραγματικού χρόνου. Κατέστρεψε το αντίπαλο Nexus ή κέρδισε τον αγώνα kills στο Blitz.

ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ
• Real-time διαχείριση 5 ηρώων
• 18 ήρωες, 6 ρόλοι (Σκοπευτής, Μάγος, Τανκ, Δολοφόνος, Υποστήριξη, Μαχητής)
• 4 modes: ARAM, Blitz, Πολιορκία Τιτάνων, Αιφνίδιος Θάνατος
• 12 items, ultimates, σύστημα support
• Πρόοδος: επίπεδο, χρυσός, ξεκλειδώματα, mastery
• Καθημερινές αποστολές, επιτεύγματα, δώρα σύνδεσης
• 3D πεδίο μάχης (Three.js)
• Αγγλικά & Ελληνικά
• Λειτουργεί offline

Για κινητό και υπολογιστή. Χωρίς λογαριασμούς, διαφημίσεις ή tracking.
```

## Graphic assets (this folder)

| Asset | File | Size |
| --- | --- | --- |
| App icon | `store/icon-1024.png` | 1024×1024 |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024×500 |
| Phone screenshots | `store/screenshots/*.png` | 412×915 @2x |

Screenshots are real gameplay captures (see `tests/screenshots.mjs`). Regenerate anytime with:

```
node tests/screenshots.mjs
```

## Notes

- Play Store requires at least **2 phone screenshots** (we provide 8) and the 512×512 icon +
  1024×500 feature graphic.
- Keep the Privacy Policy URL public (served by GitHub Pages at `/privacy.html`).
