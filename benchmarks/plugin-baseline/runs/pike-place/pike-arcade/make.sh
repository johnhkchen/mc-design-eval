#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which is moved into place only if the build succeeds.
set -e
cd "$(dirname "$0")"
node build.mjs ./build.tmp.nbt
mv ./build.tmp.nbt build.nbt
