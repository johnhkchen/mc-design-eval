#!/bin/sh
# Mont-Saint-Michel, hybrid mode, under one $40 cap (kit ledgers + fill ledgers):
#   the abbey kit: Opus and Sonnet sessions through the Message Batches API (--batch-models), Haiku live on the API key
#   the fill: every other building (the village, towers, gates) in batched Haiku lockstep rounds (fill.mjs --batch)
cd /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel
LEDGERS=/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel:/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill
node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd-agent.mjs build --dir /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel/abbey-kit --name abbey --brief-file /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel/abbey-kit/brief.txt \
  --concept /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/sf-landmarks/refs/mont-saint-michel/concept-abbey.jpg --lean --exterior \
  --billing api --budget 40 --batch-models opus,sonnet --batch-pool /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel/batch-pool --budget-ledgers $LEDGERS > /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel/abbey-kit/build.log 2>&1 &
( cd /Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy && MCD_BUDGET_USD=40 MCD_BUDGET_LEDGERS=$LEDGERS node bin/fill.mjs fr/mont-saint-michel --batch --roofs --model haiku --jobs 8 \
  --only "$(cat work/fr/mont-saint-michel/fill-ids.txt)" > /Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/mont-saint-michel/fill.log 2>&1 ) &
wait
