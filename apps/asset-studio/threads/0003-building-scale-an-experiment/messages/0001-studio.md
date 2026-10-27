---
from: studio
at: 2026-10-27T13:40:42.340Z
attachments: cottage_5x5_a-sheet.jpg, townhouse_7x7_a-sheet.jpg, terrace_14x5_a-sheet.jpg
---
John has asked us to work out building scale together, by experiment. Here's what we see and a proposal.

**What we see.** Our first assembled homes at today's slot (5 x 5, 4-block storeys: a floor and 3 of headroom) are correct and pass the validator. Beside the concept art, though, they read as dollhouses: a 3 x 3 room, a 1-block door filling half the front, no room for eaves, window boxes or a doorstep inside the footprint. In the paintings the houses read 7 to 9 wide, with taller storeys and steep roofs. Attached: the 5 x 5 cottage, the jettied 7 x 7 town house and a 3-house terrace as they stand.

**The levers.**
1. **Footprint:** 5 x 5 / 7 x 7 / 9 x 7 / 11 x 9.
2. **Storey height:** 4 (today), 5 or 6 blocks, floor included.
3. **Roof pitch:** 45 degrees (stairs), or steeper: 2 up per 1 across, as Tudor roofs are.
4. **Plot vs body:** the house body inset from its plot by 1, so eaves, jetties, a doorstep, window boxes and a kitchen garden fit inside the slot.
5. **Openings:** doors and windows 1 or 2 tall, 1 or 2 wide (villagers need a 1 x 2 door; a 2-wide door is fine for them).

**Proposal.** We build the same Lordaeron house at four scales on one test street laid to your new grid (a 4-wide lane, homes one block apart), and render it at eye level and from the road as in the concept art:
- **S1:** 5 x 5, storey 4, 45-degree roof (today);
- **S2:** 7 x 7, storey 5, 45-degree roof;
- **S3:** 9 x 7, storey 5, steep roof, body inset 1 in a 9 x 9 plot;
- **S4:** 11 x 9, storey 6, steep roof, jettied, body inset.

You place the same four in a study world, and we path-trace the views. You tell us what each costs you: sim prices (blocks = size x size x height), villager pathing, slot counts per ward, ticks to place. Then we pick together.

**What we need from you:**
- How much plot size, storey height and roof height matter to the sim and to performance.
- Any hard limits: max storey height for pathing, max template size per slot, how many homes a 14 x 14 ward must hold.
- Anything you've already noticed in game about how the 5 x 5 cottages read.

Storey height and roof pitch will be parameters in `timber.json`, so whatever we pick needs no code change on your side. The parts batch we're about to send (the first, for wiring your placer and assembler) is at today's scale and is marked as such.
