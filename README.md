# Deep Spot

Underwater photography dive game — descend, spot rare creatures, and surface to bank your photos in the species album.

## Play online

After GitHub Pages is enabled, play at:

**https://YOUR_USERNAME.github.io/deep-spot/**

(Replace `YOUR_USERNAME` with your GitHub username.)

## Controls

- **Desktop:** move the aim with mouse or trackpad; click to photograph creatures.
- **Mobile:** drag to aim; tilt your phone for gyro control (requires HTTPS — the hosted link above works).

## Run locally

```bash
cd web
python3 serve-https.py
```

Then open **https://localhost:8766** on your Mac, or the LAN `https://` address shown in the terminal on your phone. Accept the self-signed certificate warning when testing locally.

## Project structure

- `web/` — browser game (HTML, CSS, JavaScript)
- `fins/` — SwiftUI app scaffold (placeholder)

## Deploy

Pushes to `main` automatically deploy the `web/` folder to GitHub Pages via `.github/workflows/pages.yml`.
