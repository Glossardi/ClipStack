# ClipStack Website (`web/`)

One-page Download Website for `clipstack.click` (EN/DE, dark minimal style, static + Docker-ready).

## Scope

- Minimal SaaS-style one pager with focus on product download
- Extra-minimal hero with very low copy (product-first)
- Bilingual UI (English default, German auto-switch by browser language)
- Auto-fetch latest GitHub release version and download links
- Umami analytics for page views + download events
- SEO + structured data + FAQ schema
- Lightweight static hosting via Nginx (Coolify friendly)

## Architecture

- Static frontend:
  - `index.html`
  - `styles.css`
  - `app.js`
  - `release-utils.js`
- Runtime config injection:
  - `env.js` is generated at container start from ENV vars
  - Script: `docker/40-generate-env.sh`
- Web server:
  - `nginx.conf` with security headers + caching + health check

## Release Link Logic

Client-side fetch target:

- `https://api.github.com/repos/<owner>/<repo>/releases/latest`

DMG detection:

- Apple Silicon keywords: `arm64`, `aarch64`, `apple-silicon`, `silicon`
- Intel keywords: `x64`, `x86_64`, `intel`, `amd64`
- Universal fallback supported

Recommended file names:

- `ClipStack_1.2.0_aarch64.dmg`
- `ClipStack_1.2.0_x64.dmg`

Important:

- If the repository or release is not publicly reachable, GitHub API returns `404`.
- In that case the UI now shows a clean "release pending" fallback instead of technical errors.

## Analytics (Umami)

Injected script source and website ID are configurable via ENV.

Tracked events:

- `download` with `{ arch, version, repo }`
- `language_switch` with `{ language }`

## SEO / GEO Features

- Canonical + hreflang (`en`, `de`, `x-default`)
- Open Graph + Twitter cards
- JSON-LD for `SoftwareApplication`
- JSON-LD for `FAQPage`
- `robots.txt`
- `sitemap.xml`

## Local Testing

### Option A: Production-like Docker test (recommended)

```bash
cd web
docker compose up --build
```

Open:

- `http://localhost:8080`

Health:

- `http://localhost:8080/healthz`

Stop:

```bash
docker compose down
```

### Option B: Quick static server test

```bash
cd web
python3 -m http.server 8080
```

Note:

- Always use a local web server.
- Avoid opening `index.html` directly via `file://` for realistic JS/API behavior.

### Option C: Test-driven checks (release mapping)

```bash
cd web
npm run test
```

This runs `release-utils.test.js` and validates architecture mapping/fallback behavior.

## Coolify Deployment

Recommended for an orphan website branch:

1. Create a new app in Coolify from this repo.
2. Select branch `website`.
3. Dockerfile path: `web/Dockerfile`.
4. Build context: `web`.
5. Exposed port: `8080`.
6. Configure domain: `clipstack.click`.
7. Set optional ENV vars (if needed):
   - `CLIPSTACK_SITE_URL`
   - `CLIPSTACK_GITHUB_REPO`
   - `CLIPSTACK_GITHUB_PROJECT_URL`
   - `CLIPSTACK_UMAMI_SCRIPT_URL`
   - `CLIPSTACK_UMAMI_WEBSITE_ID`

Container startup behavior:

- `docker/40-generate-env.sh` writes `/usr/share/nginx/html/env.js` from ENV.

## Troubleshooting

### "No CSS visible"

- Ensure you are not previewing raw file paths incorrectly.
- Use `docker compose up --build` and open `http://localhost:8080`.

### "Latest release not found"

- Check repository visibility.
- Check if at least one public release exists.
- Verify DMG assets are attached to the latest release.

### "Download arch mapping wrong"

- Use explicit architecture keywords in DMG names (`aarch64` / `x64`).

## File Overview

- `index.html`: main page, SEO tags, structured data
- `styles.css`: visual language, spacing, interactions, responsive rules
- `app.js`: i18n, release API fetch, download mapping, Umami events
- `release-utils.js`: pure release mapping logic used by `app.js`
- `release-utils.test.js`: unit tests for release mapping logic
- `env.js`: default runtime config (overwritten in Docker runtime)
- `imprint.html`: legal placeholder page
- `assets/`: logo, favicon, app preview
- `nginx.conf`: static serving + headers + caching
- `Dockerfile`: production image
- `docker-compose.yml`: local docker run
- `docker/40-generate-env.sh`: runtime ENV to `env.js`
