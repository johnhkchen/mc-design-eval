# irl-copy

A real place, from open data, as Minecraft land with plain building masses. It is an **input** to the design
pipeline, never part of it: its output takes the place of a player's land export (as Oak Lake's or Polarton's did),
and the minecraft-design plugin builds the actual buildings on the footprints. Nothing here imports from the build
workflow; the only thing used from the plugin is the structure file writer.

```
node bin/irl.mjs sources [place]   which source supplies each layer
node bin/irl.mjs all sf/alamo-square
```

writes `out/<place>/land.nbt` (1 block = 1 m by default), `manifest.json` and `SOURCES.md`.

## The output contract

- `land.nbt`: ground, streets, sidewalks, paths, water, trees, and every building as a plain mass (one colour each)
  from the lowest ground under it to its roof height. Masses are placeholders for the design pipeline to replace.
- `manifest.json`: the frame (box, metres per block, floor elevation), the ground's range, street names, and every
  building with its `footprint` cells, `base`, `height` and LiDAR `peak` in the structure's own frame: what a kit
  build takes as its plots. `sources` and `credits` say where each layer came from and what must be credited.
- `SOURCES.md`: the same, for people.

## Layers and sources

Each source is one file in `src/sources/`, declaring its layers, licence, credit line and the places it `covers`. For
each layer the first covering source in `src/sources/index.mjs` wins; a place can name its own per layer.

| Layer | San Francisco | Elsewhere |
|---|---|---|
| ground | DataSF 5 ft contours (PDDL) | none yet (flat): add a DEM source, e.g. USGS 3DEP (US) or Copernicus GLO-30 |
| buildings | DataSF footprints with LiDAR heights (PDDL) | OpenStreetMap (`height` or `building:levels`, else 8 m) |
| streets | DataSF centrelines (PDDL) | OpenStreetMap |
| parks | DataSF Recreation and Parks (PDDL) | none yet (OSM `leisure=park` would do) |
| water | USGS NHD (public domain, US) | OpenStreetMap |
| paths, trees, playgrounds | OpenStreetMap (ODbL) | OpenStreetMap |
| canopy | Meta & WRI canopy height maps (CC BY 4.0, worldwide) | same |

Trees come from the canopy map where there is one (`src/trees.mjs`: treetops are the local maxima, crowns are voxelised
from the map, trunks run up under each top), else from mapped tree points.

## Adding a place

Add `places/<city>/<site>.json` with `name`, `city`, `country`, `centre` [lat, lon] and `half` (metres from the
centre to the box's edge; optional `scale` blocks per metre, `sources` { layer: source id }). For a new city, add a
source file for its portal and list it first in `index.mjs`.

## Licences

Only sources whose licence allows building and publishing a derived model are used, and their credit lines go
wherever the build is shown (the manifest's `credits`). ODbL (OpenStreetMap) requires "© OpenStreetMap contributors";
CC BY 4.0 (the canopy maps) requires credit to Meta and WRI. Google's Photorealistic 3D Tiles are excluded: their
terms forbid models "extracted, traced, or otherwise derived" from them.

Reference images for the facades (not layers) live with the design run that uses them, each with its licence: the
lab's `benchmarks/plugin-baseline/runs/build-1/sf-landmarks/refs/LICENSES.md`.
