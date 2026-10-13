#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only if the build succeeded.
set -eu
cd "$(dirname "$0")"
tmp="build.tmp.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
