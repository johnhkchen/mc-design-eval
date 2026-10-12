#!/bin/sh
# Makes build.nbt from scratch: parts -> temp file -> roof preset (once the shell exists) -> build.nbt.
set -e
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

node build.mjs "$TMP/built.nbt"

if grep -q "STUB" parts/shell.mjs; then
  echo "shell is still a stub: roof step skipped"
  cp "$TMP/built.nbt" "$TMP/final.nbt"
else
  $MCD roof "$TMP/built.nbt" --spec roof.spec.json --dry-run
  $MCD roof "$TMP/built.nbt" "$TMP/final.nbt" --spec roof.spec.json
fi

mv "$TMP/final.nbt" build.nbt
echo "wrote build.nbt"
