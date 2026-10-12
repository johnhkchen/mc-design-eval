#!/bin/sh
# The one command that makes build.nbt from scratch: the parts, then the roof check, then into place.
set -eu
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
TMP="${TMPDIR:-/tmp}/villa-build.$$.nbt"          # .nbt: the toolkit picks the format by extension
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"

# the roof step (plan.md ROOFS): dry run first; skipped while the shell is still a stub (no walls to roof)
if grep -q '^// STUB' parts/shell.mjs; then
  echo "roof: skipped (shell is still a stub)"
else
  $MCD roof "$TMP" --dry-run --style shed
fi

mv "$TMP" build.nbt
$MCD info build.nbt
