#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once the build has succeeded.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./build-XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
