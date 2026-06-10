# T-087-01 coherent-surface — Progress

All four plan steps complete. Three feature commits on `main`; `npm test` 1027/1027 green.

## Step log

### Step 1 — skin-iterator export ✅ (folded into commit 1)

`surfaceVoxelEntries` exported from `src/view/zone-fill.mjs` with a default `faces = FILL_FACES` and a
doc line naming it the canonical skin iterator. **Deviation (benign):** the first edit attempt failed —
T-088-01's commit `1e74bc9` had landed on zone-fill.mjs (added `dominantCoverage`) between my read and
write. Re-read, confirmed the target region untouched, re-applied. No semantic interaction: T-088's
addition and this export are in different parts of the file; both suites green together.

### Step 2 — pure cores + tests ✅ (commit `ada0472`)

`src/view/surface-pattern.mjs`: `courseMetrics`, `regularizeRoofCourses` (priority-flood basin-fill,
binary min-heap, adds-only), `stripStraySalt` (whole-skin same-material components, keep iff size ≥
minKeep AND max-extent ≥ minExtent, recolor to the cell's zone dominant), plus `overlayPlacements`.
`src/view/surface-pattern.test.mjs`: 13 tests on the two hand-counted fixtures (plan's T1–T10 plus the
minKeep-parameter test and arg-validation test). All hand counts (exact add positions, Δcliff −4 /
Δflat +3 / Δstep1 +1, salted-hut tallies 6 stripped / 8 kept, upper byZone breakdown) verified on the
first run — no fixture corrections needed.

### Step 3 — runner + wiring ✅ (commit `6df9bce`)

`benchmarks/sculpture/surface-pattern.mjs` (impure wiring only), `pattern:cottage` npm script,
.gitignore stanza for the PNGs. `node --check` clean; `--offline` fails loudly pre-record as planned.

### Step 4 — live cottage run ✅ (commit `3966e75`)

`npm run pattern:cottage`:

- **Course fill: 41 columns raised / 85 voxels added** (spruce_planks) — exactly the design-phase
  prototype numbers. stepSmoothness **0.784 → 0.827**, cliff joints **273 → 218**, mean|Δy| 0.983 → 0.755.
- **Salt strip: 202 cells stripped, 343 kept** — roof 75/133 off-dominant (the 13 top-surface cobble
  singletons among them), upper 50/184 (isolated splat fragments), base 77/228. Kept: the cobble chimney
  shaft, the timber stud runs, eave/verge trim. (Design-phase estimate was 203 on the pre-fill build;
  the strip runs on the post-fill skin — 1-cell difference, expected.)
- AJV assert green; record + md + patterned artifact written and committed; PNGs local-only.
- `--offline` re-assert exits 0 (smoothness improved, salt > 0, committed artifact AJV-valid).
- Renders eyeballed (plan's visual check): top view — cobble salt gone, pits filled, courses read
  longer/cleaner; front — upper plaster band noticeably cleaner (splat fragments stripped); right — the
  large timber patches REMAIN (they are connected runs by the rule; see review.md concern #2).

**Deviation (cosmetic, fixed in commit 3):** render labels came out `view-view-front-before.png` —
`renderViews` prefixes `view-` itself. Label changed to `${angle}-${when}`, renders regenerated.

## Acceptance criteria — status

1. **Roof-course coherence** ✅ — pure `regularizeRoofCourses` + `courseMetrics`; unit tests cover noisy
   course set → regular courses (pit/basin raised, valley/bump untouched, exact metric deltas);
   before/after top renders; regularity recorded (0.784 → 0.827, honest residual = bumps).
2. **Intra-zone stray-salt strip** ✅ — pure `stripStraySalt`; the two AC behaviors are individually
   named tests ("an isolated speck is stripped to the field", "a stud run is preserved"); cottage run
   recorded per zone/material.
3. **Distinct from S-084** ✅ — consumes the sealed+filled build; module header and record note state
   the watertightness-vs-pattern split; no overlap with sealRoof/sealWalls code paths.
4. **Cottage run + records + tests** ✅ — `surface-pattern/cottage.{json,md}` + artifact committed;
   `npm test` 1027/1027 green at every commit.

## Commits

| Commit | Content |
|---|---|
| `ada0472` | pure cores + 13 tests + skin-iterator export |
| `6df9bce` | runner, npm script, .gitignore |
| `3966e75` | live cottage record + patterned artifact + label fix |
