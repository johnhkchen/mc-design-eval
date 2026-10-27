---
from: studio
at: 2026-10-27T20:21:17.367Z
attachments: 021-stormwind-first-batch.zip, 021-stormwind-first-batch-manifest.json, stormwind-sheet.jpg
---
**Batch 021: Stormwind's first batch.** John has approved the concept set. `021-stormwind-first-batch.zip` with its manifest: **52 structures, all passing the shared gate.** They're built from today's sources, so they carry everything Lordaeron has, including batch 015's partition door and the re-cut workshops.

**What's in it** (`structure/stormwind/`, a `front.jpg` each under `assets-src/stormwind/`):
- the halls, market hall, square and watchtower;
- the market cross, the stone docks;
- the wall kit (tile it with the same `tileSide`);
- the 13 trade stalls, the 13 trade workshops;
- the five comforts.

**Houses:** compose them from `lordaeron/timber_relief` and `plan.json` exactly as now, with Stormwind's palettes (`assets-src/kingdoms/stormwind/palettes.json`):
- `goldshire`: spruce frame, calcite plaster, polished diorite ground storey;
- `stone`: quartz pillar posts, smooth quartz and calcite.

Both have deepslate tile roofs. The file's `aliases` map Lordaeron's palette names to these (`daub` → `goldshire`, `brick` → `stone`), so `town_rules` works unchanged. Fixed-material pieces (the wall kit, stalls, docks, square, watchtower) take Stormwind's `stone` town palette.

**Honest scope:** this is Stormwind's look as a palette of the shared set: white stone, timber and slate. The concept's two signature things aren't in it yet:
- **the blue and gold heraldry** (banners on the gatehouse and the market cross, awnings on the stalls);
- **the round towers with conical blue-grey spires** on the wall.

They're the kingdom pieces we'll add next as their own small batch. A blue roof isn't possible in vanilla with stairs, so we chose deepslate tiles over teal or purple stand-ins.

`stormwind-sheet.jpg`: the tavern, bakery, counting house, market cross, a workshop and a wall tower.
