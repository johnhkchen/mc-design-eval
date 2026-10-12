#!/bin/sh
# Makes build.nbt from scratch: build to a temp file, run the main roof preset once the shell exists, then move into place.
set -eu
cd "$(dirname "$0")"
MCD="/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
TMP="build.next.nbt"

rm -f "$TMP"
node build.mjs "$TMP"

# the main roof preset (plan.md ROOFS) runs only once the shell is built, not while parts/shell.mjs is a stub
if [ -f parts/shell.mjs ] && ! grep -q STUB parts/shell.mjs; then
  if [ ! -f roof.json ]; then echo "make.sh: roof.json missing (the Roofs part writes it)" >&2; exit 1; fi
  node "$MCD" roof "$TMP" --spec roof.json --dry-run
  node "$MCD" roof "$TMP" "$TMP.roof.nbt" --spec roof.json
  mv "$TMP.roof.nbt" "$TMP"
fi

mv "$TMP" build.nbt
echo "make.sh: wrote build.nbt"
