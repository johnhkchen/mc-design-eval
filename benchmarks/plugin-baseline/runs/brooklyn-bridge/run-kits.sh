#!/bin/sh
# The four Brooklyn Bridge kits through the Message Batches API, all at once on one batch pool, under one $50 cap
cd /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge
for k in bb:concept-bridge mb:concept-manhattan clock:concept-clock empire:concept-empire; do
  key=${k%%:*}; c=${k#*:}
  node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd-agent.mjs build --dir /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge/$key-kit --name $key --brief-file /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge/$key-kit/brief.txt \
    --concept /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/sf-landmarks/refs/brooklyn-bridge/$c.jpg --lean --exterior --billing api --budget 50 --batch --batch-pool /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge/batch-pool \
    --budget-ledgers /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge:/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill > /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/brooklyn-bridge/$key-kit/build.log 2>&1 &
done
wait
