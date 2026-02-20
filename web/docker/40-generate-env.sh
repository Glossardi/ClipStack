#!/bin/sh
set -eu

js_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g"
}

SITE_URL="${CLIPSTACK_SITE_URL:-https://clipstack.click}"
GITHUB_REPO="${CLIPSTACK_GITHUB_REPO:-Glossardi/ClipStack}"
GITHUB_PROJECT_URL="${CLIPSTACK_GITHUB_PROJECT_URL:-https://github.com/${GITHUB_REPO}}"
UMAMI_SCRIPT_URL="${CLIPSTACK_UMAMI_SCRIPT_URL:-https://analytics.glossardi.de/script.js}"
UMAMI_WEBSITE_ID="${CLIPSTACK_UMAMI_WEBSITE_ID:-c230ce3d-9704-46bc-9e3d-ae3bb1f35633}"

cat > /usr/share/nginx/html/env.js <<EOF_JS
window.__CLIPSTACK_CONFIG__ = {
  siteUrl: '$(js_escape "$SITE_URL")',
  githubRepo: '$(js_escape "$GITHUB_REPO")',
  githubProjectUrl: '$(js_escape "$GITHUB_PROJECT_URL")',
  umamiScriptUrl: '$(js_escape "$UMAMI_SCRIPT_URL")',
  umamiWebsiteId: '$(js_escape "$UMAMI_WEBSITE_ID")'
};
EOF_JS
