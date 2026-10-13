#!/bin/sh
# Make build.nbt from scratch: build to a temp file, then move it into place, so a failed build leaves the old one.
set -e
cd "$(dirname "$0")"
tmp="build.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
