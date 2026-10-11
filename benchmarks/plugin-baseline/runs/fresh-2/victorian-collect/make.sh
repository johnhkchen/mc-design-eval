#!/bin/zsh
# Rebuild the whole house: form -> mansard -> turret top -> turret cap -> detail -> build.nbt
set -e
mcd() { node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs "$@"; }
cd "$(dirname "$0")"
node build.mjs
mcd roof form.nbt roofed.nbt --preset townhouse --front north --overhang 1 --spec roof.json | tail -1
node turret-top.mjs
mcd roof turret.nbt --preset tower-cap --footprint 4,4,10,10 --y 23 --material copper --dry-run | tail -2
node turret-cap.mjs
[ -f detail.mjs ] && node detail.mjs || cp cap.nbt build.nbt
# Stage 4 (AGE): mossy / worn variants on the stone, after detail (detail.mjs saves build.nbt; keep its pre-age copy)
cp build.nbt pre-age.nbt
node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs paint pre-age.nbt build.nbt --rules age.rules --face north,south,east,west,roof | tail -2
