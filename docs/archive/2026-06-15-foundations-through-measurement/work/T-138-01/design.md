# T-138-01 proportion-milestone — Design

Five decisions, each grounded in research.md. The frame: this is the epic terminal — its job is
to make the **chain of record** carry the proportion loop and then ask the judge once, not to
grow a fourth parallel runner family.

## D1 — Where the loop-with-hands lives: adopt into the chain (workshop.mjs + pattern-book.mjs)

**Options.**
- (a) **Adopt in place**: pattern-book stage 3 seeds the measured program and arms the proportion
  declarations; `workshop.mjs` (the chain's spawned loop) gains the hands `geometry-levers.mjs`
  proved — source threading, the injected re-recognize applier, the critique source block.
- (b) New terminal runner doing the whole loop in-process at new paths (the levers pattern).
- (c) Chain spawns `geometry-levers.mjs` instead of `workshop.mjs`.

**Decision: (a).** T-133's review hands exactly this to S-136/S-138 ("wiring
applyMeasuredProportions into stage 3 (and rotating the chain's seed/ledger/final pins)").
(b) leaves the chain of record squat forever — E-33's DoD ("programs carry measured dimensions…
the workshop checks proportion every round") describes the pipeline of record, not a side
experiment. (c) misfits: levers seeds itself from the committed T-127 seed (its AC) and writes to
T-136's namespace, which a sibling session owns mid-flight.

Conditionality rule (registry-level, no per-building constants): the hands engage **when the
runKey's recognition record + subject sketch exist** — true for all three chain subjects, false
for `fixture`, so `workshop:fixture` replay/offline and its committed ledger are untouched. The
loop core already threads `source` and ships the geometry applier in `DEFAULT_APPLIERS` (T-136);
workshop.mjs only loads source/sketch, passes `source` to the loop and to
`parseWorkshopReply`/`critiqueRenderArgs`, and injects the same re-recognize applier composition
levers uses (BAML `ReRecognizeMass`, strong tier, judge-reply bounds). Empty source block renders
zero bytes (T-136 S1 pin), so the fixture prompt stays byte-identical.

## D2 — Seed arming vs the chain's refuse-to-spend: arm AFTER the regularity verdict

Stage 3 throws if `seedWorkshopProgram(...).conformance` fails — correct for regularity (don't
spend on a broken seed), wrong for proportion: a seed failing proportion-vs-concept is exactly
what the loop exists to fix (the measured cottage seed will fail roofShare: 0.3548 vs 0.293,
Δrel 0.211 > 0.15).

**Decision:** stage 3 computes the refusal verdict on the measured program **without**
proportion declarations (status quo semantics: regularity-only), then merges
`declarations.proportions = deriveProportionDeclarations({sketch})` into the workshop program it
commits as the seed. The committed seed therefore arms every loop round (runConformance appends
proportion-vs-concept whenever declarations are present — T-135), the round-0 "before" shows the
honest failing ratios, and the no-regress predicate bounds revisions from there. The chain record
gains `measured` (per-parameter sources + conflicts from `applyMeasuredProportions`) and
`proportionsDeclared`, plus the seed's proportion ratios reported (not gating the refusal).

Rejected: arming before the refusal check (chain refuses → cottage never runs); arming only
inside workshop.mjs (the seed pin would lie about what the loop ran under; replay re-derives
declarations from the committed seed today).

## D3 — The steep door through the lever and the measured seam

`applyGeometryAdjust` sets `mass.roof.pitchClass` blindly; `roof.gable` refuses >1 (schema max 1)
and `roof.gable.steep` is enum [2,3]. So a model aiming pitch 2 today gets apply-failed → the
saltcrag steep unlock is unreachable through the lever. Same gap in `applyMeasuredProportions`
(snap keeps the idiom name) — latent, since both sketches measure ≤1 (TRELLIS flattening), but
the seam must be correct.

**Decision:** one exported helper in `src/recognition/compile.mjs` (which already owns the
steep↔base family fact at its course-row fallback): `roofIdiomForPitch(idiomName, pitchClass)` —
returns the `.steep` variant iff class > 1, the base variant iff ≤ 1, identity for non-gable
families (steep hip/pyramid are not offered — T-134 names this; an out-of-vocabulary aim remains
an honest apply-failed). Consumed by the geometry applier (re-aim before recompile) and by
`applyMeasuredProportions` (re-aim recorded as a note beside the snap). No new imports of the
idiom registry outside the allowlisted doors; the rule is a name-pair convention compile already
encodes, now in one place.

Honesty consequence (recorded, not engineered around): no measured number demands >45° today, so
steep realization in these runs can only come from the **model aiming the lever** under the
failing ridgeToEave check (saltcrag affords class 2; rustic's [1] makes any steep aim a named
refusal). Either outcome is the capability finding the AC asks for; the ledger is the evidence.

## D4 — Judge runs, labels, pins: re-roll the patternbook labels with explicit rotation

**Options.**
- (a) Re-run `gate:patternbook:{cottage,barn,barn:saltcrag}` with `--rotate-pins` — the same
  labels, retired pins named; the chain re-runs likewise rotate seed/ledger/final/record pins.
- (b) New gate labels (`<key>-proportion`) and a parallel chain namespace — zero rotations,
  baselines stay live.

**Decision: (a).** The AC's "pins rotated under T-119 with retired pins named" presupposes
retirement; T-137's review says "T-138 should rotate pins explicitly when re-running gates";
T-133 assigns the chain-pin rotation here; and `pattern-book-compare` + the witnesses all key on
the `patternbook` label — (b) would fork the record families the epic is supposed to converge.
The cottage's re-rolled record is "its first pattern-book verdict" (the retired one is a
refusal, not a verdict).

**Named collateral (the cost of (a), carried honestly):**
- Baselines must be **quoted before rotation**: a first, model-free step captures the three
  baseline aggregates (slug, sha, decided/passed, gapCount, severities, the cottage refusal) into
  a committed record; the retired bytes remain in git history at named shas.
- T-135's and T-137's witness records consume the T-127-era committed records; after rotation
  their `--repro` degrades to the **named skip-on-pin-mismatch** path (the T-137
  gatehouse-current precedent), not silent breakage. Recorded in the milestone record + review.
- The sibling T-136 levers records' `refs.seed.sha256` will no longer match the rotated chain
  seed — input-ref drift of the recorded kind (challenge-repro precedent: name it, never
  regenerate their pins). Their replay byte-compare runs off their own ledger and survives.

## D5 — The milestone record, the glance page, and spend sequencing

A new **compare/report runner** (outside the workshop isolation scan, beside
`pattern-book-compare.mjs` — it reads gate records by path, convenes nothing): composes per
subject the before/after silhouette ratios (seed → final via the T-135 prefix replay), the
conformance trajectory, lever-use citations from the ledger (geometry/recognize rounds, accepted
or rolled back), baseline-vs-new verdict movement (gap count + severity), **both gap-budget
arithmetics with the ≤2-recalibration question flagged, not decided** (E-33 Rule 3), and the
glance sheets beside the concepts → `pr/assets/proportion-milestone.md` + a JSON record.
Deterministic over committed inputs (baselines record + new records); re-run → byte-identical.

**Spend order** (probe `claude -p` minimally before each spend block — the sibling run hit the
monthly limit at 10:24pm; the seam answered at 10:30pm): all code + tests first (no spend);
baseline capture + saltcrag measured record (model-free); then per subject **serially** —
chain live (the loop's ≤6 strong-tier exchanges) → `--repro`/`--offline` green → gate live
(4 judge views) → `--offline` green → commit — barn first (cheapest risk: 1–2 failing ratios),
then saltcrag barn, then cottage (most rounds expected). A mid-run exhaustion leaves an honest
`exchange-refused` ledger or a gate refusal: committed as the partial state, flagged in review;
nothing is weakened to pass.

## Rejected wholesale

- Re-judging the OLD T-127 cottage final artifact under the patternbook label "because T-137
  unblocked it": spends judge calls on a build the epic already superseded; the AC wants the
  cottage's verdict on the loop's output.
- Calibrating the 0.15 tolerance or the ≤2 gap budget here (E-33 Rule 3 — reviewer's).
- Touching the gate's thresholds/azimuths/judge contract (frozen instrument; T-137 moved the
  precondition arithmetic, nothing else moves).
- Concept-mask proportion targets (both concepts fail the segmentability guard — T-135; targets
  stay sketch-sourced with the honesty note).
