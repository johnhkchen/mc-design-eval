---
from: client
at: 2026-10-27T13:23:00.298Z
attachments: map.pgw, map.png, plan.geojson, region-r.-1.-1.mca, region-r.-1.-2.mca, region-r.-2.-1.mca, region-r.-2.-2.mca, terrain-biome.json, terrain-biome.pgw, terrain-biome.png, terrain-height.pgw, terrain-height.png, terrain-README.txt, terrain-surface.json, terrain-surface.pgw, terrain-surface.png, terrain-trees.pgw, terrain-trees.png, terrain-water.pgw, terrain-water.png, town.json
---
**Hearthglen's GIS export (C13), for the pilot.** Town 0 of the seed-8675309 study world, day 90. Made by `dev/experiments/gis_export.py` in our repo (`just gis ...`), committed under `assets-src/gis/seed-8675309/0-hearthglen/` (the region files are kept out of git).

Coordinates are Minecraft blocks, `[x, -z]` so north is up. Every `.pgw` world file uses the same frame, and the top-left pixel is block x -567, z -545. The area covers the outer wall, the pastures' ring, and 64 blocks beyond. Features carry exact block coordinates in `properties.mc`.

- `plan.geojson`:
  - the town's layout: bell, forum, both walls and their kept-clear strips, 8 gates, 4 avenues, 4 lanes, 15 ward cells and 74 home frontages (door direction given);
  - its land: the 3 rings, 6 farm tracks, 22 holdings (each drawn as the hull of the ground nearest its seed; the mod also keeps a holding on its own side of every road and track), the 6 fields taken, pastures and 5 caravan roads (carrier, trips);
  - its villager spots: 18 beds, 14 workstations (with their trade) and the bells, plus the hexes round the town.
- `town.json`:
  - who lives there: villagers, beds and the hands with their trades and levels;
  - how it's doing: mood, the comforts it has, treasury and stock;
  - what it works: herds, crops in plots, works under way and its caravan routes.

  Kingdom and tier aren't in the sim yet: propose them for the pilot (we'd say Lordaeron, village tier now, town tier next).
- `terrain-*`:
  - `height.png`: 16-bit, the ground's top y under any tree, plus 64;
  - `surface.png`: 8-bit, an index into `surface.json`;
  - `water.png` and `trees.png`: masks;
  - `biome.png`: an index into `biome.json`.
- `map.png`: our surveyor's map of the same area.
- `region-r.*.mca`: the world's four region files covering it, as you asked, for rendering your designs in the real world around them.

Known gaps:
- Three pastures that touch each other come out as one rectangle.
- Only the fields already taken are listed. The open slots follow the strip rules in `FieldMaps.java`; we can export them too if you want them.
