# T-053-01 Plan — ordered, atomically committable steps

Each step is independently verifiable. Testing strategy is up front because most of the "verification" here
is reproducibility of the generated table, not unit tests (the consolidator lives under `benchmarks/`, which
`npm test` does not cover).

## Testing strategy

- **No new `src/` unit tests** — the deliverable is a `benchmarks/` consolidator + docs; adding it to
  `src/**` would misfile it. The consolidator's correctness is verified by **reproducibility**: running it
  twice yields byte-identical output, and every emitted number is cross-checked by hand against its source
  JSON (Review step records the cross-check).
- **`npm test` is the regression gate**: it must stay green (artifact validation + `src/**` unit tests).
  Since no `src/` file changes, green is expected; verified explicitly in Step 4.
- **Reproducibility check**: `node benchmarks/sculpture/glb-grounded-ab.mjs` regenerates `.md`+`.json` from
  committed inputs with no diff on a second run.

## Step 1 — the consolidator + generated artifacts
Write `benchmarks/sculpture/glb-grounded-ab.mjs` (Structure §CREATE). Run it to emit
`glb-grounded-ab.{md,json}`.
- Verify: both files written; the six IoU numbers match the source JSONs exactly
  (text→JSON koi 0.472 / heart 0.456 from `glb-formtarget-ab.json`; voxel koi 0.622 / heart 0.877 from the
  voxel summaries; surgical koi 0.614 / heart 0.877 from `glb-voxel-surgical.json`; concept koi 0.481 /
  heart 0.347 from `form-baseline.json`).
- Verify: re-run is a no-op diff (byte-stable).
- Verify: `node -e "import('./benchmarks/sculpture/glb-grounded-ab.mjs')"` imports without writing (main
  guard works) — proves it's safe to import in a future test.
- Commit: `feat(E-16 T-053-01): glb-grounded three-way head-to-head (consolidator + md/json)`.

## Step 2 — the design-learnings journal section
Append the `## E-16 GLB-grounded form …` section to `docs/knowledge/design-learnings.md`, quoting the
numbers the consolidator emitted (not hand-derived).
- Verify: the table in the section equals the `.md` table; the three answers each cite a real Δ; the
  residual is present; null/negative findings (koi regressed, surgical no net gain) are stated as results.
- Commit: `docs(E-16 T-053-01): design-learnings E-16 GLB-grounded form section`.

## Step 3 — the E-12 handoff beat
Write `pr/assets/glb-grounded.md` (Structure §CREATE). If `pr/assets/README.md` enumerates beats, add a
line for it.
- Verify: every render path named exists on disk (`runs/006…`, `runs/009…`, `glb-voxel/{koi,heart}`,
  `glb-voxel-surgical/koi`).
- Commit: `docs(E-16 T-053-01): pr/assets glb-grounded E-12 handoff beat`.

## Step 4 — verify + RDSPI artifacts
- Run `npm test`; confirm green (record the count).
- Confirm AC items: head-to-head `.md/.json` ✓; design-learnings E-16 section ✓; pr/assets handoff ✓;
  honest + tests green ✓.
- Write `progress.md` (running, updated through the steps) and `review.md` (the handoff doc).
- Commit: `docs(E-16 T-053-01): RDSPI artifacts (research→review)`.

## Sequencing rationale
- Step 1 first: the generated table is the **source of truth**; the journal and handoff must quote it, so it
  must exist before they're authored (prevents drift — the design.md risk).
- Steps 2–3 are independent given Step 1 and could be one commit, but kept separate so the journal (the
  durable epic record) and the PR beat (the external handoff) have clean, reviewable diffs.
- Step 4 last: verification + the insurance artifacts.

## Out of scope (explicit)
- No re-running of any arm (no `claude -p`, no voxelization, no renders) — Option A rejected in design.
- No fresh LLM perceptual judge — the categorical is the deterministic verdict + IoU band (design decision).
- No `src/` changes.
