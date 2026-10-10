# Toolkit gaps (wizard tower)

- Dormers on a `pyramid` roof: `roof(..., dormers:[{face:"north",...}])` silently produced nothing (tried gable/shed, row 0/2, width 1/3); I hand-cut a glowing dormer into the cone. Closest: roof dormers. Needs: a dormer that works on steep pyramid/cone roofs, or a clear "dropped, because ..." note in the result.
- A real cone / leaning spire: pyramid roof is a square-stepped pyramid centred on the footprint; no way to lean or to taper to a point with a curved profile. Closest: `dome` profile "cone" or `roof pyramid`. Needs: roof option `lean:[dx,dz]` or a `cone` roof style on a rect.
- Chimney `rise` is relative to the roof apex, so a chimney at the roof edge towers over it (campfire ended at y30, 3 above the roof); I used a negative rise. Needs: `rise` measured from the local roof surface.
- Roof grows the grid silently when `grow:true`; with a steep pyramid the height was only discoverable by trial. Needs: `roof --detect`-style dry run reporting the height for a style/pitch.
- Jetty / overhanging storey: placed each storey and its upside-down stair brackets by hand. Needs: `jetty(g, {rect, y, out, bracket})` brush.
- Timber-frame wall: plaster + log posts + knee braces + plus-shaped round windows all hand-looped. Closest: `surround timber`, `pilasters profile timber`. Needs: `timberFrame(g,{rect,y,height,bay, window:'round'})`.
- Round windows: no round/oculus window brush for walls (only a pediment oculus). Needs `window shape=round|octagon` with frame ring.
- Balcony with railing and brackets: hand-placed deck + fence ring + stair brackets. Closest: `railing` treatment (top only). Needs `balcony(g,{rect, face, rail, brackets})`.
- Telescope / spyglass / small props (lightning-rod tube, tripod): no prop library. Closest: lightning_rod + fence.
- Ivy/vines: hand loop over wall cells with clustering. Closest: `vary`/`gradient` (block swaps only). Needs `ivy` treatment placing vine blocks (and leaf tufts) with strand continuation.
- Rocky mound / stairs up a rock base: hand-written height-field loop. Closest: landscaping.md brushes were not a fit for a tiny 13x13 plinth. Needs `moundBase`.
- Hanging lanterns on chains under overhangs: hand-placed; `fixtures at eaves` only works on facades found by face maps and could not reach the jetty corners.
- Glowing window: stained glass renders pale/pink without a light engine; had to put shroomlight in the glass cross to read as lit. Needs render support for light-emitting blocks (glow halo) so lit windows can be judged.
- `mcd paint ... surround` on an already-framed door reported "already detailed" and wrote 0 cells; unclear how to force/replace.
- Ladder inside a multi-floor shaft needs backing blocks at each floor because wall lines shift with the jetties; no stair/ladder brush that routes through floors.
