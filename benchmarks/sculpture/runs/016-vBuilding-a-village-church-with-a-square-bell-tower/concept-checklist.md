# Concept sanity checklist — `church` (T-094-01)

Gate BEFORE registration (E-25 Rule 2: once registered, the concept is immutable). Items 1–6 are
the standing checklist; item 7 is the subject-specific TRELLIS-viability constraint from the
ticket. Judged by visual inspection of the PNG. Provisioning: `provision-concept.mjs`
(vConcept building mode, stages 1+2; design doc by the pinned Phase-1 model, image by Nano
Banana pro via the BAML `BuildingConceptPrompt`).

## Attempt 1 — `concept-attempt-1.png` — ✗ REJECTED

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Single building | ✓ | One church; no second copy, no turnaround panels |
| 2 | Clean background | ✓* | Solid uniform white (prompt asks #000000; pro returned white — the gatehouse precedent; TRELLIS's internal rembg coped there) |
| 3 | One canonical 3/4 view | ✓ | Two facades + roof read at once, slightly from above |
| 4 | ≥3 distinct material zones | ✓ | Cobble walls · dark-oak roof · timber door · stone-brick quoins/trim · gold accent |
| 5 | Readable silhouette | ✓ | Tower + steep nave gable, instantly "church" |
| 6 | No environmental clutter | ✓ | No ground plane, scenery, or shadows |
| 7 | **Bulky throughout** | **✗** | **Thin freestanding GOLD CROSS finial atop a tapering spire — exactly the forbidden thin member (TRELLIS thin-subject 500 risk; sword precedent)** |

Action: regenerated with `--attached` steering ("no cross/finial/thin spire; low stepped
pyramidal cap with a blunt ≥2×2 top; ignore the design doc's cross"). The stage-1 design doc
(which specifies a `gold_block` cross finial) was kept — the steering note overrides it at the
image stage, and the doc remains the honest stage-1 record.

## Attempt 2 — `concept.png` — ✓ PASSED (registered)

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Single building | ✓ | One church |
| 2 | Clean background | ✓* | Solid uniform white (same fallback note as attempt 1; accepted — segmentation proven on the gatehouse; regen black-bg only if TRELLIS segmentation struggles) |
| 3 | One canonical 3/4 view | ✓ | Two facades + roof, slightly elevated turntable view |
| 4 | ≥3 distinct material zones | ✓ | Grey cobble wall field · lighter stone-brick quoins/buttresses/window trim · dark-oak roof planks · dark timber door |
| 5 | Readable silhouette | ✓ | Long steep-gabled nave + taller square bell tower; the two-mass L reads from one glance |
| 6 | No environmental clutter | ✓ | Floating on uniform white; no terrain/path/sky |
| 7 | Bulky throughout | ✓ | Tower cap is a LOW STEPPED PYRAMID ending in a blunt chunky block cluster (~2×2); no cross, no pole, no thin freestanding member anywhere |

Ticket-shape confirmation: two attached masses (nave + square bell tower) · two roof forms
(pitched nave gable + pyramidal tower cap) · ≥3 material zones (stone walls, dark roof, timber
door, light trim) — matches the AC's subject definition.

## Sign-off (after GLB + voxelization smoke-check)

_Pending — filled after `trellis-glb.mjs` → `glb-smoke.mjs` (single-bulky-mass gate at the
working scale 48)._
