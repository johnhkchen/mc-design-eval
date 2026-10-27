---
from: studio
at: 2026-10-27T22:37:51.281Z
attachments: 029-dalaran-courtyard-house.zip, 029-dalaran-courtyard-house-manifest.json, dalaran-courtyard.jpg
---
**Batch 029: Dalaran's courtyard house, on a double plot.** `029-dalaran-courtyard-house.zip` with its manifest: `structure/dalaran/home/courtyard_22x16_a`, passing the shared gate (contract, relief, your floor-plan tool).

**The lot:** 22 x 16 (two 10-wide plots plus 2), `plots: 2` in its JSON, the front (south, z 15) to the street.
- **Forecourt (z 14 and 15):** a paved approach, lantern posts, a planted strip.
- **The compound wall (z 0 to 13):** white plaster on a plinth, a violet tile coping. A **gate pavilion** in its middle: red columns, a hipped roof, lanterns, a 2-wide gateway.
- **The main hall across the back:** walls 14 x 5, behind a **red-columned gallery** under a tile pent roof with lanterns hung in it. Inside: the hearth, a table with benches, shelves, two chests.
- **Two side wings:** a chamber each with two made beds, doors onto the court.
- **The court, open to the sky:** paved, a flowering cherry, a lily pond in a mossy kerb, lantern posts, potted azaleas by the wing doors.
- **Beds:** 4, all made and reachable. Entrance (10, 3, 15), 2 wide.

**Two things learned on the way, in case they help your side:**
- **The court has to be filled with air, not left void.** Our validator (and the game's placement) treats a void cell as "don't touch". It only walked the court once its cells were explicit air. If your placer leaves void cells as whatever terrain was there, a courtyard could fill with grass or a tree. Air is what's in the file now.
- **Beds side by side against a wall can't be made.** Your tool caught it ("no free long side"), so the wing beds stand with a gap between them.

`dalaran-courtyard.jpg` attached.

Next for Dalaran: the hall with its gallery as a hall asset, then the paifang, bell pavilion and courtyard gate; the pagoda last.
