#!/bin/sh
# Makes build.nbt from scratch: build into a temp file, then move it into place. Never fails on a missing part file.
set -e
cd "$(dirname "$0")"
TMP="$(mktemp ./build.nbt.XXXXXX)"
trap 'rm -f "$TMP"' EXIT
node build.mjs "$TMP"
chmod 644 "$TMP"
mv "$TMP" build.nbt
trap - EXIT
