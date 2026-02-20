# Release-Prozess

1. Feature fertig entwickeln.
2. Version in `src-tauri/Cargo.toml` hochzaehlen (Semver, z. B. `1.1.0` -> `1.1.1` oder `1.2.0`).
3. Auf `main` pushen: `git push origin main`.
4. GitHub Actions (`.github/workflows/release.yml`) laeuft automatisch:
   - Version-Check (nur bei Version-Bump wird released)
   - Rust Tests + Clippy
   - Optional: `npm run test` (wenn Script vorhanden)
   - Build fuer Apple Silicon + Intel
   - GitHub Release mit Updater-Artefakten und `latest.json`
5. Laufende App-Instanzen pruefen beim naechsten Start automatisch auf Updates.

## Einmalig nach Klon/Fork

- Signier-Key erzeugen:
  - `npm run tauri signer generate -w ~/.tauri/app.key`
- Public Key nach `src-tauri/tauri.conf.json` eintragen:
  - `plugins.updater.pubkey`
  - Aktuell steht dort: `TAURI_PUBLIC_KEY_PLACEHOLDER`
- GitHub Secrets setzen:
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- GitHub Actions-Berechtigung aktivieren:
  - Repository Settings -> Actions -> General -> Workflow permissions -> `Read and write permissions`

## Website (spaeter)

- Ordner `web/` ist als Platzhalter vorbereitet.
- Deployment spaeter via Coolify.
- Download-Links koennen direkt auf GitHub Releases zeigen, z. B.:
  - `https://github.com/USER/REPO/releases/latest/download/ClipStack_aarch64.dmg`
