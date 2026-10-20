#!/bin/sh
# Make build.nbt from scratch: build into a temp file in this folder, then move it into place.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
