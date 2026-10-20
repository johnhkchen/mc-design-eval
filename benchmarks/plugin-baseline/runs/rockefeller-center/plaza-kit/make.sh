#!/usr/bin/env bash
# Makes build.nbt from scratch: build.mjs writes a temp file, which replaces build.nbt only once the build succeeds.
set -euo pipefail
cd "$(dirname "$0")"
tmp=".build.$$.nbt"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
