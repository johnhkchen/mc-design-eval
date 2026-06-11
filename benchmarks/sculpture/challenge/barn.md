# Challenge milestone — barn (T-095-01)

One command, the whole E-25 chain: provision (GLB+map, untuned) → shell integrity (T-091) → regularization cage (T-102) → concept-derived zones (T-092) → E-24 full-shell skin → multi-angle same-object gate (T-093). **Reproducible**: double-run byte-identical, final sha256 `80b66189c6377e36…`.

## Provision (challenge subject — first contact with the pipeline)
Scale 48, 3579 cells, 4 manifest blocks — GLB + committed material map, zero tuning.

## Shell integrity (T-091)
Strip 139 → 26 components (276 cells); voids 454 filled (minDepth 3); plug 1813 cells / 1 iter → **CLOSED** (before: 4394/4476 reachable). Openings honored: window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window, window.

## Regularization cage (T-102)
- **open** ACCEPTED (removed 0, added 0, plugged 0)
- **close** ACCEPTED (removed 0, added 1578, plugged 9)
Spikes 754 → 361; ragged 48.9% → 39.6%; IoU vs GLB held at all 4 azimuths (caged, rejected steps rolled back).

## Skin (T-086/T-092/T-090/E-23/T-087/T-088)
Zone map: **prior-fallback** (no-field-cells).
Substitution `{"stone_bricks":"polished_deepslate"}`; kit (none). Fill 702; salt 156 stripped. Coverage gate **final PASS** — base `cobblestone` 31% · roof `dark_oak_planks` 100% · upper `cobblestone` 65%. Bands: roof 100%, residue base 0% · upper 0%.

## Multi-angle gate (T-093) — **FAIL** (gaps 12/2)

![sheet](../../../pr/assets/frames/multi-angle-barn-challenge.png)

| view | azimuth | coverage | verdict | gaps |
|---|---|---|---|---|
| +x+z | 45° | pass | drifted | major form@roof ridge and slopes; major massing@long walls and overall body; minor palette@roof and walls overall |
| +x-z | 135° | pass | drifted | major form@roof ridge and slopes; major massing@long wall and eave line; minor material zoning@overall stone-vs-timber zoning across walls and roof |
| -x-z | 225° | pass | drifted | major form@roof; major massing@long walls / overall enclosure; minor material zoning@stone wall zone vs timber |
| -x+z | 315° | pass | drifted | major form@roof ridge and slopes; major massing@overall body and long walls; minor palette@roof and walls |

Gate record: `benchmarks/sculpture/multi-angle/barn-challenge.json` (the sheet is the verdict artifact — E-25 Rule 1).

## Evidence
- final -x-z: benchmarks/sculpture/challenge/barn/view-final-oblique225.png
- final front: benchmarks/sculpture/challenge/barn/view-final-front.png
- final top: benchmarks/sculpture/challenge/barn/view-final-top.png

Frames: pr/assets/frames/challenge-barn-after.png

> provision→shell→skin is a pure function of the committed inputs (concept PNG, material map, GLB, kit); two in-process executions byte-matched on every artifact; --repro re-proves from a fresh process. LLM-authored inputs are one-time committed records; the gate judge is the pinned model, single sample per view, verdicts committed in the gate record.
