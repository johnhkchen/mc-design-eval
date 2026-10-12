#!/bin/sh
# Makes build.nbt from scratch: build.mjs into a temp dir, then the roof preset step once the shell is real (dry-run
# first, the real run only if the dry-run is clean), then into place. Skips the roof step while parts/shell.mjs is a stub.
set -eu
cd "$(dirname "$0")"
MCD=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

node build.mjs "$TMP/build.nbt"

if grep -q STUB parts/shell.mjs; then
  echo "shell is still a stub: roof step skipped"
else
  # R-main (plan.md Roofs). Preset civic with the plan's overrides; R-turret cone is added after this, by the roofs worker.
  ROOF_FLAGS="--preset civic --front n --overhang 1 --material slate --eave cornice --trim smooth_quartz --ridge slab --pediment n --dormers 2:s:gable --keep 1,10,6,8,30,11 --keep 0,0,19,1,30,24"
  node "$MCD" roof "$TMP/build.nbt" "$TMP/roofed.nbt" $ROOF_FLAGS --dry-run
  node "$MCD" roof "$TMP/build.nbt" "$TMP/roofed.nbt" $ROOF_FLAGS
  mv "$TMP/roofed.nbt" "$TMP/build.nbt"
fi

mv "$TMP/build.nbt" build.nbt
echo "wrote build.nbt"
