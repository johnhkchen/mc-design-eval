# T-094-01 — subject-roster-refresh — Plan

Phase artifact 4/6. Ordered, independently verifiable steps; each commit atomic.

## Step 1 — Retire moai (commit 1)

1.1 `benchmarks/sculpture/resemblance.mjs`: remove `moai` from `SUBJECTS`; add the
    `RETIRED SUBJECTS` comment block (entry verbatim + rationale + date + ticket); update the
    registry header comment (form-type-poles sentence).
1.2 `benchmarks/sculpture/resemblance-consolidation.mjs`: fix the header comment naming moai.
1.3 Verify: `node --check` both files; `node benchmarks/sculpture/resemblance.mjs --subject moai --offline`
    must now fail with the runner's own `unknown subject` error listing 3 known keys;
    `npm test` green (no test imports the roster — this is the regression net).
1.4 Commit: `refactor(E-25 T-094-01): retire moai from the resemblance roster — concept was the defect`.

## Step 2 — Provisioning runner + church concept (commit 2)

2.1 Write `benchmarks/sculpture/provision-concept.mjs` per structure §1 (stages 1+2 only;
    `--subject/--scale/--attached/--run-dir`; attempt-preserving regeneration).
2.2 `node --check`; smoke the arg-validation path without env (`--subject ""` → usage error,
    no metered work).
2.3 Live run (env from `.env`, values never printed):
    `set -a; . ./.env; set +a; node benchmarks/sculpture/provision-concept.mjs --subject "a village church with a square bell tower" --scale 48`
    → `runs/016-vBuilding-a-village-church-with-a-square-bell-tower/` with design-doc +
    concept.png. Requires network (claude shim + Gemini) — run unsandboxed like the ticket's
    TRELLIS step; cost: one text completion + one pro image.
2.4 Inspect `concept.png` (multimodal read) against the checklist; write
    `concept-checklist.md` (7 items × attempt, pass/fail + evidence).
    - FAIL → rerun 2.3 with `--run-dir runs/016-…` (+ `--attached` steering note iff the
      failure is thinness/multi-building); previous image preserved as `concept-attempt-N.png`;
      add the new attempt's rows. Max 3 attempts, then stop and reassess (deviation note in
      progress.md).
2.5 Verify: checklist all-pass on the final image; run dir matches run.mjs file-name parity.
2.6 Commit: runner + run dir + checklist —
    `feat(E-25 T-094-01): challenge-subject concept — village church, sanity checklist beside the image`.

## Step 3 — GLB + smoke-check (commit 3)

3.1 Write `benchmarks/sculpture/glb-smoke.mjs` per structure §2 (gate: glTF magic ok AND
    26-conn components === 1; 6-conn reported, not gated).
3.2 `node --check`; sanity it against a known-good existing GLB first:
    `node benchmarks/sculpture/glb-smoke.mjs benchmarks/sculpture/glb/stone-gatehouse.glb --scale 48`
    → expect exit 0, ~dims 41×48×41, 27,620 cells, components(26)=1 (the README's recorded
    numbers — this validates the new lens against ground truth before it judges church).
    Also run it against `glb/moai.glb` — expected to FAIL (two masses): the negative control
    proving the gate would have caught the retired subject.
3.3 Generate the church GLB (unsandboxed; endpoint never printed; cold start minutes; one
    retry on transient failure):
    `set -a; . ./.env; set +a; node benchmarks/sculpture/trellis-glb.mjs benchmarks/sculpture/runs/016-…/concept.png benchmarks/sculpture/glb/church.glb`
3.4 `node benchmarks/sculpture/glb-smoke.mjs benchmarks/sculpture/glb/church.glb --scale 48`
    → must exit 0. FAIL → the concept is unregistered, so loop to step 2.4's regeneration
    (checklist gains a "TRELLIS fragmentation" row for the failed attempt) and redo 3.3–3.4.
3.5 Mesh stats for the manifest row: verts/tris via the existing GLB parse (glb-smoke prints
    them if cheap, else `node src/form/glb-silhouette.mjs` load path) + file size.
3.6 Append the **Sign-off** section to `concept-checklist.md` (smoke numbers + verdict);
    update `glb/README.md` (church row + provenance paragraph + moai-row parenthetical).
3.7 Verify: `git status` shows NO `.glb` staged (gitignore line 24 active); README numbers
    match glb-smoke output exactly.
3.8 Commit: smoke runner + README + checklist sign-off —
    `feat(E-25 T-094-01): church GLB minted + single-mass smoke gate (gatehouse positive, moai negative control)`.

## Step 4 — Registration + journal (commit 4)

4.1 `resemblance.mjs`: add the `CHALLENGE SUBJECTS` block + `export const CHALLENGE_SUBJECTS`
    (church: concept path, glb, scale 48 + contract comment). Registration is last — the
    concept is immutable from this commit on (Rule 2).
4.2 `docs/knowledge/design-learnings.md`: tail section per structure §8 (why moai retired ·
    the checklist · the church registration & untuned-pipeline contract).
4.3 Verify: `node --check resemblance.mjs`;
    `node -e "import('./benchmarks/sculpture/resemblance.mjs').then(m => console.log(Object.keys(m.SUBJECTS), m.CHALLENGE_SUBJECTS.church))"`
    → 3 live keys + church entry; registered paths exist on disk (concept committed, GLB
    present); `node benchmarks/sculpture/resemblance.mjs --offline` (default cottage subject)
    still works — proves the registry edits didn't disturb the runner.
4.4 `npm test` green (full suite).
4.5 Commit: `feat(E-25 T-094-01): church registered as the challenge subject — paths/config only`.

## Step 5 — Review phase artifacts

5.1 `progress.md` maintained throughout (after each commit: done / remaining / deviations).
5.2 `review.md`: files changed, AC-by-AC status, test coverage assessment (what's unit-tested
    vs verified-by-run), open concerns (e.g. checklist is judgement-based; GLB regenerability;
    consolidation default sweep now 3 subjects).

## Testing strategy

- **Unit tests:** none added — both new files are impure runners (network/model/GL-adjacent
  provisioning), and the repo convention (resemblance.mjs header) is that runners are
  verified by offline modes / committed outputs, never pulled into the suite. The pure cores
  they lean on (`voxelizeGlb`, `strayVoxelStats`, prompt builders) are already unit-tested.
- **Ground-truth validation of the new gate:** gatehouse (positive) + moai (negative) before
  church is judged — the smoke runner is itself smoke-tested against recorded reality.
- **Regression net:** `npm test` after steps 1 and 4 (registry edits), plus runner
  `--offline` spot-checks (1.3, 4.3).
- **Live verifications:** checklist on the PNG (recorded), TRELLIS magic check (built into
  the CLI), glb-smoke exit code (recorded in README + sign-off).

## Budget / external dependencies

claude shim (1 small text call) · Gemini pro image (1–3 calls) · TRELLIS Modal (1–2 calls,
minutes each, unsandboxed) — all keyed from `.env`, values never printed or committed.
