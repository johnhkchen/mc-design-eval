# T-093-01 — multi-angle-same-object-gate — Plan

Five steps; GL + metered judge only in step 4. Each step commits atomically.

## Step 1 — config + pure gate core + tests

**Files:** `src/config.mjs` (MULTI_ANGLE_GATE), `src/form/multi-angle-gate.mjs`,
`src/form/multi-angle-gate.test.mjs`.

Implement `buildMultiAngleViewPrompt`, `parseMultiAngleVerdict`, `aggregateMultiAngle`,
`viewOutcomeLabel` + schemas per structure.md. Tests: the full parser contract (valid minor-gap
shapes; same-object+major → throw; drifted without major → throw; vocab violations → throw;
fenced JSON accepted) and the aggregation matrix (pass at 0 and exactly 2 gaps; fail at 3 with
`gap-budget`; drifted/different/coverage-failed views fail with named angles; missing view and
unparsed verdict → refusal, NOT a fail; exact-azimuth-set contract).

**Verify:** `npm run test:unit` green. **Commit:** `feat(E-25 T-093-01): multi-angle gate pure
core — v2 per-view verdict + aggregate pass rule (+tests)`.

## Step 2 — composeSheet refactor

**Files:** `src/form/resemblance.mjs` (add `composeSheet`, delegate `composeTriptych`), sheet
tests appended to `multi-angle-gate.test.mjs` (N-panel width math; 3-panel triptych throw
preserved; pixel-identical output for a 3-panel input vs the old path — assert on a small panel).

**Verify:** full `npm run test:unit` green (existing resemblance tests prove no regression).
**Commit:** `refactor(E-25 T-093-01): composeSheet — N-panel composition under the triptych contract`.

## Step 3 — the gate runner

**Files:** `benchmarks/sculpture/multi-angle-gate.mjs`, `package.json` (`gate:multi`),
`.gitignore` (gitignore `benchmarks/sculpture/multi-angle/**/*.png` — committed sheets live in
`pr/assets/frames/`).

Implement per structure.md §runner. Key behaviors to get right:
- REFUSAL on any failed render or unparsed verdict: record written with `decided:false`, sheet
  drawn with MISSING placeholder, exit 1 — no silent skip, no partial verdict.
- Coverage short-circuit per view: judge not called, `reason:"coverage"`, verdict null.
- No flags for angles/resolution/budget; `--artifact/--label` only select the build under test.
- Verify `surfaceZoneHistogram` accepts diagonal face names early (a 5-line node probe before
  wiring); if it does not, the projection census falls back to `projectSurface(occ, angle)`
  directly (both pure; same cells).

**Verify:** `npm test` green (runner outside glob); `node --check`; an `--offline` dry error path
("committed record absent") behaves. **Commit:** `feat(E-25 T-093-01): multi-angle gate runner —
4 fixed azimuths, per-view coverage precondition, contact-sheet verdict`.

## Step 4 — the proof, both ways (GL + metered judge)

1. `npm run gate:multi -- --subject cottage --label baseline --artifact
   concept-materials/cottage/after-artifact.json` — expect: per-view coverage REJECT (or judge
   fail) on at least one non-front azimuth; record + sheet committed; exit 1 is the expected
   outcome and is recorded as such.
2. `npm run gate:multi -- --subject cottage` — the durable-skin artifact (pass candidate).
3. If (2) does not pass: run the gatehouse; record both honestly. The AC accepts a synthetic
   positive only as last resort — prefer recording the real finding and satisfying the pass leg
   with whichever real subject passes; if NONE passes, construct the synthetic positive (a build
   whose 4 views are the concept-faithful skin by construction) and record it as synthetic.
4. `--offline` re-assert for each committed record.

**Inspect before committing** (E-25 Rule 1): the sheets must show concept + 4 labeled views; the
baseline sheet must visibly show the grey-roof defect the gate caught.
**Commit:** `feat(E-25 T-093-01): gate proof both ways — baseline cottage FAILS oblique, skinned
build PASSES` (records + sheets).

## Step 5 — suite + artifacts

`npm test` full run; progress.md finalized; review.md (phase artifact). Confirm zero changes to
`resemblance.mjs` runner / v1 schema callers (`git diff --stat` audit).

## Testing strategy summary

- **Unit (steps 1-2):** parser contract, aggregation matrix, sheet math — all pure, no GL/network.
- **Integration (step 4):** the live runs ARE the integration proof, recorded both ways +
  `--offline` re-asserts (durable-skin/resemblance pattern).
- **Non-regression:** existing resemblance.test.mjs suite + full `npm test`; no v1 file changes
  beyond the delegating composeTriptych.

## Rollback / safety

Steps 1-2 additive/refactor with the old contract pinned by existing tests. The runner is new —
zero blast radius on existing gates. Proof artifacts are new committed files; durable-skin and
resemblance records are not rewritten by this ticket.
