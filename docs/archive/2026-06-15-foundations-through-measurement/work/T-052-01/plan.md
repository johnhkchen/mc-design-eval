# T-052-01 — Plan: ordered, committable steps

Each step is small enough to commit atomically. The harness is GL+metered (not in `npm test`); the
verification that matters is a clean live run + committed record + `npm test` still green.

## Step 1 — Harness skeleton (pure scaffolding)
**Do:** Create `benchmarks/sculpture/glb-voxel-surgical.mjs` with the header (E-16 synthesis framing),
imports (incl. `formVerdictOf`/`VERDICT_GLOSS` from `./glb-formtarget-ab.mjs`), `SUBJECTS` (koi+heart, four
regions from design.md), `makeRegionCritic`, and `p14Report`. Stub `reviseSubject`/`emit` enough to parse.
**Verify:** `node --check benchmarks/sculpture/glb-voxel-surgical.mjs` passes; `node -e` importing the file
does not throw (the pure helpers load with no GL). Quick assert `makeRegionCritic` returns the right route
for a matching spec and `[]` for a non-match.
**Commit:** `feat(E-16 T-052-01): glb-voxel-surgical harness skeleton (critic + P14 reporter)`.

## Step 2 — Live wiring + emit
**Do:** Implement `wholeObjectIoU`, the full `reviseSubject` (read glb-voxel artifact → buildBounds →
`glbFormTarget` → before render → `makeFormEditor({critic})` → `reviseLoop` with both routes → after render
→ proposed renders for stashed LLM edits → assemble row with `perRegion`, `p14`, `verdict`), `mdTable`,
`emit`, `regenerateOffline`, and `main` (skip absent artifact/GLB; `--offline` branch).
**Verify:** `node --check` passes; import still GL-free (emit/regenerateOffline don't import GL at module
load — GL is lazy inside `wholeObjectIoU`). Do **not** run live yet.
**Commit:** `feat(E-16 T-052-01): live reviseSubject + emit for glb-voxel-surgical`.

## Step 3 — .gitignore
**Do:** Add `benchmarks/sculpture/glb-voxel-surgical/**/*.png`.
**Verify:** `git status` shows no PNGs staged after a (later) run; `.json`/`.md` are tracked.
**Commit:** folded into Step 4's run commit (trivial; or its own one-liner).

## Step 4 — The live run (the deliverable)
**Do:** `node benchmarks/sculpture/glb-voxel-surgical.mjs` with the GLBs present (dwebp not needed). This
renders both builds, runs the loop (procedural region deterministic; LLM region spawns `baml-revise.mts`
via `claude -p`), and writes `glb-voxel-surgical/{glb-voxel-surgical.json, .md}` + per-subject renders.
**Verify (the honest checklist):**
- Both subjects ran (no skip); each has a before/after whole IoU and a per-region trace.
- **P14:** `p14.ok === true` for both; every accepted region appears in `locked`; rolled-back tweaks left
  the build unchanged.
- **Apples-to-apples:** verdict computed GLB-after vs GLB-before (never a cross-target baseline).
- **Sanity:** no `regressed` verdict (would be an alarm — impossible under the rollback gate). If it
  appears, stop and debug the gate wiring before committing (the T-049-01 lesson).
- Eyeball the committed renders: does the LLM/procedural pass visibly touch the targeted artifact (koi tail
  fin / heart arch), and did the gate keep or roll it back?
**Commit:** `feat(E-16 T-052-01): live surgical run on glb-voxel koi+heart (record committed)` including the
`.json`/`.md` + `.gitignore`.

## Step 5 — Regression + offline reproducibility
**Do:** `npm test`. Then `node benchmarks/sculpture/glb-voxel-surgical.mjs --offline` to confirm the verdict
re-derives from the committed numbers with no GL/model.
**Verify:** `npm test` green (count ≥ the T-051-01 baseline 514, unchanged — no new src tests). Offline
regen reproduces the same `.md` table.
**Commit:** none if clean (offline regen is idempotent); else amend the record.

## Step 6 — Phase artifacts
**Do:** `progress.md` (what shipped, deviations, the honest numbers) then `review.md` (handoff: files, AC
status, the did-it-clean-the-artifact answer, kept-vs-rolled-back, P14, open concerns). Commit:
`docs(E-16 T-052-01): RDSPI artifacts (progress + review)`.

## Risk register & responses
- **`claude -p` / GL unavailable in this environment** → the run errors. Response: the harness skips a
  subject only on missing *assets*, not on model failure; a model/GL failure is a hard stop. If GL/model
  genuinely can't run here, fall back to documenting the offline-shaped harness + the deterministic
  procedural-route result (which needs only GL, not the model) and flag the LLM-route run as
  not-executed-here — **honestly**, never fabricate numbers. (Prior tickets ran live tonight, so the
  expectation is a full live run.)
- **A region selects zero placements** → `selectRegion` returns an empty R; `diagnose` proposes nothing
  meaningful → identity no-op → rolled back. Caught by eyeballing the trace; regions were chosen from the
  occupancy histogram to avoid this.
- **LLM proposes out-of-R ops** → `applyFormEdit` rejects them (recorded in `proposals`); a fully-rejected
  proposal stashes nothing → identity no-op → rolled back. Already the designed behavior; surfaced in the
  report's `proposals` field.
- **`regressed` alarm** → indicates a target/baseline mix or a non-rollback path; stop and fix before
  committing (mirrors the T-049-01 pre-commit catch).
- **Duplicate-logic temptation** → verdict helpers are imported from the sibling, not re-declared (the
  parallel-roots / duplicate-parser lesson). `node --check` + a grep for a local `function formVerdictOf`
  guards against accidental reintroduction.

## Definition of done (maps to AC)
- [AC1] `reviseLoop` ran on both glb-voxel builds with `glbFormTarget({glbPath})`. ✓ when Step 4 records two
  non-skipped subjects.
- [AC2] per-region trace (procedural vs LLM, kept vs rolled-back) + before/after GLB IoU + categorical
  verdict saved under `glb-voxel-surgical/<subj>/` + an A/B summary. ✓ on emit.
- [AC3] P14 holds (no accepted region later altered; non-improving tweaks rolled back). ✓ when `p14.ok` for
  both and the gate shows rollbacks.
- [AC4] honest about whether tweaks cleaned artifacts (kept-vs-rolled-back shown); `npm test` green. ✓ in
  the md headline + Step 5.
