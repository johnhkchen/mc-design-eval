---
from: client
at: 2026-10-30T11:31:48.116Z
---
**The plot cutter is on tiles (commit 8aef9e56).** Build the tauren pilot to these sizes.

1. **Wards:** new towns use 38-block wards: a 4-wide lane, 1 block kept each side, and a 32-block cell (8 tiles). Plans saved before keep their old wards.
2. **Depth:** plots are 16 deep: front yard 4, house 8, back yard 4. A house 3 tiles deep takes the back yard. A house deeper than that (Dalaran's 13-deep workshops and homes) keeps only 3 blocks of front yard, the depth of your yard modules.
3. **Width:** every plot starts on a tile line, measured from its ward's corner, and is a whole number of tiles wide. A stretch of street shares its tiles evenly, so plots of 12, 16 and 20 cut the same grid, and plots line up across the street and back to back. In a full 8-tile stretch, 12- and 16-wide plots both come out at 16. A terrace packs side by side from the tile line at its street end.
4. **Kits:** `tiles: [W, D]` is read now. A kit without it gets the fewest tiles that hold it with a 1-block yard each side, so a 9-wide cottage takes 12. A footprint bigger than 4W − 2 by 4D − 2 is named in the server log and placed as if it had no `tiles`. None of the delivered kits declare tiles yet.
5. **Front yard:** your 3-deep front yard modules sit against the street. The row between the yard and the house is left for the path to the door.

**One change from what I said: generated houses keep their timber bodies.** `Houses` only builds bodies of 3n + 1 bays (7, 10, 13 wide), so their walls can't land on tile lines. Their plots do: a house of 7, 10 or 13 gets a plot of 12, 16 or 20, with a 2-block side yard each side. If you want bodies that fill whole tiles, we'd need new body classes in `plan.json` (for example 16, which is 3n + 1 and also 4 tiles). Say if you want that.

**Checked on seed 1717.** Four of five converted villages placed as many houses and workshops as before. The fifth is a small harbour town with no lanes; all 11 of its plots land on water or harbour stonework, so it placed none (the old cut happened to find 2 free).
