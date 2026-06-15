# T-122-01 ridge-height-closure — Design

## The diagnosis the design must answer (research §3)

The ~4 blocks are lost in three composing mechanisms, all inside the fit data the generator
consumes (the generator itself faithfully realizes `gableSurfaceHeight`):

- **(a)** independently-fitted side pitches are shallow → the side planes intersect *below*
  `ridge.y`, and the `min()` surface never reaches the declared ridge (cottage cross-gable:
  planes meet at 18.864 with ridge.y 21; built apex 18.577);
- **(b)** a misfitted hip end plane is honored as a hard ceiling (barn lo hip, pitch 0.231,
  ramps half the ridge 13.5→19 while the GLB ridge is flat at 19.5 to the footprint edge);
- **(c)** `ridge.y = recordY` (the blob median) sits below the trusted fitted apex, and the
  apex evidence (`ridgeFit[].apexLine`) is never consumed.

Plus one instrument defect surfaced by the trace: **(d)** `heightProfiles`' eave anchors are
not like-for-like on asymmetric-eave gables — `buildEave` is the mean of *declared* side eaves
(barn: (13.5+18)/2 = 15.75) while `glbEave` is one pooled median over whatever eave-edge columns
happened to sample (barn: 4 samples, all low-side → 13.45), contradicting the function's own
docstring ("each side anchored to its OWN measured eave"). That manufactures −2.3 of barn's
−4.396. Without (d) repaired, no honest build can read ~0 on barn: matching the instrument's
current arithmetic would build the barn ridge 2.3 above the GLB absolute (cage/IoU risk),
and matching the GLB absolute would leave delta ≈ −2.3 (> tolerance).

## Decision

**Close the ridge at fit time (provision-fit), using the instrument's own sampled GLB ridge
profile as the target, eave-relative with repaired like-for-like anchors; refute or re-anchor
hips from the same profile; re-derive side pitches through the closed ridge. Repair the anchor
defect in the instrument as its own unit-tested change.** Five parts:

1. **Anchor repair (instrument, `src/view/roof-region-diff.mjs`)** — per-side GLB eave medians,
   averaged over the *same* sides that contribute the build mean; a side with zero GLB samples
   drops out of *both* anchors (symmetric coverage). Cottage (symmetric eaves, both edges
   sampled) is numerically ≈ unchanged — so the cottage witness validates the construction fix
   independently of the anchor repair. Per-side sample counts recorded in `anchors`.
2. **Closure target (new pure core, `src/form/roof-ridge-fit.mjs`)** — sample the GLB surface
   at footprint column centers (the instrument's `glbHeightAt`, exported and reused — one
   ruler, no second sampler), per-ridge-station max across the gable's cross-section, dominant
   line selection with the existing protrusion exclusion. NOT the vertex-based `apexLine.height`:
   on the barn that value rests on 3 of 48 stations (excludedColumns 45) and sits 1.49 above the
   47-station sampled profile; the sampled profile is the stronger reading *and* is what the
   acceptance instrument measures. `apexLine` stays as evidence + cross-check (|target − apex|
   recorded; divergence > `apexGap` is a named finding, not a block).
3. **Apply (fit time, `src/form/provision-fit.mjs`)** — per sane gable:
   `ridge.y ← roundHalf(buildEaveAnchor + (glbRidgeLine − glbEaveAnchor))` (eave-relative
   mapping with the *repaired* anchor arithmetic, computed from the same tris); each side's
   `pitch ← (ridge.y − eaveY) / run` (plane forced through eave line *and* ridge — the GLB
   surface really does reach its apex, so eave+ridge are the two trustworthy anchors and pitch
   is the derived quantity); prior fitted pitch kept on the side as evidence (`pitchFitted`).
   Sanity gates, shared not subject-tuned: derived pitch ∈ (0, `maxPitch`], target above both
   eaves (+0.5), profile coverage ≥ a declared fraction of stations — any failure → NAMED
   refusal, gable left exactly as fitted today (Rule 2: never invent; the residual stays named).
4. **Hip arbitration (same closure step)** — at a `demanded` end, if the sampled ridge profile
   holds the ridge line within `apexGap` out to the footprint edge, the hip demand is **refuted**
   (recorded `hip.refuted: "ridge-profile-to-edge"`, demand cleared — the recorded short ridge
   was a blob artifact; the profile can only refute, never invent). Otherwise the hip stays and
   its plane is re-anchored to pass through (`ridgeEnd`, closed ridge.y):
   `hip pitch ← (ridge.y − eave) / |edge − ridgeEnd|`, same sanity gates. Barn: refuted (profile
   flat 19.5 across span [−24, 23] = the full bbox).
5. **Record** — `ridgeFit[]` gains a `closure` block per gable: `{from, to, glbRidgeLine,
   anchors, apexCheck, sides: [{pitchFrom, pitchTo}], hip, refusals[]}`. The fit record remains
   the single authority the generator consumes; the closure is *in* the committed fit
   (pin-rotated), not a generate-time patch.

`gableSurfaceHeight` / `evalSideHeight` / `hipEndPlanes` / `roofHeightfield` / `generateRoof`
**stay byte-identical**: the closure rewrites gable *data*, not the shared surface definition.

## Why this shape (alternatives rejected)

- **Generate-time ridge lift (force ridge columns up to ridge.y in `roofHeightfield`)** —
  rejected. Patches (a) only; barn's hip ramp (b) and the low ridge.y (c) survive; it also
  forks the generator away from `gableSurfaceHeight`, the exact divergence the T-112 gatehouse
  lesson forbids (generator and `programFitError` must share one surface).
- **Change `gableSurfaceHeight` itself (e.g. blend planes toward the ridge)** — rejected. The
  definition is shared with the reconstructed path's swap-ladder fit-error gate; changing it
  moves committed reconstructed records and re-opens every subject. Blast radius without need.
- **Use `apexLine.height` (vertex max) as the target** — rejected as primary (kept as
  cross-check). Barn shows it resting on 3 stations after protrusion exclusion, 1.49 above the
  sampled surface; building to it would overshoot the instrument by >1 and flirt with cage
  spill. The E-30 learnings already warn the apex evidence is protrusion-fragile (T-118).
- **Raise eaves to keep fitted pitches (anchor planes at the ridge)** — rejected. Eaves are the
  best-grounded as-built quantity; moving them violates "no other region's delta worsens".
- **Close eave-relative against the *current* anchor arithmetic** — rejected. On the barn it
  builds the ridge ~2.3 above the GLB absolute to cancel an anchor artifact: silhouette spill,
  cage risk, and a lie. Repairing the instrument's own documented intent is the honest path —
  precedent T-118 (this epic repairs the reading where the reading is the defect, with the
  repair unit-tested on synthetic fixtures and the raw profiles kept beside it).
- **Fit-time vs generate-time placement of the closure** — fit time wins: the committed fit
  record stays the single source of truth (`regenerate-from-record` byte-equality keeps
  holding); roof-diff's generated path reads the same gables, so regions repartition
  consistently; and the swap-free generated chain needs no new seams.

## Scope and blast radius

- **Subjects re-run (artifacts moved) this ticket: `generated:cottage`, `generated:barn` only.**
  The closure code is registry-wide (no subject branches), but church/gatehouse generated
  chains are not re-run; their committed artifacts/records stay byte-intact (pin-guard enforces;
  `--offline` still asserts committed records vs committed artifacts). Their staleness vs the
  new fit code is a NAMED handoff item, matching the ticket's economy rule (re-judge only moved
  artifacts) — exactly how T-121 left the −4.015 itself.
- **roof-diff records: all 8 (4 subjects × 2 paths) re-derived** under `--rotate-pins` —
  judge-free instrument refresh (T-118/T-121 precedent), forced by the anchor repair (`--repro`
  on any stale record would diverge). Reconstructed-path numbers move only via anchors (their
  artifacts are untouched).
- **Re-judge: one owned run per subject** — `npm run generated:cottage -- --rotate-pins`, same
  for barn (the judge rides the milestone chain; pin-guard preflights before spend; T-114
  bounded re-asks only on malformed replies). Retired pins named in the commit. Movement vs
  T-121 profiles (both FAIL 12/2, 0/4) recorded with instrument receipts, or residuals named
  with the diff deltas that explain them.
- **Hygiene**: runner comments are already de-specialized (T-121); the stale barn
  `generalization.clean: false` refreshes to `true` on this ticket's owned re-run (never a
  re-judge for the cosmetic field alone — it rides the moved artifact). `roof-diff.mjs:16`'s
  "(the barn, until T-117 lands)" comment is de-specialized in passing (its own header bans
  subject keys; no record field depends on it).

## Acceptance mapping

| Criterion | Design answer |
|---|---|
| Diagnosis first, real numbers | research §3 trace + progress.md step 0 re-states fitted-vs-built per gable (21/22.792-vs-18.577 cottage cross; 19.5-ridge.y/19.5-glb-vs-13.5→19 ramp barn) |
| Fix pure + unit-tested, −4.015 witness | closure + anchor repair are pure cores under `src/**/*.test.mjs`; witness test feeds the committed cottage cross-gable fit values through the old path (asserts the −4-class deficit: built top ≤ 19 vs target 22.4) and the closed path (ridge cells at fitted height ±1); synthetic specs: both ridge axes, cross-gable pair, hip-refuted, hip-kept-reanchored, asymmetric-eave anchors, sanity refusals; stair/slab caps render with `unmapped` empty |
| Instrument-verified before judging | `npm run diff:roof -- --subject {cottage,barn} --path generated --rotate-pins` after re-generating, BEFORE any milestone gate run; assert ridge stats mean within ±1, no other region's missing/extra worsens, per-view IoU vs GLB no-regress; before/after diff JSON+sheets committed |
| One owned re-judge | the two milestone runs above, `--rotate-pins`, one judge run per view |
| Repro + hygiene | `--repro`/`--offline` re-asserts on both subjects; generalization grep clean (barn record finally `clean: true`); `npm test` green |

Declared tolerance: **±1 block** on the ridge-region eave-relative mean (voxel quantization +
half-block caps are the floor; the +1 face convention and slab cells already cancel inside the
instrument's eave-relative arithmetic).

## Risks, named

- **Steeper derived pitches** change stair-course selection (`stairShape`); mitigations: family
  mapping asserted `unmapped`-empty in tests; `maxPitch` sanity refuses absurd rises.
- **Downstream chain stages** (skin/grammar/settle/zone lens) see a taller roof first-run;
  T-116/T-121 hardening (band recognition, program-exempt seal, all-flagged degradation) is in
  place; any new stall is a named finding, not silently patched around.
- **Suite tripwires** (cross-record conformance): expected to fire where records rotate; resolve
  via the sanctioned judge-free paths (`--distill-only --rotate-pins`) as in T-121, never by
  hand-editing records.
- **Cottage main gable + church/gatehouse reconstructed numbers** shift slightly from the anchor
  repair; raw profiles remain beside eave-relative in every record for cross-checking.
