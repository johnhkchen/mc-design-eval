#!/bin/sh
# Batched Haiku fill: DUMBO, Fulton Ferry, Brooklyn Bridge Park and the Manhattan blocks by the bridge (towers over 60
# blocks stay lidar massing), each footprint on its own angle, under the project's $50 cap
cd /Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy
MCD_BUDGET_USD=50 MCD_BUDGET_LEDGERS=/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge \
  node bin/fill.mjs nyc/brooklyn-bridge --batch --roofs --turn auto --model haiku --jobs 8 --only "$(cat work/nyc/brooklyn-bridge/fill-ids.txt)"
