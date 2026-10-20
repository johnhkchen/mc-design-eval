#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, and it replaces build.nbt only once the build has finished.
set -e
cd "$(dirname "$0")"
tmp=build.nbt.tmp
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
