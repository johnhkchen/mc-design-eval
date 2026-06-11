# Generate-first vs the repair path — the E-29 head-to-head (S-115 / T-115-01)

The inversion the epic is named for, run and measured: **the voxelized TRELLIS blob never becomes
the build** — it is fit evidence and cage target only. Per subject, the full component set is
fitted from concept + GLB (every refusal named), the build is generated entirely from parameters +
kit (zero blob cells, machine-checked by provenance and re-proven by regenerating the artifact
byte-identically from the serialized fit record), skinned through the S-113 authority, settled by
the same op the kit-presence checker re-runs, and judged by the **frozen** kit-aware gate
(label `generated`; instrument-diff vs the committed styled-label records: `diffs: []` on all
three). Repair-path rows are the committed T-111-01 records (`reconstructed/<subj>.json`); the
church's freshest repair verdict is the post-T-113 `styled/church.json` gate, cited as such.

## The table

| | cottage gen-first | cottage repair | gatehouse gen-first | gatehouse repair | church gen-first | church repair |
|---|---|---|---|---|---|---|
| gate outcome | FAIL | FAIL | FAIL | FAIL | FAIL | refused @ settle (T-111); FAIL (post-T-113 styled) |
| gaps / budget | 12 / 2 | 10 / 2 | 12 / 2 | 12 / 2 | 12 / 2 | — (T-111); 12 / 2 (styled) |
| 45° verdict | drifted | drifted | drifted | drifted | drifted | — |
| 135° verdict | **same object** | **same object** | drifted | drifted | drifted | — |
| 225° verdict | drifted | **same object** | drifted | drifted | drifted | — |
| 315° verdict | drifted | drifted | drifted | drifted | drifted | — |
| kit presence | PASS (0 gaps, 0 skips) | PASS | PASS | PASS | PASS | — (T-111); PASS (styled) |
| spikes | **53** | 86 | **26** | 43 | **62** | 204 |
| ragged rate | 8.1% | 6.4% | **0.8%** | 8.1% | **9.9%** | 15.9% |
| zero blob cells | **PASS** (5,069 tagged) | n/a (blob substrate) | **PASS** (4,732 tagged) | n/a | **PASS** (7,859 tagged) | n/a |
| blob-position overlap (evidence) | 38.6% | ≈100% by construction | 36.0% | ≈100% | 39.2% | ≈100% |
| IoU vs GLB (4 az.) | .84–.87 | at blob ceiling | .74–.80 | at ceiling | .78–.84 | at ceiling |
| blob's own IoU ceiling | .89–.94 | — | .91–.93 | — | .87–.95 | — |
| fit refusals (named) | 13 | n/a | 20 | n/a | 31 | n/a |
| omitted unsupported masses | 0 | n/a | 3 | n/a | 2 | n/a |

Records: `benchmarks/sculpture/generated/<subj>.{json,md}` (+ artifacts, provision-fit, component
plan beside them), gate records `multi-angle/<subj>-generated.{json,md}`, sheets
`pr/assets/frames/multi-angle-<subj>-generated.png`. All three: double-run byte-identical,
`--repro` fresh-process MATCH, `--offline` re-asserts, self-grep `subjectKeysInRunner: []`.

## What it shows (losses are findings with causes — E-29 honesty)

1. **The inversion works as an instrument.** All three subjects run concept+GLB → fitted
   parameters → generated build → frozen gate, end-to-end, reproducibly, with zero blob cells —
   including the church, which the repair path could not even carry to its gate at T-111. The
   provenance check, the regenerate-from-record proof, and the instrument-diff receipts make the
   claim machine-checked, not narrated.
2. **Generate-first does not yet beat the repair path on the judge** — cottage 12 vs 10 gaps (and
   one fewer same-object view; the 135° hold survives both paths), gatehouse ties 12 = 12 (4/4
   drifted on both), church ties the styled repair verdict 12 = 12. **Roof FORM is THE gap on
   every azimuth of every subject** — the same conclusion the multi-angle gate has produced since
   E-27, now measured on builds whose roofs are *entirely* fitted+generated: the fits are honest
   but under-cover (gatehouse: one sane gable from a fragmented ridge record; church: nave gable +
   tower hip-cap fitted yet reading wrong; cottage: proportions). The fit error lives in the
   recorded refusals, not in hidden cells.
3. **Generate-first decisively wins the craft censuses.** Spikes drop 86→53 (cottage), 43→26
   (gatehouse), 204→62 (church); ragged 15.9%→9.9% on the church. Authored geometry has no
   voxelization noise to exorcise — the E-27 lesson, now holding for whole buildings.
4. **The hollow-shell topology is honest and visible.** Generated masses are wall slabs (the blob
   is a shell too — and true apertures are what let the openings detector, the dressing, and the
   kit-presence fixpoint all engage: 0 skips). The judges read the under-covered tops as "open
   hollow" massing gaps on gatehouse/church — a named consequence of refused roof fits, not of the
   topology itself.
5. **Blob overlap ~36–39%** at IoU-vs-blob ~.83–.86: the generated forms coincide with the
   evidence where the fits held and diverge where they refused — exactly what "the blob is
   evidence, not substrate" predicts. Set-intersection is recorded as evidence; provenance is the
   gate.

## The instrument's verdict on the inversion

The generate-first path is now a *peer* of the repair path under the same frozen ruler — equal or
−2 gaps on the judge, strictly cleaner under the craft censuses, with the blob's pathologies
(spikes, ragged columns, inherited surfaces that fail azimuths) replaced by *named fit refusals*
that point at exactly one seam: roof-form fitting. The next gap-closing work has an address.

---

## The fourth subject (S-116 / T-116-01) — first contact, and what it measured

The terminal milestone registered a subject no pipeline file had ever seen: **a rectangular stone
tithe barn** (`runs/017-vBuilding-…/concept.png`, S-094 checklist passed on attempt 1; the ticket's
L-plan coaching inn candidate was declined with recorded reasons — the roof ladder has no valley
rung, D2 decompose merges same-height L-wings into one mass, and a jetty is exactly what the
`mass-unsupported` support check prunes). Registration was registry-data only; the generalization
grep is clean over all six consuming runners (`grep -c "barn"` = 0 in challenge-/generated-/
styled-milestone, zone-map, multi-angle-gate, component-skin).

| | barn generate-first | barn untuned repair (challenge label) |
|---|---|---|
| gate outcome | **DID NOT RUN — named bootstrap stall** | FAIL |
| gaps / budget | — | 12 / 2 |
| per-view | — | 4/4 drifted (major form@roof + major massing@walls, every azimuth) |
| kit presence | — (kit never minted; the stall) | not run (no-kit-record) |
| reproducible | — | double-run byte-identical (final sha 80b66189…) |
| spikes (post-regularize) | — | 754 → 361 |

**The stall, with receipts.** The T-092 zone lens refused the barn concept:
`zone-map/barn.json` = `source: prior-fallback`, reason **`no-field-cells`**. Reproduced through
the exact extraction path: **cobblestone — the map's only `placementRule:"walls"` field block —
dominates ZERO quantized concept rows**; the wall rows are stone_bricks-dominated (piers/quoins/
plinth prominent at this aspect, and the cobble panels quantize INTO stone_bricks — the near-tone
pair, ΔL 2.082, far below shading variance). That is the E-21 mean-color collapse
(*material-identity-is-semantic*) surfacing in the zone lens. From there the chain is contractual:
`kit-extract` requires a concept-derived zone record (`src/form/kit.mjs:122` throws), and the
generated runner requires a committed kit (`generated-milestone.mjs:476` throws). Under E-25
Rule 3 (a new subject runs UNTUNED) relaxing either contract would be tuning-to-pass; the stall is
the measurement.

**What the fourth subject actually measured — a robustness asymmetry.** The repair path tolerates
an unreadable concept: its skin falls back to the registry prior (named) and it carried the barn
end-to-end to an honest 12/2 FAIL — the same verdict profile as the gatehouse. Generate-first
cannot start without a kit, and a kit cannot be minted without derived bands. The eleven-epic arc
gave the cottage many chances to harden each lens; the one-run thesis concentrates ALL of that
risk into input-prep preconditions. **First-run generalization is gated by the weakest lens, not
by the strongest generator.** The fix has one address and it is already named by E-26: recognize
blocks, don't color-match — the zone lens is the last color-matcher on the path (the kit prompt's
band references are its only consumer that hard-requires it). Routed to the next epic; not fixed
here.

**Pinned bar, honestly missed.** The T-116 target was the cottage's T-111 profile (kit PASS, ≥2/4
same-object, ≤10 gaps). Recorded result: not reached — not because the generator lost to the
judge, but because the milestone never reached the judge. The barn's repair row (12/2, 4/4
drifted) now sits in the table as the untuned-first-contact comparator the next attempt must beat.
