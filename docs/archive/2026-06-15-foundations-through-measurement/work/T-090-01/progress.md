# T-090-01 full-shell-zone-fill — Progress

All plan steps complete. Three feature commits on `main`. One significant, evidence-driven deviation
from the design (documented below before it was implemented, per the workflow).

## Step 1 — Pure core (commit `2b694a4`) ✓

`src/view/zone-fill.mjs`:
- `exposedVoxelEntries(occ)` — the full-shell skin (any-of-6-faces air test), exported.
- `skinEntries` dispatcher; `zoneFill` and `surfaceZoneHistogram` gained `skin:
  "projection"|"exposure"` (default `"projection"` — all existing callers untouched, including
  T-087-01's `surface-pattern.mjs`).
- `zoneFill` gained `regions` (declared sub-regions, kept unconditionally, `byRegion` tally).

`src/view/zone-fill.test.mjs`: +8 tests. The planned "gabled stepped roof" synthetic was replaced by a
**covered valley** (two ridges + grey valley floor + bridging cap): while pinning coordinates I
verified empirically (all 615 missed grey roof cells on the real artifact) that ortho-occlusion
requires a same-row blocker — soffits and covered slots, not open step risers, are what projection
misses. The covered-valley cell (1,0,1) is provably in `exposedVoxelEntries` and absent from
`surfaceVoxelEntries`; both memberships asserted. Suite green (1,035).

## Step 2 — Runner wiring (commit `3a3a014`) ✓

As planned: §0c fill `skin:"exposure"` (replacing the wall-field stage; projection replay kept as the
before-baseline), census basis → exposure everywhere (splat-only coverage, front-candidate
precondition, final gate), band acceptance consts + hard throw, oblique render helper, record/md/
offline additions. Offline replay against the OLD record exited 0 (bands skip-if-absent verified).

## Step 3 — Live run, evidence, records (commits `<run-1 uncommitted>` → final) ✓ with DEVIATION

**Run 1** (policy per design D5: cobble/bricks/logs all in roof preserve) passed every numeric gate —
roof materials 100%, residue 49%→0%, coverage gate both ways — but **failed the real acceptance, the
render** (E-25 Rule 1): before/after oblique renders differed by only 0.3–0.6% of pixels and the roof
still read as a grey-brown jumble. Investigation:

1. The 615 grey *stone* cells the exposure fill recolors live almost entirely on faces invisible from
   external above-horizon cameras (soffits, covered slot risers) — pixel-diff old-committed vs new at
   45°/135°/225° ≈ 0.6%.
2. The *visible* grey jumble is **cobblestone** — 185 scattered fragments across the roof courses —
   which design D5's preserve-runs policy kept, and which the roof splat set could even re-add.
3. The material map (`material-map/cottage.json`) binds cobble to "quoins, plinth & chimney shaft" and
   bricks to "chimney cap" — never the roof field. Blanket preserve was the wrong mechanism; the
   ticket's own parenthetical ("chimney excepted **as a declared sub-region**") is the right one.

**Deviation (supersedes design D5's cobble handling, uses design D3's mechanism for real):**
- `ZONE_POLICY.roof`: preserve = `[dark_oak_planks, dark_oak_log]`; splat = `[dark_oak_planks]` —
  cobble/bricks out of both (the splat may no longer scatter grey onto the roof either).
- The chimney is a **declared sub-region** passed to `zoneFill` — derived geometrically by
  `protrudingStackRegion(occ)`: ridgeY = the highest 8-connected plateau of ≥4 equal-top columns (a
  roof plane); the region = cells above ridgeY in columns topping out above it. No subject constants
  (E-25 Rule 3). On the cottage: ridgeY=24, 6 columns, 12 cells kept.
- The before-replay now uses `LEGACY_FILL_ZONES` (the shipped T-085 policy) so "before" is the
  faithful old pipeline, not a hybrid.
- Acceptance measurement made chimney-aware: roof-materials fraction excludes the declared region from
  the denominator (the ticket's exception, computed rather than asserted away); same instrument applied
  to before and after. `dark_oak_log` joining roof preserve (design D5) stands — gable framing.
- Evidence angle moved from 225°/30° to **135°/15°**: measured pixel-change across candidate angles
  (225/30: 0.3%, 225/15: 0.5%, 135/15: 2.8%, 135/5: 3.2%, 45/15: 4.3%); 135° is a ticket-named azimuth
  with the failure clearly visible. Renders committed (narrow gitignore exception).

**Run 2 results (the committed record):**
- Fill: 2,645 cells recolored on the exposed shell, 2,693 kept, `byRegion: {chimney: 12}` (legacy
  projection replay: 976).
- Bands (6-dir exposure, chimney excepted): roof materials **65% → 100%** (target ≥90%); upper
  stone residue **49% → 0%** (max 5%). Roof zone after: spruce 91%, logs 7%, dark planks 2%.
- Coverage gate: splat-only baseline REJECTED (upper 0.059, roof 0.427 < 0.5); final skin PASSED
  (base 0.66, upper 0.85, roof 0.91) — both proofs hold on the exposure census.
- Renders: before shows grey speckle across the brown courses; after is a clean plank roof with the
  chimney stack keeping its grey shaft — 3.6% of pixels changed, concentrated on the roof. Verified
  visually, not just numerically.
- `--offline` exits 0 asserting the new bands record; `npm test` green at 1,035 throughout.
- Wall note: the dark blotches on the upper plaster in the after-render are the pre-existing
  GLB/concept splat-stud path — present byte-for-byte-similarly in the old committed artifact
  (verified by rendering `git show HEAD:…artifact.json` side by side) — NOT introduced here.

## Acceptance criteria → status

1. Pure full-shell fill op, preserve secondaries + declared sub-regions, unit-tested (stepped-roof
   grey cells → roof material; stud run → preserved) — **done** (covered-valley + stud + region tests).
2. Wired into the pipeline behind `npm run spray:paint`, replace-vs-after recorded (REPLACES; legacy
   replay retained), no hand edits — **done**.
3. Cottage roof band ≥90% roof materials (chimney excepted as declared sub-region): **100%**; upper
   residue ≤5%: **0%**; before/after histograms recorded with the same 6-dir-exposure instrument —
   **done**.
4. Before/after renders at an oblique azimuth the old fill failed on (135°), grey roof sides visibly
   gone, saved + committed — **done**.
5. No subject-specific constants in the op (region mechanism is caller-declared; the runner's chimney
   detector is geometric); `npm test` green — **done**.

## Remaining

Review phase (review.md) only.
