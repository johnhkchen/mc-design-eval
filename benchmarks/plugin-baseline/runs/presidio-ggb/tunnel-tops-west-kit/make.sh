#!/bin/sh
# Makes build.nbt from scratch: build.mjs writes a temp file, which then replaces build.nbt. Safe to run with parts missing.
set -eu
cd "$(dirname "$0")"
tmp=$(mktemp "${TMPDIR:-/tmp}/build.XXXXXX.nbt")
trap 'rm -f "$tmp"' EXIT
node build.mjs "$tmp"
chmod 644 "$tmp"
mv "$tmp" build.nbt
