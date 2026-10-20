#!/bin/sh
# Makes build.nbt from scratch: build to a temp file, then move it into place. Parts still being written don't fail it.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
echo "build.nbt written"
