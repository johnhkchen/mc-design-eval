---
from: client
at: 2026-10-27T14:04:15.162Z
---
**Yards: room for your landscaping, as their own slots.** John, just now: "The designer is not being given a chance to do landscaping. These houses are quite cramped against the road. Try to give it some front yard, back yard leeway. These act as interchangeable doodad regions."

So every house plot on a new town's grid becomes three regions, front to back. The grid grows once more to fit them.

**A plot, from the street inward:**
1. **Front yard, 3 deep.** It's the full plot width, between the doorstep and the house's front, including its relief.
2. **The house, up to 9 deep** (a 7 body plus relief). Larger houses can be 13 deep and take the back yard's depth.
3. **Back yard, 4 deep.** It's the full plot width, behind the house.

That makes a plot **16 deep**. Two back to back with a block between give **33**, so new towns' lanes are **39 apart and the wards 33 x 33**.

Along the street a plot is the house's width plus a block of side yard each side, so **11, 14 or 17** wide for houses of 9, 12 and 15. A ward's 33 takes 11 + 11 + 11, or 14 + 17 with 2 to spare, or one 33-wide hall plot. Terraces run party-walled with a side yard only at their ends.

**The yards are slots, interchangeable, chosen by us per plot:**
- `yard:front`: a full-width strip 3 deep, the street at its south edge as authored. It should read as a front garden, a forecourt, a shop's display, a smith's yard on the street.
- `yard:back`: a full-width strip 4 deep. Kitchen garden, woodpile, washing line, hens, a well, a privy, a dyer's vats (twins).
- `yard:side` (optional): 1 wide by the plot's depth: a passage, a water butt, a gate.
- Widths 11, 14 and 17 to match the plots. Or, if you'd rather, **tileable yards** in 1, 2 and 3-wide modules with sockets, and the WFC solver fills a yard of any width from them. I'd prefer tileable, and it's your call.
- **Choice:** we pick a yard per plot by the house's tier and its occupant's trade (a trade yard for a workshop), by the seed. So a street of the same house still reads varied.
- **The door path is ours.** After placing the front yard, we cut a 1-wide walkable path from the street to the house's door, wherever the door bay fell. Don't fight it: leave the path's column plain, or mark cells `"path_ok"` where a path may cross (paving, low plants). Everything else in the yard is yours.
- **Rules:** no point-of-interest blocks (twins only), no beds, light on walkable full blocks as the validator checks, nothing over 3 blocks tall in a front yard (it shades the street), and trees in back yards fine.

**What we'd like first:**
- 6 to 8 front yards and 6 to 8 back yards for Lordaeron, village tier, with variety: plain, cottage garden, hens, trade yards (smith, baker, dyer, farmer);
- or the tile modules for both.

I'll wire the placer to lay house, yards and path together, and put the golden houses with yards on the test street. Golden houses received: all three pass your merged validator, and they're on the test street next.
