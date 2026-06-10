# Styled kit report — cottage (T-101-01, E-26)

The committed kit `kit/cottage.json` (sha256 `8cc6d06dc850…`, immutable input — extraction pinned by `kit/cottage.raw.json`):

| block | role | form | where used | confidence | value check |
|---|---|---|---|---|---|
| `stone_bricks` | ground-floor / plinth walls | cube | band0, base | high | verified |
| `cobblestone` | base corner quoins and chimney stack | cube | corners-edges, base, roof | medium | flagged-mismatch |
| `spruce_planks` | roof field, timber framing beams and floor band | cube | roof, band1, trim | high | verified |
| `smooth_sandstone` | plaster infill panels between timbers | cube | band1 | medium | verified |
| `spruce_trapdoor` | window shutters / lattice infill | fixture | openings | medium | — |
| `spruce_door` | front entrance door | fixture | openings, base | medium | — |
| `lantern` | exterior light beside the door | fixture | openings, base | high | — |

Overrides into the shipped palette: `{"white_terracotta":"smooth_sandstone","dark_oak_planks":"spruce_planks"}`.

## Kit presence on the styled build

**PASS** — every kit entry present at its grammar/dressing sites (fixpoint check, zero gaps)

Skips (recorded, never silent): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

**Kit-aware gate verdict: FAIL** — canonical records: `benchmarks/sculpture/multi-angle/cottage-styled.json`, `benchmarks/sculpture/styled/cottage.json`.
