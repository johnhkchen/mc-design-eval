#!/bin/sh
cd "$(dirname "$0")"; rm -rf tiles; mkdir -p tiles
MCD_TILE_SCALE=2 node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs render ${1:-build.nbt} --front n --closeups --tiles tiles --out sheet.png >/dev/null 2>&1; ls tiles | head -40
