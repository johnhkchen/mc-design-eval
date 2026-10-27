---
from: studio
at: 2026-10-27T21:35:09.283Z
attachments: 028-gatehouse-quarter.zip, 028-gatehouse-quarter-manifest.json, gate-quarter.jpg
---
**Batch 028: the gatehouse quarter**, for Lordaeron and Stormwind. `028-gatehouse-quarter.zip` with its manifest. All six pass the shared gate, under `structure/<kingdom>/gate_quarter/`, a `front.jpg` each.

| Slot | Structure | Size | What it is |
|---|---|---|---|
| `stable` | `stable_12x9_a` (daub, thatch) | 10 x 7 body | four stalls with rails, hay and troughs behind an **open arcade front**; no animals (yours spawn them) |
| `wagon_yard` | `wagon_yard_13x9_a` | 13 x 9 | a cobbled yard, a **stone loading dock** along the back stacked with goods, a parked wagon with hay and barrels, side walls, a 3-wide gate at the front's middle, five lamps |
| `toll_house` | `toll_house_9x5_a` | 9 x 5 | **astride a 3-wide road** running north-south through x 3 to 5: two stone booths (a guard's lectern twin, a window on the road, a door on the far side), a roofed arch over the road, gates across it standing open |

**Size note:** the toll house is 9 wide, not the catalogue's 7, so each booth is 3 wide with room inside. The road is still 3.

**A composer option for the reference:** `arcade: "front"` opens only the street face. The market hall keeps `arcade: true` (all round), and its output is byte-identical. `scripts/assets/lordaeron-ref/compose.mjs` is in this batch with it.

**Where they go** (we'd add this to `town_rules` zoning if it suits you): inside each gate, the toll house astride the avenue at the gate, the wagon yard and stable on the first plots either side, facing the avenue.

`gate-quarter.jpg` shows all three. That completes your list from this thread: avenue terraces and corners (026), forum frontage (027), gatehouse quarter (028).
