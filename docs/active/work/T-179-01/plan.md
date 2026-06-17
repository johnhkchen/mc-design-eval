# T-179-01 — Plan: ordered, independently-verifiable steps

Testing strategy: the two new derivations are **pure** → exhaustive `node:test` unit tests on synthetic gable
/ arched geometry (the AC). The compositor rewire is covered by rewriting TG16 + a new opening test. The
render is the **glance** witness (AC2), produced by an `experiments/` runner (unswept). `npm test` must be
green before every commit (shared-file-commit-sweep: re-read, additive, verify, commit).

## Step 1 — Pure derivations + their unit tests (commit 1)

1. Add `deriveRakingVerge(occ, {ridgeAxis, eaveY, ridgeY})` after `deriveRoofEdges` (structure §1a). Pure,
   fail-loud, JSON-round-trippable.
2. Add `deriveArchHead(aperture)` after `deriveOpeningEdges` (structure §1b). Pure, fail-loud.
3. Tests TG21–TG25 (structure §2): rake on ridge-x / ridge-z / flat-shed; arch head on arch / flat.
4. Verify: `node --test src/view/treatment-grammar.test.mjs` green.
5. Commit: `feat(T-179-01): profile edge primitives — deriveRakingVerge + deriveArchHead (rake & arch curve)`.

**Verification criteria:** rake cells = top-y-per-across (5,6,7,6,5 across z on `gableBoxStub`), `curve===true`;
flat shed `curve===false`; arch head crown av varies & voussoirs trace the arc; flat head degenerates to one
row. All round-trip JSON; input occupancy/aperture untouched.

## Step 2 — Rewire the verge layer to the rake (commit 2)

1. In `composeRoofTreatment`, replace the `vergeColumns` 2-D-keyed `surface.relief` with the
   `deriveRakingVerge` 3-D rake-cell-keyed one (structure §1c). Faces = `rake.faces`. Report: drop `leak`, add
   `profile:"raking", rakeCells, curve, resolves:"..."`.
2. **Rewrite TG16**: from *asserts-the-leak-exists* to *asserts-the-rake-is-crisp* — `verge.profile==="raking"`,
   `verge.placed === rakeCells.length`, and strictly fewer than the old full-band count (computed inline);
   closure ok.
3. Verify: full `node --test src/view/treatment-grammar.test.mjs` + `npm test` green (TG16 was the only
   leak-asserting test; confirm nothing else asserts `verge.leak`).
4. Commit: `feat(T-179-01): raking verge — composeRoofTreatment emits the sloped board, leak closed`.

**Verification criteria:** verge cell count drops to the rake-line count; closure not regressed; no other test
references the removed `leak` field (grep before commit).

## Step 3 — Optional voussoir head recolor in the opening layer (commit 3)

1. Extend `composeTreatment`'s `E.opening` branch: when `E.opening.voussoir` set + seam injected, derive arch
   heads and recolor voussoir stones via the injected seam (structure §1d). Skipped gracefully without the
   seam (mirror TG11). Flat path byte-unchanged.
2. Test TG26: injected stub returns an arched aperture → voussoir recolor places head cells; no seam →
   skipped.
3. Verify: `npm test` green.
4. Commit: `feat(T-179-01): voussoir arch head — optional head recolor through the injected opening seam`.

**Verification criteria:** with the stub, `byLayer.opening.voussoirs > 0`; without the seam,
`byLayer.opening.skipped` present; existing TG11 (flat opening seam) still passes unchanged.

## Step 4 — Witness runner + render + spec witness (commit 4)

1. Write `experiments/eval-alignment/treatment-verge-voussoir-beside.mjs` (structure §3): load faithful
   gatehouse, source spec (+ `roof.edge`, `edges.opening.voussoir`), compose wall → roof(rake) → voussoir
   head, render the −x gable elevation beside the concept, assert closure on every build, glance log to
   stderr.
2. `assertGlAvailable()` up front. Run it → `docs/active/work/T-179-01/verge-voussoir-beside.png` +
   `gatehouse.vergehead.treatment.json`.
3. **Glance judgement** (the AC2 gate): inspect the PNG — does the verge read as a crisp rake board (not the
   T-176 heavy end band)? Does the arch head read as dressed voussoirs (not a void)? Record the call in
   FINDINGS/review, honestly, whichever way it lands.
4. Commit: `feat(T-179-01): witness — rake verge + voussoir head render beside concept (−x gable)`.

**Verification criteria:** the runner exits 0 with `closure ok` on every build; the PNG exists; stderr shows
rake-cell count < old band count and voussoir count > 0 (or an honest no-arch note if the build's gate is
square).

## Step 5 — FINDINGS + review (no code; the handoff)

1. `FINDINGS.md`: the glance call on the render; the honest answer to AC4 — *the edge classifier (a surface
   profile) was the sub-problem; one profile primitive closes both leaks and generalizes (a row is the
   degenerate profile)*; any residual (e.g. the build's gate is square so the head is moot on this subject).
2. `review.md` (the RDSPI Review artifact): files changed, test coverage, open concerns, instrument-untouched
   confirmation.

## Risk register

- **TG16 is the one breaking test** (it asserts the leak). Expected and intended — rewrite, don't preserve.
- **GL absent** → the render AC can't be met live; `assertGlAvailable` fails loud and we record it (per the
  GL-probe-lives-in-nested-render rule, the authoritative probe is render/src). T-176 rendered here, so expect
  green.
- **Faithful gate may be square** (`isArch=false`) → voussoir recolor no-ops on the render; the *derivation*
  test (TG24) still proves the curve. Record honestly; do not fabricate an arch (anti-hedge).
- **Shared file**: `treatment-grammar.mjs` / its test may be touched by a sibling — re-Read before each Edit,
  keep additive, verify green, commit promptly.
