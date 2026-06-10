# Styled milestone — gatehouse (T-101-01, E-26 terminal)

One command, the whole E-26 chain: kit (committed, T-096) → shell integrity (T-091) → skin (T-086 value-true → kit overrides → seal → T-092 zones → T-090 fill → T-087 coherence → T-088 gates) → placement grammar (T-098) → opening dressing (T-099) → grammar settle (the T-100 fixpoint seam) → kit-aware multi-angle gate (T-100 ∘ T-093). **Reproducible**: double-run byte-identical, styled sha256 `3ea1c65bd03a117c…`.

## Shell integrity (T-091)
Strip 23 → 3 components (221 cells); voids 820 filled; plug 54 cells / 1 iter → **CLOSED**. Openings honored: window, window, door, window, window, door.

## Skin (T-086/T-096/T-092/T-090/T-087/T-088)
Zone map: **concept** — band0 y0..20 `stone_bricks`; roof `deepslate_tiles`. Substitution `{"stone_bricks":"polished_basalt"}`; kit overrides `{"deepslate_tiles":"deepslate_bricks"}`. Fill 170; salt 245 stripped. Coverage gate **final PASS** — band0 `polished_basalt` 74% · roof `deepslate_bricks` 63%.

## Placement grammar (T-098)
Frame `cobblestone`: 548 painted, 16 adopted, 294 respected, 2 isolates skipped, 81 already; fill 10 / kept 5660; **frameRefilled 0** (survival proof); coverage + band evidence re-asserted PASS.

## Opening dressing (T-099)
12 concept-declared apertures; 51 placements (0/12 fully dressed, 36 conflicts, 0 already dressed). Unfulfilled slots: infill (no kit entry routes to this slot), shutter (no kit entry routes to this slot), door (no kit entry routes to this slot), light (no kit entry routes to this slot). Derivations: none.
Settle (the T-100 seam): grammar re-run to its own fixpoint in 2 iteration(s) (frame 0 + fill 6; frame 2 + fill 0) — the styled build is a no-op for the op the kit-presence checker re-runs.

## Kit-aware multi-angle gate (T-100 ∘ T-093) — **FAIL**

Resemblance: FAIL (gaps 12/2) · Kit presence: PASS (zero gaps)

![sheet](../../../pr/assets/frames/multi-angle-gatehouse-styled.png)

| view | azimuth | coverage | verdict | gaps |
|---|---|---|---|---|
| +x+z | 45° | pass | drifted | major form@roofline along the top; major massing@overall building mass and footprint; minor material zoning@front and side walls |
| +x-z | 135° | pass | drifted | major form@roof / ridge line; minor massing@upper walls and eaves; minor palette@stone base and dark-wood trim |
| -x-z | 225° | pass | different object | major massing@overall building mass; major form@roof — the gabled pitched roof of the concept/mesh; major form@walls and entrance — should be a closed stone box with an arched door, instead reads as open colonnaded ruin |
| -x+z | 315° | pass | different object | major massing@overall building body; major form@walls — open colonnade of vertical columns instead of solid stone walls; major form@roof and ridge |

Gate record: `benchmarks/sculpture/multi-angle/gatehouse-styled.json` (the sheet is the verdict artifact).

## Evidence
Frames: pr/assets/frames/styled-gatehouse-before.png, pr/assets/frames/styled-gatehouse-after.png; kit report `pr/assets/styled-gatehouse-kit.md`.

> kit→shell→skin→grammar→dressing is a pure function of the committed inputs (concept PNG, material map, GLB, kit); two in-process executions byte-matched on every artifact; --repro re-proves from a fresh process. LLM-authored inputs are one-time committed records (the kit's raw model reply is pinned beside it); the gate judge is the pinned model, single sample per view, verdicts committed in the gate record.
