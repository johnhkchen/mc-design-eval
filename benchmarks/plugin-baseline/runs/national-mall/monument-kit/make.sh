#!/bin/sh
# Makes build.nbt from scratch: build to a temp file in this directory, then move it into place.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
