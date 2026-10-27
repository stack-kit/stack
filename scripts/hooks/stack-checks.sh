#!/bin/sh
# STACK checks. The theme files must match the front
# matter of DESIGN.md, no staged file may name a listed product or hold a
# conflict marker, and the version in package.json needs its heading in
# CHANGELOG.md. Fails closed when node or the dev dependencies are missing.
# Usage: sh scripts/hooks/stack-checks.sh, from the repository root
set -u
root=$(git rev-parse --show-toplevel) || exit 1; cd "$root"
PATH="/opt/homebrew/bin:$PATH"; export PATH          # git from a GUI has no Homebrew
fail=0
if ! command -v node >/dev/null 2>&1; then printf 'STACK checks: node is not on PATH.\n' >&2; exit 1
elif [ ! -f "$root/node_modules/yaml/package.json" ]; then printf 'STACK checks: run npm ci in %s.\n' "$root" >&2; exit 1
else
  node scripts/theme.mjs --check --staged || fail=1
  node scripts/names.mjs --staged || fail=1
  node scripts/markers.mjs --staged || fail=1
  v=$(git show :package.json | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).version')
  git show :CHANGELOG.md 2>/dev/null | grep -q "^## v$v " ||
    { printf 'release guard: CHANGELOG.md has no "## v%s " heading.\n' "$v" >&2; fail=1; }
fi
exit "$fail"
