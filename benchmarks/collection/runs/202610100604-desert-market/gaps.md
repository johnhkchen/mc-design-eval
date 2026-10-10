# Toolkit gaps (desert market hall, 2026-10-10 run)

- `mcd roof --detect/--dry-run` on a roofless shell mis-detects the footprint (reads my awning stairs at y4 as an old roof); had to dry-run through roof(g, rects, "desert", {dryRun:true}) from code. Needs `--footprint x0,z0,x1,z1[;...]` on the CLI.
- Preset `desert` hard-codes a front-left 3x3 wind tower (height 2) that cannot be moved or styled from the preset (only `tower:false`); built the wind tower by hand (3x3 fill + trapdoor vents + slab cap). Closest: roof `tower` option.
- Striped sloped awning: placed by hand in a loop (stairs + slab soffit + fence posts + lanterns). Terracotta has no stairs, so stripes are red_sandstone/quartz; no `awning` brush (closest: `bunting`, banners only).
- Vigas (beam-end rhythm on 4 sides): hand-placed dark_oak_log stubs; no `vigas` brush (closest: `brackets`).
- Thick rounded adobe walls on a non-rectangular plan: union of two rects looped by hand; no wall-shell brush for chamfered plans and no per-skin material layering (closest: `shell`).
- Dome r=3 on a 3-tall budget reads as a stepped pyramid; `dome` has no band/stripe option (orange course done by replacing stairs in a loop) and no smoother small-radius profile.
- Market props (clay pots, baskets, goods): hand-placed decorated_pot/barrel/hay_block/composter; no prop-cluster brush (`planter` only does boxes/beds).
- Orange terracotta band round the building: a manual loop over skin cells; `paint ... courses` bands every n rows but not "rows 2-3 on every face".
- `mcd palette` flags the monochrome sandstone trim and the quartz/orange awning stripes as invisible/outliers; no way to declare "monochrome by design".
- Entrance steps: no stair-up that also keeps the interior floor level when the building floor is y0 (needs `plinth`-style forecourt brush).
- Glass panes render see-through end to end in elevations, so a window in both side walls looks like a hole through the building.
