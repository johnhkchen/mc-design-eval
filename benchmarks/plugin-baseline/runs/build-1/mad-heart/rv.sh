#!/bin/zsh
# usage: rv.sh file.nbt outdir [dist]  -> custom exterior views of the heart (world coords: x = 29 - u)
export MCD_TILE_SCALE=${MCD_TILE_SCALE:-3}; f=$1; o=$2; d=${3:-26}; mkdir -p $o
node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs render $f --front n --out $o/sheet.png --tiles $o \
 --view "front:14.5,17,-$d->14.5,17,13" \
 --view "fl:$((-d/2)),24,-$d->14.5,16,13" \
 --view "fr:$((29+d/2)),24,-$d->14.5,16,13" \
 --view "back:14.5,20,$((26+d))->14.5,17,13" \
 --view "left:-$d,17,13->14.5,17,13" \
 --view "right:$((29+d)),17,13->14.5,17,13" >/dev/null 2>&1
ls $o | tr '\n' ' '
