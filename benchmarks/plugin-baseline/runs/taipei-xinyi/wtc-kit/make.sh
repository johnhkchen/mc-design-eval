#!/bin/sh
# Makes build.nbt from scratch: node build.mjs writes a temp file, which is moved into place only when it succeeded.
set -eu
cd "$(dirname "$0")"
tmp="build.$$.tmp.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
