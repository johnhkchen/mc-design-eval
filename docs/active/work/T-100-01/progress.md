# T-100-01 kit-aware-gate — Progress

## Step 1 — `placed` counters (Commit A `ea28265`) ✓

- `src/view/opening-dressing.mjs`: perOpening reports gain `placed` per slot (NEW placements
  only; already-dressed/already-frame skips count in `applied` alone). No behavior, ordering, or
  placement change.
- Tests: happy path asserts `placed === applied` on a fresh dressing; the idempotency test
  asserts all-zero `placed` with non-zero `applied`. 17/17 green;
  `dress:cottage --offline` still passes (committed record untouched).

## Step 2 — pure core (Commit B `0fcc0fb`-ish, see log) ✓

- `src/form/kit-presence.mjs`: `kitPresence` (grammar fixpoint for frame/panel/course; dressing
  fixpoint for infill/shutters/door/light; lintel/sill informational; named gaps; skips for
  unbound features, unfulfilled treatment slots, and door-less subjects),
  `composeKitAwareVerdict` (AND composition, refusal passthrough, not-run passthrough),
  `toleratedConflict` (T-099's acceptance predicate, shared semantics).
- `src/form/kit-presence.test.mjs`: 15 tests — gap naming with the ticket's format, fixpoint
  pass on grammar-satisfied and dressed fixtures, no-jamb toleration, residue toleration, skip
  honesty, verdict matrix, kit immutability (deep-freeze), byte-determinism.
- One test-fixture correction: the window-box policy must declare the dressing's frame block as
  a preserve secondary (the same frame-in-preserve contract the grammar runner enforces) or the
  fill rightly fights the lintel/sill recolors.

## Step 3 — proof runner (Commit C) ✓ — with one DESIGN DEVIATION (recorded)

- `benchmarks/sculpture/kit-presence.mjs` + `npm run presence:cottage`; record
  `kit-presence/cottage.{json,md}` + committed positive fixture
  `kit-presence/cottage/dressed-artifact.json` (grammar artifact + 38 dressing placements —
  the actual pipeline order composed).
- **The design's named risk materialized, with a different root cause than predicted.** The
  composed positive showed 6 residual fill placements (5 band1 + 1 roof). Diagnosis: not
  unskinned reveal cells — the dressing BREAKS RUNS. Re-opening a sealed pane removes solid
  cells, and lintel/sill recolors change others, leaving adjacent declared-secondary cells
  (cobblestone, spruce_planks) below minRun; zoneFill would strip those specks.
- **Resolution (deviation from the design's pre-planned fallback):** instead of scoping
  fill-derived absences to wall-field/roof cells, the checker now distinguishes *foreign* from
  *own-vocabulary* blocks at fill sites: a missing ingredient is a site occupied by a block
  FOREIGN to the zone's declared vocabulary (dominant ∪ preserve); an own-vocabulary speck is
  sub-minRun residue — the fill/coherence layers' cleanliness business, tolerated and counted
  (`tolerated.residue` per panel/course row), never silent. This is more principled than the
  planned fallback: it keeps the ingredient question ("is the kit's block here?") separate from
  the cleanliness question ("are runs ≥ minRun?"), and it sharpened the negative too — the
  durable-skin cottage's 5/8/26-cell panel/course "gaps" were all preserve-family residue and
  vanished, leaving exactly the ticket's expected absences.
- Proof: negative FAILS naming `spruce_planks frame @ 192/321 frame-line cells`,
  `spruce_fence infill @ openings 1/2/3/4/5/6`, `spruce_trapdoor shutters @ openings
  1/2/3/4/5/6` (+ door/light recorded skips); positive PASSES with zero gaps. Double-run
  byte-identical both sides; `--offline` green.

## Step 4 — gate wiring + live proof (Commit D `a4440f4`) ✓

- `benchmarks/sculpture/multi-angle-gate.mjs`: presence computed right after zone derivation
  (deterministic — runs whether or not the judge later refuses), `kitPresence` + `overall`
  (composeKitAwareVerdict) in the record, exit code from `overall`, md gains "Kit presence
  (T-100)" + "Kit-aware verdict" sections, `--offline` gains the additive `kitAware`
  consistency check (recomputes the composition from the recorded parts). `ran:false` reasons:
  `no-kit-record` (synthetic-hut), `no-concept-bands`, `no-reference-build`.
- No-weakening regression: cottage-current/gatehouse-current/cottage-baseline pre-T-100 records
  all still pass `--offline` ("kit-aware n/a (pre-T-100)").
- Live run `gate:multi --subject cottage`: kit presence FAIL (same named gaps as the proof
  record), coverage rejected +x+z (judge correctly not called — T-088 short-circuit untouched),
  judge ran on the other three views (drifted, major roof form — the known E-25 gap), overall
  kit-aware FAIL. Both checks ran; both are in the record; new record passes `--offline` with
  `kit-aware consistent`.

## Final state

- `npm test`: **1215/1215** green (was 1199; +16 net: +2 dressing assertions inside existing
  tests, +15 kit-presence tests, counted by the runner as documented).
- All four deterministic runners re-assert: `dress:cottage`, `grammar:cottage`,
  `presence:cottage`, `gate:multi --subject cottage` (+ gatehouse/baseline) `--offline`.
- Commits: A `ea28265` (placed counters), B (pure core + tests), C (proof runner + records),
  D `a4440f4` (gate wiring + live record).
