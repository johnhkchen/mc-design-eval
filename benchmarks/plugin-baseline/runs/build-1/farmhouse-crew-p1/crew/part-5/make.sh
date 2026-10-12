#!/usr/bin/env bash
# The ONE command that makes build.nbt from scratch: generator parts -> house roof (mcd roof, cottage preset) -> build.nbt.
set -euo pipefail
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
node build.mjs build.raw.nbt
# The roof step only makes sense once the shell exists (the stubs leave bare ground): look for the front door lintel wall.
if node --input-type=module -e '
  import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
  const g = load("build.raw.nbt"); process.exit(g.isAir(1, 7, 11) ? 1 : 0);'; then
  # cottage preset (house -> cottage): 45-degree pitch keeps the ridge at y=12; red-tile reads against the grey stone; 2x2 brick chimney at x=9..10,z=14..15
  $MCD roof build.raw.nbt --spec roof.json --dry-run
  $MCD roof build.raw.nbt build.tmp.nbt --spec roof.json
  mv build.tmp.nbt build.nbt
else
  echo "no house shell yet: skipping the roof step (bare ground)"
  cp build.raw.nbt build.nbt
fi
$MCD info build.nbt | head -8
