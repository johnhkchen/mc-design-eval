#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once it is complete.
set -e
cd "$(dirname "$0")"
TMP="build.$$.tmp.nbt"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
mv "$TMP" build.nbt
