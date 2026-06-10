# T-094-01 — subject-roster-refresh — Structure

Phase artifact 3/6. File-level blueprint; ordering where it matters.

## Files created

### 1. `benchmarks/sculpture/provision-concept.mjs` (new, ~90 lines, committed)

Concept-only provisioning runner for challenge subjects (building mode, stages 1+2 of
vConcept; no build stage). One-off-class tooling like `building-concept.mjs`, but
parameterized so the next subject reuses it.

- CLI: `node benchmarks/sculpture/provision-concept.mjs --subject "<term>" [--scale 48] [--attached "<steering note>"] [--run-dir <existing>]`
- Imports: `requestText` from `../../src/sdk-binding.mjs`; `PHASE1_MODEL_ID` from
  `../../src/config.mjs`; `assertBuildingSpec`, `runIdForBuilding`,
  `composeBuildingDesignDocPrompt`, `BUILDING_DEFAULT_SCALE` from `../../src/building.mjs`.
- Flow:
  1. `assertBuildingSpec({subject, scale})` before any metered work (run.mjs convention).
  2. `nextSeq()` — same `readdirSync(runs/)` max+1 scan as run.mjs (3-digit prefix) — unless
     `--run-dir` names an existing dir (regeneration: reuse dir + design doc, skip stage 1).
  3. Stage 1: `composeBuildingDesignDocPrompt` → `requestText({prompt, model: PHASE1_MODEL_ID})`;
     save `design-doc.prompt.txt` + `design-doc.md` in the run dir (run.mjs file-name parity).
  4. Stage 2: spawn `npx tsx baml-concept.mts` with stdin job
     `{designDocPath, images: [], targetBlocks: scale, model: "pro", outPath, variant: "building", attached}`
     (the same `runBamlConcept` spawn contract as run.mjs lines 87–103, duplicated locally —
     run.mjs does not export it; ~15 lines, acceptable for provisioning tooling).
  5. On regeneration (`--run-dir` given and `concept.png` exists): rename the existing image
     to `concept-attempt-N.png` (N = first free), then write the new `concept.png`.
  6. Prints the run dir + concept path + timing; never prints env values.
- NOT pipeline code: nothing imports it; it changes no existing runner.

### 2. `benchmarks/sculpture/glb-smoke.mjs` (new, ~60 lines, committed)

Single-bulky-mass smoke check for a freshly minted GLB.

- CLI: `node benchmarks/sculpture/glb-smoke.mjs <path.glb> [--scale 48]`
- Imports: `voxelizeGlb` from `../../src/form/glb-voxelize.mjs`; `strayVoxelStats` from
  `../../src/form/voxel-components.mjs`; `inspectGlb` from `./trellis-glb.mjs` (header sanity).
- Output (stdout, JSON + human line): glb bytes/version, `dims`, `count`,
  `strayVoxelStats @26` (gated) and `@6` (reported only).
- Exit 0 iff `inspectGlb.ok && stats26.components === 1` (largestFraction printed; 1.0 implied
  by the components gate but shown for the README record). Exit 1 otherwise with the stats.
- Pure-core reuse only; no GL, no model, no network.

### 3. `benchmarks/sculpture/runs/016-vBuilding-a-village-church-with-a-square-bell-tower/` (new, committed)

- `design-doc.prompt.txt`, `design-doc.md` — stage-1 record (run.mjs parity).
- `concept.png` — the registered image (the passing attempt).
- `concept-attempt-N.png` — failed attempts, if any (kept; checklist rows explain).
- `concept-checklist.md` — the sanity checklist (AC's six items + bulky-throughout), one
  row per attempt per item with pass/fail + evidence; a **Sign-off** section appended after
  the GLB smoke-check (numbers + verdict + "registered, immutable hereafter (E-25 Rule 2)").

Exact dir name comes from `runIdForBuilding(nextSeq(), subject)` at run time; 016 expected.

### 4. `benchmarks/sculpture/glb/church.glb` (new, on disk only — gitignored line 24)

Produced by `trellis-glb.mjs` from `concept.png`. Durable record = README row (below).

## Files modified

### 5. `benchmarks/sculpture/resemblance.mjs`

Three edits, all in the registry region (lines 60–106); no logic touched:

- Header comment (lines 60–63): live roster is now gatehouse + cottage + pineapple; drop
  "moai +" from the form-type-poles sentence (pineapple remains the organic pole; the angular
  sculpture pole is retired — say so rather than silently rewording).
- `SUBJECTS`: delete the `moai` entry from the live object.
- Below the closing `};` of `SUBJECTS`, two new blocks:
  1. `// ── RETIRED SUBJECTS …` comment block holding the moai entry verbatim plus the
     rationale (multi-statue concept on black → TRELLIS fragmented into two masses → verdicts
     measured debris, not design; retired 2026-06-10, T-094-01; history/artifacts untouched).
  2. `// ── CHALLENGE SUBJECTS …` + `export const CHALLENGE_SUBJECTS = { church: { key:
     "church", concept: "runs/016-…/concept.png", glb: "church.glb", scale: 48 } };`
     with the contract comment: registered + immutable (Rule 2); no build/map/skin exists;
     consumed later by the pipeline untuned (Rule 3) — future tickets point runner rosters at
     these paths as pure data. Field shapes mirror `SUBJECTS` (`glb` relative to `glb/`,
     `concept` relative to the sculpture root) so a future promotion into `SUBJECTS` is a
     move, not a rewrite; `scale` is the working scale (new field, AC-required).

`export { SUBJECTS, resolveSubject }` (line 301) unchanged; `CHALLENGE_SUBJECTS` exported
inline at declaration. No importer changes — `resemblance-consolidation.mjs`'s default sweep
shrinks to 3 live subjects automatically by object-key removal.

### 6. `benchmarks/sculpture/resemblance-consolidation.mjs`

Header comment only (line ~3): subject list no longer names moai; one line noting the
retirement pointer ("moai retired → see RETIRED SUBJECTS in resemblance.mjs / T-094-01").

### 7. `benchmarks/sculpture/glb/README.md`

- Manifest table: church row (file · subject · source concept run 016 · verts/tris/size from
  `inspectGlb` + mesh load) and a "(retired as a measurement subject, T-094-01)" parenthetical
  on the moai row — provenance preserved, status honest.
- A short "church (T-094-01)" provenance paragraph: provisioning command, checklist file
  pointer, smoke-check numbers (dims/cells, 26-conn components/largestFraction, 6-conn
  reported), mirroring the gatehouse single-mass-verified paragraph.

### 8. `docs/knowledge/design-learnings.md`

New tail section "Subject roster refresh (T-094-01)": why moai was retired (the concept was
the defect — every downstream verdict inherited it), the concept sanity checklist now gating
registration (the six AC items + bulkiness, recorded beside the image, immutable after), and
the church registration (paths, scale, smoke-check numbers, untuned-pipeline contract).

## Files deliberately NOT touched

- `durable-skin.mjs` / `zone-map.mjs` / `multi-angle-gate.mjs` / `material-map.mjs` /
  `shell-integrity.mjs` rosters — no moai present; adding church now would make live runners
  consume it today (violates Rule 3 / "zero pipeline-code changes").
- `trellis-glb.mjs` (frozen Modal contract), all `src/` modules, all tests, scale-study
  artifacts and moai run dirs / `e19-build/moai/*` / `glb/moai.glb`.

## Ordering

1. Edit 5+6 (retirement) — independent; `npm test`; commit.
2. Create 1; run it (live Gemini + claude shim); judge checklist (3); regenerate as needed.
   Commit runner + run dir + checklist (pre-sign-off).
3. Generate 4 (TRELLIS, unsandboxed, `.env`); create 2; run smoke; on fragmentation loop back
   to step 2's regeneration path. Append sign-off to checklist; update 7. Commit.
4. Edit 5 (CHALLENGE_SUBJECTS — registration is last) + 8; `npm test`; commit.
