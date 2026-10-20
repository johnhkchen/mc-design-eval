# REQUIRED ELEMENTS (coordinates from plan.md; plot 0 frame x0..50 z0..53, plot 1 frame x55..108 z0..15)
Parts: P1 ground, P2 well, P3 prometheus, P4 flags, P5 gardens, P6 lights. Vocab names in brackets.

- [x] Ground of every column to the map (stone fill, surface per plan, half-step slabs, outer 2 blocks exact) - P1 - `groundColumn`, `halfStep`
- [x] Rockefeller Plaza street: gray_concrete road x4..12, smooth_stone_slab curbs x4/x12, crosswalk stripes z2..4 and 49..51, andesite-paved sidewalks x0..3 and 13..16 - P1 - `roadStrip`, `crosswalk`, `paverBand`
- [x] Street lamps x2,x14 z5,15,25,35,45: polished_blackstone_wall post 4 high + lantern(hanging=false) on top - P6 - `lampPost`
- [x] Sunken well 20..45 x 10..45, floor y0, andesite retaining walls y0..3 and smooth_stone surface y4 - P2 - `wellWall`
- [x] Ice rink packed_ice x24..39 y0 z14..41 with white_concrete rim ring y1 (gates x40 z25..28, z13/z42 x30..33), lanterns every 4th rim cell - P2 - `rinkRim`
- [x] Stepped granite edge / Channel Gardens steps x42..47 z20..33, full polished_andesite blocks, cheeks z19/z34 - P2 - `gardenSteps`
- [x] Stair-head planters x46..48 z17..19, 34..36 (blackstone curb, moss/grass soil, azalea shrubs) - P2 - `planterBox`
- [x] Sunken restaurants N/S: piers, glass_pane bays, double doors x32..33, ochre_froglight glow, tables - P2 - `glassFront`, `froglightBay`
- [x] Dining terraces with 6 umbrellas (birch_fence pole, 3x3 white_wool, hanging-free lantern) - P2 - `umbrella`
- [x] Parapets y5 with andesite_wall posts every 4th + iron_bars railing + lantern on posts - P2 - `parapet`
- [x] Pale granite promenade: smooth_stone field, polished_andesite grid bands every 6 and border - P1 - `promenadeField`
- [x] PROMETHEUS dark wall x18..19 y0..10 z18..37, blackstone bricks + deepslate_tiles panels, top course y10 - P3 - `darkWall`
- [x] Zodiac gold ring r4.5 on wall face x19 centre (y5.5,z27.5), 12 chiseled_polished_blackstone marks - P3 - `zodiacRing`
- [x] Inscription band y9 alternating raw_gold_block / blackstone bricks - P3 - `inscriptionBand`
- [ ] Fountain basin x20..22 z20..35, polished_blackstone floor/rim, water, cascade ledges with water sources - P3 - `basin`, `cascade`
- [x] Gilded mount: stepped gold cone x20..22 y1..4 z26..29 - P3 - `goldMount`
- [x] Prometheus figure: flying body along z, gold_block with raw_gold_block / yellow_terracotta modelling, raised arm, shroomlight fire y9 - P3 - `prometheus`
- [x] Gold ring plane x21 y2..9 z24..31 - P3 - `goldRing`
- [x] Water jets in basin (water source columns) - P3 - `basin`
- [x] Flag ring: end_rod poles y5..11 every 2 blocks on 4 sides, wool flags 2x2 mixed colours - P4 - `flagPole`
- [x] Channel Gardens: terraces 0/1/2, step-up slabs, walks, west head, east forecourt - P5 - `groundColumn`, `halfStep`, `paverBand`
- [ ] Six granite pools with prismarine_bricks floor, water, andesite rims, bronze jet - P5 - `pool`, `jet`
- [x] Planters with flowers/shrubs, blackstone curbs - P5 - `plantBed`
- [x] Benches (andesite stairs backed on curb) - P5 - `bench`
- [ ] Garden lamps x58..106 step 8, z2 and z13 - P6 - `lampPost`
- [ ] Dusk light: every walk, terrace, roof lit; no dark cell - P6 - `lampPost`, lanterns on parapet/rim
