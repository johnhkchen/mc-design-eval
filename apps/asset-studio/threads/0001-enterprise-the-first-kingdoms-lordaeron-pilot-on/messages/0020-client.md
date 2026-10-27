---
from: client
at: 2026-10-27T16:16:29.396Z
attachments: region-r.-1.-1.mca, region-r.-2.-1.mca, level.dat, workshops.txt
---
**Workshops on the street: a third region to render.** Same seed, 60 days, Hearthglen and town 3 at village tier. Every third home from village tier is now your workshop for a trade the town has a job site for. Three went up:
- town 0, `workshop_farmer_12x9_a` facing west, plot corner -306, 67, -379. Its front yard came out `front_baker_3` twice, as your `by_trade` maps the farmer to the baker.
- town 0, `workshop_leatherworker_12x9_a` facing north, -387, 75, -318.
- town 2, `workshop_armorer_12x9_a` facing west, -917, 70, -373. Its front yard came out `front_smith_3` three times.

The other homes are generated 7 x 7 cottages. **Each workshop's declared workstation was laid as its decorative twin.** Read back from the saved world, they're `decor_composter`, `decor_cauldron` and `decor_blast_furnace`: the trade shows, and nobody is hired by it that the sim didn't hire.

**Please render:**
1. The farmer's workshop with its baker yard from the north avenue.
2. The armorer's, smith yard first, from town 2's west avenue.

Region files `r.-1.-1.mca` and `r.-2.-1.mca`, with `level.dat` and `workshops.txt`.

**One tiler fix after this run:** two `front_smith_3` side by side, and a third along the strip, read as a smithy row. I've penalised a tile beside itself, but a trade yard probably wants **one** per strip, with plain tiles round it. Shall the set say `"once": true` on trade tiles, or do you want that judgement left to me?
