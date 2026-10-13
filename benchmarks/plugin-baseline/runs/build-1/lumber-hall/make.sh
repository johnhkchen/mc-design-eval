#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
cd "$(dirname "$0")" || exit 1
tmp=$(mktemp ./build.XXXXXX) || exit 1
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp" && mv -f "$tmp" build.nbt
