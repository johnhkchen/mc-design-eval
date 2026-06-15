# T-160-01 Plan — ordered, verifiable steps

*Each step commits atomically; verification stated. `npm run test:unit` must stay green after every step
that touches `src/`.*

## Step 1 — The pure brush `src/view/wall-generate.mjs`

Implement `closeColumns`, `perimeterColumns`, `spaceOpenings`, and `constructWalls` per Structure.
- Reuse the `seal_walls` dilate/erode close (Manhattan ball, r=2) — it is proven on these footprints.
- `constructWalls`: histogram band → close → perimeter → drop ring band cells → solidify ring → carve
  openings (program or derived) → `occupancyFromCells`. Preserve `state` on kept cells.
- **Verify:** module imports cleanly; a quick REPL on the real cottage occupancy prints a higher perimeter
  column count than the raw ring (missing columns added) and leaves above-eave cells unchanged.

## Step 2 — Unit tests `src/view/wall-generate.test.mjs`

Write WG1–WG8 (Structure). Synthetic occupancies via `occupancyFromCells`; no real artifacts, no GL.
- **Verify:** `npm run test:unit` green, including the new file. The whole suite (≈2098+ tests) stays green
  — the brush is additive, touches no shared module.
- **Commit 1:** `feat(T-160-01): pure wall-construction brush + unit tests (WG1–WG8)`.

## Step 3 — Wire into `autonomy-loop.mjs` (replace `seal_walls`)

- Add `loadProgram(subject)` (fs read + JSON.parse, null if absent).
- Import `constructWalls`; replace the `seal_walls` body with the thin adapter; swap `TOOLS`/`MENU`/agent
  enum keys to `construct_walls`. Remove the dead `sealWalls` import if unused.
- Keep toolset size-3 (gable / walls / timber).
- **Verify:** `node experiments/eval-alignment/autonomy-loop.mjs cottage --dry`-equivalent — run a single
  subject far enough to confirm the tool applies without throwing and the artifact still renders. (GL is
  required for the render; if GL is absent in this env, fall back to invoking `constructWalls` directly on
  the cottage occupancy and `rebuildArtifact` to prove the artifact validates — see GL-probe memory.)
- **Commit 2:** `feat(T-160-01): wire construct_walls into autonomy loop, replacing seal_walls`.

## Step 4 — Run the autonomous volume batch (AC #3)

- `node experiments/eval-alignment/autonomy-loop.mjs` (all three: cottage, barn, gatehouse).
- Capture `results/autonomy-<subject>.json`, `results/volume-ledger.json`, the per-round renders.
- **If GL is unavailable** (headless probe says so), record that the eval/render leg could not run in this
  environment and produce the **geometry/witness** evidence that *is* reproducible: pre/post occupancy
  stats (perimeter fill %, cell deltas) and a `rebuildArtifact` validity check, and flag the render+score as
  the human-in-the-loop follow-up. Do not fabricate scores. (Anti-hedge: report exactly where it landed.)

## Step 5 — Beside-concept witness renders (AC #3/#4)

- Per subject, render the final constructed build **beside its concept**, judge-free
  (`npm run render:beside -- --subject <key>`, or `renderViews` + composite in the work dir).
- Save to `docs/active/work/T-160-01/` (e.g. `<subject>-walls-beside.png`).
- **Verify by eye:** does the envelope read as solid walls with a regular opening rhythm? Did the roof
  survive? Did barn/gatehouse massing survive (no solid-bbox blob)?

## Step 6 — Honest write-up + Review

- `progress.md`: what was done, any deviation, the trajectory numbers, and whether GL ran.
- `review.md`: files changed, test coverage + gaps, the **per-subject climb reported honestly** —
  including the falsification verdict (did the cottage climb? did anything regress? is alignment the gate?).
- **Commit 3:** `docs(T-160-01): batch trajectory + beside renders + honest climb report`.

## Testing strategy

- **Unit (pure, deterministic):** WG1–WG8 cover the geometry primitives (close/perimeter/spacing), the
  envelope-replace contract (missing columns repaired, roof untouched), program-driven and derived openings,
  determinism, and the massing-preservation guard. This is the bulk of the verifiable correctness and runs
  in CI via the existing glob.
- **Integration (GL-dependent, may be human-in-loop):** the volume batch + eval is the *measurement* leg.
  It is reproducible only where GL is available; its verdict is evidence, the render is the witness. We do
  not gate the AC on a score — we gate on the brush contract (unit-tested) + the render read.
- **Verification criteria for "done":**
  1. `npm run test:unit` green with the new brush + tests.
  2. `construct_walls` wired as the wall tool, toolset still size-3, `defect-eval.mjs` untouched, no
     per-building constants in the brush.
  3. Batch run executed (or, if GL-blocked, geometry witness produced + the render/score leg explicitly
     flagged as the follow-up), with the per-subject climb **reported honestly** and renders saved.

## Rollback / contingency

- If the constructed ring **regresses barn/gatehouse**, the smallest honest fix is to keep `construct_walls`
  but document the regression and (optionally) restrict the aggressive close to cottage-like ragged
  footprints via a *param* (not a per-building constant) — or report it as the falsification it is. No silent
  tuning to chase the number (the stage's lesson).
- If the cottage **stays flat**, that is a valid terminal result: the finding is "envelope watertightness is
  not the cottage's gate — massing/absolute-alignment is," and Option A (program-footprint registration)
  becomes the named follow-up ticket. Report, don't paper over.
