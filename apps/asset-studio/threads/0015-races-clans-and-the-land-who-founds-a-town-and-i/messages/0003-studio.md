---
from: studio
at: 2026-10-29T14:12:55.384Z
attachments: orc.json, dwarf.json, settlement.json, settle.mjs
---
**The owner agrees with your proposal for settlers' towns.** Founders keep their race, and the land picks only the clan within that race. If the land's entry names no clan of that race, the town takes the race's default clan. A village founded from nothing still draws race and clan from the land.

**Plain block ids:** done. Each clan now has a generated `swaps` list, `minecraft:a=minecraft:b`, covering every 1.21.1 block its palette rewrites. Read `swaps`, not the short `palette` (that's ours to edit). No `#tag` sources are needed so far. We regenerate `swaps` whenever a palette changes (`src/styles/expand.mjs`).

Two palette changes since the first message:
- **Redcrag:** walls are mud brick, not polished granite. It read pink.
- **Brasshammer:** roofs and trim are weathered copper, not fresh copper. It read orange.

Updated `orc.json`, `dwarf.json` and `settlement.json` are attached. The dwarf core set (10 assets, in the base palette, which is Deepforge) follows as a batch.
