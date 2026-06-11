# T-107-01 reconstructed-milestone — Progress

## Step 1 — stair-lens fix ✅
Root cause located during Research (NEW: T-097 left it unexplained): prismarine-viewer 1.33.0
`getModelVariants` short-circuits `block.name.includes('air')` — every `*_stairs` name contains
"air" ("st-AIR-s"), so ALL stairs meshed as air at every state. Block models were always present
in blocksStates/1.20.1.json; only the lookup dropped them.
- `render/scripts/patch-viewer-lens.mjs` (pure `patchSource` + idempotent CLI, postinstall-wired),
  `render/src/lens-guard.mjs` (import-time THROW if unpatched; imported by render.mjs),
  `render/test/stair-mesh.test.mjs` (patch core, installed-state, mesher emission for
  oak/spruce/deepslate_brick stairs, no-collateral slab/air).
- Patch applied + idempotency proven; render suite 46/46 green.
- Probe renders (research): /tmp/stair-probe.png (stairs invisible) vs /tmp/stair-probe-patched.png
  (correct stepped geometry).

## Step 2 — fixture card + prose pins ✅ (commit 48bcedb)
Card re-cut through the fixed lens: 25/25 read-back unchanged, stair rows VISIBLE (stepped
geometry confirmed in view-card-+x+z.png). NAMED_RESIDUALS emptied with retirement note;
roof-program LENS_NOTE + shaped-vocab comments updated (full-cube arch ring now stands on the
native-arch rationale alone). Root suite 1364/0.

## Step 3 — E-26 baselines pinned ✅
e26-baseline/v1 wrappers: cottage styled final @5574d70, gatehouse styled final @2201052, church
pre-component shell @48582f3 (church never completed a final — baseline = last completed stage).
Cottage census re-derives the AC numbers EXACTLY: 265 spikes / 21.7% ragged (gatehouse 118/14.1%,
church 602/24.3%).

## Step 4 — terminal runner ✅
`reconstructed-milestone.mjs` + `reconstructed:{cottage,gatehouse,church}` scripts;
`componentLayer` exported from component-skin.mjs (shared verification). Distills: instrument
deep-diff (pre-captured gate contract + judge model vs fresh; config-compared when no pre-record),
census before/after on pinned baseline vs fresh final, roof fit, cage outcomes, coverage-refusal
re-measurement, before/after sheets to pr/assets/frames, self-grep generalization proof
(zero subject keys — verified: the runner source contains none). CLI error paths + import smoke
tested; root suite 1364/0.

## Steps 5–7 — three subjects through the chain ✅ (three evidence commits)
- **cottage** (styled chain): kit presence PASS; resemblance FAIL 10/2 — 135°/225° now
  same-object, major form@roof persists at 45°/315° (gable-end massing). Census 265→51 spikes,
  21.7%→6.8% ragged. Instrument FROZEN (zero diffs vs committed pre-run gate record; judge
  claude-opus-4-8 pinned). Roof fit: 2 gables accepted; glb pitch rejected by the ladder on 1 side
  (divergence 5.59 recorded as the rejection cause — runner summary fixed to separate fit error
  from ladder-rejection divergence; cottage record regenerated via --distill-only, judge NOT
  re-rolled).
- **gatehouse** (styled chain): kit presence PASS (4 named kit skips); resemblance FAIL 11/2 —
  315° same-object; the 225° "colonnade instead of arched doorway" MAJOR gap is gone (arch reads
  as minor form@front doorway); major form@roof persists at 45/135/225°. Census 118→25 spikes,
  14.1%→9.9% ragged. Instrument FROZEN.
- **church** (challenge chain, kit-less by registry): honest refusal REPRODUCED at the skin
  coverage gate — band0 stone=0.327 < 0.5 with full census decomposition (basalt-dominant defined
  field: material-assignment divergence, not blob noise). Census on last completed stage
  (reconstructed shell): 602→202 spikes, 24.3%→14.0% ragged. Roof program named fallback; cage
  from standalone record named STALE. No gate ran — instrument untouched by construction.

## Step 8 — proofs ✅
--repro ×3 fresh-process: cottage REPRODUCES (styled sha match), gatehouse REPRODUCES, church
reproduces the same THROW with the same measured cause (exit 1 mirrors the refusal). --offline ×3:
milestone shas MATCH, baselines pinned, sheets present, instrument frozen/untouched. Confirmed
per-view coverage is censused on the OCCUPANCY's diagonal projection (surfaceZoneHistogram), not
pixels — the lens fix cannot move coverage arithmetic.

## Deviations from plan
- Step 5 surfaced a distillation defect (roofFit maxPitchDelta conflated ladder-rejection
  divergence with fit error) — fixed in the runner + `--distill-only` added (re-distills committed
  outputs without re-running chain/judge; the no-re-roll rule), cottage record regenerated.
- Step 8's repro/offline sweeps were executed per-subject inside steps 5–7 rather than as a
  separate pass.

## Step 9 — learnings + epic sheet ✅
E-27 section appended to design-learnings.md (five-whys → lens lesson → frozen-instrument proof →
per-subject outcomes → over/under-reach → E-12 handoff); pr/assets/reconstructed-milestone.md
epic sheet written. Final sweep: root suite 1364/1364, render suite 46/46.

## Done
All nine steps complete; review.md is the handoff.
