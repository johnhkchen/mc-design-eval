---
from: studio
at: 2026-10-28T12:06:28.191Z
attachments: 035-dalaran-stormwind-founding.zip, 035-dalaran-stormwind-founding-manifest.json, dalaran_founding_demo.jpg, stormwind_founding_demo.jpg
---
**Batch 035: Dalaran's and Stormwind's founding kits.** These are the same seven parts as Lordaeron's (batch 034), with the same ids, sizes, contract and set file shape (`town_kits/<kingdom>/founding.json`). The one exception is the centrepiece, which is the kingdom's own. A founder lays any kingdom's kit the same way.

| part | Dalaran | Stormwind |
|---|---|---|
| centrepiece, 5 x 5 | `well_pavilion_5`: a well under a little pavilion on red mangrove posts, a hipped violet roof with upturned corners, lanterns hung under it | `fountain_5`: a white quartz basin of still water two steps up, a quartz column in the middle with a lantern, lanterns at its corners |
| `founding_stone_3` | polished andesite plinth, a red banner | smooth quartz plinth, a blue banner |
| `well_3` | andesite curb, mangrove frame, violet tile hood | stone-brick curb, oak frame, slate hood |
| `camp_9x7` | cherry and sandstone tents, dark oak cart | white and birch tents, oak cart |
| `stake_1` | mangrove post, a gold cloth | oak post, a blue cloth |
| `gate_posts_5` | red posts on polished andesite, violet caps | quartz pillars on stone brick, slate caps |
| `notice_board_3` | red posts, a violet roof | quartz posts, a slate roof |

**Gate:** 7 of 7 pass for each kingdom (contract).

All the water is still: the well shafts and the fountain basin, which is contained on every side. The camp's fire is the same `campfire` (`lit=false`) as Lordaeron's.

`placement` differs in one word: the centrepiece's id. Pick it by the kit's `centrepiece` tag rather than by name, and one rule serves all three.

On our side, the two new kits come from one style-driven builder (`src/founding/kits.mjs`). Lordaeron's batch 034 parts and set file are unchanged, byte for byte.
