# T-160-04 Plan — ordered, independently verifiable steps

Each step is a small, committable unit. Tests precede or accompany the behaviour they cover. `npm run
test:unit` is green after every step. Re-Read `wall-generate.mjs` / `autonomy-loop.mjs` before each Edit
(shared-file sweep lesson).

## Step 0 — baseline
- Run `npm run test:unit`; confirm green (expect 2172/2172). Record the count. No edits.

## Step 1 — `robustExtent` + `coverageOf` (pure helpers, no behaviour change)
- Add both functions, exported, to `wall-generate.mjs`. `robustExtent` defaults to raw min/max (identity)
  so it is a strict superset of `bboxOf`; the `polluted` flag compares raw vs percentile.
- **Tests (WG9):**
  - `robustExtent` on a clean rect == raw bbox, `polluted=false`.
  - inject one outlier post far outside → raw bbox inflates, percentile (trim 0.02) does not, `polluted=true`.
  - `coverageOf`: a ring laid exactly on a set of posts → 1.0; a ring one cell off but within tol → 1.0; a
    ring far from the posts → low; empty inputs → 0 (no NaN).
- **Verify:** `npm run test:unit` green. **Commit:** `feat(T-160-04): robustExtent + coverageOf pures`.

## Step 2 — `registerRect` + `filledRect` (the affine fit; still no `constructWalls` change)
- Add `filledRect` (private) and `registerRect` (exported) per structure.md. Build the affine `transform`,
  the 2-rung axis ladder, coverage rank, tie-break, `ambiguous`/`polluted` diagnostics.
- **Tests (WG10, WG11):**
  - WG10 — a synthetic occupancy that is a clean `W×D` ring in a **negative-coord** frame at a **different
    scale** than the program rect (e.g. program `{0,0,48,24}`, build ring 24×12): `registerRect` returns a
    transform whose `ring` traces the build ring (`coverage` high), `axis="identity"`, `scale≈{0.5,0.5}`,
    `ambiguous=false`. A program rect rotated relative to the build (program `48×24`, build ring `12×24`)
    selects `axis="swap"`.
  - WG10b — near-square extent + near-square program → `ambiguous=true` (axis tie reported, not forced).
  - WG11 — two masses (L: main + perpendicular wing) → `ring` is the **union** of two transformed
    perimeters and the **L-notch column stays out of the ring** (massing preserved, не a bbox).
- **Verify:** green. **Commit:** `feat(T-160-04): registerRect affine fit (axis ladder, coverage rank)`.

## Step 3 — wire the branch into `constructWalls` + the WG1 companion (red→green)
- Re-Read `wall-generate.mjs`. Add the branch (structure.md): compute `closeRing`, `reg`, `useReg` by
  comparative coverage; set `ring`/`bbox` from the winner. Steps 3–5 unchanged.
- **Test (WG12 — the AC's required companion to WG1):** build a `ringOcc` with a **straight-run absent
  column** dropped from a flat edge (the case WG1 documents close *cannot* bridge); supply a `program` whose
  single mass is that clean rectangle; assert the dropped column is now **solid floor→eave** via the
  registered path. Add a paired assertion that **without** a program (close path) the same column stays
  open — pinning the contrast WG1 named.
- **Test (WG13 — no-regress on a dense shell):** a FULL clean ring + a program matching it → registered ring
  == close ring → `constructWalls` output is byte-identical to the program-less close path (gatehouse/dense
  invariance). Confirms the comparative gate never *degrades* a shell Option B already solves.
- **Verify:** green. **Commit:** `feat(T-160-04): registered-rectangle envelope path in constructWalls`.

## Step 4 — confirm the loop is a no-op (or minimal)
- Re-Read `autonomy-loop.mjs` `construct_walls`. The program is already passed to `constructWalls`, so the
  registered path is live with **no loop edit**. If true, add only a one-line comment noting registration is
  now internal (geometry, not a new tool). Do **not** touch `wallSkin`/`roleBlock` wiring.
- **Verify:** `node -e` smoke importing the loop's `construct_walls` on the barn occupancy throws nothing and
  yields a closed barn ring (count band-floor columns solid). **Commit (if any):** `chore(T-160-04): note
  internal registered path in the wall tool`.

## Step 5 — measurement: barn witness + no-regress check
- If GL is available (probe `render/src` GL_AVAILABLE per the nested-render lesson; macOS has no `timeout`,
  use a node-native timeout / `gtimeout`):
  - Render the **barn** beside its concept via `walls-beside.mjs` (or a direct `renderBesideConcept` on the
    constructed end-state). Save `docs/active/work/T-160-04/barn-walls-beside.png`. **Eyeball:** are the
    long-wall straight runs now solid (not a colonnade)?
  - Render **gatehouse** + **cottage** beside concepts → confirm no visible regression (gatehouse stays the
    clean stone ring; cottage envelope is at least as solid as before — its cap remains material).
  - Optionally re-run the volume batch (cottage/barn/gatehouse) to record quality deltas in the ledger, with
    the eval untouched. Report median quality before/after per subject.
- If GL is **absent**, record that the measurement leg is deferred (as in T-160-01), and rely on the
  unit-level WG12 proof (straight-run closed) + a deterministic occupancy census (count solid band columns
  on the barn before/after) as the closure evidence. State this plainly in `progress.md`/`review.md`.

## Step 6 — Review
- Write `review.md`: files changed, test coverage + gaps, which of failure modes (a)/(b)/(c) actually
  occurred for the barn, whether gatehouse/cottage held, and the exported transform seam for T-160-03.

## Testing strategy summary
- **Unit (CI, pure, deterministic):** WG9 (robust extent + coverage), WG10/10b (registration ladder, axis,
  ambiguity), WG11 (multi-mass L-union), WG12 (the straight-run companion — the headline proof), WG13
  (dense-shell no-regress). All under `src/**/*.test.mjs`.
- **Integration (out of CI, GL+LLM):** the barn/gatehouse/cottage beside-concept renders + optional batch
  quality deltas. Evidence committed as PNGs + ledger, per the T-160-01 precedent.
- **Verification criteria for the claim:** WG12 green = straight runs close at the unit level; the barn
  render = they close on the real shell; gatehouse/cottage renders = no regression. If the barn render still
  shows a colonnade despite WG12 green → registration didn't fire on the real shell (ambiguous / out-covered)
  → report which, per failure mode (b)/(c).

## Risks / mitigations
- **Real barn shell is too ragged for `coverage(reg) ≥ coverage(close)` to trip** → registered path never
  selected. Mitigation: log both coverages in the smoke; if the gate is too strict, the honest finding is
  the comparison metric, not a constant — document, don't tune a subject in.
- **Outlier post inflates extent → misplacement.** Mitigated by `robustExtent` trim; `polluted` flag
  surfaces it. WG9 pins this.
- **Shared-file sweep** with a sibling thread on `wall-generate.mjs`/`autonomy-loop.mjs`: re-Read before each
  Edit, keep edits additive, verify green before commit.
