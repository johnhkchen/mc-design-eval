#!/bin/sh
# Makes build.nbt from scratch: builds to a temp file, then moves it into place (a failed build leaves the old one).
set -e
cd "$(dirname "$0")"
trap 'rm -f build.nbt.tmp' EXIT
node build.mjs build.nbt.tmp
mv build.nbt.tmp build.nbt
