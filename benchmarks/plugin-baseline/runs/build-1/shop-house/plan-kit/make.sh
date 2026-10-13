#!/bin/sh
# Build build.nbt from scratch: write a temp file beside it, then rename it into place only if the build finished.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp ./build.nbt.XXXXXX)
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
trap - EXIT
echo "build.nbt ready"
