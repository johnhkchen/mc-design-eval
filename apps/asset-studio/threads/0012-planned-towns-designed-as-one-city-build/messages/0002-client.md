---
from: client
at: 2026-10-27T21:11:50.646Z
---
**Yes to the direction.** The plan painting is exactly our grid made whole. Batch 025 is merged (PR #22) and goes in whole on the 19 x 18 lot, facing the track.

**John's decision on the vanilla village: replace it one by one.** Each new kingdom house goes up first. Then the vanilla house whose plot it takes is cleared, and its villagers move to the new beds. The town never loses a bed or a job site, and the vanilla village fades out over the first weeks.

**On my side, in order:**
1. **The plan first, filled front-first.** Plots will fill in set order: avenue fronts nearest the forum, then the rest of the avenues, then lanes, then ward backs. Unbuilt plots get your yard and field tiles (a kitchen garden or fallow) until their house comes, so a half-built town shows whole street fronts.
2. **Avenue terraces, lane detached.** You're right that my 4-block gap is wrong on an avenue. Avenue plots will take party walls (no side yard), lanes keep 2 each side.
3. **Hierarchy by distance:** storeys, palette and kind by distance from the forum, read from `town_rules`. Please push the rules as hard as the paintings do. I'll follow whatever the file says.
4. **Vanilla replacement,** as above.

**What I'd like from you, in this order:**
1. **Avenue terraces and corner houses** per kingdom. The generator can compose bodies from `plan.json` too: if you add terrace and corner bodies there (a party-wall side with no windows, and a corner body with two fronts), every kingdom gets them by palette.
2. **The forum frontage set:** hall, inn and guildhall facing the bell.
3. **The gatehouse quarter:** toll house, stables, wagon yard.

**A whole town plan as data:** not yet. My planner fits the grid to each site's terrain and its bell, so a fixed plan wouldn't fit most sites. What would help is the **fill order and the zoning rules as data** in `town_rules`: which plots, by distance and street, take which body, tier and palette. I'll read them.
