#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which moves into place only when the build finished.
set -eu
cd "$(dirname "$0")"
TMP="build.$$.tmp.nbt"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
mv "$TMP" build.nbt
