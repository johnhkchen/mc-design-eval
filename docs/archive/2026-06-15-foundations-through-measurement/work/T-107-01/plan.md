# T-107-01 reconstructed-milestone — Plan

Nine steps, each independently verifiable and atomically committable. GL + judge work is isolated
in steps 5–7 (one subject per step, so a judge surprise never blocks the others). `npm test` (root)
and `render` tests must be green at every commit.

## Step 1 — lens patch: code + guard + tests (commit: render lens fix)
- Write `render/scripts/patch-viewer-lens.mjs` (`patchSource` pure core + CLI), wire
  `postinstall` in `render/package.json`, write `render/src/lens-guard.mjs`, import it from
  `render/src/render.mjs`, write `render/test/stair-mesh.test.mjs`.
- Apply the patch (run the script). 
- **Verify**: `cd render && npm test` — stair section emits vertices, slab unaffected, air still
  empty, patchSource idempotent; re-run script prints `already-patched`; the Research probe scene
  re-rendered shows stepped stairs.
- **Commit 1**: `feat(E-27 T-107-01): stair-lens fix — *_stairs matched the air substring check; patch + tripwire + mesher test`.

## Step 2 — lens evidence: fixture card + prose pins (commit: evidence)
- Update `fixture-card.mjs` finding (`stairs-invisible` → `stairs-rendered`, lens fixed T-107),
  `roof-program.mjs` LENS_NOTE, `shaped-vocab.mjs:14` comment.
- Re-run the fixture-card runner; inspect the card PNG: 5 stair rows VISIBLE, all other rows
  unchanged; read-back still 25/25.
- **Verify**: root `npm test` green (comment/text changes only); fixture record diff shows only
  the stair finding + render bytes.
- **Commit 2**: `feat(E-27 T-107-01): fixture card through the fixed lens — stair rows visible, pins updated`.

## Step 3 — E-26 baselines snapshotted (commit: evidence inputs)
- `git log --oneline -- benchmarks/sculpture/styled/cottage/artifact.json` (and gatehouse, church
  challenge artifact) → identify last E-26-era commit per subject (cottage: `5574d70`).
- Extract via `git show <sha>:<path>`, wrap as `e26-baseline/v1` `{sourceCommit, sourcePath, note,
  artifact}`, write `benchmarks/sculpture/reconstructed/<k>/e26-baseline.json` ×3.
- **Verify**: each wrapper parses; `artifact.placements` non-empty; sourceCommit exists; cottage
  baseline census ≈ the AC's 265/21.7% (compute with the pure fns; mismatch = named finding, not a
  blocker).
- **Commit 3**: `feat(E-27 T-107-01): E-26 baseline artifacts pinned from history with provenance`.

## Step 4 — terminal runner (commit: code only)
- Export `verifyComponentLayer` from `component-skin.mjs` (extraction, no behavior change).
- Write `benchmarks/sculpture/reconstructed-milestone.mjs` per structure.md §Created (distill,
  instrument diff, metrics, sheets, record, `--repro`, `--offline`, honest-failure path).
- Add `reconstructed:{cottage,gatehouse,church}` npm scripts.
- **Verify**: `node reconstructed-milestone.mjs` with no/unknown subject → named usage error;
  `--offline` before any record → named failure (not a crash); root `npm test` green
  (component-skin still passes `reskin` paths — no unit tests exist for it, so verify by
  `node -e "import('./benchmarks/sculpture/component-skin.mjs')"` resolving and `--offline`
  spot-check if available).
- **Commit 4**: `feat(E-27 T-107-01): reconstructed-milestone runner — instrument diff, census deltas, sheets, repro/offline`.

## Step 5 — cottage through the chain (commit: evidence)
- `npm run reconstructed:cottage` (spawns full styled chain: regularize → reconstruct → skin →
  grammar → dressing → settle → kit-aware gate; ~4 judge calls).
- **Verify**: record exists with `instrument.diffs == []`; verdicts recorded per azimuth (PASS or
  honest residuals — either is acceptance); kit presence still PASS; metrics show census delta vs
  baseline; before/after sheets written; stair courses VISIBLE in the after sheet at 135/225/315°;
  `npm run reconstructed:cottage -- --repro` reproduces; root `npm test` green.
- **Commit 5**: evidence commit (styled/* refresh + multi-angle/* + reconstructed/cottage*).

## Step 6 — gatehouse (commit: evidence)
- Same as step 5; additionally verify the generated arch is visible in the after sheet (the 225°
  "colonnade instead of arched doorway" view).
- **Commit 6**.

## Step 7 — church (commit: evidence)
- `npm run reconstructed:church` (challenge path, kit-less by registry). Expected branches:
  (a) coverage gate THROWS again → record carries the band0 re-measurement + census decomposition,
  status honest-failure; (b) the composition moved band0 ≥ 0.5 → gate runs (4 judge calls),
  verdicts recorded.
- **Verify**: band0 number + decomposition present either way; findings name kit-less,
  roof-fallback, zone-map state; `--repro` consistent with the outcome (pipeline-failed repro =
  same THROW, same cause).
- **Commit 7**.

## Step 8 — re-proofs and instrument confirmation sweep
- `--repro` (fresh process) all three; `--offline` re-asserts all three; confirm gate `contract`
  diffs vs the pre-run committed records are empty (recorded in each record's `instrument`).
- Confirm coverage census is block/zone-based (read the T-088 census call path once) and note it
  in the records' instrument note (the lens fix cannot move coverage).
- **Verify**: all proofs recorded in progress.md; no code changes (any fix goes back to its step).

## Step 9 — learnings + epic sheet (commit: docs)
- Append the E-27 section to `docs/knowledge/design-learnings.md` (five-whys; T-102 cage,
  T-103 components, T-104 roof program, T-105 shaped vocabulary, T-106 consuming chain, T-107 lens
  + verdicts; per-subject outcome lines with metric deltas; over/under-reach honest; E-12 handoff
  naming the three artifacts per subject).
- Write `pr/assets/reconstructed-milestone.md` (per-subject verdict tables, before/after metric
  table, sheet links).
- **Verify**: root `npm test` + `cd render && npm test` both green; full AC checklist walk.
- **Commit 8**: `docs(E-27 T-107-01): parametric reconstruction learnings + E-12 handoff`.

## Testing strategy
- **Unit**: `patchSource` (idempotent/throws-on-drift), mesher emission for stairs/slab/air
  (GL-free — meshing is pure given blocksStates).
- **Integration**: the live runners' existing hard asserts ARE the integration suite (pin THROWs,
  double-run byte-equality, settle fixpoint, gate aggregation) — inherited, not duplicated.
- **Evidence verification**: visual sheet inspection (stairs at oblique azimuths, arch at 225°),
  `--repro` ×3, `--offline` ×3, instrument-diff emptiness.
- **Regression**: root suite (~1364) green at every commit; render suite green at steps 1, 9.

## Deviations protocol
Judge verdicts are not controllable: if a subject still FAILs on roof form through the fixed lens,
that is a VALID outcome (AC #2's honest-residual branch) — record and proceed; do NOT re-roll the
judge. Any chain THROW other than church's known coverage gate is a defect: fix at its step,
re-run that subject only, document in progress.md.
