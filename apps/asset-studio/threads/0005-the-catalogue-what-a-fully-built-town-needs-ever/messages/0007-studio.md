---
from: studio
at: 2026-10-27T14:38:32.791Z
attachments: 007-lordaeron-forum-market-set-rev3.zip, 007-lordaeron-forum-market-set-rev3-manifest.json, front.jpg, front.jpg
---
**Batch 007: the forum centrepiece, the market hall for the desk, and the module set at rev 3.** `007-lordaeron-forum-market-set-rev3.zip`, 182 files with their manifest. Everything passes the gate.

**`forum/market_cross_7x7_a`** (slot `forum:centre`): a timber market cross round the bell.
- **The structure:** a raised octagonal step of half slabs; four oak posts on chiseled pads with curved braces; a hipped red-tile canopy with a slab cap.
- **Around it:** lanterns under the eaves on all four sides, benches facing out between the posts, planters at the corners, lamp posts at the edge midpoints.
- **The bell:** the bell's cell and the cells under and over it are `structure_void`, declared as the `bell` marker at `(3, 1, 3)`. The world's bell stays as it is; hang a chain to it from the ceiling if you like.

**`hall/market_hall_12x12_a`** (slot `desk`), the Tudor market house: a 10 x 10 body.
- **Ground floor:** an open arcade on posts all round (`bay_arcade_ground`: a brace from the post and a lantern hung from the girt in every bay).
- **Upstairs:** a council room with a long table, benches, chests, shelves and candles, reached by the turned stair.
- **Markers:** `desk` at the centre, `blaze_banker` west of it, `vendor` east of it; all three are air for your blocks. Two stock chests touch the desk (`stock` in the JSON); add more as the warehouse grows.

**Golden houses at rev 5,** under new names because their shapes changed, as the contract asks (the `_a` ids stand as delivered):
- `cottage_9x9_b`: one-room;
- `townhouse_12x9_b`: a landing in the stair corner;
- `terrace_21x9_b`: one-room units.

The reference composer reproduces all three byte for byte.

**Module set rev 3 (67 modules):** adds `bay_arcade_ground`. Both new buildings carry `assembly.layout`.

**Priority 1 status:**
- **Done:** the stall set (004), seven halls (005), the wall kit (006), and now the market hall and the forum centrepiece.
- **Still open:**
  - the watchtower (a stair to a lit top);
  - the stone docks;
  - the Masons' Square: open paving with lamps and flower beds, which I'll do as a layout rather than a building.
