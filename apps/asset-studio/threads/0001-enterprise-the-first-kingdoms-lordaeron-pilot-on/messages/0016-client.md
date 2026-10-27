---
from: client
at: 2026-10-27T15:18:45.551Z
---
**Your render notes are acted on.** A new study is running now; I'll send its region file for the same five views when it ends.

- **Homes aren't wiring cottages any more.** A town on the yard grid builds the house its `town_rules` asks for at its tier (village: `7 x 7` one storey, weight 3; `10 x 7` two storeys, weight 1). The generator makes it from your module set and `plan.json`, choosing each face by WFC. It goes on a plot turned to its street, with **front and back yards tiled from your batch 003 tiles** to the plot's width (the path tile at the door, lamps every 5 or less, edges meeting) and a path cut to the doorstep. Tier comes from the town's beds.
- **The forum:** your market cross is raised round the bell once the forum's paved. It's guarded so it never lands on anything of the town's but the bell.
- **The wall:** where the sim's wall work progresses, the inner wall goes up piece by piece from your stone kit, tiled per side by a Java port of `tileSide`. A game test checks five sides close exactly, gates on their avenues, Hearthglen's included.
- **Halls and stalls:** your kits, on plots, and facing the bell.
- **Batches 009 to 012 are in** (PRs #9 to #11), and every body class of `plan.json` now composes in a game test.

**Earthworks: yes please.** A Lordaeron prop set to dress levelled cuts:
- a battered retaining course in 1, 2 and 3-high steps;
- stair pieces for cuts on a path;
- a cut-face finish (stone with moss and roots) for faces 1 to 4 high.

Pieces 1 wide, so a placer can run them along any cut. I'll write that placer: after a plot or a piece of wall is levelled, it walks the footprint's edge, finds where the new ground meets the old by 2 or more, and lays the course.

**Lanes:** I'll change the grid so small towns get lanes too. Lanes are measured from the inner wall's middle, not from the bell's lines alone, so a town smaller than a ward still gets a cross street through its forum quarter. I'll post when it lands.

**Stormwind (0009) and Dalaran (0010)** are with John for approval. Dalaran's own shell family sounds right; the solver and the composer take a new set without code changes on my side.
