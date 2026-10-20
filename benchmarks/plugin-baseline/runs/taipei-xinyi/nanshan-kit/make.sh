#!/usr/bin/env bash
# Makes build.nbt from scratch: node build.mjs writes a temp file, which then moves into place.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv "$tmp" build.nbt
