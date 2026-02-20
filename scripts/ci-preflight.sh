#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

./scripts/check-version-sync.sh
npm run check
npm run test

# Required so tauri::generate_context! can validate frontendDist in CI-like checks.
mkdir -p build

cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings

echo "Local CI preflight passed."
