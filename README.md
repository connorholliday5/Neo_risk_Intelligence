# Neo Risk Intelligence

A live astronomical desktop wallpaper built with Three.js + FastAPI. Runs via [Lively Wallpaper](https://www.rocksdanister.com/lively/) on Windows.

## Features

### Solar System View
- Real-time planet positions via JPL ephemeris
- Procedural sun shader with prominences and limb darkening
- Planet textures, Saturn rings, axis rotation
- Live clock and upcoming sky events panel for Westerly, RI
- Click Earth to drill down

### Earth View
- Textured Earth sphere with live ISS orbital position
- 14+ real near-Earth objects from NASA JPL CAD API
- NEO dots placed in true directions using position vectors
- Color-coded by NASA Sentry impact probability (green/orange/red)
- Closest NEO pulses, sized by distance
- Risk meter with real Sentry data (6hr cache)
- Lunar distance reference ring
- Click Earth to view local sky

### Sky View
- Planetarium dome projection (zenith = center, horizon = edge)
- 60+ named stars with real alt/az from observer coordinates
- Star colors by spectral type
- Constellation lines and labels for currently visible constellations
- Altitude rings at 30deg and 60deg
- Cardinal directions (N/S/E/W) on horizon
- Hover tooltips with magnitude and altitude

## Stack

- **Frontend**: Three.js, Vite
- **Backend**: FastAPI, Python, uvicorn
- **Data**: NASA JPL CAD API, NASA JPL Sentry API, Celestrak ISS TLE
- **Wallpaper**: Lively Wallpaper (renders localhost:5173 as desktop)

## Setup

### Requirements
- Python 3.11+
- Node.js 18+
- [Lively Wallpaper](https://www.rocksdanister.com/lively/)

### Install

```bash
# Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install fastapi uvicorn requests numpy astropy

# Frontend
cd frontend
npm install
```

### Run

```powershell
.\start_neo.ps1
```

This launches both servers minimized. Open Lively Wallpaper and set the wallpaper to `http://localhost:5173`.

### Manual

**Terminal 1 (API):**
```powershell
uvicorn api.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

## Observer Location

Configured for Westerly, RI (41.3776N, 71.8271W). Change in `config.py`.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /scene/solar` | Solar system planet positions |
| `GET /scene/earth` | Earth-centered bodies, ISS, NEOs with impact probability |
| `GET /scene/sky` | Stars, constellation lines, visible constellations |
| `WS /ws/{page}` | Live WebSocket feed (2s interval) |

## Data Sources

- **Planet positions**: JPL VSOP87 via `astropy`
- **NEOs**: [NASA JPL CAD API](https://ssd-api.jpl.nasa.gov/doc/cad.html) (1hr cache)
- **Impact probability**: [NASA JPL Sentry API](https://ssd-api.jpl.nasa.gov/doc/sentry.html) (6hr cache)
- **ISS TLE**: [Celestrak](https://celestrak.org) (6hr cache)
