# T-097-01 fixture-path-proof — Plan

Five steps; each is an atomic commit with its own verification. Suite must be green after every step
(`npm test` — currently 1129 tests).

## Step 1 — State-id decoder (render/src/version.mjs)

- Add `stateProps(block, states, stateId)` (pure over descriptor) and `decodeStateId(stateId)`
  (mcData-backed, memoized block range index).
- Refactor `decodeDefaultIndices` to share the radix walk; `blockStateId` behavior unchanged.
- Tests (in `src/form/fixture-card.test.mjs`? No — decoder tests precede the card; put them in step 1
  as `src/form/fixture-card.test.mjs` would not exist yet, so create the test file in step 2 and keep
  decoder synthetic tests there): **deviation guard** — to keep step 1 self-verifying, verify by a
  one-off node invocation (encode→decode round-trip for a trapdoor/fence/stairs/slab/door/lantern
  sample) recorded in progress.md; the durable unit pins land with step 2's test file.
- Verify: `npm test` green; manual round-trip output correct.
- Commit: `feat(E-26 T-097-01): state-id decoder — stateProps/decodeStateId invert blockStateId`.

## Step 2 — Fixture card pure module + tests (AC #1 artifact, AC #2 gate pin)

- `src/form/fixture-card.mjs`: `CARD_ROWS` (25 rows per design D6), `cardLayout`, `fixtureCard`.
- `src/form/fixture-card.test.mjs`:
  - `assertArtifact(fixtureCard())` passes the live gate (AC #2 regression pin);
  - coverage: all six families, all four trapdoor facings, fence connection booleans explicit;
  - layout: unique coords, determinism, baseplate under every fixture column;
  - decoder: synthetic-descriptor radix pins + per-CARD_ROW encode→decode round-trip against real
    minecraft-data descriptors (imports `../../render/src/version.mjs`).
- Verify: `npm test` green (new tests counted).
- Commit: `feat(E-26 T-097-01): fixture test-card — 25-row state vocabulary, live-gate pinned`.

## Step 3 — Occupancy third class (AC #3)

- `src/view/occupancy.mjs`: forms/states Maps, `formOf`, `solid`, `solidOccupancy`,
  `artifactOccupancy` state+form carry with injectable classifier (default `derivedFormClass`).
- `src/view/occupancy.test.mjs`: new cases per structure.md (sparse default proves back-compat;
  cube-only → `solidOccupancy(occ) === occ`).
- Risk check: run the full suite — any consumer relying on Map identity or key order must stay green
  (no consumer changes expected in this step because `cells`/`has` are untouched).
- Commit: `feat(E-26 T-097-01): occupancy third class — fixture cells distinct, solid view derived`.

## Step 4 — Dressed-opening semantics (AC #4 + #5)

- `src/view/structural-read.mjs`: `openings` over `solidOccupancy` + `dressing` annotation.
- `src/view/shell-integrity.mjs`: `closureCheck` solid-only skin + `dressed` report;
  `strayFixtures`; `rebuildArtifact` state carry; `plugClosure` forms/states carry-forward.
- Tests (`structural-read.test.mjs`, `shell-integrity.test.mjs`):
  - dressed window detected as window with dressing (AC #5);
  - closure: dressed-in-region → closed+dressed; dressed-no-region → breach; stray fence in wall
    field flagged while build verdict unaffected (AC #4 both ways);
  - rebuild round-trips state; plugClosure preserves fixture metadata across iterations.
- Verify: `npm test` green; grep that no other `openings(`/`closureCheck(` caller needs a shape fix
  (additive fields only).
- Commit: `feat(E-26 T-097-01): dressed openings — closure reads dressed-not-hole, identity survives`.

## Step 5 — Runner, renders, committed regression reference (AC #1 close-out)

- `benchmarks/sculpture/fixture-card.mjs` (ladder steps 1–4 per structure.md), npm script
  `card:fixtures`.
- Run it: gate → unmapped==0 → per-row read-back all pass → renders at 4 gate azimuths + front.
- **Inspect the renders by eye** (open the PNGs): trapdoor facings visibly distinct, fence runs
  connected, stair top/bottom halves correct, slab top/bottom correct, door pair joined, lantern
  hanging vs standing. The render is the unproven half — if prismarine-viewer draws a state wrong,
  record it in the record + review.md as a named residual (do not gate on pixels).
- Commit `benchmarks/sculpture/fixture-card/` reference (card.json, record.json, md, PNGs).
- Verify: `npm test` green; `npm run card:fixtures` exits 0 reproducibly (byte-stable record except
  render hashes, which are environment-tagged evidence).
- Commit: `feat(E-26 T-097-01): fixture card runner — placement verified, render reference committed`.

## Testing strategy summary

- **Unit (pure, offline, in `npm test`):** decoder radix math; card gate acceptance (AC #2); layout
  invariants; occupancy third-class semantics (AC #3); dressed/stray/closure both-ways (AC #4);
  opening identity under dressing (AC #5). No subject-specific constants anywhere (AC #6).
- **Integration (runner, deterministic):** AJV gate → world build (`unmapped` empty) → state-id
  read-back per row (AC #1's "verified correct").
- **Evidence (non-gating):** committed renders at gate azimuths — the visual regression reference.

## Fallbacks / known unknowns

- If a card state is REJECTED by the gate (not expected): minimal schema/blockState change, recorded.
- If prismarine-viewer mis-renders a state (the genuine unknown): keep the row, record the defect as
  a named residual for S-099 to route around; placement correctness is still proven by read-back.
- If `derivedFormClass` misclassifies a card cube (e.g. smooth_stone baseplate missing from the 305
  table — must check in step 3): baseplate block chosen from the table; assert in a test.
