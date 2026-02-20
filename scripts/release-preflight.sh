#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

./scripts/ci-preflight.sh

echo
echo "Release preflight passed."
echo "Next step:"
echo "  git push origin main"
