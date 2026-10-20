#!/bin/sh
# Makes build.nbt from scratch: build to a temp file in this directory, then move it into place (so a failed run
# never leaves a half-written build.nbt). Runs the same in every part copy; the stubs or unfinished parts never fail it.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp ./build.tmp.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
trap - EXIT
