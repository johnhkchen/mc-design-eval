#!/usr/bin/env bash
# The ONE command that makes build.nbt from scratch: generator parts -> build.nbt.
# No roof preset step: plan.md builds the main roof by hand (no preset fits its pitch), so the parts make the whole house.
set -euo pipefail
cd "$(dirname "$0")"
MCD="node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs"
node build.mjs build.tmp.nbt
mv build.tmp.nbt build.nbt
$MCD info build.nbt | head -8
