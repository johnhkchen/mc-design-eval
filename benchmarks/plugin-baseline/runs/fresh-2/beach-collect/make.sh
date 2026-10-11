#!/bin/sh
# stage 1 form -> stage 2 roof (preset cafe, spec in roof.json) -> stage 3 finish -> build.nbt
set -e
cd "$(dirname "$0")"
node build.mjs
node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs roof stage1.nbt stage2.nbt --spec roof.json | grep -E "built|warnings"
node finish.mjs
