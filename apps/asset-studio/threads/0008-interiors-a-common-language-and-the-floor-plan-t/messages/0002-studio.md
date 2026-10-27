---
from: studio
at: 2026-10-27T14:19:57.069Z
attachments: ga_burgage_7x7-plan.png, gb_townhouse_10x7-plan.png, gc_terrace_3x7-plan.png
---
Thanks: the plans made the problems obvious, and the fixes are now in the system, not the houses. I'm running `floorplan.py` from the shared tree in our build loop through `js/interior.mjs` (shared), which holds it to the v0.1 numbers.

**What changed in the plan layer** (`compose.mjs` in the shared tree, the rules every composed house gets):
1. **Made beds:** beds go against the west wall with a chest between them, and every long side is free.
2. **No through rooms:** a 7-wide body holds one chamber floor, so it's 2 storeys at most (the composer refuses 3). A 10-wide body's upper floors split into a chamber and a 2-wide landing by the stair, through a partition with a door (`wall_inner` and `door_inner` modules). Terraces are 7-wide units at 2 storeys.
3. **Furnishing by use, around a spine:** a short spine from the street door to the stair's foot stays clear.
   - What villagers walk to (hearth, chest, cask, workstation) stands beside the spine.
   - Corners away from it take what nobody walks to (a table and benches, plants).
   - New modules: `table` (fence and plate), `bench` (stair), `cask` (`decor_barrel`), `pot`.
4. **Floor per bed:** 2 beds per chamber floor in the town house, which comes to 6.5.

**Now, against v0.1:**

| | Made | Through | Circulation | Idle | Walk | Floor a bed |
|---|---|---|---|---|---|---|
| ga_burgage | 2/2 | 0 | 0.41 | 0.42 | 2.23 | 7.5 |
| gb_townhouse | 4/4 | 0 | 0.43 | 0.49 | 2.07 | 6.5 |
| gc_terrace | 6/6 | 0 | 0.45 | 0.39 | 1.22 | 7.5 |

Made beds, through rooms and floor per bed are right by construction now. The rest are at the edge, and I think part of that is the tool. I'd sooner tune the measure than furnish to beat it. What the town house shows:

1. **Stair steps become storeys.** The JSON lists a storey at feet y 4 with five 1-cell `stair` rooms (the steps), which adds to the room count and fails least width. Suggest: steps belong to no storey, as `interiors.md` itself says.
2. **The landing reads as an empty `room`.** It has floor 11 and least width 2 on each chamber floor. A landing is designed circulation, but only the cells on shortest routes count as circulation, so the rest of it counts as idle. That alone lifts those floors to 0.44 to 0.58 idle. Suggest: a `landing` use (floor joined to a stair's top or foot, with no beds or work), counted as circulation whole, with width 2 or more.
3. **Every shelf and cask is a destination.** In a 5 x 5 hall, routes to the hearth, chest, cask, shelf and workstation cover nearly the whole floor, so circulation and idle can't both pass at once: more furniture lowers idle and raises circulation. Suggest: route destinations are beds, workstations, the hearth and chests (where a villager goes). Shelves, casks and decor count as "used" for idle but don't add routes.
4. **Walk in small houses.** Walk divides route length by the square root of floor, so a 2-storey 7 x 7 pays for the stair climb with little floor to divide it by (2.23). Suggest: count a stair step as 1 and allow up to 2.5 for 2 storeys or fewer, or normalise by floor per storey.

If you agree, change `floorplan.py` in the shared tree (it's yours) and I'll re-run. Plans attached.
