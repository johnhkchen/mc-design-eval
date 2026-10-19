# irl-copy

A real place, from open data, as Minecraft land with plain building masses. It is an **input** to the design
pipeline, never part of it: its output takes the place of a player's land export (as Oak Lake's or Polarton's did),
and the minecraft-design plugin builds the actual buildings on the footprints. Nothing here imports from the plugin:
it writes its own structure files (`src/voxels.mjs`); only the tests read them back with the toolkit's loader.

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
| lidar | USGS 3DEP point cloud, CA_SanFrancisco_1_B23 (2023, ~100 points/m², public domain): ground, each building cell's roof, and the canopy | other 3DEP collections (add to `usgs-lidar.mjs`) |
| aerial | USDA NAIP 0.6 m RGB + near-infrared, newest year (public domain): roof colours, green / sand / paving | NAIP (continental US) |
| parcels | DataSF Assessor tax rolls, latest year (PDDL): year built, construction, use, storeys, address per parcel | none yet |
| ground | lidar ground returns; else DataSF 5 ft contours (PDDL) | none yet (flat): add a DEM source, e.g. USGS 3DEP (US) or Copernicus GLO-30 |
| buildings | DataSF footprints with LiDAR heights (PDDL) | OpenStreetMap (`height` or `building:levels`, else 8 m) |
| streets | DataSF centrelines (PDDL) | OpenStreetMap |
| parks | DataSF Recreation and Parks (PDDL) | none yet (OSM `leisure=park` would do) |
| water | USGS NHD (public domain, US) | OpenStreetMap |
| paths, trees, playgrounds | OpenStreetMap (ODbL) | OpenStreetMap |
| canopy | from the lidar; else Meta & WRI canopy height maps (CC BY 4.0, worldwide) | Meta & WRI |

Buildings take their shape from the lidar: each footprint cell's roof is the highest return there (a 3x3 median within
the footprint, capped at the footprint's own recorded peak, so a tree over a roof isn't roof). Materials
(`src/materials.mjs`): walls by the assessor's record (painted clapboard for Victorian and Edwardian houses, stucco for
interwar ones, brick for masonry, concrete for steel and concrete frames, sandstone for civic and commercial), roofs
the median aerial colour matched to a roofing block, open ground by the aerial photo's colour and NDVI.

Recorded buildings get a fit-out (`src/fitout.mjs`): a floor at every storey (the roll's storey count or the measured
height at ~3.6 m a storey, whichever is more: the roll counts living floors, not a raised ground floor or an attic), a
front door on the side facing the nearest street, windows along that front at each storey, a glazed shopfront on a
commercial ground floor, and a few windows round the back. The manifest records each building's storeys and entrance.

Trees come from the canopy map where there is one (`src/trees.mjs`: treetops are the local maxima, crowns are voxelised
from the map, trunks run up under each top), else from mapped tree points.

## Placing designed modules

`node bin/irl.mjs compose <place>` builds the place and sets the design pipeline's modules on it from
`places/<place>.compose.json` (`src/place.mjs`): `centre` (whole, on the footprint's centre), `arc` (bent along a curved
footprint: a circle fit, an inverse map so the band has no holes, facings turned with the curve, never mirrored) and `at`
(at an offset in the footprint's box, turned by quarter turns, repeated). Each module can carry colour swaps
(`swap: [{ from, to, minY?, maxY? }]`) so the design run's files stay as they are; `node bin/irl.mjs modules <place> <dir>`
writes the modules with their swaps applied, for the catalog.

Nothing is left hanging in the air (`src/float.mjs`): after the modules go in, every piece not joined to the ground
through touching faces is found. One that nearly touches (a module's tower one course over its podium, a skylight or
chimney short of its roof, up to 6 blocks) is propped up with its own block; a tree crown whose trunk a placement cleared
is removed; whatever still floats (joined by no face, edge or corner) is listed with the placement it belongs to, so the
compose file or the kit can be fixed.

## Photographs (Chunky)

`node bin/irl.mjs world <place>` writes the place (composed, if it has a compose file) as a Minecraft Java world
(`src/anvil.mjs`: region files, 1.18+ chunk sections, a minimal level.dat) in `out/<place>/world/`: a single-player
save, and what Chunky reads. `node bin/chunky-shot.mjs <place> <name> --eye x,y,z --look x,y,z --sun alt,az` writes a
scene and renders it headless with [Chunky](https://github.com/chunky-dev/chunky) (GPL-3.0, installed separately: its
launcher jar in ~/.local/share/chunky-tool, the 1.21.1 textures via `-download-mc 1.21.1`, the 2.5 snapshot core via
`--updateAlpha`), path traced with the Nishita sky, to `out/<place>/shots/<name>.png`. Full quality is 3200x2000 at
1000 samples per pixel (about 15 minutes on this machine); below a few hundred samples the image is noisy.

## Adding a place

`node bin/irl.mjs landmark <no> sf/<site>` frames a place on one of San Francisco's Article 10 landmarks (its boundary,
plus 40 m, or `--half`), with the landmark's number, photo and designation document recorded.

Add `places/<city>/<site>.json` with `name`, `city`, `country`, `centre` [lat, lon] and `half` (metres from the
centre to the box's edge; optional `scale` blocks per metre, `sources` { layer: source id }). For a new city, add a
source file for its portal and list it first in `index.mjs`.

Washington DC (`city: "washington-dc"`, `src/sources/dc.mjs`): Open Data DC's footprints (named by the museum and
memorial points and the historic landmarks, joined to tax parcels), owner polygons with land use, historic landmarks,
DDOT centrelines, NPS and DPR parks and waterbodies (CC BY 4.0); the USGS Sandy NCR 2014 lidar. Optional place keys used
there: `peaks` { footprint id: metres } where the lidar caught a bird over a roof, and `parkPaths` { width, block } to
draw the walks inside parks wider and in their own surface (the Mall's gravel walks).

## Licences

Only sources whose licence allows building and publishing a derived model are used, and their credit lines go
wherever the build is shown (the manifest's `credits`). ODbL (OpenStreetMap) requires "© OpenStreetMap contributors";
CC BY 4.0 (the canopy maps) requires credit to Meta and WRI. Google's Photorealistic 3D Tiles are excluded: their
terms forbid models "extracted, traced, or otherwise derived" from them.

Reference images for the facades (not layers) live with the design run that uses them, each with its licence: the
lab's `benchmarks/plugin-baseline/runs/build-1/sf-landmarks/refs/LICENSES.md`.

## Scale

`scale` is blocks per metre (default 1; fractional is fine: lengths round to whole blocks). The San Francisco places use
1.4: a 7.6 m Painted Lady is 11 blocks wide, a storey about 5. Road, sidewalk and path widths, water depth and tree
limits are set in metres and scale with it. The volume is built in `src/voxels.mjs` (a palette and 2 bytes per cell,
written straight to a structure file), not the toolkit's grid (an object per block, ~640 bytes): 2:1 on a 320 m place
took 5 GB that way.

## Reference datasets (not layers)

- **San Francisco Landmark Dataset** (Stanford Digital Repository, https://purl.stanford.edu/vn158kj2087): 1.7M
  street-level building images, 640x480 (central PCIs and facade-aligned PFIs), with the building's latitude and
  longitude in each filename; 261 tars, 56.8 GB, grouped by panorama, not place. Use with citation: D. M. Chen,
  G. Baatz, K. Köser, S. S. Tsai, R. Vedantham, T. Pylvänäinen, K. Roimela, X. Chen, J. Bach, M. Pollefeys, B. Girod,
  R. Grzeszczuk, "City-Scale Landmark Identification on Mobile Devices," CVPR 2011. Its terms ask that it not be used to
  identify people: facades only. The first file of each tar locates the tar (a 512-byte range read); the nearest start
  about 0.9 km from Alamo Square and 1.7 km from the Palace, so a tar has to be listed to confirm coverage.
