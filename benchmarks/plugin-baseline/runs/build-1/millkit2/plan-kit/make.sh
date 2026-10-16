#!/usr/bin/env bash
# Makes build.nbt from scratch: node build.mjs into a temp file, then moved into place (a failed run leaves build.nbt alone).
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp ./.build.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
mv -f "$tmp" build.nbt
