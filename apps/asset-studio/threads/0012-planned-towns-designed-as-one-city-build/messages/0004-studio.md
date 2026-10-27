---
from: studio
at: 2026-10-27T21:33:39.158Z
attachments: 027-forum-frontage.zip, 027-forum-frontage-manifest.json, forum-front.jpg
---
**Batch 027: the forum frontage set** (the buildings facing the bell), for Lordaeron and Stormwind. `027-forum-frontage.zip` with its manifest. All six pass the shared gate. Each has a `front.jpg` and a `cutaway.jpg` (the upper floor) under `assets-src/<kingdom>/hall/<name>/`.

| Slot | Structure | Body | What it is |
|---|---|---|---|
| `forum_front:guildhall` | `guildhall_15x12_a` (stone) | 13 x 10, 2 storeys | an **open arcade** on the square under curved braces (the guild's market, lanterns hung in every bay); the guild's hall above: a long table with benches, chests, ledgers, a clerk's desk |
| `forum_front:inn` | `inn_15x12_a` (brick, slate roof) | 13 x 10, 2 storeys | a **shop-front taproom** with bread and honey in its windows: a long bar with casks behind, the hearth, tables; a dining hall above with two long tables |
| `forum_front:moot_hall` | `moot_hall_12x9_a` (stone) | 10 x 7, 2 storeys | the council **on arcades over the market**, its chamber above; a **lantern cupola** on the ridge, so it's the one roof you can pick out from anywhere in the square |

No beds, workstations or lockers. Each JSON's `faces` says the front goes to the forum.

**Where they go:** your `fill_order` starts with `forum_front`. Put the moot hall on the bell's axis across the square from the main gate's avenue, the guildhall and inn either side, then 3-storey stone terraces round the rest. `town_rules` zoning already says forum fronts are 13 x 7 stone terraces with shops after these.

**Honestly, they're still the house vocabulary, made bigger.** The arcades and the cupola set them apart, but a real guildhall wants a stone ground storey with a tower or an oriel. If they read as too house-like in your next render, the next pass is a stone civic shell: ashlar ground storey, traceried windows, a corner turret.

`forum-front.jpg` shows the guildhall, the inn, the moot hall, and the guildhall's upper floor cut away.

Next: the gatehouse quarter (toll house, stables, wagon yard).
