#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_BUNDLE="${ROOT_DIR}/src-tauri/target/release/bundle/macos/ClipStack.app"
OUTPUT_DIR="${ROOT_DIR}/src-tauri/target/release/bundle/dmg"

if [[ ! -d "${APP_BUNDLE}" ]]; then
  echo "App bundle not found: ${APP_BUNDLE}"
  echo "Run: npm run build:macos:app"
  exit 1
fi

VERSION="$(grep -m1 '"version"' "${ROOT_DIR}/src-tauri/tauri.conf.json" | sed -E 's/.*"version": "([^"]+)".*/\1/')"
ARCH="$(uname -m)"
DMG_NAME="ClipStack_${VERSION}_${ARCH}.dmg"
DMG_PATH="${OUTPUT_DIR}/${DMG_NAME}"

STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/clipstack-dmg.XXXXXX")"
cleanup() {
  rm -rf "${STAGING_DIR}"
}
trap cleanup EXIT

mkdir -p "${OUTPUT_DIR}"
cp -R "${APP_BUNDLE}" "${STAGING_DIR}/ClipStack.app"
ln -s /Applications "${STAGING_DIR}/Applications"

rm -f "${DMG_PATH}"
hdiutil create \
  -volname "ClipStack" \
  -srcfolder "${STAGING_DIR}" \
  -ov \
  -format UDZO \
  "${DMG_PATH}" >/dev/null

echo "Created DMG: ${DMG_PATH}"
