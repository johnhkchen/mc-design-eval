# T-179-01 — Review (RDSPI handoff)

Close the E-43 treatment-grammar leak T-176-01 reported: the edges-from-geometry vocabulary handled
eave/ridge/reveal but could not name the **raking verge** (a sloped line) or the **voussoir arch head** (a
curve). This ticket adds both via one new edge classifier — the **surface profile** — and proves them on the
render + unit tests.

## What changed

### `src/view/treatment-grammar.mjs` (the engine)
- **NEW `deriveRakingVerge(occ, {ridgeAxis, eaveY, ridgeY})`** — the profile primitive for the gable rake:
  the top occupied cell per across-coordinate of each gable-end slice → a sloped line of 3-D `"x,y,z"` rake
  cells; `curve` flags a true rake vs a flat shed. Pure, JSON-round-trippable.
- **NEW `deriveArchHead(aperture)`** — the profile primitive for the opening crown: the crown air cell per
  column (toward the lintel) → the voussoir wedge stones; `curve` separates an arch from a flat lintel.
  Orientation-robust (head direction read from the lintel band). Pure.
- **REWIRED `composeRoofTreatment` verge layer** — keys `surface.relief` to the rake-cell set on the gable-end
  faces (was the gable-end **column** set = the heavy band). Report drops `leak`, adds
  `profile:"raking", rakeCells, curve, resolves`.
- **NEW `archHeadPlacements` helper + `composeTreatment.edges.opening.voussoir`** — optional recolor of the
  arch wedge stones along the crown curve, depth probed against `occ` within the aperture region (recolor of
  existing solids, no air op). Skipped gracefully without the injected seam. Flat openings carry no `isArch` ⇒
  no-op (the flat head stands unchanged). Added local `namespaced` + `OPENING_AXES`.

### `src/view/treatment-grammar.test.mjs`
- **TG16 rewritten** — from *asserts-the-verge-leak-exists* to *asserts-the-rake-is-crisp* (verge cells <
  full gable-end band; `curve=true`; no `leak` field; closure ok).
- **NEW TG21–TG26** — `deriveRakingVerge` on ridge-x / ridge-z / flat-shed; `deriveArchHead` on arch / flat;
  the `composeTreatment` voussoir path with an injected seam stub (and skipped without it).

### `experiments/eval-alignment/treatment-verge-voussoir-beside.mjs` (NEW witness, unswept)
- Renders the faithful gatehouse with the rake verge beside the concept, and a synthetic arched passage
  (bare vs voussoir-dressed) through the same compositor. Asserts closure on every build; glance log to
  stderr. Output PNGs + `gatehouse.vergehead.treatment.json` in this work dir.

### `experiments/eval-alignment/treatment-sourced-beside.mjs` (T-176 runner, 2 lines)
- Its stale `leak` print updated to report the resolved rake profile.

## Test coverage

- `npm test` **green: 2283 pass / 0 fail** (+6 from TG21–TG26). Grammar file 26/26.
- The two new derivations are **pure** and unit-tested exhaustively on synthetic gable + arched geometry (the
  AC): ridge-x/ridge-z/flat for the rake; arch/flat for the head; both round-trip JSON; inputs untouched.
- The compositor rewire is covered by the TG16 rewrite (crisp rake) and TG26 (voussoir via seam).
- **Gap**: the voussoir recolor's *world-space* path (`archHeadPlacements` depth probe) is exercised by the
  witness runner (live, GL) and the synthetic render, but not by a pure unit test that asserts exact world
  positions — TG26 uses an injected stub and asserts placement *presence*, not coordinates. The runner + the
  synthetic A/B render are the integration check. A pure positional test could be added if the head is
  promoted into the chain.

## Acceptance criteria

- [x] Raking-verge + voussoir-head derivations added, composed by the same compositor (`surface.relief` via
      the door; the injected opening seam).
- [x] Gatehouse rendered — the verge reads (rake, 34 cells vs the T-176 198-cell band); the head reads on
      synthetic arch geometry (the faithful gate is square — see open concern).
- [x] Unit tests on synthetic gable + arched-opening geometry (TG21–TG26).
- [x] `closureOf` not regressed (all builds `ok`, before==after==1.0000); **recorded honestly**: the edge
      classifier (a surface profile) was the sub-problem; one primitive closes both and generalizes.
- [x] `npm test` green; frozen instrument untouched (only `src/view/treatment-grammar*` + `experiments/`).

## Open concerns for a human

1. **The faithful gatehouse gate is not an arch** (`extractApertures` finds no arched aperture; only 4
   rectangular window slits). So the voussoir head **no-ops on the real build** — a **build faithfulness gap
   (S-177)**, not a grammar gap. The head is witnessed on synthetic geometry + unit tests. When S-177
   delivers a gate that reads as an arch (or the recognition marks it `isArch`), the head will dress it with
   no further grammar change — `edges.opening.voussoir` is already wired.
2. **The voussoir recolor lives in `composeTreatment`, not `opening-dressing.mjs`** (design opt 4 — blast
   radius). If a future ticket promotes it onto the styled chain, move `archHeadPlacements` into
   opening-dressing (it has the depth-probe machinery) and add a positional unit test.
3. **Multi-ridge / hip rakes**: `deriveRakingVerge` handles both ends of one gable ridge. A cross-gable or
   hip would need the same profile applied per gable — straightforward, deferred (the gatehouse is a single
   gable).
4. **No metered re-score** — the judge is the render (the FINDINGS posture; spend gated). The numeric
   self-concept lift is unspent, consistent with T-176-01.

## Provenance
Commits on `main`: profile primitives + tests; witness + synthetic head render. All `npm test`-green before
each commit.
