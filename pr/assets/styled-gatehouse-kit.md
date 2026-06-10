# Styled kit report — gatehouse (T-101-01, E-26)

The committed kit `kit/gatehouse.json` (sha256 `583bcb85d57d…`, immutable input — extraction pinned by `kit/gatehouse.raw.json`):

| block | role | form | where used | confidence | value check |
|---|---|---|---|---|---|
| `stone_bricks` | main wall body / coursed masonry of the structure | cube | band0, openings | high | verified |
| `cobblestone` | corner quoins and the eave/trim band capping the walls | cube | corners-edges, trim | high | thin-sample |
| `deepslate_bricks` | roof field (the sloped dark brick courses) | cube | roof | medium | verified |
| `stone_brick_stairs` | stepped roof eaves / verge and ridge edging | fixture | roof | medium | — |
| `dark_oak_planks` | arched door surround / lintel framing the gateway opening | cube | openings | medium | flagged-mismatch |

Overrides into the shipped palette: `{"deepslate_tiles":"deepslate_bricks"}`.

## Kit presence on the styled build

**PASS** — every kit entry present at its grammar/dressing sites (fixpoint check, zero gaps)

Skips (recorded, never silent): openings:infill (kit names no treatment for this slot); openings:shutters (kit names no treatment for this slot); openings:door (kit names no treatment for this slot); openings:light (kit names no treatment for this slot)

**Kit-aware gate verdict: FAIL** — canonical records: `benchmarks/sculpture/multi-angle/gatehouse-styled.json`, `benchmarks/sculpture/styled/gatehouse.json`.
