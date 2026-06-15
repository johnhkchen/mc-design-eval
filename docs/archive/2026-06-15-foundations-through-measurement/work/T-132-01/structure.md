# T-132-01 factory-milestone — Structure

File-level blueprint. Two kinds of change: **code seams** (small, committed first, pinned by
tests while rustic's committed records stay byte-asserted) and **run products** (records the
live runs write through the pin guard). Gap-brush files are enumerated by shape — their names
arrive from the saltcrag backlog at run time.

## A. Code seams (modified)

### `src/workshop/seed.mjs`  (+ ~25 lines)
- `export const DEFAULT_PACK_REL = "packs/rustic.json"` — single sourcing of the default.
- `export function packNs(packRel)` — `""` when `packRel === DEFAULT_PACK_REL`, else
  `"--" + <basename without .json>` (slug-validated `^[a-z][a-z0-9-]*$`). One commented
  special case: rustic's records predate namespacing; relocating them would rewrite committed
  pins.
- `export function chainRels(key, packRel)` — the one place chain record paths are derived:
  `{ seed, ledger, final, plan, record, recordMd }` →
  `workshop/<key><ns>/program.json`, `workshop/<key><ns>.json`,
  `workshop/<key><ns>/final-artifact.json`, `workshop/<key><ns>/component-plan.json`,
  `pattern-book/<key><ns>.json`, `pattern-book/<key><ns>.md` (ROOT-relative; both runners
  consume this so paths cannot drift apart).
- `workshopSubjectsFrom(registry, {relDir, packRel})` unchanged in signature; callers pass
  the invocation pack.

### `benchmarks/sculpture/pattern-book.mjs`  (~40 lines touched)
- CLI: `--pack <rel>` (default `DEFAULT_PACK_REL`), `--ticket <id>` (default `"T-127-01"`,
  the machinery's owner; the saltcrag npm script passes `T-132-01` so the record names the
  run's authority honestly).
- Two pack handles: `seamPack = loadStylePack(DEFAULT_PACK_REL)` for stage 1–2 verification
  (the committed sketch/recognition seam is verified under its own pack of record);
  `buildPack = loadStylePack(--pack)` for stage 3 seed, conformance, workshop spawn, record.
- All record paths via `chainRels(key, packRel)`; workshop spawn gains `--pack <rel>`
  passthrough; record fields `pack: buildPack.style`, `ticket` from flag.
- `--repro`/`--offline`/`--plan-only` honor `--pack` (skip-if-no-committed-chain semantics
  unchanged); the flagless sweep remains rustic — committed behavior byte-identical.
- Constraint: still scanned by `isolation.test.mjs` (no judge tokens) and still self-greps
  subject keys; the style slug never appears in this source (argv only).

### `benchmarks/sculpture/workshop.mjs`  (~15 lines touched)
- CLI: `--pack <rel>` (default `DEFAULT_PACK_REL`); subject map derived per invocation via
  `workshopSubjectsFrom(REGISTRY, {relDir: REL_DIR, packRel})` with program/ledger/final
  paths from `chainRels`; its own pin preflight covers the namespaced paths. The `fixture`
  row keeps its explicit rustic pack (fixture tests unchanged).

### `package.json`  (scripts only; flags encoded — the no-`--` convention)
```
patternbook:barn:saltcrag      node …/pattern-book.mjs --subject barn --pack packs/saltcrag.json --ticket T-132-01
patternbook:saltcrag:repro     node …/pattern-book.mjs --all --repro --pack packs/saltcrag.json
patternbook:saltcrag:offline   node …/pattern-book.mjs --all --offline --pack packs/saltcrag.json
gate:patternbook:barn:saltcrag node …/multi-angle-gate.mjs --subject barn --label patternbook-saltcrag
                               --artifact workshop/barn--saltcrag/final-artifact.json
                               --reference recognition/barn.artifact.json
factory:receipts               node scripts/factory-receipts.mjs
```
(`barn--saltcrag` literal lives only here — package.json is the sanctioned home for encoded
flags; runner sources stay grep-clean. Exact artifact rel follows `chainRels`.)

## B. Gap brushes (created; names from the backlog)

Per promoted saltcrag draft, following the registry contract (brush.schema.json +
`validateBrushRegistry` sweep):
- `src/view/<brush>-generate.mjs` (construct) or `src/view/<brush>.mjs` (pass) — the
  technique function, pure, matching the draft's parameter sketch. Mirrors existing brush
  sources (e.g. `roof-generate.mjs`).
- `src/view/<brush>.test.mjs` — unit tests named in the registry entry's `tests` field
  (contract: file exists and mentions the brush or realizer name); covers the draft's test
  plan + `paramsSchema` accepts `{}`.
- `src/pack/idiom-registry.mjs` — one new frozen entry per brush through the single door:
  kind, generate/fn, source, tests, composition {consumes, emits} (closed vocabularies from
  brush-contract.mjs), paramsSchema, preview (construct: card ids; pass: substrate+realize).
- `docs/active/backlog/saltcrag--<brush>.md` — frontmatter stamped
  (`promoted_by: planner-sanction/T-132-01`, `date`, `ticket: T-132-01`) and `rework:`
  filled with any spec divergence found during implementation.
- `docs/active/backlog/README.md` — one rework-log row per promoted draft.

One commit per brush ("implemented once" is the epic's clause — each commit is the receipt).
If the backlog demotes everything to parametrization notes: no files here, the receipts
table records reuse fraction 1.0, and the notes are audited against the registry instead.

## C. Receipts composer (created)

- `src/factory/receipts.mjs` — pure half: `composeReceipts({registryNames, packs, backlog,
  drafts, ledgers, gateRecords, before})` → `{json, md}`; sorted keys, no clock reads;
  renders the AC's **one table** (registry before/after · reuse fraction · draft-rework ·
  cost shape · verdict beside conformance).
- `src/factory/receipts.test.mjs` — unit tests on synthetic inputs (counts, fraction
  arithmetic, rework rows, determinism/byte-stability).
- `scripts/factory-receipts.mjs` — impure shell: reads the real records (registry, two
  packs, backlog records, promoted-draft frontmatter, formation/backlog/workshop ledgers,
  the two gate records `multi-angle/barn-{patternbook,patternbook-saltcrag}.json`), calls
  the pure half, guarded-writes `benchmarks/sculpture/factory/receipts.{json,md}`.
  Deliberately **outside** the isolation scan (reads verdict paths; judges nothing) — same
  standing as `pattern-book-compare.mjs`. The "before" registry snapshot is passed as
  recorded data (captured in progress.md before the first brush lands), never re-derived.

## D. Run products (written by the runs, through the pin guard — all first writes)

1. `packs/drafts/saltcrag/**` — formation records (stages, draft.json, README, ledger) —
   if the T-130 sibling has not already landed them.
2. `packs/saltcrag.json` — the ratified pack (`ratification {by, date, note: provisional…}`).
3. `docs/active/backlog/saltcrag--*.md`, `…/records/saltcrag/{inputs,prompt,ledger,backlog}.json`.
4. `benchmarks/sculpture/workshop/barn--saltcrag{,.json}/…` — seed program, ledger, final
   artifact, component plan.
5. `benchmarks/sculpture/pattern-book/barn--saltcrag.{json,md}` — chain record.
6. `benchmarks/sculpture/multi-angle/barn-patternbook-saltcrag.{json,md}` + sheet
   `pr/assets/frames/multi-angle-barn-patternbook-saltcrag.png` — the epic's one judge call.
7. `benchmarks/sculpture/factory/receipts.{json,md}` — the compounding receipts.
8. `docs/knowledge/design-learnings.md` — `## Brush factory (E-32)` section + E-12 handoff
   block (consumes: receipts.md, the two gate sheets, pattern-book records, the pack).

## E. Tests & guards affected (no contract changes)

- New: `packNs`/`chainRels` units (in `src/workshop/seed.test.mjs`), receipts units, per-brush
  units.
- Must stay green unchanged: `patternbook:repro`/`:offline` (rustic byte-asserts — the proof
  the parameterization didn't move committed behavior), `isolation.test.mjs` (scans both
  modified runners), `brush-door.conformance.test.mjs` (new brushes enter via the door),
  `formation-{guard,replay}.test.mjs` (saltcrag draft joins the replay sweep automatically),
  transport guards (no metered key in `scripts/`), style-pack schema tests.

## F. Ordering (constraint, detailed in plan.md)

Code seams first (A, committable + rustic-repro-pinned before any spend) → pack acquisition
(D1/D2) → backlog (D3) → brushes (B, one commit each) → building run (D4/D5) + replay →
gate (D6) → receipts (C run, D7) → journal (D8) → review. Each boundary is a commit; a
spend-limit trip strands nothing uncommitted.
