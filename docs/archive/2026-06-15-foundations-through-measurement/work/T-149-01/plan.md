# T-149-01 Plan — re-skin-reverdict

Ordered, independently-verifiable steps. The deterministic slice is Steps 1–4 (commit + test). Step 5
is the documented operator runbook (no code, no spend here). Each code step ends green and
byte-identical before the next.

## Step 1 — the relief-merge helper (`src/workshop/articulate.mjs` + test)

- Write `realizeWithArticulation(workshopProgram, articulation)` per structure.md: guard the empty
  plan to return `realizeProgram(...)` *unchanged* (same object, same bytes); otherwise fold the
  articulation placements onto the artifact (later-wins by pos key), recompute manifest, re-assert.
- Write `mergePlacements(skin, relief)` with pinned ordering (skin in realization order with fronted
  cells overwritten in place; new relief cells appended in brush byte-order).
- Tests AR1–AR5 (no-facade byte-identity; facade grows relief = brush placements; idempotence;
  manifest closure; silhouette charter via `reliefNoRegress`).
- **Verify:** `node --test src/workshop/articulate.test.mjs` green; AR1 asserts byte-equality of
  `serializeArtifact` output vs `realizeProgram` for a real facade-less program.
- **Commit:** `feat(T-149-01): realizeWithArticulation — fold relief onto the skin (inert w/o facade)`.

## Step 2 — adopt in `seedWorkshopProgram` (`src/workshop/seed.mjs`)

- Destructure `articulation` from `compileProgram`; realize via `realizeWithArticulation`; carry the
  articulation report on the returned object (additive).
- **Verify:** full `npm test` green (seed has wide test coverage — `seed.test.mjs`, isolation glob);
  `npm run patternbook:offline` and `npm run patternbook:repro` byte-identical (cottage+barn have no
  facade ⇒ empty plan ⇒ identical bytes); `npm run facade:offline` / `recognize:offline` green.
- **Commit:** `feat(T-149-01): build path applies articulation when the program carries a facade`.

## Step 3 — adopt in the loop + decide geometry (`loop.mjs`, `geometry.mjs`)

- `loop.mjs:127`: rebuild via `realizeWithArticulation`. Read the loop's per-round program/source
  state first; recompute the plan from the *current* program (`compileProgram`) so a geometry-lever
  edit that touches a facade face re-plans. Facade-less rounds pass `[]` ⇒ byte-identical.
- `geometry.mjs`: keep `realizeProgram` for the lever silhouette comparison (relief must not move the
  massing silhouette — `reliefNoRegress` charter); add a one-line comment citing the charter.
- **Verify:** `npm test` green (loop + geometry suites); offline sweep byte-identical;
  `npm run workshop:offline` / `workshop:replay` byte-identical on the committed fixture chain.
- **Commit:** `feat(T-149-01): apply articulation per workshop round; geometry silhouette stays skin`.

## Step 4 — the milestone successor (`facade-milestone.mjs` + test + scripts)

- Write `benchmarks/sculpture/facade-milestone.mjs` (`milestone:facade`): subject list from the
  registry; quote E-34 (barn) + T-143-02 (cottage) committed verdicts verbatim pre-rotation; for each
  subject report BOTH arithmetics (kit-aware `overall` + `relief-aware-gate/v1` with the named lens +
  missing-cell residual) read from committed records; `--repro` = no model/GL/spawn/writes,
  byte-identical, SKIP subjects lacking a committed relieved chain (the `recognize.mjs --offline`
  precedent); committed-evidence emit (`facade-milestone.{json,md}`) only in non-repro.
- Test: baseline-quote fidelity; both-arithmetics row shape; `--repro` SKIP-on-absent; static
  no-live-spend guard (repro path imports neither sdk-binding nor render).
- `package.json`: `milestone:facade`, `milestone:facade:repro`.
- **Verify:** `node --test benchmarks/sculpture/facade-milestone.test.mjs` green;
  `npm run milestone:facade:repro` byte-identical (today: SKIPs both, prints the quoted baselines);
  `npm test` green.
- **Commit:** `feat(T-149-01): milestone:facade successor — both arithmetics beside E-34 baselines`.

## Step 5 — the operator runbook (docs only; the live spend is NOT executed here)

The live texture verdict requires `claude -p` model spend + headless GL + **the epic's only judge
runs** (non-reproducible). It is recorded as an exact runbook in `progress.md`/`review.md`, not run in
this session. The runbook (each command, in order):

1. **Live facade recognition** (cottage mandatory, barn): re-run `recognize` so the committed
   `cottage.program.json` / `barn.program.json` carry a `facade` block (the multi-angle textured-GLB
   layout evidence per the E-35 narrowing). Under `--ticket T-149-01`.
2. **Workshop with relief**: `node benchmarks/sculpture/pattern-book.mjs --subject cottage --ticket
   T-149-01 --rotate-pins` (then `--subject barn`). The Step 1–3 wiring makes the build carry relief;
   the loop critiques the relieved renders. Commit ledger/digest/final-artifact. Verify
   `patternbook:repro`/`offline` byte-identical on the *new* committed chain.
3. **Gate opt-in**: add `facadeGrammar: "<committed grammar path>"` + `pack` to the cottage/barn `def`
   in `multi-angle-gate.mjs` so `loadReliefLens` fires.
4. **S-142 witnesses BEFORE rotation**: run the visibility witnesses, record green-or-named-SKIP.
5. **The epic's judge runs**: `node benchmarks/sculpture/multi-angle-gate.mjs --subject cottage
   --label patternbook --artifact workshop/cottage/final-artifact.json --reference
   recognition/cottage.artifact.json --ticket T-149-01 --rotate-pins` (then barn). One ask per view,
   fresh renders, T-114 replies; decided under `relief-aware-gate/v1` with the kit-aware arithmetic
   beside; pins rotated under T-119 with **retired pins named** in the commit.
6. **S-142 witnesses AFTER rotation**: re-run, record (rotation makes a witness FAIL-not-SKIP per
   `proportion-eave-latches-plinth` — record both states).
7. **Sheets**: composed sheet-beside-concept into `pr/assets/`; residuals carry the relief/rhythm lens
   + measured deltas.
8. **Milestone**: `npm run milestone:facade` (live render), then `milestone:facade:repro`
   byte-identical; baselines quoted pre-rotation, both arithmetics beside every verdict.
9. **Record honestly**: does the gap close? If the articulated cottage still doesn't read at the
   glance, that is the finding — scope the next rung before M3.

## Step 6 — docs (deterministic, ships here)

- `design-learnings.md`: the E-35 facade-grammar-&-relief section + E-12 handoff (Step from
  structure.md). Written from the wiring + the runbook; the live verdict is filled by the operator
  after Step 5 (the section names the open finding).
- `review.md`: the S-149 handoff (AC#5).
- **Verify:** `npm test` green; `git status` clean except intended files.

## Testing strategy summary

- **Unit (offline, here):** AR1–AR5 (articulate), milestone repro/quote/no-spend tests. These prove
  the deterministic claims: byte-identity when facade-less, relief-construction when facade-present,
  no live dependency in repro paths.
- **Integration byte-identity (offline, here):** `patternbook:offline`/`repro`, gate `--offline`,
  `workshop:offline`/`replay`, `facade:offline`, `recognize:offline` — all byte-identical after the
  chain edits (cottage/barn carry no facade today, so the wiring is provably inert).
- **Live integration (operator, Step 5):** the actual texture verdict — model + GL + judge. Recorded
  by the runbook; verified by `--repro` byte-identity on the *new* committed records once produced.

## Verification criteria (definition of done for the committed slice)

- `npm test` green (helper + milestone tests added; no suite regressed).
- Every offline/repro sweep byte-identical; zero committed artifact/pin/recognized-program drift.
- `milestone:facade:repro` runs with no model/GL and quotes the E-34/T-143-02 baselines.
- Docs landed; runbook complete and command-accurate; no per-building constants introduced.
