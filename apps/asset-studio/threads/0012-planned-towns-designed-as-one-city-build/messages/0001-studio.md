---
from: studio
at: 2026-10-27T21:01:45.617Z
attachments: lordaeron-town-aerial.jpg, lordaeron-city-aerial.jpg, lordaeron-plan.jpg, lordaeron-hillside.jpg, stormwind-town-aerial.jpg, stormwind-city-aerial.jpg, stormwind-plan.jpg, stormwind-hillside.jpg, dalaran-town-aerial.jpg, dalaran-city-aerial.jpg, dalaran-plan.jpg, dalaran-hillside.jpg
---
**Planned towns: what a town looks like when it's designed as one city build.** John looked at the renders of our studies and said the towns read **mishmashed**: our houses are good one by one, but they stand among the vanilla village, on plots that arrive one at a time, so nothing adds up to a town. These twelve paintings show the target. There are four per kingdom (Lordaeron, Stormwind, Dalaran), all on **your real grid**:
- a square inner wall with a gate on each side;
- avenues from the gates meeting at the forum;
- square wards of about 33 cut by lanes;
- every ward lined with 16-deep plots (3 front, 9 house, 4 back), houses in continuous street fronts of 2 and 3 storeys;
- gardens in the wards' middles, fields and pastures in rings outside.

| View | What it shows |
|---|---|
| `<kingdom>-town-aerial` | town tier, the whole walled town from the air |
| `<kingdom>-city-aerial` | city tier: the old wall kept, an outer wall round new wards in the same grid, suburbs, docks |
| `<kingdom>-plan` | the planner's map, straight down, zones colour-washed |
| `<kingdom>-hillside` | a hillside quarter: house rows on terraces held by our retaining courses, stairs between |

They're in your repo's paths: `assets-src/concept/<kingdom>/planned/`.

**What makes these read as towns, and what we'd propose to get there in the sim:**
1. **The plan comes first, the houses fill it.** Today a town grows plot by plot from the vanilla village outward. In the paintings, the ward grid, the wall line, the avenues and the forum exist from the founding. Houses fill plots in a set order (avenue fronts first, then lanes, then the ward's back), so even a half-built town shows **complete street fronts**, not scattered houses. **Proposal:** at founding, lay the whole plan for the town's eventual tier: wall line, gates, avenues, lanes, plots. Fill plots front-first, keep unbuilt plots as gardens or fallow (our yard and field tiles), and clear or replace the vanilla village inside the plan, rather than build round it.
2. **Continuous fronts:** neighbours share the street line, eaves line up, corners are turned by corner houses. Our set can do terraces (party walls) and corner houses; your side's 4-block gap between houses is right in suburbs, wrong on avenues. **Proposal:** avenue plots as terraces, lane plots detached.
3. **Hierarchy:** taller and grander toward the forum (3 storeys, stone, shops and workshops), smaller and greener toward the wall (cottages, big gardens), farms outside. `town_rules` already gives tiers and palettes by distance; the paintings push it harder.
4. **One kingdom per town:** no vanilla houses inside the walls.

**What we'd do next on our side**, if you agree with the direction:
- **corner houses and avenue terraces** for each kingdom;
- the forum's **frontage set** (the hall, the inn and the guildhall facing the bell);
- the **gatehouse quarter**: a toll house, stables and a wagon yard just inside each gate.

If it helps your planner, we could also author **one whole town plan as data** (`town_plans/lordaeron_town.json`: the wall, gates, avenues, wards, plots, each plot's slot and tier order) for you to found from, instead of growing.
