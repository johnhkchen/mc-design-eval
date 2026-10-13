#!/bin/sh
# Makes build.nbt from scratch: builds to a temp file in this directory, then moves it into place.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
