# IEWG Transnational Data Protection Cases Map

An interactive global map of transnational data protection enforcement cases, built for the **International Enforcement Cooperation Working Group (IEWG)** of the **Global Privacy Assembly (GPA)**.

## Features

- 🌍 **Interactive world map** — zoom, pan, double-click to reset
- 🔗 **Connection arcs** — hover a case to see which countries are affected, with animated arcs on the map
- 🔵 **Bubble markers** — sized by case count, coloured by dominant enforcement type
- 🔍 **Search & filter** — by enforcement type, jurisdiction, year, or free-text search
- 📋 **Detail panel** — full case information with source links
- 30 cases across 10 jurisdictions (2018–2022)

## Tech Stack

- **React 18** + **Vite 5**
- **D3 v7** — map projection, zoom/pan, arc drawing
- **TopoJSON** — world geography data
- Google Fonts: Libre Baskerville + Source Sans 3 + Source Code Pro

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/iewg-cases-map.git
cd iewg-cases-map
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for production

```bash
npm run build
```

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect Vite.

### Option B — GitHub Integration (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — just click **Deploy**
5. Done! You'll get a live URL like `https://iewg-cases-map.vercel.app`

No environment variables needed. Build settings are auto-detected:
- **Framework**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`

## Project Structure

```
iewg-map/
├── public/
│   ├── GPA_Logo.png
│   └── IEWG_Logo.jpg
├── src/
│   ├── components/
│   │   ├── WorldMap.jsx      # D3 map with zoom + arcs
│   │   └── DetailPanel.jsx   # Slide-over case detail
│   ├── data/
│   │   └── cases.js          # All 30 cases + config
│   ├── App.jsx               # Main layout + state
│   ├── main.jsx              # React entry point
│   └── index.css             # CSS variables + global styles
├── index.html
├── package.json
└── vite.config.js
```

## Adding or Updating Cases

Edit `src/data/cases.js`. Each case object has:

```js
{
  id: 0,                          // unique integer
  jurisdiction: "United Kingdom", // enforcing DPA's country
  dpa: "ICO",                     // authority name
  year_initiated: "2018",
  year_enforced: "2020",
  case_name: "British Airways",
  institution_type: "Airline",
  description: "...",
  enforcement_tool: "Monetary Penalty — £20m",
  enforcement_category: "Fine/Penalty", // see CAT_CONFIG keys
  transnational_implication: "...",
  affected_countries: ["United Kingdom", "Germany", ...],
  technologies: "Cyber-attack, ...",
  hyperlink: "https://...",
}
```

Enforcement categories: `"Fine/Penalty"`, `"Order"`, `"Determination/Recommendation"`, `"Cessation Notice"`, `"Other"`

To add coordinates for a new country, add it to `COORD_MAP` in `cases.js`:
```js
"New Country": [longitude, latitude],
```
