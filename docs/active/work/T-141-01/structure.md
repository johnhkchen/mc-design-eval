# Structure — T-141-01 rustic-headroom

The file-level blueprint. One production data file, two test files, one stale comment. No new files,
no deletions, no `.schema.json` edits.

## Files changed

### 1. `packs/rustic.json` — PRODUCTION (data + provenance text)

**`proportions` block** (the only data change):
```json
"proportions": {
  "storeyHeight": { "min": 3, "max": 5 },     // was max 4
  "pitchClasses": [1, 2],                       // was [1]
  "openingRhythm": { "minSpacing": 2, "maxSpacing": 5 }   // unchanged
}
```

**`provenance` free-text** (the taste record — fold into existing fields, no new key):
- `provenance.wealthClass` — append one line justifying the taller wall column (storeyHeight → 5):
  the generous timber-framed hall storey is a yeoman's spend, period-plausible over local stone.
- `provenance.roofingEconomy` — append one line justifying class-2 pitch: steeper-than-45° sawn
  plank/shingle roofs shed weather and are period-plausible for the steep timber vernacular.

Untouched in this file: `palette` (and every `valueCheck`), `idioms`, `decoration`,
`conformance.checks`, `style`, `schema`. So `pack:validate`'s value re-derivation and the
vocabulary-authority composition point are unaffected.

### 2. `src/workshop/geometry.test.mjs` — TESTS (the G3 lever family)

Loads the live `packs/rustic.json`. Edits + additions:

- **G3** (currently 74-78): keep as the rustic honest-refusal, but the surviving forbidden class is
  now **3**. Update the expected message regex `\[1\]` → `\[1, 2\]`. (`pitchClass:3` already used.)
- **G3b** (81-100): UNCHANGED (saltcrag class-2 lands — regression guard).
- **G3c** (102-107): REWRITE. Was "rustic class-2 is the honest refusal"; now rustic carries class 2.
  Assert rustic `pitchClass:2` **lands**: re-aims `roof.idiom` to `roof.gable.steep`, the compiled
  element carries the steep door, and the program realizes (`cells.length > 0`). This is the
  cottage/barn class-2 unblock proof for rustic (mirrors G3b's saltcrag assertions but on rustic's
  own vocabulary).
- **G3d** (109-123): UNCHANGED (saltcrag down-aim).
- **NEW G3e — cottage wall-raise round-trips**: `applyGeometryAdjust(ctx(), {massId:"main",
  params:{eaveHeight:10}})` → `source.masses[0]` has `storeys:2, storeyHeight:5` (factorEave), the
  `main-shell` element `spec.height === 10`, roof eave moved with it, and `realizeProgram` yields
  cells. The move the band `{3,4}` refused. (Place adjacent to G1, the eaveHeight lever test, or in
  the G3 block — see plan for ordering.)
- **NEW G3f — pack is the binding constraint (honest refusal)**: `applyGeometryAdjust(ctx(),
  {params:{storeyHeight:6}})` throws `/outside the pack band \[3, 5\]/` — the **pack** refuses while
  the schema (`storeyHeight` max 6) admits it, proving the pack row is binding, not a hidden schema
  ceiling.

Test-shape notes:
- `makeSource` fixture is `storeys:2, storeyHeight:4` — `eaveHeight:10` factors uniquely to
  `2 × 5` (only `n≤4, sh≤6` product hitting 10). No fixture change needed.
- `realizeProgram` and `applyGeometryAdjust` are already imported (lines 13-16). G3e/G3f need no new
  imports.

### 3. `src/recognition/program.test.mjs` — TEST (off-vocabulary case)

Line 110, inside "off-vocabulary is rejected" table:
```js
[(p) => { p.masses[0].roof.pitchClass = 2; }, /outside the pack vocabulary/],
```
Change the value `2` → `3` (2 is now in rustic's vocabulary; 3 stays off). The regex
`/outside the pack vocabulary/` is value-agnostic, so only the mutation changes.

### 4. `src/recognition/compile.test.mjs` — COMMENT only (line ~150)

The "steep roof idiom" test constructs `pitchClass:2` **un-validated on purpose** and the program
still compiles (compile never gates on `pitchClasses`). The inline comment
`// not 'validated': rustic declares pitchClasses [1] — steep adoption is a pack decision`
is now stale. Update it to reflect that rustic **now** declares `[1, 2]` (T-141-01); the test still
constructs directly to isolate compile from validation. **No assertion change** — the test passes
either way; this is honesty maintenance, not a functional edit.

## Ordering of changes

1. `packs/rustic.json` first (the data the gates read).
2. Tests second (they load the live pack — they must follow the data so the run reflects reality).
3. The compile comment last (cosmetic).

Commit boundaries (see plan.md): the pack data + provenance can land with its tests in one atomic
commit (the gate behavior and its proof move together); the program.test + compile comment can ride
the same commit (all are the direct consequences of the one data change).

## Interfaces / boundaries (unchanged)

- `validateProgramAgainstPack(program, pack)` signature and error strings unchanged — only the pack
  *data* it reads changes, so its messages now list `[1, 2]` / `[3, 5]` naturally.
- `applyGeometryAdjust` / `factorEave` / `roofIdiomForPitch` unchanged.
- `building-program.schema.json` and `style-pack.schema.json` unchanged.
- `composeVocabulary` / `ownSetsOf` (vocabulary authority) untouched.

## Verification surface (maps to plan.md)

- `npm run pack:validate` — rustic still schema-valid + value-consistent.
- `npm test` (`test:unit` over `src/**/*.test.mjs`) — G3 family green, program.test green, full suite
  green (baseline was 2013 passing per the T-139 session note; this ticket adds 2 tests, rewrites 1,
  edits 2 messages).
- No runner/chain/judge/pin commands invoked (T-143 owns the re-verdict).
