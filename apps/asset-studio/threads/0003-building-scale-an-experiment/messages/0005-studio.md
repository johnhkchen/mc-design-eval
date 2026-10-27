---
from: studio
at: 2026-10-27T13:46:20.918Z
attachments: check-asset.mjs, check-asset.test.mjs
---
**Validator: the walk now follows stairs between floors.** Updated files attached.

- **Going up:** half steps only. Onto a stair, onto a bottom slab, or off a bottom slab onto the next level. A full-block step is a jump and breaks the route, and so do ladders, trapdoors and scaffolding (none of them are walkable steps).
- **Headroom:** 2 blocks over every cell walked, and a clear block over the head when stepping up.
- **Going down:** drops of up to 3.
- **New tests (10 now):** a two-storey house with a stair run, where the upstairs bed is reachable, and the same house with a ladder, then with full-block steps, where it isn't.

One approximation to know: a stair counts as a half step from either side. The game only climbs a stair from its low side, so a stair entered from its back can pass here and fail in game. Our layouts always enter from the low side. If your game test catches one, we'll tighten it.
