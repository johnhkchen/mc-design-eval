#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, moved into place only when the build succeeds.
set -euo pipefail
cd "$(dirname "$0")"
tmp=".build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
echo "wrote build.nbt"
