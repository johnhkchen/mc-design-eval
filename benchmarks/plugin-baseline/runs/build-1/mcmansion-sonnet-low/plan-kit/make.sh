#!/bin/sh
# make.sh: makes build.nbt from scratch. Runs build.mjs to a temp file; once the shell exists, tries the roof preset
# (dry run first; a refusal keeps the hand-built roofs); then moves the result into place.
set -eu
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
WORK=$(mktemp -d)
RAW="$WORK/raw.nbt"
OUT="$WORK/build.nbt"

node build.mjs "$RAW"

if grep -q STUB parts/shell.mjs; then
  echo "shell is still a stub: skipping the roof preset"
  cp "$RAW" "$OUT"
elif $MCD roof "$RAW" "$OUT" --preset cottage --material deepslate_tile --dry-run; then
  $MCD roof "$RAW" "$OUT" --preset cottage --material deepslate_tile
else
  echo "roof preset refused: keeping the hand-built roofs"
  cp "$RAW" "$OUT"
fi

mv "$OUT" build.nbt
rm -rf "$WORK"
echo "made build.nbt"
