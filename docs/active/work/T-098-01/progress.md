# T-098-01 placement-grammar — Progress

All six plan steps complete. Suite green at every commit (1156 → 1183 tests).

## Step log

- **Step 1 — frame-line geometry core** ✅ `8360f8d`
  `src/view/frame-lines.mjs` + 13 tests on two hand-counted synthetic huts (chimney-piercing hut,
  gable-rake hut). Wall predicate = side-exposed ∧ NOT (y ≥ upperTop ∨ roofKeys) — the fill's own
  roof rule, so the grammar can never classify a cell the fill calls roof.
- **Step 2 — binding + grammar core** ✅ `12a680f`
  `src/form/placement-grammar.mjs` + 13 tests (later 14). **Deviation from structure.md:** zone-fill
  gained one exported helper (`inRun`, previously private — `export` keyword + doc line only, zero
  behavior change) so the grammar respects the *same* keep rule the fill uses instead of reforking it.
- **Step 3 — runner + wiring** ✅ `117ff81`
  `benchmarks/sculpture/placement-grammar.mjs`, `grammar:cottage`/`grammar:gatehouse` scripts,
  .gitignore stanza. Guards smoke-tested (usage error; church THROWs honestly — no skin/kit records).
- **Step 4 — cottage run** ✅ `062b9b8` (after two honest gate failures, see below)
  113 posts + 120 crown + 88 beams; 181 painted + 11 adopted + 91 respected + 10 isolates skipped +
  28 already-frame; fill 39; **frameRefilled 0**; coverage band0 67% / band1 67% / roof 84% (≥50%);
  band evidence clean; double-run byte-identical; offline re-asserts; before/after 4-azimuth sheets
  committed (`pr/assets/frames/grammar-cottage-{before,after}.png`).
- **Step 5 — gatehouse run** ✅ `41acbb4`
  Same code path, data only: frame=cobblestone, panel band0=polished_basalt (value-true rename
  composed via the record's substitution ∘ kit overrides), course=deepslate_bricks. 187 painted +
  3 adopted; frameRefilled 0; 2 *pre-existing* isolated cobble specks stripped by the fill —
  reported as `preexistingFrameRefilled`, separated from the gate (see deviation 2). Cottage record
  refreshed with the new field (artifact sha unchanged).
- **Step 6 — review** ✅ review.md alongside this file.

## Deviations from the plan (both found BY the runner's own gate — it worked)

1. **Line continuity (first cottage run failed: 21 frame cells refilled).** Where the splat had
   already painted partial `dark_oak_log` studs on a frame line, the per-cell respect rule left
   1-cell gaps that the kit frame block would fill as isolated sub-minRun specks — which the fill
   rightly strips. Fix in the core: a paint cell with no same-block support (no paint neighbour, no
   existing frame-block neighbour) ADOPTS the adjacent kept preserve-run's block (completing the
   stud), and a cell with neither support nor donor (broken-line isolates over debris columns) is
   SKIPPED and counted. Unit test added (14th): the gap cell adopts `dark_oak_log`, frameRefilled 0.
2. **Pre-existing specks ≠ grammar violations (first gatehouse run failed: 2 cells).** Two isolated
   pre-existing cobblestone cells sat at frame positions; the fill's anti-speckle strip took them.
   The survival gate now counts only cells THE GRAMMAR PAINTED (`frameRefilled`, must be 0);
   pre-existing strip is `preexistingFrameRefilled`, recorded, never gated.
3. **Concurrent T-099 session noted:** `dress:cottage` script appeared in package.json mid-ticket
   (sibling Lisa thread on dress-openings). All commits in this ticket stayed file-scoped; no
   overlap with T-099 files. The grammar's `openings` bindings are exactly its input seam.

## Acceptance criteria status

- **AC1 pure core, unit-tested on synthetic reads** ✅ frame-lines (13 tests) + placement-grammar
  (14 tests): kit→frameLines/fields/openings/courses, concrete placements, deterministic
  (byte-equal double-call test + double-run runner proof), states-capable schema (cube recolors
  carry no state; opening bindings defer to T-099).
- **AC2 composes with the fill** ✅ one recorded pipeline order (`durable-skin → placement-grammar →
  T-099`); fields/courses realized by running zoneFill itself; frame lines survive (frameRefilled 0
  on both subjects, T-090-01 declared-secondaries contract exercised, not assumed).
- **AC3 cottage run behind named npm run** ✅ `npm run grammar:cottage`; frame on the frame lines
  (kit-recognized `spruce_planks` — the committed kit's trim entry; the AC's "stripped-log" names
  the concept's depicted material, the kit is the authority per E-26), panels in the fields, both
  storeys framed (posts span band0+band1 by construction; floor-line beam at y7), before/after
  renders at the 4 config gate azimuths.
- **AC4 no subject constants / no hand-edits / tests green** ✅ runner has zero subject branches
  (gatehouse ran unchanged); all transforms are pure cores; `npm test` 1183/1183.
