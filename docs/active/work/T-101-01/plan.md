# T-101-01 styled-milestone — Plan

Six steps, one atomic commit each. Steps 1–3 are code; 4–5 are runs that commit records/evidence;
6 is docs. Deterministic verification accompanies every step; metered (judge) and GL work happens
only in steps 4–5, never in `npm test`.

## Step 1 — export `runChain` from challenge-milestone.mjs

- Change: `async function runChain` → `export async function runChain`. Nothing else.
- Verify: `npm test` green (no test imports the runner, but the suite guards the tree);
  `node -e "import('./benchmarks/sculpture/challenge-milestone.mjs').then(m => console.log(typeof m.runChain))"`
  prints `function` with no side effects; `npm run challenge:cottage -- --offline` still passes
  (file untouched semantically).
- Commit: `refactor(E-26 T-101-01): export the E-25 deterministic chain (runChain) for the styled milestone`

## Step 2 — extract + export `grammarStage` and `renderSheet` in placement-grammar.mjs

- Move the body of `runGrammar` from "geometry + derived zone map" through "band evidence" into
  `grammarStage(build, { bands, roof, policy, substitution, kitRec, zoneOpts })`; compose
  `sub = {...substitution, ...kitRec.overrides}` inside the stage; keep every THROW message
  verbatim. `runGrammar(def)` keeps loading the committed records, asserting record-level
  preconditions (files exist, `kit/v1`, `zoneMap.source === "concept"`), then delegates.
  Hoist `renderSheet` above `main()` and export it unchanged.
- Verify (the refactor proof, all deterministic):
  - `npm test` green (1215+, no count change expected).
  - `npm run grammar:cottage -- --offline` and `npm run grammar:gatehouse -- --offline` both pass —
    committed T-098 records/artifacts still verify byte-identically.
- Commit: `refactor(E-26 T-101-01): placement-grammar exposes grammarStage/renderSheet — disk seam split from the gated core, T-098 records unchanged`

## Step 3 — `benchmarks/sculpture/styled-milestone.mjs` + npm scripts

- Create the runner per structure.md: named kit precondition → `styledChain` (runChain →
  source-assert → grammarStage → dressing recipe) → double-run byte-compare (base?/shell/skin-final/
  grammar-final/styled) → artifacts + shas → before/after sheets (before data-gated on the
  committed kit-less build) → spawnGate(label `styled`) → kit report md → record/md → exit =
  gate code. `--offline` / `--repro` per structure.md. Add the three `styled:*` scripts.
- Verify before any live run (cheap, no GL/LLM):
  - `npm test` green.
  - `node benchmarks/sculpture/styled-milestone.mjs` (no subject) → registry usage error.
  - `npm run styled:church` exercises the **named kit precondition** path end-to-end without
    metered cost: writes `styled/church.{json,md}` with `status: "pipeline-failed", stage: "kit"`,
    exit 1. (This is also church's AC3 result unless review decides otherwise; re-run in step 5
    only if anything upstream changed.)
  - `npm run styled:church -- --offline` reports the recorded failure, exit 1.
- Commit: `feat(E-26 T-101-01): styled-milestone runner — one named command, kit→shell→skin→grammar→dressing→kit-aware gate`

## Step 4 — the cottage milestone run (AC1 + AC2)

- `npm run styled:cottage` — the full chain + GL + judge. Expected mechanics: chain completes
  (every stage previously proven on cottage), kit-presence passes (T-100 positive precedent),
  resemblance verdict **empirical** (see risk register).
- Then `npm run styled:cottage -- --repro` (fresh-process sha match) and `-- --offline`.
- Inspect renders before committing (memory: inspect renders, not block counts): the contact sheet,
  `styled-cottage-{before,after}.png`, and that the after-sheet visibly shows frame lines +
  trapdoor shutters + fence infill vs the sealed before.
- Commit records + artifacts + frames + kit report:
  `feat(E-26 T-101-01): styled cottage by one named run — <outcome: both gates / named gaps> (record + sheet + kit report + before/after)`
- If the chain THROWS (not expected): the pipeline-failed record is the committed result (Rule 6);
  investigate only for wiring bugs (a wiring bug is fixed and re-run; a *finding* is not).

## Step 5 — gatehouse + church through the same untuned command (AC3)

- `npm run styled:gatehouse` (+ `--repro`, `--offline`): chain should complete (skin+grammar proven
  on gatehouse; dressing places ~0 with named unfulfilled slots). Gate verdict empirical —
  challenge precedent FAILed 12 gaps; record what lands.
- Church: step 3 already produced the named kit-blocked record via the same command. Confirm the
  record names the upstream cause (zone-map/kit blocked by the skin coverage finding) and that
  `--offline` re-asserts it.
- Zero-subject-specific-code check (AC3's "grep/review recorded"):
  `grep -nE "cottage|gatehouse|church|synthetic" benchmarks/sculpture/styled-milestone.mjs` → no
  hits (paste into progress.md + review.md).
- Commit: `feat(E-26 T-101-01): gatehouse + church through the untuned styled path — <outcomes>, zero subject-specific code (grep recorded)`

## Step 6 — design-learnings E-26 section + handoff (AC5)

- Append `## Concept style kit (E-26) — recognize the blocks, place them by grammar, gate on their
  presence (S-096…S-101, T-101-01) · 2026-06-10` covering: the five-whys (E-21's color-role
  contract asked *which color*, not *which block*); recognize-don't-match (kit extraction, value
  *verification* not snapping); the fixture path (CARD_ROWS state vocabulary; trapdoor/fence/
  lantern render, stairs lens gap); grammar + dressing as recorded ops; the kit-aware fixpoint
  gate; honest over-reach (shading-offset judgment call, species-fence derivation, own-vocabulary
  residue tolerance, dressing breaking kept runs) and under-reach (door detection, church blocked
  at the skin coverage gate, roof-form resemblance unchanged by styling); milestone outcomes per
  subject; E-12 handoff (what the scoring layer should consume: the styled records, kit reports,
  gate `overall`).
- Verify: `npm test` green, final.
- Commit: `docs(E-26 T-101-01): design-learnings — concept style kit section, milestone outcomes, E-12 handoff`

(The RDSPI artifacts themselves are committed with the project's usual
`docs(E-26 T-101-01): RDSPI artifacts — styled-milestone (research→review)` after review.md.)

## Testing strategy

- **Unit**: no new pure logic ⇒ no new unit tests; existing suites (`placement-grammar.test.mjs` 14,
  `kit-presence.test.mjs` 15, `opening-dressing.test.mjs` 17, etc.) must stay green un-edited. If
  Implement is forced to add decision logic, it lands in `src/` with tests (recorded deviation).
- **Refactor proof** (step 2): committed-record `--offline` byte-verification on both grammar
  subjects — stronger than unit tests for "zero behavior change".
- **Integration, deterministic**: per-subject double-run byte-compare inside the runner; `--repro`
  fresh-process sha proof; `--offline` committed-record re-assertion. These three are the AC4
  answer, plus the kit pin: extraction is seeded by committing the verbatim model reply
  (`kit/<subj>.raw.json`); `node benchmarks/sculpture/kit-extract.mjs --offline` reproduces
  `kit/<subj>.json` byte-identically (cite in review.md, re-run once in step 5 as evidence).
- **Integration, metered**: one live gate run per completing subject (cottage, gatehouse) — single
  pinned-model sample per view, verdict committed (variance at the budget edge is a named
  instrument property, never re-rolled for a better verdict).

## Risk register / contingencies

1. **Cottage resemblance FAIL (likely — roof form)**: AC2 then does NOT close. Plan: record
   honestly, no re-roll, no gate weakening; review.md states plainly that the kit-aware gate passes
   and resemblance fails on roof form (pre-existing E-25 finding, orthogonal to E-26's claim), and
   flags reviewer acceptance per the epic's definition of done. Do not chase a roof fix in this
   ticket (scope: composition + accountability, not form revision).
2. **Coverage/band gate failure *after* dressing-induced run breaks** (T-100 noted 6 residual
   placements): grammar gates run before dressing, so grammar-final passes; the styled final is
   gated only by the multi-angle gate's per-view coverage. If a view's coverage REJECTs from
   dressing, that's a named per-view outcome (judge-not-called), recorded.
3. **GL/render unavailability**: frames degrade to "unavailable", gate render failure is REFUSAL
   (exit 2) — recorded, not retried blindly.
4. **Double-run divergence**: THROW, pipeline-failed record — that's a wiring bug to fix, not a
   finding.
5. **Sibling-session collision** (memory: ticket double-dispatch): before each commit, check for
   minutes-old same-ticket commits/edits; none seen at research time.
