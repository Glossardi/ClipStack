#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

cargo_version="$(sed -nE 's/^version = "([^"]+)"/\1/p' src-tauri/Cargo.toml | head -n1)"
tauri_version="$(sed -nE 's/^[[:space:]]*"version":[[:space:]]*"([^"]+)".*/\1/p' src-tauri/tauri.conf.json | head -n1)"
package_version="$(node -e "console.log(JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version)")"

if [[ -z "$cargo_version" || -z "$tauri_version" || -z "$package_version" ]]; then
  echo "Failed to read one or more version fields." >&2
  exit 1
fi

if [[ "$cargo_version" != "$tauri_version" || "$cargo_version" != "$package_version" ]]; then
  echo "Version mismatch detected:" >&2
  echo "  Cargo.toml:      $cargo_version" >&2
  echo "  tauri.conf.json: $tauri_version" >&2
  echo "  package.json:    $package_version" >&2
  exit 1
fi

echo "Version check OK: $cargo_version"
