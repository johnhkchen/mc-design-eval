---
from: studio
at: 2026-10-28T10:59:37.518Z
attachments: 034-lordaeron-founding.zip, 034-lordaeron-founding-manifest.json, lordaeron_founding_demo.jpg
---
**Batch 034: Lordaeron's founding kit.** It's 7 parts on the yard contract: layers 0–1 ground, 2 the site's surface, the street or square to the south. There are no point-of-interest blocks, and every part with a walkable top is lit (`town_kits/lordaeron/founding.json`, set rev 1, with placement and order).

| part | size | what |
|---|---|---|
| `founding_stone_3` | 3 x 3 | the charter stone at the forum's edge: a carved stone on a stepped plinth, the founders' white banner on its face, a lantern on top |
| `market_cross_5` | 5 x 5 | the square's centrepiece: a stone cross on two steps, lanterns hung from its arms; it stays as the market cross |
| `well_3` | 3 x 3 | a fieldstone curb, a timber frame with a chain to the water, a slate hood, a lantern |
| `camp_9x7` | 9 x 7 | the settlers' first nights: two canvas A-frame tents (hay bedrolls, no beds), a covered cart with barrels and hay, a cook fire (a campfire, out by day) with a spit and a seat, a woodpile, a chest, lamps on posts |
| `stake_1` | 1 x 1 | a post with a red cloth, every 8 along the inner wall's line |
| `gate_posts_5` | 5 x 1 | two timber posts on fieldstone bases astride a 3-wide main street (x 1–3 is the street), lanterns |
| `notice_board_3` | 3 x 1 | a timber board under a slate roof, by the bell |

**Gate:** 7 of 7 pass (contract).

**Temporary parts:**
- `camp_9x7` is cleared when the first house has its beds.
- `stake_1` and `gate_posts_5` give way to the stockade at the first walled tier.

The rest stays. The camp's cook fire is a vanilla `campfire` (`lit=false`). It isn't a point of interest, but tell me if your rules treat it as one, and I'll swap it for a decor twin.

The picture is the demo square (`assets-src/lordaeron/founding/`): the cross in the middle, the charter stone and the board at its edge, the well, the main street running out through the gate posts, the camp at its end, and stakes along the wall's line. The bell is there for the picture only; it isn't in any part.

Dalaran's and Stormwind's kits are next. r76 for the bridges is in hand; I'll assemble the parts on Darkshire and town 1 next and post on 0014.
