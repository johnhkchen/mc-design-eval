---
from: studio
at: 2026-10-27T20:29:32.740Z
attachments: 023-lordaeron-fields-rev2.zip, 023-lordaeron-fields-rev2-manifest.json, demo_fields_close.jpg
---
**Batch 023: fields rev 2**, built to your answers. It replaces 022 whole: 48 parts, all passing the shared validator. The validator now knows `decor_beehive`; that's pushed to shared (`js/check-asset.mjs`).

**Every crop field has one main crop**, with `crop` and `plots` in its JSON and the set file:

| Main crop | Tiles (a and b variants each) | plots |
|---|---|---|
| wheat | `field_wheat_border` (sunflowers and cornflowers along the headland), `field_wheat_scarecrow` (a scarecrow and hay in one corner) | 71 |
| carrot | `field_carrots` (wall to wall), `field_carrots_garden` (beds between paths, a pea row on poles) | 80 / 53 |
| potato | `field_potatoes` (scarecrow corner), `field_potatoes_garden` | 71 / 53 |
| beetroot | `field_beetroots` (sunflower border), `field_beetroots_garden` | 71 / 53 |
| sugar_cane | `field_cane` (cane 2 or 3 tall), `field_cane_reeds` (uneven, lily pads in the channels) | 54 |
| sweet_berries | `field_berries` (rows with a walk between each pair, so nobody walks through the thorns), `field_berries_hedged` | 53 / 41 |

**Water:**
- **Most crop fields:** the source at (4, 2, 4).
- **The cane fields:** water channels on rows 1, 4 and 7 instead (cane must stand beside water). Their JSON says so in `water`.

**Not crop fields** (`crop: null`, decor): `garden_pumpkins`, `field_fallow`, `field_orchard` and `field_meadow`. The orchard now has two `decor_beehive`s.

**Edges:**
- **Long edges:** the 9 x 1 strips for the balks and the headland, as before.
- **New, for pastures:**
  - `edge_hedgerow_1a-c`, `edge_drystone_1a-c` and `edge_rail_1a-c`: 1-wide straights, east-west (rotate for north-south);
  - `corner_hedgerow`, `corner_drystone` and `corner_rail`: corner posts drawn for runs leaving east and south, a pasture's north-west corner (rotate for the others). The rail corner carries a lantern.

  An 18 x 14 pasture closes exactly with them.

**Preview:** the new `demo_fields.jpg` (in `assets-src/lordaeron/field/`) shows a wheat border field, cane, an orchard, a carrot garden, hedged berries and a scarecrow wheat field, with drystone balks, a hedgerow and a gated rail headland.

Next: the farmstead and field barn from the module set, as the head of a holding beside its track.
