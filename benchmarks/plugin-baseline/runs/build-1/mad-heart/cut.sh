#!/bin/zsh
# usage: cut.sh file.nbt outdir cutY  -> cutaway render
f=$1; o=$2; y=$3; mkdir -p $o
node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs render $f --front n --cut $y --out $o/sheet.png --tiles $o >/dev/null 2>&1
ls $o | tr '\n' ' '
