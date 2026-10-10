# Toolkit gaps hit (steampunk workshop)

- Round / curved relief on a flat wall (a gear window ring with teeth): no brush; hand-drew a 7x7 bitmap octagon. Closest: `arch` (openings only), `ring`/`disc` (horizontal only). Needs a vertical-plane `disc`/`ring` + teeth option.
- Pipes (thick copper runs with elbows, flanges and valves): hand-placed `copper_block` cells. No `pipe(g, {from, to, flange})` brush; closest `fixture`/`railing`.
- Valve wheels: nothing round on a wall; used `grindstone` as a stand-in.
- Crane / jib / gantry with chain-and-load: hand-placed logs, chain, barrel. No `crane`/`gantry` brush; closest `signboard hanging` (fence arm + chains).
- Chimney stacks (banded brick stack with cap and smoke): hand-filled boxes plus a campfire. No `chimney()` standalone brush; `roof ... chimneys` only works through the roof.
- False front / pediment over a sawtooth roof: roof() sawtooth gives the profile on the gable end, so a flat gear-window field had to be hand-filled; closest `falseFront`/`stepGable`, but they ignore sawtooth.
- `mcd roof` CLI has no `--glaze` flag (sawtooth glazed-face direction); had to call roof() from code. Preset `workshop` is hard-wired to `glaze: north`, which puts the sawtooth profile on the side walls instead of the front.
- Roof palette contrast guard rejects copper on red brick (tone 0.29) and swaps in slate; needed `contrast:false` + `why`. A copper preset with a patina mix would pass.
- Sawtooth roofs cannot have overhang/eaves (always 0) so the `--overhang 0 --why` bypass is needed; a cornice/drip-course option would help.
- Proud depth: the front only had 1 block of proud layer until I shifted the body back 1; a `grid.resize`-with-shift helper for "add a porch layer" would save hand-offset code.
- Mirror helper: building design left-to-right then flipping x (facings, hinges, stair corner shapes) had to be hand-written; `mirrorX` only mirrors paired sets, not a whole composition.
- Chimneys taller than the ridge conflict with the 14-tall cap: no way to say "stacks may exceed roof by N" in presets.
- Palette outlier check flags barrels/dark oak props as clashing; there is no way to mark intended accent blocks.
- Wall banners render as flat boards; no check that a patterned banner reads at street size.
