# Challenge milestone — cottage (T-095-01)

One command, the whole E-25 chain: shell integrity (T-091) → regularization cage (T-102) → concept-derived zones (T-092) → E-24 full-shell skin → multi-angle same-object gate (T-093). **Reproducible**: double-run byte-identical, final sha256 `347def099ef05da1…`.

## Shell integrity (T-091)
Strip 24 → 1 components (156 cells); voids 958 filled (minDepth 3); plug 462 cells / 1 iter → **CLOSED** (before: 2417/2424 reachable). Openings honored: window, window, window, window, window, window, window, window.

## Regularization cage (T-102)
- **open** ACCEPTED (removed 5, added 0, plugged 0)
- **close** ACCEPTED (removed 0, added 2332, plugged 0)
Spikes 276 → 57; ragged 23.9% → 9.6%; IoU vs GLB held at all 4 azimuths (caged, rejected steps rolled back).

## Skin (T-086/T-092/T-090/E-23/T-087/T-088)
Zone map: **concept** — band0 y0..7 `stone_bricks`, band1 y8..18 `white_terracotta`; roof `dark_oak_planks`. Derived vs committed record: **diverged** (chain runs on the repaired shell; recorded, not gated).
Substitution `{"stone_bricks":"tuff","white_terracotta":"sandstone"}`; kit kit/cottage.json. Fill 1004; salt 346 stripped. Coverage gate **final PASS** — band0 `tuff` 65% · roof `spruce_planks` 76% · band1 `smooth_sandstone` 60%. Bands: roof 100%, residue band0 0% · band1 0%.

## Multi-angle gate (T-093) — **FAIL** (gaps 11/2)

![sheet](../../../pr/assets/frames/multi-angle-cottage-challenge.png)

| view | azimuth | coverage | verdict | gaps |
|---|---|---|---|---|
| +x+z | 45° | pass | drifted | major form@overall roof and upper storey; major massing@roof eaves and ridge; minor material zoning@timber-frame upper walls |
| +x-z | 135° | pass | same object | minor form@roof ridge and eaves; minor massing@chimney on the roof |
| -x-z | 225° | pass | drifted | major form@roof; minor form@roof eaves/beams; minor material zoning@lower walls (stone base + cream storey) |
| -x+z | 315° | pass | drifted | major form@roof — far slope and ridge; minor massing@upper timber-frame storey, right gable end; minor material zoning@stone ground floor at building corner |

Gate record: `benchmarks/sculpture/multi-angle/cottage-challenge.json` (the sheet is the verdict artifact — E-25 Rule 1).

## Evidence
- final -x-z: benchmarks/sculpture/challenge/cottage/view-final-oblique225.png
- final front: benchmarks/sculpture/challenge/cottage/view-final-front.png
- final top: benchmarks/sculpture/challenge/cottage/view-final-top.png
- e23-before -x-z: benchmarks/sculpture/challenge/cottage/view-e23-before-oblique225.png

Frames: pr/assets/frames/challenge-cottage-before.png, pr/assets/frames/challenge-cottage-after.png

> provision→shell→skin is a pure function of the committed inputs (concept PNG, material map, GLB, kit); two in-process executions byte-matched on every artifact; --repro re-proves from a fresh process. LLM-authored inputs are one-time committed records; the gate judge is the pinned model, single sample per view, verdicts committed in the gate record.
