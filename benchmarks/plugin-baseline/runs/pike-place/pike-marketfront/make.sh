#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which replaces build.nbt in one move.
set -eu
cd "$(dirname "$0")"
TMP=$(mktemp ./.build.XXXXXX)
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
chmod 644 "$TMP"
mv "$TMP" build.nbt
