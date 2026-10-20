#!/bin/sh
# Makes build.nbt from scratch: node build.mjs into a temp file in this directory, then mv it into place.
# No roof step here: runParts lays the roof (roof.json, when it exists) inside build.mjs.
set -eu
cd "$(dirname "$0")"
TMP="$(mktemp ./.build.XXXXXX)"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
chmod 644 "$TMP"
mv -f "$TMP" build.nbt
