#!/bin/sh
# Makes build.nbt from scratch: every part in plan order into a temp file, then moved into place.
# The roofs are built inside the parts (parts/roofs.mjs, via vocab.roofPiece), so there is no separate roof step.
set -eu
cd "$(dirname "$0")"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
node build.mjs "$tmpdir/build.nbt"
mv "$tmpdir/build.nbt" build.nbt
echo "build.nbt written"
