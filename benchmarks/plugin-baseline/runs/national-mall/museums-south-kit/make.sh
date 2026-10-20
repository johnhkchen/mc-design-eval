#!/usr/bin/env bash
# The one command that makes build.nbt from scratch: build to a temp file, then move it into place.
set -euo pipefail
cd "$(dirname "$0")"
tmp="$(mktemp "${TMPDIR:-/tmp}/museums-south.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv -f "$tmp" build.nbt
echo "build.nbt written"
