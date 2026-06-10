# T-099-01 opening-dressing — Plan

Four commits, each independently verifiable. `npm test` must be green at every commit point
(suite at 1156 going in).

## Step 1 — Pin the trapdoor-facing convention (no commit; feeds step 2)

The committed fixture-card renders are the ground truth for which side of its cell an open
trapdoor's panel occupies per `facing` value. Inspect
`benchmarks/sculpture/fixture-card/view-front.png` (trapdoor row: north@x0, south@x3, west@x6,
east@x9, all at y=1, z=0; front camera looks toward −z): identify panel side per facing. If a tiny
probe render is needed, build one with `renderViews` on a throwaway artifact (not committed).
**Output**: the verified `SHUTTER_FACING` table (hypothesis: facing = compass opposite the wall's
outward normal puts the panel against the wall).

## Step 2 — Pure core + tests → commit A

`src/view/opening-dressing.mjs` per structure.md interface, in this order:
1. Constants (`COMPASS`, `SHUTTER_FACING`, `FENCE_RUN_STATE`), `speciesFence`, `treatmentsFromKit`.
2. `extractApertures` (ref solid grid → world terms; flanks/lintel/sill/perim precomputed).
3. `dressOpenings` (wall-plane modal probe; infill/shutters/lintel/sill/door/light; conflicts;
   idempotency; deterministic placement order).
4. `applyDressing` (append + manifest union).

`src/view/opening-dressing.test.mjs` per the structure.md coverage map (~20 tests, synthetic huts).
Test-ordering note: write the happy-path ±x window test FIRST against hand-computed world
coordinates (the geometry is the bug farm), then conflicts, then integration.

**Verify**: `npm test` green (≈1176). Each emitted state shape matches a CARD_ROWS row family
(asserted in a test). `spruce_fence` membership in the committed vocab asserted.
**Commit A**: `feat(E-26 T-099-01): opening-dressing pure core — kit treatment slots, world-space dressing, conflict honesty`

## Step 3 — Runner + wiring → commit B

1. `benchmarks/sculpture/dress-openings.mjs` (ladder per structure.md; SUBJECTS registry data;
   `--offline` mode; record schema `dress-openings/v1`).
2. `package.json`: `"dress:cottage": "node benchmarks/sculpture/dress-openings.mjs --subject cottage"`.
3. `.gitignore`: stanza `benchmarks/sculpture/dress-openings/**/*.png` (mirror the challenge stanza;
   record JSON/md + `cottage/artifact.json` stay committed).

**Verify** (smoke, no GL): bad `--subject` → usage error; `--offline` before any record → clear
"run live first" error; `npm test` still green (runner is outside the glob).
**Commit B**: `feat(E-26 T-099-01): dress-openings runner + npm dress:cottage`

## Step 4 — Live cottage run → commit C

1. `npm run dress:cottage`. Expected mechanics (from the research probes):
   - apertures: 6 window face-openings from the raw ref (3 windows × ±x), 0 doors;
   - openings on the skinned target: 0 before → 6 after, `dressing.cells > 0` on each;
   - every window fully dressed (infill + both shutters + lintel + sill) or the run exits 1;
   - door honesty row `none-detected` recorded (design D7);
   - double-run placements byte-identical; dressed artifact AJV-clean; sha256 recorded;
   - closure closed-with-dressing under `openingRegions(dressedOcc)`; strayFixtures empty under
     composed regions.
2. **Eyeball the renders** (E-25 Rule 1): `right`, `+x+z`, `-x-z` before/after — shutters flat
   against the facade flanking each window, fence lattice in the aperture, lintel/sill timber. If
   the trapdoor panel is mirrored (against-wall vs proud), flip `SHUTTER_FACING` once, re-run
   step 2 tests + this step.
3. `npm run dress:cottage -- --offline` → exit 0 against the committed record.

**Commit C**: `feat(E-26 T-099-01): cottage windows dressed — shutters + fence infill, dressed-opening closure, render evidence` (record, dressed artifact, frames).

## Step 5 — Full verification sweep + progress log

- `npm test` (entire suite) green.
- `git status` clean of strays; records/frames committed; PNG out-dir ignored.
- `progress.md` updated with deviations (running log kept during steps 2–4).
(Folds into commit C or a small follow-up commit if docs-only.)

## Step 6 — Review phase

`review.md`: changes, AC table (incl. the honest door gap), test coverage + gaps, open concerns
(door non-detection, unproven door facings ≠ east, stairs lens residual inherited, hinge sweep).

## Testing strategy

| layer | what | how verified |
|---|---|---|
| unit (pure) | slot derivation, geometry, states, conflicts, idempotency | `node --test`, synthetic occupancies, hand-computed coords |
| integration (pure) | openings/regions identity, closure-as-dressed, stray composition | same test file, hut fixtures |
| deterministic integration | gate→determinism→integrity ladder on the real cottage | runner exit code, live + `--offline` |
| visual evidence | orientation correctness, "windows dressed as the concept shows" | committed before/after frames at gate angles (never gates logic) |

## Risk register

- **SHUTTER_FACING mirrored** → step 1 verification + step 4 eyeball; 1-line table flip, tests
  recompute (table-driven assertions, not literals).
- **Fence renders as lone post** → state booleans are unit-pinned per face dir against CARD_ROWS
  shapes; render eyeball confirms.
- **Aperture cells double-counted from ±x twins** → each face-opening dresses its OWN wall plane;
  the shared through-column means infill cells at the two planes differ (probed: 2 pane cells per
  column) — assert no duplicate positions in placements (unit test).
- **closureCheck cost on 26×27×32 cottage** → same scale shell-integrity already runs; fine.
- **GL unavailable** → ladder still gates (renders are evidence); frames absence recorded — but the
  AC wants renders, so treat GL failure as a stop-and-investigate, not a shrug.
- **Sibling sessions** — none active on T-099 (checked); `material-map`/`durable-skin` records are
  read-only inputs here.
