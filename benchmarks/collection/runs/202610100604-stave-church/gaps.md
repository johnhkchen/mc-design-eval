# Toolkit gaps (stave church)

- Preset `church`/tiered builds a pagoda-like ring-lean-to tiers; I needed gabled stacked roofs per tier with a front gable (the concept) — closest: `--preset church` with `top: gable`, `tiers: 2`; had to drop to 2 tiers.
- No way to size the tiered roof to a total height cap (spire + 3 tiers overshot 22 by ~5): I found the fit by trial (pitches [1,1.25], tower height 0).
- `tower` option `at` is the corner, not the centre; `height` 0 still adds a 4-5 block spire; spire material is hard-wired (black stone brick) with a copper lightning rod — no cross/finial option.
- The dry run under-reports the roof height of tiered presets (12 vs 14 real) and the real run still warns ROOF_TOO_TALL for the church preset (ratio 1.71-2.0 vs cap 1.8); the plinth counts as wall height.
- `ROOF_CONTRAST_OFF` note is emitted by the tiered form itself (it passes contrast:false), with no way to see the real contrast result.
- Dragon-head ridge ends: the preset makes only corner curls; the ridge-end carved dragon head was hand-placed (stairs/trapdoor/planks in `dragon()`); closest: `ridgeEnds: "dragon"` (corners only), `finial`.
- Gallery/arcade (svalgang): posts, rail and beam courses placed by loops; no arcade/colonnade brush with railing and beams (closest: `pilaster` profile timber, `fixture`).
- Door portal with carved timber frame and lanterns hung from chains: placed by hand; `surround` timber is for windows/doors but I did not trust it on a door in a dark wall.
- Staves (vertical log pattern with panel infill) hand-looped; `mcd paint` has no "stave" bay rule.
- `mcd palette` evaluates the tiered roof poorly (eave y=11, roof 106 cells; flags dark_oak band as roof==walls) — roof tone check misreads the wood bands.
- Gable wall relief (saltire bracing, window grid) not available as a roof option; closest: `pediment.tympanum`, `dormers`.
