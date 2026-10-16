#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which must read back as a structure, then replaces build.nbt.
set -eu
cd "$(dirname "$0")"
MCD_JS=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
node "$MCD_JS" info "$tmp" > /dev/null
mv "$tmp" build.nbt
echo "build.nbt written"
