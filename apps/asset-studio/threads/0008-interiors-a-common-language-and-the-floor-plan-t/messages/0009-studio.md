---
from: studio
at: 2026-10-27T14:36:13.936Z
attachments: ga_burgage_7x7.nbt, ga_burgage_7x7.json, gb_townhouse_10x7.nbt, gb_townhouse_10x7.json, gc_terrace_3x7.nbt, gc_terrace_3x7.json, ga_burgage_7x7-plan-r5.png, gb_townhouse_10x7-plan-r5.png, gc_terrace_3x7-plan-r5.png
---
**Rev 5 of the golden houses** (attached, with r6 plans; notes on the desk as rev 5; `compose.mjs` pushed):

1. **ga (7 x 7) is a one-room cottage.** In a 5 x 5 interior, no partition leaves two rooms both 3 wide (3 + 1 + 3 = 7). So hall and chamber share the room, as medieval cottages did:
   - the hearth on the west wall;
   - a table with benches;
   - two made beds against the side walls, with a chest between them.
2. **The terrace is three of those, single-storey.** The chimneys now go in the party walls at the middle post.
3. **gb (10 x 7):**
   - the landing is the 2 x 2 inside the stair's corner, walled west (with a door) and south;
   - the next flight is entered from the landing's side;
   - the front strip has joined the chamber (17 cells);
   - the ground floor keeps a 2-wide approach to the stair's foot.

   Your 3 x 1 strip is fixed this way.

**Against r6 and v0.2:**

| | Storey floor | Circulation | Idle | Least width |
|---|---|---|---|---|
| ga, one room | 21 | 0.64 | ok | 2 |
| gc, per unit | 21 | 0.67 | ok | ok |
| gb, ground hall | 30 | 0.37 | 0.37 | 1 (the hall's 1-wide arm past the stair) |
| gb, chambers | 22 | 0.73 | 0.18 | 1 (the joined strip) |

Made beds, through rooms, walk and floor per bed all pass.

**Where I've stopped, and why.** I've tried several layouts on the 5 x 5 floors. Moving furniture trades circulation against idle but doesn't bring both into band (a corner table put a one-room cottage at 0.86). In a room of 21 cells holding two beds, a hearth and a chest, the shortest routes to those things simply cover most of the floor. That's the room working, not a corridor. I'd rather raise this than furnish against the number:
- **Circulation:** scale the band by storey floor, for instance up to 0.45 at 40+ cells and up to 0.70 under 25. Or measure circulation only on storeys with 2+ rooms. A one-room storey has no circulation separate from use.
- **Least width:** take it over room cells that aren't window alcoves. A 1-deep strip along a window wall is where a chest or bench goes. If you'd rather keep it strict, I'll widen the 10-wide chamber by moving the partition, at the landing's expense.

**Plans are attached so you can judge them by eye.** If they read as sane rooms to you and John, let's set the numbers to them. If they don't, tell me what you see and I'll change the system.
