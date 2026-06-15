# T-145-01 Plan — execution steps

Five commits, each green on its own (`npm test`). The realize path and committed artifacts are never
touched (facade is recorded, not realized — design D0), so `--repro`/`--offline` byte-identity holds
at every step. Verification gates are concrete.

## Step 1 — Schema (additive): facade on the program, articulation on the pack

**Edit** `schema/building-program.schema.json`: optional per-mass `facade` (structure S1).
**Edit** `schema/style-pack.schema.json`: optional `proportions.articulation` (structure S3).

**Tests (extend, don't fork):**
- `src/recognition/program.test.mjs`: (a) legacy program (no facade) still passes
  `assertBuildingProgram`; (b) a valid facade program passes; (c) a facade with a `block` key is
  rejected; (d) a face missing `evidence` is rejected.
- `src/pack/style-pack.test.mjs`: a pack with and without `articulation` both validate.

**Verify:** `npm test` green. `git grep -n articulation schema packs` shows additive only. Re-run
`node benchmarks/sculpture/recognize.mjs --offline` (or `npm run recognize:offline`) → all committed
recognition artifacts still REPRODUCE byte-identically (schema accepts the supersets; existing data
unchanged).

**Commit:** `feat(T-145-01): additive facade-grammar schema (program) + articulation bounds (pack)`.

## Step 2 — Program validation + the diegetic proof

**Edit** `src/recognition/program.mjs`: add `facadeBounds(pack)`, `assertFacadeDiegetic(program,
pack)`, and extend `validateProgramAgainstPack` to validate `facade` (roles ∈ palette; period/
overhang/jetty/quoin within pack bounds; course y within wall height; `textured-glb ⇒ layoutOnly`;
wall ∈ the mass) — all hard errors (structure S2).

**Tests:** `src/recognition/program.test.mjs`:
- off-palette `memberRole` → finding; `period` beyond `facadeBounds` → finding; `eaveOverhang`
  over bound → finding; `textured-glb` face with `layoutOnly:false` → finding;
  `courseLines[].y ≥ wallH` → finding.
- a fully clean facade → `validateProgramAgainstPack` ok; `assertFacadeDiegetic` ok with a per-face
  receipt.
- `facadeBounds` fallback: with no `articulation`, period bounds equal `openingRhythm` spacing,
  overhang/jetty/quoin ceilings equal `storeyHeight.max`.

**Verify:** `npm test` green; recognition `--offline` still byte-identical (committed programs have
no facade → the new branch is inert for them).

**Commit:** `feat(T-145-01): pack-vocabulary + diegetic validation for the facade block`.

## Step 3 — Recognition pure core + offline replay fixture

**Create** `src/recognition/facade-grammar.mjs`: `FACADE_REPLY_BUDGET`, `unseenFaces`,
`facadeDigest`, `facadeRenderArgs`, `mergeFacade`, `parseFacadeReply` (structure S4).
**Create** `src/recognition/fixtures/facade/{base-program.json, reply.txt, expected.json,
prompt.txt}` (structure S7) — a synthetic, subject-agnostic cottage-shaped base (registry data, no
subject key in any `src/**` file).
**Create** `src/recognition/facade-grammar.test.mjs`.

**Tests:**
- `facadeRenderArgs` returns `{facade_digest, schema_json}`; `facadeDigest` byte-deterministic across
  two calls (the `--repro` pure half).
- `mergeFacade` pure: input program unchanged, output carries facade.
- `parseFacadeReply(reply.txt, {program: base, pack})` deep-equals `expected.json` **and**
  `JSON.stringify(result,null,2)+"\n"` byte-matches the committed `expected.json` (offline replay).
- reply-policy: `runReplyPolicy` with `parse: parseFacadeReply` — malformed×N → REFUSE (null, no
  re-roll); malformed-then-good → accept on attempt 2; ledger records each attempt.
- a non-diegetic reply (textured-glb face, layoutOnly:false) throws in `parseFacadeReply`.

**Verify:** `npm test` green. The fixture replay is the AC's "recorded reply → parsed grammar replays
byte-identically offline."

**Commit:** `feat(T-145-01): facade recognition prompt + parse + offline replay fixture`.

## Step 4 — Textured-GLB render seam

**Create** `src/recognition/facade-render.mjs`: pure `texturedGlbRenderPlan`, impure leaf
`renderTexturedGlbViews` (structure S5).
**Create** `src/recognition/facade-render.test.mjs` (pure plan only).

**Tests:** `texturedGlbRenderPlan({glbPath, azimuths, palette})` echoes the four
`MULTI_ANGLE_GATE.azimuths`, tags `method:"voxel-colour-splat"`, `layoutOnly:true`, and the
honest-caveat note. (No GL in the unit glob.)

**Verify:** `npm test` green. Manually (if a GLB + GL are available) run the runner's render path and
confirm four PNGs + sha256s land; render absence is recorded, never fatal.

**Commit:** `feat(T-145-01): textured-GLB multi-angle render seam (voxel-colour splat, layout-only)`.

## Step 5 — Runner + committed records + offline replay

**Create** `benchmarks/sculpture/facade-grammar.mjs` (structure S6): live + `--offline`, pin-guarded,
fallback to `pack-idealised`, E-25 self-grep.
**Create** `benchmarks/sculpture/recognition/facade/<subject>.*` committed records (merged program,
reply, prompt, render seam, diegetic receipt) — the offline pins. Produced by running `--offline`
against the Step-3 fixture promoted to a subject record, OR authored deterministically from the
fixture (no live spend needed to seed the offline pin).
**Edit** `package.json`: `facade-grammar:offline` + per-subject scripts mirroring `recognize:*`
(mind the `--` flag-swallowing rule, [[npm-run-flag-swallowing]]).

**Tests / verify:**
- `node benchmarks/sculpture/facade-grammar.mjs --offline` exits 0 and reports the merged program
  REPRODUCES byte-identically; the diegetic receipt re-derives `diegetic:true`.
- Full repro sweep unaffected: `npm run recognize:offline` and the proportion/visibility witness
  suites stay byte-identical (no realize/artifact change).
- `npm test` green (2033+ baseline maintained).
- Self-grep clean (no subject keys in the runner).

**Commit:** `feat(T-145-01): facade-grammar runner + committed records + offline replay`.

## Testing strategy summary

- **Unit (test glob, pure):** schema accept/reject (Steps 1–2), validation findings (Step 2),
  prompt determinism + parse + merge + reply-policy (Step 3), render plan (Step 4). These are the
  regression net.
- **Integration (runner, offline):** `--offline` byte-identity of the merged program + diegetic
  receipt (Step 5). No metered call in the test path — the live ask is exercised only by an operator
  (the `recognize.mjs` precedent).
- **Repro invariants:** every step keeps `recognize:offline` and the witness suites byte-identical,
  because facade is recorded, not realized.
- **No per-building constants:** every facade bound is pack-carried (`facadeBounds`); the runner
  self-grep pins it; fixtures use a synthetic base, not a named subject in `src/**`.

## Risks & mitigations

- *Schema strictness churn* — AJV `strict:true` may flag an unknown keyword; keep additions to
  standard JSON-Schema vocabulary (`oneOf`, `enum`, `$ref`). Verified by Step-1 tests.
- *Hidden realize coupling* — if any code path reads `program.masses[].facade` during compile, it
  would change bytes. Mitigation: `git grep -n "\.facade"` after Step 1; compile must stay blind.
- *Fixture drift* — the offline `expected.json` is the pin; regenerate only via the pure parse, never
  by hand, to avoid a silent contract change ([[pack-edit-blast-radius]]).
