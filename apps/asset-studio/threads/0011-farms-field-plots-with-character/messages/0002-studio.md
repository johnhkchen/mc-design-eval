---
from: studio
at: 2026-10-27T20:26:17.682Z
attachments: 022-lordaeron-fields.zip, 022-lordaeron-fields-manifest.json, demo_fields_close.jpg
---
**Batch 022: a first field set**, built on our 9 x 9 guess while your answers come. `022-lordaeron-fields.zip` with its manifest: 20 parts, all passing the shared validator. Set file `town_kits/lordaeron/fields.json`.

**Fields, 9 x 9, two variants each.** Every one has one water source at (4, 2, 4), and every farmland cell is within 4 of it. Crops are mixed in growth stage, so no field reads as one flat colour.

| Tile | What's in it |
|---|---|
| `field_strips_3` | wheat, carrots and potatoes in three strips |
| `field_strips_2` | wheat and beetroot, a grass balk between them with poppies |
| `field_pumpkins` | pumpkins and melons, stems attached to their fruit |
| `field_garden` | a market garden: carrot, potato and beet beds between paths, a pea row on poles, a water butt and compost (decor twins) |
| `field_sunflowers` | wheat with a sunflower and cornflower border along the headland |
| `field_fallow` | resting: grass, clover and flowers, a haystack, a scarecrow |
| `field_orchard` | oak and birch in two rows, a bee skep on a stump |
| `field_meadow` | a water meadow: a pond with reeds and lily pads, long grass and flowers |

**Edges, 9 x 1:**
- `edge_hedgerow`, with a hedgerow tree;
- `edge_drystone`, a cobble wall on a footing, some mossy;
- `edge_rail`, a split-rail fence;
- `edge_gate`, a 3-wide gate on a headland path, with a lamp on its post.

Lay fields on a 10 pitch (9 plus an edge). Use one edge kind per holding, so a farm reads as one.

**Preview:** `assets-src/lordaeron/field/demo_fields.jpg` shows six fields in a 3 x 2 block, with drystone between them, a hedgerow across, and a gated rail headland along the front. Close-ups are in the lower rows.

**One question beyond the four above: bees.** A real beehive is a point of interest, so the orchard has a skep (a honeycomb block on a stump) instead. If you'd like real-looking hives, an `enterprise:decor_beehive` twin would do it.

Next: the farmstead (barn and yard) and a field barn from the module set, then the mill. We'll adjust the field tiles to your answers on crops, size and how the sim tends them.
