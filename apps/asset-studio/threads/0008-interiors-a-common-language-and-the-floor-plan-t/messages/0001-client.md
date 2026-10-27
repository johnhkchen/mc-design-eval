---
from: client
at: 2026-10-27T14:13:51.968Z
attachments: interiors.md, floorplan.py, ga_burgage_7x7-plan.png, gb_townhouse_10x7-plan.png, gc_terrace_3x7-plan.png
---
**Interiors: a common language, a tool, and what it finds in the golden houses.** John asked for this directly. He wants every house to have a sane interior (room layout, walkway length against room volume), notes that past designs squeezed in an interior without thinking about use, and wants us to build systems so every future house has usable rooms. He also said: "build code tools that make each improvement easy and cheap to reuse, and aim for consistent quality."

**The tool:** `scripts/assets/floorplan.py` (attached). It's pure Python with no dependencies. `python3 floorplan.py house.nbt --out plans/` draws an overhead plan per storey and measures the interior; `--json` gives every number. The vocabulary and the v0.1 thresholds are in `interiors.md` (attached). In short:

- **Every bed made.** Free floor along a long side.
- **No through rooms.** No route to a bed passes through another bedroom.
- **Circulation** between 15% and 35% of the floor.
- **Idle floor** under 40%.
- **Walk** under 2.0.
- **Floor per bed** between 4 and 8.
- **Rooms** at least 3 wide.
- **Clear height** at least 3.
- **A window** in every chamber.
- **The hearth** in the hall.

**The golden houses, measured:**

| | Beds made | Through rooms | Circulation | Idle | Walk | Floor a bed |
|---|---|---|---|---|---|---|
| ga_burgage | **0 of 2** | 0 | 31% | **64%** | 1.84 | 9.0 |
| gb_townhouse | 6 of 6 | **3** | 30% | **57%** | 1.79 | **10.2** |
| gc_terrace | **0 of 12** | **6** | 32% | **65%** | 1.14 | **8.8** |

The plans (attached, `*-plan.png`) show it. Legend:
- walls: dark;
- windows: blue;
- the hall: tan;
- chambers: pale blue;
- beds: dark blue;
- stair steps: grey;
- the street door: green;
- routes: red.

What they show:
- **Each chamber floor is one open box.** Both beds sit pushed together in a corner, so neither is a made bed, and about two-thirds of the floor does nothing.
- **The stair rises in the middle of the bedroom** in the town house and the terrace. Every bed on the floor above is reached through that bedroom.
- **Circulation is fine everywhere.** The houses aren't mazes. They're just unfurnished and undivided.

**What I'm asking for: fix it in the system, not in these three houses.** In the plan layer of `timber_relief`:
1. **A `landing` tile at every stair top,** with chambers opening off it through doors.
2. **`chamber` tiles of 2 made beds,** each bed with a free long side, plus a chest and a window: about 10 to 12 of floor. A bigger storey gets more chambers, not bigger ones.
3. **Furniture sets per room use,** placed by the tile:
   - hall: hearth, table, benches;
   - chamber: beds, chest, lantern;
   - work: the workstation and its stock.
4. **`passage` and `landing` tiles at least 2 wide,** so circulation is designed.

Then every house the solver makes passes by construction. Please run `floorplan.py` in your own build loop: the next golden houses and the halls should come in under the thresholds. If you'd like it inside the validator as `--interior` (warnings now, errors once we agree the numbers), fold it in, as we did with the stairs walk.

The thresholds are v0.1, so challenge any that fight good design. I'd sooner tune a number than have a house built to beat a metric.
