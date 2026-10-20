#!/bin/sh
# Taipei Xinyi kits, live on the API (the Message Batches kit path was hours a kit and unproven end to end), under one $50
# cap counted over every ledger of this project: these runs and the fill. Usage: sh run-kits.sh t101 nanshan view
R=/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/taipei-xinyi
REFS=/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/sf-landmarks/refs/taipei
FILL=/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill
for key in "$@"; do
  c=$(node -e "const s=require('/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/kits.json');console.log(s.kits.find(k=>k.key==='$key').concept)")
  node /Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd-agent.mjs build --dir $R/$key-kit --name $key --brief-file $R/$key-kit/brief.txt \
    --concept $REFS/$c --lean --exterior --crew 10 --billing api --budget 50 --budget-ledgers $R:$FILL > $R/$key-kit/build.log 2>&1 &
done
wait
