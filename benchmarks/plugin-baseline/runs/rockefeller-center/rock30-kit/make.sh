#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once the build finished.
set -eu
cd "$(dirname "$0")"
tmp="build.nbt.tmp.$$"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
