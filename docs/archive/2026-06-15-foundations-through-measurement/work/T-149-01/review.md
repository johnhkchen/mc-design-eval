# T-149-01 / S-149 Review — re-skin-reverdict (E-35 terminal)

Handoff for a human reviewer. The deterministic slice of E-35's terminal story shipped and is green +
byte-identical; the live texture verdict (the epic's only judge runs) is a documented operator runbook,
not run here, by design. This is the one thing to understand before reading the diff.

## The scope decision (read this first)

E-35 asks: *does the flat box become the articulated build at the glance?* That verdict is **live** —
it needs a model that recognizes a facade grammar, a workshop that critiques relieved GL renders, and
**the epic's only judge runs** (singular, billed, non-reproducible). None of that is byte-reproducible,
and the judge runs must not be burned speculatively or fabricated ("recorded honestly" is the AC).

What stood between "all four parts built" (S-145…S-148) and "a facade-bearing program builds with
relief" was exactly one **deterministic** defect: every build path dropped the articulation plan
`compileProgram` returns. **This ticket closes that seam (committed, tested, byte-identity-proven) and
writes the runbook for the live spend.** That split matches the siblings: T-147 *deferred* the live
hook to S-149 with the code "exported and ready"; T-148's integration is "committed, operator-run."

## What changed (deterministic slice — committed on `main`)

**The relief join (new, pure):** `src/workshop/articulate.mjs` (+ `.test.mjs`).
- `realizeWithArticulation(workshopProgram, articulation)` — realize the skin, then fold the plan's
  proud relief onto it. **Empty/no-placement plan ⇒ returns the bare `realizeProgram` object
  unchanged (byte-identical).** Facade-present ⇒ merged manifest, re-asserted artifact, articulation
  report carried for the ledger.
- `mergePlacements(skin, relief)` — last-wins by `pos` key (relief fronts the skin in place; fresh
  relief appended in the brushes' byte-stable order). Replay-stable.

**Adopted at all three realization sites:**
- `src/workshop/seed.mjs` — `seedWorkshopProgram` threads `compileProgram`'s `articulation` through
  the join (seed build).
- `src/workshop/loop.mjs` — the per-round `realize` recompiles the plan from `currentSource`
  (re-recognition aware) and joins; the brushes resolve positions against the live occupancy.
- `src/workshop/replay.mjs` — `replayLedger` reconstructs the same articulation from the seed
  `source` + the sha-pinned `pack`, so a relieved build reproduces byte-identically. **The
  non-obvious, essential site.**
- `src/workshop/geometry.mjs` — *deliberately left on `realizeProgram`*: the geometry levers compare
  massing silhouette, which relief must not move (`reliefNoRegress` charter).

**The milestone successor (new):** `benchmarks/sculpture/facade-milestone.mjs` (`milestone:facade` /
`:baselines` / `:repro`) + `.test.mjs` + `package.json` scripts + committed records
(`pattern-book/facade-baselines.json`, `pattern-book/facade-milestone.json`,
`pr/assets/facade-milestone.md`). Pure I/O over committed gate records: **both arithmetics on every
row** (kit-aware prior + budget v2/legacy + the T-148 relief-aware verdict), baselines snapshotted
pre-rotation (never re-banked), `--repro` byte-identical, no model/GL, self-grep clean.

**Docs:** `docs/knowledge/design-learnings.md` gains the "Facade grammar & relief (E-35)" terminal
section + the E-12 handoff. This work dir holds research/design/structure/plan/progress.

Net: one new pure module + test, three one-line adoptions, the geometry comment, one milestone runner
+ test + records + scripts, doc edits. No committed artifact / pin / recognized-program touched.

## How the ACs are met

- **AC#1 (cottage + barn through the full loop, relief live):** the *code path* is wired and proven
  inert on today's facade-less programs (byte-identical) — the relief constructs the moment a facade
  is recognized. The **live run itself** (facade recognition + relieved workshop under `--ticket
  T-149-01 --rotate-pins`) is the operator runbook below; it cannot run here (model + GL).
- **AC#2 (the epic's only judge runs):** the gate already supports the opt-in (`def.facadeGrammar`,
  T-148) and the pin/reply machinery (T-114/T-119) is in place; the runbook gives the exact commands.
  **Not executed** — singular judge runs are not burned speculatively.
- **AC#3 (recorded honestly):** `milestone:facade` reports the pre-operator truth — relief
  `armed:false` on every flat-build record, beside the quoted baselines — and is wired to surface the
  texture finding (close or not-close) the moment the relieved records land. No fabricated pass.
- **AC#4 (milestone recompose):** `milestone:facade` quotes the E-34 (barn) + T-143-02 (cottage)
  verdicts pre-rotation, both arithmetics beside every verdict, `--repro` byte-identical, baselines
  never re-banked. ✅ (shipped + committed).
- **AC#5 (docs, no per-building constants, npm test green):** design-learnings E-35 + E-12 handoff +
  this review ✅; no per-building constants (the join is set algebra; the period lives in grammar
  JSON; the only "number" is the fixpoint `missing===0`) ✅; `npm test` 2098/2098 ✅.

## Test coverage & gaps

- **Unit (offline, `npm test` = src/**):** `articulate.test.mjs` AR1–AR6 — facade-less byte-identity
  (real barn program, empty plan), facade-bearing relief construction (brush placements appear,
  last-wins on overlap), per-round idempotence, manifest closure, the `reliefNoRegress` silhouette
  charter, and `mergePlacements` ordering. **2098/2098 green.**
- **Runner (offline, `node --test` + `:repro`):** `facade-milestone.test.mjs` FM1–FM7 (compose, both
  arithmetics, baseline-quote sha fidelity, pre-operator honesty, self-grep, determinism,
  no-live-dependency static guard) — 7/7; `milestone:facade:repro` byte-identical.
- **Integration byte-identity (offline):** `patternbook:repro`/`offline`, `workshop:replay`/`offline`
  all byte-identical *after* the chain + replay edits (cottage/barn carry no facade ⇒ the wiring is
  provably inert; the replay path now exercises `compileProgram(source, pack)` on real data).
- **Gaps (acknowledged):**
  1. **No live relieved build is tested** — by design (model + GL). The join is proven on the
     committed facade fixture (relief constructs) and on real facade-less programs (byte-identical),
     not on a rendered relieved subject. That render is the operator step.
  2. **The `eaveRow` live edge:** the loop recomputes the plan from `currentSource`, but a geometry
     lever that changes storey height mid-loop shifts the *skin* eave without updating the source's
     `eaveRow` param (the brushes resolve all other positions against the live occupancy). Low-risk
     for the rectangular masses in scope; flagged for the live run.
  3. **The milestone test isn't in `npm test`** (it lives in `benchmarks/`, matching the
     runner-tested-by-repro convention); the `:repro` script is its CI-equivalent gate.

## The operator runbook (the live slice — NOT run here)

Run from repo root. Each step is verifiable; pins rotate only under the named ticket.
1. **Live facade recognition** (cottage mandatory, then barn) so `cottage.program.json` /
   `barn.program.json` carry a `facade` block (the multi-angle textured-GLB layout evidence), under
   `--ticket T-149-01`.
2. **Capture pre-rotation baselines:** `npm run milestone:facade:baselines` (snapshots the current
   flat verdicts before anything rotates), commit.
3. **Relieved workshop:** `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket
   T-149-01 --rotate-pins` then `--subject barn`. The Step 1–3 wiring makes the build carry relief.
   Commit ledger/digest/final-artifact; verify `patternbook:repro`/`offline` byte-identical on the
   *new* chain.
4. **Gate opt-in:** add `facadeGrammar: "<committed grammar path>"` + `pack` to the cottage/barn `def`
   in `multi-angle-gate.mjs` so `loadReliefLens` fires.
5. **S-142 witnesses BEFORE rotation** — record green-or-named-SKIP.
6. **The epic's judge runs:** `node benchmarks/sculpture/multi-angle-gate.mjs --subject cottage
   --label patternbook --artifact workshop/cottage/final-artifact.json --reference
   recognition/cottage.artifact.json --ticket T-149-01 --rotate-pins` then barn. One ask per view,
   fresh renders, T-114 replies, decided under `relief-aware-gate/v1` with the kit-aware arithmetic
   beside; **name the retired pins** in the commit.
7. **S-142 witnesses AFTER rotation** — re-run, record (rotation makes a witness FAIL-not-SKIP per
   `proportion-eave-latches-plinth`; record both states).
8. **Sheets:** composed sheet-beside-concept into `pr/assets/`; residuals carry the relief/rhythm lens
   + measured deltas.
9. **Recompose:** `npm run milestone:facade` (now arms the relief-aware column) then
   `milestone:facade:repro` byte-identical; baselines quoted pre-rotation, both arithmetics beside.
10. **Record the finding honestly** in the milestone note + design-learnings: does the gap close? A
    still-flat cottage is the finding and scopes the next rung before M3.

## Risk & open concerns

- **Risk: low for the committed slice.** All changes are additive or inert-by-construction; no
  committed artifact/pin/program mutated; byte-identity proven on every offline/repro chain; full
  suite green. The two non-additive edits are import-line cleanups (mechanical).
- **For human attention:** (a) the scope split — confirm the live judge runs are intended as an
  operator step (the AC framing + sibling precedent say yes); (b) the `eaveRow` live edge (gap #2);
  (c) the milestone-test-location convention (gap #3).
- **Ticket frontmatter left untouched** (Lisa owns phase transitions). The pre-existing `M` on this
  ticket and sibling ticket files in `git status` is not from this work.
