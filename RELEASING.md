# Release-Prozess

Release-Branch ist `main`.

1. Feature fertig entwickeln.
2. Lokal immer zuerst Preflight ausfuehren:
   - `npm run release:preflight`
   - Rust Toolchain: `rustc --version` sollte mindestens `1.88` sein
   - Falls Homebrew-Rust priorisiert wird: `export PATH="$HOME/.cargo/bin:$PATH"`
3. Version in allen drei Dateien hochzaehlen:
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
   - `package.json`
4. Auf `main` pushen:
   - `git push origin main`
5. GitHub Actions (`.github/workflows/release.yml`) laeuft automatisch:
   - Version-Check (nur bei Version-Bump wird released)
   - Rust Tests + Clippy + Frontend-Tests
   - Build fuer Apple Silicon + Intel
   - GitHub Release mit Updater-Artefakten und `latest.json`
6. Laufende App-Instanzen pruefen beim naechsten Start automatisch auf Updates.

## Lokale Checks (gleich wie CI)

- `npm run ci:version-check`
- `npm run ci:preflight`

Damit sparst du unnoetige CI-Runs, weil die typischen Fehler lokal vorher auffallen.

## Private vs. Public Repository (wichtig)

- Technisch kann der Updater auch mit GitHub Releases arbeiten.
- Fuer echte Endnutzer-Updates muss `latest.json` und die Artefakte oeffentlich erreichbar sein.
- Bei einem privaten Repository koennen fremde Nutzer ohne GitHub-Auth die Update-Dateien nicht abrufen.
- Wenn du die App oeffentlich kostenlos verteilst, sollte der Update-Endpoint oeffentlich sein:
  - entweder Repo spaeter auf `public`
  - oder eigenes Hosting (z. B. Coolify/S3/CDN)
- Hinweis: `.gitignore` schuetzt nur neue Commits. Bereits historisch eingecheckte private Dateien bleiben in der Git-Historie, bis sie aktiv bereinigt werden.

## Einmalig nach Klon/Fork

- Signier-Key erzeugen:
  - `npm run tauri signer generate -w ~/.tauri/app.key`
- Public Key nach `src-tauri/tauri.conf.json` eintragen:
  - `plugins.updater.pubkey`
  - Wenn du forken willst: eigenen Key erzeugen und den vorhandenen Wert ersetzen.
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
