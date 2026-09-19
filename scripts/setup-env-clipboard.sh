#!/usr/bin/env bash
# Reads your Supabase keys from the macOS clipboard instead of a hidden prompt,
# so there is no invisible-paste guesswork. Keys go clipboard -> .env directly.
set -euo pipefail
cd "$(dirname "$0")/.."

URL="https://qwveafgvylzqudqbiacj.supabase.co"

# Identify a key without printing it. Legacy keys are JWTs with a role claim;
# the newer format is self-describing in its prefix.
identify() {
  case "$1" in
    sb_publishable_*) echo anon; return;;
    sb_secret_*)      echo service_role; return;;
  esac
  local payload role
  payload=$(printf '%s' "$1" | cut -d. -f2 | tr '_-' '/+')
  while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="${payload}="; done
  role=$(printf '%s' "$payload" | base64 -d 2>/dev/null \
         | sed -n 's/.*"role":"\([a-z_]*\)".*/\1/p')
  echo "${role:-unknown}"
}

mask() { printf '%s…%s (%d chars)' "${1:0:8}" "${1: -4}" "${#1}"; }

grab() {                       # grab <expected-role> <label>
  local want="$1" label="$2" key role
  while :; do
    read -r -p "Copy your ${label} key to the clipboard, then press Enter: " _
    key=$(pbpaste | tr -d '[:space:]')
    if [ -z "$key" ]; then echo "  Clipboard is empty. Try again."; continue; fi
    role=$(identify "$key")
    if [ "$role" != "$want" ]; then
      echo "  That looks like a '${role}' key, not '${want}'. $(mask "$key")"
      read -r -p "  Use it anyway? [y/N] " ok
      [[ "$ok" =~ ^[Yy]$ ]] || continue
    else
      echo "  Got it — ${role}: $(mask "$key")"
    fi
    printf '%s' "$key"; return
  done
}

echo "Supabase project: $URL"
echo "Keys live in: Project Settings -> API Keys"
echo
ANON=$(grab anon "anon / publishable")
echo
SVC=$(grab service_role "service_role / secret")

if [ "$ANON" = "$SVC" ]; then
  echo; echo "Both keys are identical — you copied the same one twice. Start over."; exit 1
fi

umask 077
printf 'SUPABASE_URL=%s\nSUPABASE_ANON_KEY=%s\nSUPABASE_SERVICE_ROLE_KEY=%s\n' \
  "$URL" "$ANON" "$SVC" > .env
chmod 600 .env

echo
echo "Wrote .env (owner-only)."
git check-ignore -q .env && echo "Confirmed: .env is gitignored." \
                         || echo "WARNING: .env is NOT gitignored."
