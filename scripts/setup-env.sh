#!/usr/bin/env bash
# Prompts for your Supabase credentials and writes .env.
# Values are read straight from your terminal into the file — they are never
# echoed, never logged, and never leave this machine.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  read -r -p ".env already exists. Overwrite? [y/N] " ok
  [[ "$ok" =~ ^[Yy]$ ]] || { echo "Left .env alone."; exit 0; }
fi

echo "From Supabase: Project Settings -> API Keys"
echo
read -r  -p "Project URL (https://xxxxx.supabase.co): " URL
read -rs -p "anon / publishable key: "        ANON; echo
read -rs -p "service_role / secret key: "     SVC;  echo

[ -n "$URL" ] && [ -n "$ANON" ] && [ -n "$SVC" ] || { echo "All three are required."; exit 1; }
[[ "$URL" == https://*.supabase.co* ]] || echo "warning: URL doesn't look like a Supabase project URL"

umask 077
cat > .env <<ENVFILE
SUPABASE_URL=$URL
SUPABASE_ANON_KEY=$ANON
SUPABASE_SERVICE_ROLE_KEY=$SVC
ENVFILE
chmod 600 .env

echo
echo "Wrote .env (permissions 600, owner-only)."
git check-ignore -q .env && echo "Confirmed: .env is gitignored." \
                         || echo "WARNING: .env is NOT gitignored. Stop and fix that."
echo
echo "Next:  set -a && source .env && set +a && npm run seed"
