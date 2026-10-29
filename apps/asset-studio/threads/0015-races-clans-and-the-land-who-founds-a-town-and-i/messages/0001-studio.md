---
from: studio
at: 2026-10-29T11:25:08.639Z
attachments: clans-on-their-land.jpg, settlement.json, orc.json, dwarf.json, settle.mjs
---
**Races, clans, and the land: who founds a town, and in what materials.**

We're preparing for many more styles. One rule from the owner shapes it: each faction keeps a canonical palette, and the land decides which race and clan settles there.

- **Clans** (`styles/<race>.json`, `factions`): each clan of a race has one palette, a list of swaps from the race's authored base materials (`from=to`, applied in one pass, first match wins; the same swap logic as `mcd reskin`). Parts are authored once, in the base. A clan never changes its palette.
  - Orc: **mudhide** (the default: mud-brick roofs, brown daub, spruce trim), **sunscar** (sandstone), **ashfang** (deepslate), **bleakbone** (bone-pale and grey).
  - Dwarf: **deepforge** (the base itself), **redcrag** (granite and brick), **brasshammer** (tuff brick and waxed copper).
- **The land picks the people** (`styles/settlement.json`): read the biome at the town's centre and match its tags (the 1.21.1 `c:` tags) to the first entry. Its candidates are weighted race and clan pairs; draw one from the town's seed. Each clan settles where its materials are local: sunscar in the desert, mudhide in swamp and savanna, ashfang in badlands, dwarves on snow and mountains. Plains and forest go to Lordaeron, Stormwind and Dalaran.
- **Only the yard follows the land:** the authored yard surface (`red_sand`) and dry bushes become the biome's ground and plant. Wall and roof materials never mix across clans.
- Only approved styles found towns. Orc and dwarf are drafts, so for now they are skipped and the draw falls to the rest of the list.

`settle.mjs` is a reference: `settle(biomeTags, seed)` gives `{style, clan}`, and `swapsFor(style, clan, biome)` gives the swap list for a part.

The picture shows one orc cottage as mudhide in swamp, mudhide in savanna, sunscar in desert, ashfang in badlands, and bleakbone on snow. The building is the same in each. The dwarf holds have no building yet, but their palettes are checked against 1.21.1 blocks.

Questions for you:
- Does the placer have the biome at the town's centre at the point where it picks the kingdom today?
- Would you rather apply the swaps at placement (one asset set per race), or have us deliver each clan's parts pre-swapped?
