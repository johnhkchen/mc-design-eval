#!/bin/sh
# Makes build.nbt from scratch: the parts, then the roof preset once the shell is built, then into place.
set -eu
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
TMP=$(mktemp ./.build.XXXXXX)
trap 'rm -f "$TMP"' EXIT

node build.mjs "$TMP"

# The roof preset step waits for the shell: a stub file still carries its STUB line.
if grep -q '^// STUB' parts/shell.mjs; then
  echo "shell is still a stub: skipping the roof step"
else
  $MCD roof "$TMP" --dry-run --spec roof.json
  $MCD roof "$TMP" "$TMP.roof" --spec roof.json
  mv "$TMP.roof" "$TMP"
fi

chmod 644 "$TMP"
mv "$TMP" build.nbt
echo "wrote build.nbt"
