#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only when the build succeeds.
set -eu
cd "$(dirname "$0")"
tmp="build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
