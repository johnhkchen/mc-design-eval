#!/bin/sh
# Makes build.nbt from scratch: build.mjs to a temp file, then the roof preset check once the shell exists, then mv.
set -eu
cd "$(dirname "$0")"
MCD=/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs
tmp=build.tmp.nbt
trap 'rm -f "$tmp"' EXIT

node build.mjs "$tmp"

# The roofs are built in node by roofSpec (parts/roofs.mjs), so this preset step is a dry-run report only (it writes
# nothing); running it for real would put a second roof over the first.
if grep -q '^// STUB' parts/main-shell.mjs; then
  echo "roof step skipped: the shell is still a stub"
else
  node "$MCD" roof "$tmp" --preset cottage --style hip --material dark-slate --dry-run
fi

mv "$tmp" build.nbt
echo "wrote build.nbt"
