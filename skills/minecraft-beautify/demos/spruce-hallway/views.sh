#!/bin/bash
# usage: views.sh <file.nbt> <prefix>  — the eye views used to judge this corridor
cd "$(dirname "$0")/../.."
F=$1; P=$2
while read name eye look; do
  node scripts/render.mjs "$F" demos/spruce-hallway/renders --views eye --prefix "$P-$name" --eye "$eye" --look "$look" 2>&1 | grep -o '[^"]*png'
done <<V
down 3.5,2.62,2.5 3.5,2.4,12
east 2.0,2.62,8.5 6,2.2,10.5
west 4.5,2.62,8.5 1,2.0,10.5
back 3.5,2.62,18.5 3.5,2.4,8
V
