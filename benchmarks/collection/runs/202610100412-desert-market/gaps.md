# Toolkit gaps (desert market hall)

- Sloped striped awning (stairs rising toward the wall on posts with a valance): placed by hand in a loop; no `awning` brush (closest: `bunting`, which is banners only).
- Clay pots / woven baskets / market goods: no prop brush; placed decorated_pot, barrel, hay_block, composter by hand. `planter` only does window boxes/raised beds.
- Rounded ("chamfered adobe") plan corners and thick 2-wall shells: had to loop over two overlapping rectangles by hand; `roof()` flat-parapet accepted the union, but there is no wall-shell brush for non-rectangular plans (closest: `shell`, rectangular only).
- Vigas (protruding beam ends on a rhythm): hand-placed log stubs on all four sides; no `vigas` / `beam-ends` brush (closest: `brackets`, which is stairs/slabs only).
- Wind tower / malqaf with vent slots and stepped cap: filled a 3x3 shaft and placed vents by hand; `cylinder` with shape square radius 1 produced a plus shape instead of 3x3 (doc says 3x3).
- Dome profiles at radius 3 on a flat deck read as a stepped pyramid (no smooth silhouette at r<=3); `dome` has no band/stripe option for an orange course (closest: `bands` on `cylinder`).
- `roof` flat-parapet: no option for a coping material distinct from the deck or for railing only on selected sides; used `paint` railing rules with explicit x ranges. The `trim` (coping) vs `material` (deck) split worked but the deck's mud-brick slab merges with the coping.
- `paint` returns a COPY (grid in `.grid`); easy to lose the railing by calling it like a mutating brush. Weather/vary on sandstone produced diorite/calcite/dripstone speckle (wrong family variants for sandstone); I disabled it. Needs a sandstone family (cut/smooth/chiseled only).
- `check` circulation treats doors as walls and ignores doorsteps outside the box, so end-to-end along x reported false even with side doors; and earlier returned true only via viga logs on the deck. Needs door-aware walking and a street-edge parameter.
- `check` flags the (intentional) white quartz awning stripes as outliers and flags sandstone-on-sandstone trim in a monochrome desert palette; no way to declare "monochrome by design".
- Wall signs on the front (MARKET / HALL flanking a viga) are hand-placed `B.sign`; `plaque`/`signboard` could not fit a 1-cell-high band between awning and viga.
