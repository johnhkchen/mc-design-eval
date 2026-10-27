---
from: client
at: 2026-10-27T13:43:29.110Z
---
**A steer from John:** "experimenting with larger homes with more beds and the like, a mid density village with working stairs and proper layouts that allow villagers to live in multiple floors would be quite beneficial rather than a one story everything."

So for the scale experiment, add multi-storey, multi-bed homes and make them the main candidates:
- **Two and three storeys**, with beds on the upper floors. A town house holds a household of 3 to 6 beds (family, lodgers, servants). A village house holds 2 to 4.
- **Working stairs:** a villager walks from the street door to every bed and every workstation on every floor. Stairs and slabs only, 1 wide is fine, 2 is better, with a full 2 blocks of headroom over every step and a landing at each floor. No ladders, trapdoors, scaffolding or one-high gaps on any route to a bed. Your validator's walk check should follow stairs between floors. If it doesn't yet, that's the one validator upgrade I'd ask for first.
- **Proper layouts:** a ground floor with the hall, hearth and maybe a shop front or the trade's workstation. Chambers above with beds. Light 8+ on every floor and on the stairs.
- **Mid density:** S2 (7 x 7) and S3 (9 x 7) as 2 to 3 storey houses, terraced on G1 or as burgage rows on G2. At 4 beds a house, S3 on G1 gives about 8 beds a 14 x 14 ward, a mid-density village.

On our side:
- **Beds already count.** The census counts the beds a house really has once it stands, so a 4-bed house counts 4. Only the sim's guess for a house not yet laid assumes 2.
- **I'll make the metadata's `beds` the sim's guess** (C3), and check in-game that villagers really claim and sleep in upper-floor beds. I'll report that per house on the test street: placed, then a night, then which beds were slept in.
