# Styled kit report — church (T-101-01, E-26)

The committed kit `kit/church.json` (sha256 `164a2f7e2bfe…`, immutable input — extraction pinned by `kit/church.raw.json`):

| block | role | form | where used | confidence | value check |
|---|---|---|---|---|---|
| `cobblestone` | main wall body / masonry infill of nave and tower | cube | band0 | high | flagged-mismatch |
| `stone_bricks` | quoins/corners, window surrounds, eaves & gable verge course, and base plinth | cube | corners-edges, trim, openings, base | high | verified |
| `spruce_planks` | main sloped nave roof sheeting | cube | roof | medium | flagged-mismatch |
| `spruce_stairs` | stepped pyramidal tower roof and the eave/verge course of the main roof | fixture | roof | medium | — |
| `spruce_door` | tower entrance door at the base | fixture | openings, base | medium | — |

Overrides into the shipped palette: `{}`.

## Kit presence on the styled build

**PASS** — every kit entry present at its grammar/dressing sites (fixpoint check, zero gaps)

Skips (recorded, never silent): panel:band0 (no-candidate); course (no-candidate); openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

**Kit-aware gate verdict: FAIL** — canonical records: `benchmarks/sculpture/multi-angle/church-styled.json`, `benchmarks/sculpture/styled/church.json`.
