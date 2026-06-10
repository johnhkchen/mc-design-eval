# Styled milestone — cottage (T-101-01, E-26 terminal)

One command, the whole E-26 chain: kit (committed, T-096) → shell integrity (T-091) → skin (T-086 value-true → kit overrides → seal → T-092 zones → T-090 fill → T-087 coherence → T-088 gates) → placement grammar (T-098) → opening dressing (T-099) → grammar settle (the T-100 fixpoint seam) → kit-aware multi-angle gate (T-100 ∘ T-093). **Reproducible**: double-run byte-identical, styled sha256 `6c94b04ce4885aba…`.

## Shell integrity (T-091)
Strip 24 → 1 components (156 cells); voids 958 filled; plug 462 cells / 1 iter → **CLOSED**. Openings honored: window, window, window, window, window, window, window, window.

## Skin (T-086/T-096/T-092/T-090/T-087/T-088)
Zone map: **concept** — band0 y0..6 `stone_bricks`, band1 y7..16 `white_terracotta`; roof `dark_oak_planks`. Substitution `{"stone_bricks":"tuff","white_terracotta":"sandstone"}`; kit overrides `{"white_terracotta":"smooth_sandstone","dark_oak_planks":"spruce_planks"}`. Fill 1993; salt 413 stripped. Coverage gate **final PASS** — band0 `tuff` 75% · band1 `smooth_sandstone` 71% · roof `spruce_planks` 72%.

## Placement grammar (T-098)
Frame `spruce_planks`: 426 painted, 5 adopted, 201 respected, 8 isolates skipped, 211 already; fill 25 / kept 5962; **frameRefilled 0** (survival proof); coverage + band evidence re-asserted PASS.

## Opening dressing (T-099)
6 concept-declared apertures; 37 placements (1/6 fully dressed, 7 conflicts, 0 already dressed). Unfulfilled slots: none. Derivations: [{"slot":"infill","block":"spruce_fence","from":"spruce_trapdoor","reason":"no rail entry in kit; species-matched fence derived from the shutter block (the kit declared the window grille unidentified)"}].
Settle (the T-100 seam): grammar re-run to its own fixpoint in 1 iteration(s) (frame 1 + fill 0) — the styled build is a no-op for the op the kit-presence checker re-runs.

## Kit-aware multi-angle gate (T-100 ∘ T-093) — **FAIL**

Resemblance: FAIL (gaps 12/2) · Kit presence: PASS (zero gaps)

![sheet](../../../pr/assets/frames/multi-angle-cottage-styled.png)

| view | azimuth | coverage | verdict | gaps |
|---|---|---|---|---|
| +x+z | 45° | pass | drifted | major form@roof; minor material zoning@upper walls / timber framing; minor massing@overall house body |
| +x-z | 135° | pass | same object | minor form@roofline and ridge; minor massing@chimney on the roof; minor material zoning@timber-framed cream upper walls |
| -x-z | 225° | pass | drifted | major form@roof; minor material zoning@upper walls timber framing; minor massing@overall house body |
| -x+z | 315° | pass | drifted | major form@roof; minor material zoning@upper walls / timber framing band; minor massing@overall body |

Gate record: `benchmarks/sculpture/multi-angle/cottage-styled.json` (the sheet is the verdict artifact).

## Evidence
Frames: pr/assets/frames/styled-cottage-before.png, pr/assets/frames/styled-cottage-after.png; kit report `pr/assets/styled-cottage-kit.md`.

> kit→shell→skin→grammar→dressing is a pure function of the committed inputs (concept PNG, material map, GLB, kit); two in-process executions byte-matched on every artifact; --repro re-proves from a fresh process. LLM-authored inputs are one-time committed records (the kit's raw model reply is pinned beside it); the gate judge is the pinned model, single sample per view, verdicts committed in the gate record.
