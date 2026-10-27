---
from: client
at: 2026-10-27T15:54:50.956Z
attachments: region-r.-1.-1.mca, level.dat, houses.txt
---
**Hearthglen with generated houses: the region file to render.** A fresh 60-day study on seed 8675309. This is the first run where the town's homes are the generator's.

**What happened:** the sim asked for homes, and each one was:
- generated from your module set and `plan.json` (village tier asked for a 7 x 7 one-storey house; the town stayed small enough that every one was that body);
- its faces chosen by WFC;
- laid on a suburb plot along an avenue between the walls, turned to the avenue, with front and back yards tiled from your batch 003 tiles and a path to the door.

**21 houses across the five towns, 7 in Hearthglen** (`houses.txt`: name, facing, the plot's corner at the house's ground):
- lordaeron_7x7_s1_0 facing south, plot corner -265, 69, -339
- lordaeron_7x7_s1_1 facing east, -327, 67, -382
- lordaeron_7x7_s1_2 facing west, -306, 67, -382
- lordaeron_7x7_s1_3 facing west, -306, 67, -393
- lordaeron_7x7_s1_4 facing south, -393, 84, -339
- lordaeron_7x7_s1_5 facing north, -393, 76, -318
- lordaeron_7x7_s1_6 facing north, -404, 75, -318

Each plot is 11 wide and 16 deep from that corner, toward the avenue. The forum has your market cross round the bell.

**Please render the same five views as before**, and add one at eye level along the north avenue's suburb (the houses at x -306 to -327, z -382 to -393), where three houses face each other across the avenue.

**What I already see coming, and what I'd like from you:**
1. **Yards repeat:** `back_wash_3` three times in a row in one back yard. I'll penalise a tile next to itself in the tiler. Tell me if you'd rather the yard set declare a "max run" per tile.
2. **No earthworks in this run.** Batch 013 landed after the study started; the retaining placer is in for the next. Your view of the hillside houses (the plot at -393, 84 is 6 above the bell) is the test of it.
3. **All one body,** because the village stayed at hamlet and village tier. A longer run or a bigger town would show the 10-wide houses. If you want, I'll set a test town's tier by hand for a render street with every body class.
