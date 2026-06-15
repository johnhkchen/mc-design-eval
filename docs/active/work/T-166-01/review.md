# T-166-01 — Review

**Ticket:** bakeoff-and-wrong-style-clean-fixture (Story S-166, Epic E-39). The referee that closes E-39 by
measuring the epic's own bet. Handoff for a human reviewer.

## What changed

A pure, tested scoring core plus two live (metered) creation-loop harnesses that settle E-39's two
falsifiable claims — **both landed on the embarrassing/negative side, reported in full** (`FINDINGS.md`).
The frozen scalar instrument, the multi-angle gate, transport-guard, `loop.mjs`, and all BAML sources are
**untouched**.

### Files created
- `src/workshop/bakeoff-score.mjs` — PURE scoring (in `npm test`): `regionToDepartment` (the lossy
  fused→department adapter; `matched:false` flags unmapped regions), `worstDepartmentOfDispatch` /
  `worstDepartmentOfFusedReply`, `styleFidelityScore` (the crater 0–100), `critiqueEvidence`,
  `dispatchCorrectness` (SPLIT/FUSED/TIE verdicts), `PENALTY`, `BAKEOFF_SCHEMA`.
- `src/workshop/bakeoff-score.test.mjs` — 10 tests (BO1–BO7): keyword map + the WALL-before-ROOM
  precedence + default-WALL flag, both worst-dept extractors, score boundaries/clamp, evidence bundle,
  aggregation + all three verdicts.
- `experiments/eval-alignment/clean-wrong-style.mjs` — Claim 2 crater harness (4 conditions × 2 votes) +
  beside-concept compose (`decodeImage` sniffs the JPEG-in-.png concepts; no GL, no model).
- `experiments/eval-alignment/bakeoff.mjs` — Claim 1 split-vs-fused dispatch harness (2 states × 3 votes),
  with the analyst ground-truth table, `why` per state, and the excluded states logged.
- `experiments/eval-alignment/results/{clean-wrong-style,bakeoff}.json` — committed live evidence.
- `docs/active/work/T-166-01/{clean-vs-matched,clean-vs-wrongstyle,clean-vs-wrongstyle-2}.png` — the
  AC's renders beside both concepts.
- `docs/active/work/T-166-01/{research,design,structure,plan,FINDINGS,review}.md`.

### Files modified
- `package.json` — `bakeoff` + `clean-wrong-style` scripts (additive).

## Results (the headline — see FINDINGS for the full honest record)

- **Claim 2 (within-family crater): DID NOT CRATER.** Clean rustic gatehouse: matched=52, wrong-style
  arc=46 / chapelle=40, control=58 — spreads (6, 12) inside the ±12 noise. The per-style `expected`
  changes the *content* of the critique (it correctly names guildhall quoins/pilasters/voussoirs) but not
  the *severity/score*; the measure counts missing-element *presence*, not style *distance*. Next gate: a
  deeper-measurement epic (style-distance severity) + a cleaner build to lift the matched ceiling.
- **Claim 1 (split beats fused): NOT SUPPORTED.** split 3/6, fused 6/6. Both tie+correct on the
  unambiguous barn ROOF state; on the one ambiguous cottage state the paths picked *different defensible*
  worst-defects (split→CHIMNEY, real; fused→WALL, matches the analyst). The verdict was also adapter-
  sensitive (a defensible keyword-precedence fix moved TIE→fused 6/6) — itself an argument for typed
  dispatch. The 2-state, soft-labeled sample is under-powered; next gate: a consensus-labeled ≥8–10-state
  multi-department corpus (or score on loop outcome once idiom-appliers exist).

## Acceptance criteria — status

- [x] **Bake-off harness** — split vs fused on a fixed state set, scored on dispatch correctness, reported
  honestly **including the fused win**. (`bakeoff.mjs`, `results/bakeoff.json`.)
- [x] **Clean × wrong-style fixture** — clean build vs matched and two same-family wrong-style concepts +
  a control; spread reported; **renders beside both concepts** committed. (`clean-wrong-style.mjs`,
  `results/clean-wrong-style.json`, the three PNGs.)
- [x] **Recorded honestly with numbers + renders; each negative routes to a named localized next gate.**
  (`FINDINGS.md`.) The embarrassing outcomes are reported, not softened.
- [x] **`npm test` green (2226); only creation-loop judges touched — the frozen instrument is untouched.**

## Test coverage & gaps

- **Covered (in `npm test`):** the entire `bakeoff-score.mjs` surface — the deterministic rules a reviewer
  must trust (the adapter incl. the consequential precedence fix, both worst-dept extractors, the crater
  scalar, the aggregation/verdicts). 10 tests, suite 2226/2226.
- **Not automated (by design — metered witnesses, the smoke precedent):** the two live harnesses are
  non-deterministic and one-call-per-layer (no re-ask, spend caution); their *output JSON + PNGs* are
  committed evidence, not gating tests.
- **Gaps / limitations (all named in FINDINGS, not hidden):**
  1. **Claim-1 sample is under-powered** — 2 states, one ambiguous, ROOF-clustered corpus; the "FUSED
     WINS" verdict should not be over-read as a settled collapse. It is *"not supported,"* with the powered
     re-test named as the prerequisite.
  2. **Ground truth is a single-analyst label** on glaring defects; the cottage WALL-vs-CHIMNEY ambiguity
     is the live demonstration of why a consensus label is needed.
  3. **The wrong-style concepts carry a palette confound** (monument scale + saturated palettes); the
     control C isolates the profile, and the no-crater result holds regardless, but a bespoke house-scale
     guildhall concept (an outward image-gen call, not fired) is the clean follow-up.
  4. **The crater build isn't clean enough** (matched=52); a higher matched ceiling (S-160) is entangled
     with the style-distance metric as a joint prerequisite.

## Open concerns for the next ticket / epic

1. **The two negatives converge on one place: the SCORING, not the reading.** S-165 proved the per-style
   `expected` reads style; this ticket shows the *severity → scalar* is style-blind and the *dispatch* gain
   is unproven. The natural next epic is a **style-distance measurement** (present-but-wrong-style = major
   defect) + a **consensus-labeled defect corpus**, on top of cleaner builds (S-160). FINDINGS states both
   gates precisely.
2. **Adapter precedence is now load-bearing** for any future fused-region scoring — pinned by the BO1 test;
   note the comment in `bakeoff-score.mjs` if the keyword sets are ever edited.

## Risk

Low. All new code is additive and lives under `experiments/eval-alignment/` + one pure tested `src/`
module; no edits to the frozen instrument, the gate, transport-guard, `loop.mjs`, or BAML sources. The
live evidence is reproducible via `npm run clean-wrong-style` / `npm run bakeoff` (metered). Reverting the
two harness commits leaves the pure module + tests intact.
</content>
