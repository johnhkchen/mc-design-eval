#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: node build.mjs writes every part in plan order to a temp file,
# the temp file must read back as a structure, then it moves into place. Stubs yield the bare ground plus the roof.
set -euo pipefail
cd "$(dirname "$0")"

MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
TMP=build.tmp.nbt
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"
node "$MCD_JS" info "$TMP" > /dev/null
mv "$TMP" build.nbt
echo "build.nbt written"
