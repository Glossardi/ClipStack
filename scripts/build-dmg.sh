#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_BUNDLE="${ROOT_DIR}/src-tauri/target/release/bundle/macos/ClipStack.app"
OUTPUT_DIR="${ROOT_DIR}/src-tauri/target/release/bundle/dmg"
LATEST_DIR="${ROOT_DIR}/Latest"

if [[ ! -d "${APP_BUNDLE}" ]]; then
  echo "App bundle not found: ${APP_BUNDLE}"
  echo "Run: npm run build:macos:app"
  exit 1
fi

VERSION="$(grep -m1 '"version"' "${ROOT_DIR}/src-tauri/tauri.conf.json" | sed -E 's/.*"version": "([^"]+)".*/\1/')"
ARCH="$(uname -m)"
DMG_NAME="ClipStack_${VERSION}_${ARCH}.dmg"
DMG_PATH="${OUTPUT_DIR}/${DMG_NAME}"
case "${ARCH}" in
  arm64|aarch64) LATEST_ARCH="aarch64" ;;
  x86_64|amd64) LATEST_ARCH="x64" ;;
  *) LATEST_ARCH="${ARCH}" ;;
esac
LATEST_DMG_PATH="${LATEST_DIR}/ClipStack_latest_${LATEST_ARCH}.dmg"

STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/clipstack-dmg.XXXXXX")"
cleanup() {
  rm -rf "${STAGING_DIR}"
}
trap cleanup EXIT

mkdir -p "${OUTPUT_DIR}" "${LATEST_DIR}"
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
cp -f "${DMG_PATH}" "${LATEST_DMG_PATH}"
echo "Updated latest DMG: ${LATEST_DMG_PATH}"
