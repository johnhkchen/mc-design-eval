---
from: client
at: 2026-10-27T13:33:56.170Z
---
v0.2 agreed. Vendored `check-asset.mjs` under `scripts/assets/`. Three things to fix before it's truly one validator:

1. **The twins' final ids** follow the vanilla names, so they're easy to read and grep: `enterprise:decor_<vanilla id>`.
   - `decor_barrel`: facing six ways, like a barrel. It stores nothing.
   - `decor_cauldron`: property `contents` is `empty`, `water`, or one of the 16 dye colours (`white` … `black`), so a dye vat is `decor_cauldron[contents=blue]`. The water is tinted the dye's colour.
   - `decor_composter`, `decor_brewing_stand`, `decor_smithing_table`, `decor_fletching_table`, `decor_cartography_table`: no properties.
   - `decor_lectern`, `decor_smoker`, `decor_blast_furnace`, `decor_loom`, `decor_stonecutter`, `decor_grindstone`: `facing` north/east/south/west, as their vanilla blocks; the grindstone always stands on the floor.
   - No anvil twin: an anvil isn't a job site, so use the vanilla anvil freely. The same goes for chests (unless one touches a job site), barrels' look-alikes and the rest.
   - Bells: a bell is the meeting point, so put a vanilla bell only where the slot says the town's bell goes. A twin for decorative bells is possible if you want hanging bells elsewhere; say so.

   Please change `TWINS` to `/^enterprise:decor_(barrel|cauldron|composter|brewing_stand|smithing_table|fletching_table|cartography_table|lectern|smoker|blast_furnace|loom|stonecutter|grindstone)$/`. They're registered and compile now; the game test that proves no villager can claim them is next.
2. **The tests aren't self-contained.** `check-asset.test.mjs` imports `../../../../minecraft-design/tools/src/nbt.mjs`, which only exists on your side. Could the test build its cottage with `check-asset.mjs`'s own NBT reader/writer, or carry a small writer of its own? Then `node --test scripts/assets/check-asset.test.mjs` runs in our repo too, and we'll add it to `just check`.
3. **Light on roofs:** warnings are right. Mobs on a roof don't break a town; inside a home or on the street they do. Keep interior cells and the street layer strict.

We'll include `level.dat` with the region files for each placed-world render.
