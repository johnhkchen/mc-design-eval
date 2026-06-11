# T-127-01 styled-house-milestone — Structure

Phase artifact 3/6. The shape of the change: files, boundaries, interfaces, ordering.

## New files

### `src/workshop/seed.mjs` — pure chain helpers (unit-tested)
The compile-to-workshop seam the chain runner and tests share. No I/O, no judge tokens
(it lives inside the isolation scan's directory and must stay clean).

```
export const PATTERN_BOOK_BUDGET = Object.freeze({ rounds: 6 });  // D3 — fixture-calibrated, N=1

export function seedWorkshopProgram({ program, pack, budget = PATTERN_BOOK_BUDGET })
  // building-program/v1 (already parsed/validated) + pack →
  //   compileProgram → override budget → assertWorkshopProgram → realizeProgram → runConformance
  // returns { workshopProgram, serialized /* jsonOf, THE committed bytes */,
  //           artifact, cells, elements, conformance }
  // throws on any gate failure (chain records it as pipeline-failed)

export function workshopSubjectsFrom(registry, { relDir, packRel })
  // durable-skin SUBJECTS → { [key]: { program: `${relDir}/${key}/program.json`,
  //   concept: `benchmarks/sculpture/${def.concept}`, pack: packRel } }
  // predicate: def.glb && def.generated?.scale (recognize.mjs's predicate, one place... it is
  // re-stated here as data shape; keys never enumerated)
```

### `src/workshop/seed.test.mjs`
- budget override lands (rounds 6) and `{rounds:1}` never survives; byte-stable double-run
  (`serialized` identical across two calls — the --repro contract).
- seed of a synthetic building-program (reuse compile.test.mjs's fixtures) realizes and passes
  conformance; a program failing pack validation throws.
- `workshopSubjectsFrom`: predicate filtering, path shapes, frozen result, no fixture collision.

### `benchmarks/sculpture/pattern-book.mjs` — THE chain runner (impure, no judge — D1/D4)
Header documents: stages, modes, isolation posture (this file is scanned by isolation.test.mjs;
the judge is convened separately via gate:patternbook:*).

```
node benchmarks/sculpture/pattern-book.mjs --subject <key> | --all [--repro|--offline] [--rotate-pins]
```

Internal layout (mirrors recognize.mjs conventions):
- consts: ROOT/HERE, `OUT_DIR = benchmarks/sculpture/pattern-book`, `REL_DIR`, sketch/recognition
  dirs, `PACK_PATH = packs/rustic.json`, `RECORD_SCHEMA = "pattern-book-chain/v1"`.
- `subjectDefs()` — durable-skin registry, same predicate as recognize.
- `generalizationGrep()` — recognize.mjs verbatim pattern (self-grep over this source).
- `verifySketch(key)` → { sketchSha, sheetSha } (exists + sha256; throws if absent).
- `verifyRecognition(key, pack)` → re-parse committed program (parseProgramReply — same gates as
  live), compile WITHOUT budget override?? NO — re-derive the T-125 artifact exactly as
  recognize --offline does (compileProgram as-committed, budget 1, realize, byte-compare
  `recognition/<key>.artifact.json`), return { program, shas, repliesSummary }.
- `stageSeed(key, program, pack)` → seedWorkshopProgram with PATTERN_BOOK_BUDGET; live mode
  guardedWriteRecord `workshop/<key>/program.json` (domain "workshop"); repro mode byte-compares
  against the committed file instead.
- `spawnWorkshop(key)` → `spawnSync(process.execPath, [workshop.mjs path, "--subject", key,
  ...(rotate ? ["--rotate-pins"] : [])], { stdio: "inherit" })`; non-zero status → throw.
- `readBackWorkshop(key)` → ledger + final artifact shas, outcome, rounds used, accepted/rolled
  counts, conformance before-first/after-final scores.
- record + md writers; honest `pipeline-failed` record on any stage throw (generated-milestone
  precedent), exit 1.
- modes: live = stages 1–5; `--repro` = stages 1–3 byte-asserts + `replayLedger` byte-compare +
  final conformance re-derivation (no model/GL/spawn/writes); `--offline` = `--repro` plus
  `offlineAssert` on the committed ledger; both exit-coded.
- preflight BEFORE any spend (live): pins = `pattern-book/<key>.{json,md}` +
  `workshop/<key>/program.json`, domain "workshop", rotate flag passthrough.

### `src/form/head-to-head.mjs` — pure compare composition (unit-tested)
```
export function composeHeadToHead({ subjects: [{ key, gates: { patternbook, generated },
                                                  chain, draftConformance }] })
  // per subject: { key, rows: [{ label, decided, passed, gapCount, gapBudget, sameObject,
  //   views: [{ angle, verdict, gaps[{severity,attribute,region}], coverage, reason }],
  //   kitPresence, conformance, cells, sheet }], deltas: { gapCount, sameObject } }
  // pure; throws on schema mismatch (MULTI_ANGLE_GATE_SCHEMA pin); no thresholds, no judgement.
```
### `src/form/head-to-head.test.mjs`
Minimal fixture records (two labels × one subject): row extraction, same-object counting,
delta signs, schema-pin throw, coverage-rejected view rendering (`reason: "coverage"`).

### `benchmarks/sculpture/pattern-book-compare.mjs` — compare runner (pure I/O, NOT workshop-scanned)
Reads `multi-angle/{key}-{patternbook,generated}.json`, `pattern-book/<key>.json`,
`recognition/<key>.record.json`; calls `composeHeadToHead`; writes
`pattern-book/head-to-head.{json,md}` (guardedWriteRecord) and
`pr/assets/pattern-book-milestone.md` (sheets side by side per subject: patternbook | generated
frames already in `pr/assets/frames/`). Reads gate records, therefore deliberately OUTSIDE the
isolation scan list (D4/D5). Exit 0 unless inputs missing/malformed.

## Modified files

- **`benchmarks/sculpture/workshop.mjs`** — SUBJECTS becomes
  `Object.freeze({ fixture: {…verbatim…}, ...workshopSubjectsFrom(REGISTRY, { relDir: REL_DIR,
  packRel: "packs/rustic.json" }) })` with `import { SUBJECTS as REGISTRY } from
  "./durable-skin.mjs"` and the seed.mjs helper. No other behavior change; absent program file
  keeps failing loudly in live mode (existing readFile throw path).
- **`src/workshop/isolation.test.mjs`** — add `benchmarks/sculpture/pattern-book.mjs` (and
  `src/workshop/seed.mjs`, which the directory glob may already cover — verify) to the scanned
  set. The compare runner is explicitly NOT added, with a comment naming why.
- **`package.json`** — scripts:
  `patternbook:cottage|barn` → `node benchmarks/sculpture/pattern-book.mjs --subject <key>`;
  `patternbook:repro` → `… --all --repro`; `patternbook:offline` → `… --all --offline`;
  `gate:patternbook:cottage|barn` → `node benchmarks/sculpture/multi-angle-gate.mjs --subject
  <key> --label patternbook --artifact workshop/<key>/final-artifact.json --reference
  recognition/<key>.artifact.json`; `patternbook:compare`.
  (Direct `node` invocations inside the scripts — no `--` flag-swallowing surface.)
- **`docs/knowledge/design-learnings.md`** — append the E-31 section (D7) after E-30.

## Produced records (committed by runs, all first writes — no rotations)

```
benchmarks/sculpture/workshop/{cottage,barn}/program.json        (chain stage 3)
benchmarks/sculpture/workshop/{cottage,barn}.json|.md            (workshop ledger + digest)
benchmarks/sculpture/workshop/{cottage,barn}/final-artifact.json
pr/assets/frames/workshop-{cottage,barn}-{before,after}.png      (workshop evidence frames)
benchmarks/sculpture/pattern-book/{cottage,barn}.json|.md        (chain records)
benchmarks/sculpture/multi-angle/{cottage,barn}-patternbook.json|.md  (THE judge calls)
pr/assets/frames/multi-angle-{cottage,barn}-patternbook.png      (the sheets)
benchmarks/sculpture/pattern-book/head-to-head.json|.md
pr/assets/pattern-book-milestone.md
```
Round-render PNGs under `workshop/{key}/round-N/` are already gitignored.

## Boundaries

- pattern-book.mjs ↔ judge: NONE (isolation-scanned). Gate convened only by
  `gate:patternbook:*` scripts → multi-angle-gate.mjs (unmodified).
- pattern-book.mjs ↔ workshop live loop: child process via workshop.mjs CLI only.
- seed.mjs ↔ recognition: imports `compileProgram` (read-only consumer of T-125's contract).
- compare runner ↔ everything: committed JSON records only; no model, no GL, no gate spawn.

## Ordering (matters)

1. seed.mjs + tests; workshop.mjs SUBJECTS derivation; isolation scan extension — commit
   (machinery, no spend).
2. pattern-book.mjs + npm scripts — commit (runner, no spend).
3. Live chains: `patternbook:cottage`, then `patternbook:barn` (metered: ≤6 strong-tier critique
   exchanges + 4-azimuth GL renders per round, per subject); verify `patternbook:repro` +
   `patternbook:offline`; commit records per subject.
4. Frozen gate: `gate:patternbook:cottage`, `gate:patternbook:barn` (metered: ≤4 judge calls
   each under T-114 bounds); `gate:multi --offline` asserts; `gate:rejudge` ONLY if a view
   exhausts unparsed; commit.
5. head-to-head.mjs + tests + compare runner + npm script; run; commit.
6. design-learnings E-31 section; `npm test`; review.md — commit.
