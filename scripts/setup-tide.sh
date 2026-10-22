#!/usr/bin/env bash
set -euo pipefail
# Fetch the official Tide template, NEVER reinvent auth/DPoP/bootstrap.
# This script does not create a realm, take license email, or agree to terms.
cd "$(dirname "$0")/.."
if [ -e app/package.json ]; then
  echo "app/ already exists; refusing to overwrite existing Tide setup."
  exit 1
fi
command -v curl >/dev/null || { echo 'curl is required' >&2; exit 1; }
command -v tar >/dev/null || { echo 'tar is required' >&2; exit 1; }
mkdir -p .tide-pack
curl -fsSL 'https://mcp.tide.org/pack/templates.tgz' | tar -xz -C .tide-pack
TEMPLATE='.tide-pack/templates/nextjs-customer-portal'
[ -f "$TEMPLATE/package.json" ] || { echo 'Official template missing' >&2; exit 1; }
mkdir -p app
cp -R "$TEMPLATE/." 'app/'
node -e 'const fs=require("fs");const p="app/package.json";let j=JSON.parse(fs.readFileSync(p));j.name="dual-control-desk";fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n")'
cp -R tide-overlay/src/. app/src/
cp core/engine.mjs app/src/lib/expense/engine.mjs
printf '\nTide Next.js app created at ./app using OFFICIAL template + project overlay.\n'
printf 'Do not run npm run init until YOU provide licence email and personally accept https://tide.org/legal.\n'
printf 'See docs/TIDE_SETUP_VI.md; start with cd app && npm install.\n'
