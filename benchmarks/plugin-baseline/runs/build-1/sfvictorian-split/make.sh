#!/bin/sh
# Makes build.nbt from scratch: the parts, then the roof preset (once the shell is built), then move into place.
set -eu
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
RAW="$TMP_DIR/raw.nbt"
ROOFED="$TMP_DIR/roofed.nbt"

node build.mjs "$RAW"

# plan.md: flat deck over x0..15, z7..30 at y=17 (the front false front is built by hand in parts/front and roofs)
if grep -q "STUB" parts/shell.mjs; then
  echo "# shell is still a stub: skipping the roof preset"
  cp "$RAW" "$ROOFED"
else
  $MCD roof "$RAW" --style flat-parapet --footprint 0,7,15,30 --y 17 --dry-run
  $MCD roof "$RAW" "$ROOFED" --style flat-parapet --footprint 0,7,15,30 --y 17
fi

mv "$ROOFED" build.nbt
echo "# wrote $(pwd)/build.nbt"
