---
from: studio
at: 2026-10-27T14:28:51.168Z
attachments: 005-lordaeron-halls-and-set-rev2.zip, 005-lordaeron-halls-and-set-rev2-manifest.json, front.jpg, cutaway.jpg
---
**Batch 005: seven halls, and the module set at rev 2.** `005-lordaeron-halls-and-set-rev2.zip`, 195 files with their manifest. Everything passes the gate: contract and relief (halls hold no beds, so the interior stage doesn't run).

**The halls** (`structure/lordaeron/hall/`) are one shell each from the relief module set, single storey, so no stair core. Each comes with `front.jpg` and a roof-off `cutaway.jpg` under `assets-src/lordaeron/hall/<name>/`.

| Hall | Body | Palette | Inside (twins for every job-site lookalike) |
|---|---|---|---|
| `granary_9x9_a` | 7 x 7 | daub | hay stacked two high on three walls, a centre aisle |
| `root_cellar_9x9_a` | 7 x 7 | stone | casks (`decor_barrel`) two high along the walls |
| `counting_house_9x9_a` | 7 x 7 | brick | clerks' desks (`decor_lectern`) with benches, ledger shelves, a strongbox, a table with candles |
| `temple_9x9_a` | 7 x 7 | stone | an altar with candles at the head of an aisle, pews either side facing it |
| `library_9x9_a` | 7 x 7 | daub | shelves two high round the walls, a reading desk, a table and benches |
| `smithy_9x9_a` | 7 x 7 | stone | a forge (`decor_blast_furnace`) under the chimney, an anvil, a quench vat (`decor_cauldron[contents=water]`), a `decor_smithing_table`, a tool rack, stores |
| `caravanserai_12x9_a` | 10 x 7 | daub | stall rails and hay for the trains (no animals), casks and chests, the drovers' table by the hearth |

Each hall's JSON carries `assembly.layout`, the exact module placements, so your solver can reproduce or vary it. Halls stay off the 5 x 5-interior question in 0008, since they have no stair.

**Still to come:**
- the watchtower: its stair goes to a lit top, which needs a turning stair inside 3 x 3;
- the stone docks;
- the Masons' Square: open ground, so it isn't a building.

**The module set at rev 2** (`timber_relief.json`, 66 modules, golden houses re-composed), changed since batch 002:
- **Turned core:** it hugs the side and back walls, so the hall keeps its width. 10-wide bodies take it, with an L partition and a 2 x 2 landing. The straight core is for 13-wide and up.
- **New modules:**
  - furniture: `table`, `bench`, `cask`, `pot`, `hay`, `desk`, `altar`, `candles`, `anvil`, `smith_table`, `forge`, `quench`, `rack`, `stall_rail`;
  - partitions: `wall_inner`, `door_inner`.
- **`bay_door`:** now stands a lamp on its hood. That lights the door, and the ledge on the hood is no longer a dark cell a mob could spawn on (it failed the gate on single-storey halls).
- **The reference composer** still reproduces all three golden houses byte for byte from their layouts.
