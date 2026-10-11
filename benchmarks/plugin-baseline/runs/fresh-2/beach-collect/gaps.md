# Toolkit gaps hit on the beach house

- Palm trees: no tree species for palms in `tree()` (oak/birch/dark_oak/spruce/azalea only). Placed jungle logs + jungle leaves by hand in a small `palm()` helper. Closest: `tree(..., "azalea")`, wrong silhouette.
- Palm fronds leave "orphan" leaf cells on the structure check (drooping tips); no way to mark leaves as intentionally free-hanging. Closest: `persistent=true` leaves.
- Roof is only one slab over one footprint: `mcd roof` takes one eave height, so a two-level house (lower volume with an exposed roof terrace) cannot get a preset roof on the lower part. Closest: `--footprint`/`keep`, but the lower terrace deck had to be hand-set as a floor plus a pane balustrade.
- `cafe` preset material is a grey, noisy andesite/deepslate mix that reads like a lid on a minimalist house. Had to pass my own palette through `--spec roof.json` (`material.mix`, `gradient: none`). Closest: `--material` with a palette name; no "smooth slate / flat membrane" palette exists.
- `cafe` preset overhang is fixed N2 S1 E1 W1; wanted the deepest cantilever on the sea side (south). Closest: `overhang` object in the spec; kept the preset default.
- No brush for a slat screen / louvre fins as free-standing garden screens: `louvres` works on an existing wall opening only. Hand-placed open birch trapdoors (fins) plus end posts.
- No outdoor furniture brushes: sun loungers (stairs + slabs + carpet), parasol (fence pole + wool disc) and a campfire pit were all hand-placed with `g.set`. Closest: `fixture`/`planter`, which only cover lamps and window boxes.
- No pool brush: sealed water in a quartz coping ring was hand-built (`containWater` is only run by `stream`/`waterfall`). Closest: `stream` with `level`.
- No glass-balustrade brush: used a single row of tinted panes by hand; `railing` treatment exists for `mcd paint` but needs a face map and cannot read as frameless glass with posts. Closest: `railing glass_pane`.
- `signboard` is a heavy wall board (planks + slab cap + stair brackets) tuned for a shopfront; on a minimalist wall the house number needed a dark panel with two hand-placed wall signs (`B.sign`). Closest: `plaque` with a 1-row band.
- `mcd render` draws glazing near-black (interior in shade, no light engine) so large glass walls read as black voids; there is no preview of reflective glass. Closest: tinted `light_blue_stained_glass_pane`.
- `mcd palette` flags white piers on white concrete as "trim invisible" but the piers read fine in shadow; no way to tag intent. Swapped piers to smooth_quartz to quiet the flag.
- `mcd new --from` scaffolds a guarded generator; staged builds (form -> roof tool -> finish) need three scripts plus a `make.sh`, there is no single-file flow when the roof is a CLI step. Closest: `roof()` from the library, but the instructions require the CLI dry run first.
- Daylight detectors for solar panels could not sit in the cafe roof: the roof slabs are `bottom` half at y=12 and a detector is a 6/16 block, so no flush placement. Left as a task.
