#!/usr/bin/env bash
# v2 = v1.nbt + tower-v2.mjs (tower boxes only); written to a temp file, moved into place on success.
set -euo pipefail
cd "$(dirname "$0")"
tmp=".v2.$$.tmp.nbt"; trap 'rm -f "$tmp"' EXIT
node tower-v2.mjs "$tmp" && mv -f "$tmp" build.nbt && echo "wrote build.nbt"
