#!/bin/sh
# Makes build.nbt from scratch: node build.mjs into a temp file, then mv into place.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build-tmp.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
