# My London Transit 🚇

Personal London transit PWA — live TfL data, line status, nearby stops, and family sightseeing guide.
Hosted on GitHub Pages, installs on iPhone like a native app.

---

## STEP 1 — Get your free TfL API key

1. Go to **https://api.tfl.gov.uk**
2. Click **Register** (top right corner)
3. Fill in your name and email — completely free, no card needed
4. Check your email and click the confirmation link
5. Log back in → click **My Applications** → **Register Application**
6. Give it any name, e.g. "My Transit App" → click Submit
7. Your **App Key** appears — copy it (looks like: `a1b2c3d4e5f6...`)
8. Open `js/config.js` in any text editor and paste it here:
   ```
   appKey: 'PASTE-YOUR-KEY-HERE',
   ```
9. Save the file

---

## STEP 2 — Push to GitHub

1. Go to **github.com** → click **+** → **New repository**
2. Name it `london-transit` → set to Public → click **Create repository**
3. On your computer, open Terminal in the project folder and run:

```bash
git init
git add .
git commit -m "My London Transit app"
git branch -M main
git remote add origin https://github.com/johno78/london-transit.git
git push -u origin main
```

---

## STEP 3 — Turn on GitHub Pages

1. Go to your repo on github.com
2. Click **Settings** → scroll down to **Pages** (left sidebar)
3. Under "Branch" — select **main**, folder **/ (root)** → click **Save**
4. Wait ~60 seconds → your app is live at:
   **https://johno78.github.io/london-transit**

---

## STEP 4 — Install on iPhone

1. Open **https://johno78.github.io/london-transit** in **Safari** (must be Safari)
2. Tap the **Share** button (the box with an arrow, bottom of screen)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**
5. The app icon appears on your home screen — tap it to open like a native app!

---

## Making changes later

Edit any file, then:
```bash
git add .
git commit -m "describe what you changed"
git push
```
GitHub Pages updates automatically within about 60 seconds.

---

## File structure

```
london-transit/
├── index.html           — App shell (5 tabs)
├── manifest.json        — PWA settings (name, icon, colours)
├── sw.js                — Service worker (offline support)
├── css/app.css          — All styling
├── js/
│   ├── config.js        ← YOUR API KEY GOES HERE
│   ├── explore-data.js  — Family attractions data (edit to add your own)
│   ├── tfl.js           — TfL API wrapper
│   └── app.js           — All app logic
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Tabs

| Tab | What it does |
|-----|-------------|
| **Plan** | Live journey planner — origin, destination, step-by-step directions |
| **Status** | Live line status for all Tube, DLR, Overground, Elizabeth line |
| **Nearby** | GPS live departures from nearest stations and bus stops |
| **Explore** | 20+ family attractions — filterable, with "Get there" routing |
| **Oyster** | Balance and recent journey display |
