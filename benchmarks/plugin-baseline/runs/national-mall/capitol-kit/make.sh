#!/bin/sh
# Makes build.nbt from scratch: build.mjs into a temp file, then moved into place. Runs from any directory.
set -eu
cd "$(dirname "$0")"
tmp="$(mktemp ./build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
