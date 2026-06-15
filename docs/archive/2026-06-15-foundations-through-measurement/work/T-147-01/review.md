# T-147-01 Review — articulation-brushes

Handoff for a human reviewer. Epic E-35 / Story S-147. **Implementation complete, `npm test` 2092/0,
all byte-identity gates byte-identical.** One scope decision (live `pattern-book` hook deferred) needs
a sign-off; one cross-ticket repair needs awareness.

## What changed

**Created**
- `src/view/facade-articulation.mjs` — the four brushes (`pilaster`, `quoin`, `infillPanel`,
  `eaveOverhang`), each delegating to T-146's `surfaceRelief`; pure, fail-loud. (+`.test.mjs`, FA1–FA9)
- `src/recognition/fixtures/facade/articulated-program.json` — committed facade-bearing fixture
  (rustic vocab: jetty, 2 dormers, a +z infill/quoin face, a -z course-line face).
- `src/recognition/facade-build.test.mjs` — the end-to-end build proof (5 tests).

**Modified**
- `src/pack/idiom-registry.mjs` — four `kind:pass` entries (composition/tests/preview/closed schema).
- `src/pack/idiom-registry.test.mjs` — pass-coverage test for the four names.
- `src/pack/brush-contract.test.mjs` — brush count 24 → 28.
- `src/pack/brush-door.conformance.test.mjs` — `facade-articulation` in TECHNIQUES + allowlist; plus
  two sibling-required entries (see Cross-ticket).
- `src/recognition/compile.mjs` — `{workshopProgram, articulation}`; `facadeArticulationPlan`;
  `applyArticulation`; jetty `overhang` from `facade.faces[].jettyDepth`.
- `src/recognition/compile.test.mjs` — no-facade invariance + facade→plan mapping.

Net: ~396 insertions across 8 files, plus the two new brush files. No production module deleted; no
committed artifact/pin touched; `surface-relief.mjs` reused, not modified.

## How it works (one paragraph)

The recognised facade grammar (T-145, previously recorded-only) now drives construction. `compile`
lowers each mass's `facade` into a deterministic, plain-data plan `[{massId, brush, params}]` with all
roles resolved to blocks via `roleBlock` (the program-path vocabulary authority), and refines the
jetty lip depth from `jettyDepth`. After `realizeProgram` builds the shell + roof + jetty + dormers,
`applyArticulation` runs the plan over the occupancy through the registry door (`getBrush`), and the
four passes emit proud relief in front of the existing skin — pilaster strips, quoin corner steps,
infill studs over a recessed-by-exclusion field, and an eave soffit course. The relief charter
(in-plane silhouette + height ratios invariant) is enforced by T-146's exported `reliefNoRegress`.

## Test coverage & gaps

- **Strong:** every brush has placement/rhythm/idempotence/purity + silhouette-no-regress tests; the
  compile plan has role-resolution + jetty-refinement + no-facade-invariance tests; the whole program
  path has an end-to-end build test; the registry/contract/conformance/catalog meta-tests cover the
  new entries. Byte-identity proven on four offline/repro chains.
- **Gaps (acknowledged, low-risk):**
  - `quoin` corner detection is tested on a box (clean extrema) and a single face; complex/concave
    plans (multi-mass corners, L-shapes) aren't exercised — the brush reads per-face along-axis
    extrema, so an L-junction corner shared by two masses would be read per-face, not as a true
    re-entrant corner. Fine for the rectangular masses the schema allows (`maxItems:4`, rects).
  - `eave-overhang`'s default eave row (max skin y) is only correct for a wall without a roof on that
    face; the program path always passes an explicit `eaveRow` (eaveY-1), so the default is a
    convenience for unit substrates only — documented in the brush.
  - The four passes are not yet applied by any **live committed chain** (no committed subject has a
    facade). Proven by fixture, not by a rendered subject — see the deferral.

## Open concerns / needs human attention

1. **Deferred: live `pattern-book` hook (Step 5).** AC#2 is met by the program-path wiring + the
   end-to-end build test, but the articulation is not yet applied by the live benchmark chain. I
   deliberately did **not** wire it because (a) no committed subject carries a `facade` → it would be
   untested dead code in a record-pinned, self-grep-guarded runner; (b) the correct integration point
   couples with **S-148**'s relief-aware gate (the gate must see the relief to score it) and the
   workshop-loop ordering. `applyArticulation` is exported and ready. **Decision wanted:** accept the
   deferral (recommended — land the gate + a facade subject together in an S-148-adjacent ticket), or
   request a guarded no-op hook now.

2. **Cross-ticket repair, please be aware.** Sibling **T-148-01** committed `relief-presence.mjs` and
   `relief-calibration.mjs` (both import `surface-relief`) without brush-door allowlist entries,
   leaving HEAD red on the closed sweep before my work. I added both entries (correct — each delegates
   to the one relief op) so this branch is green. If T-148 adds the same entries, the duplicate object
   keys are harmless (last-wins). No action needed unless you'd rather those entries live in T-148's
   commits.

3. **`facade.faces[].courseLines` reuse `eave-overhang`.** A belt course is realized as an
   eave-overhang at an explicit row. This is intentional (a proud horizontal course IS that brush),
   but a reviewer expecting a distinct `course-line` brush should know there isn't one — and the AC
   lists only the four brushes, none of which is a dedicated course brush.

## Risk assessment

Low. All changes are additive; no committed artifact, pin, or pinned-runner call chain was modified;
`surface-relief.mjs` (T-146) was reused unchanged; byte-identity is proven on every offline/repro
chain. The only non-additive edits are test-count/allowlist bumps (mechanical) and the corrected
ticket premise (documented). The deferred live hook is the one item carrying forward.
