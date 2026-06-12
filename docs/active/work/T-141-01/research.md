# Research — T-141-01 rustic-headroom (E-34 / S-141)

Descriptive map of where the two refused rustic proportion rows live, what gates read them, and
which tests touch them. No solutions here — see design.md.

## The two refusals (the ticket's subject)

From the E-33 milestone (`benchmarks/sculpture/pattern-book/proportion-milestone.json`) and the
T-138-02 review (`docs/active/work/T-138-02/review.md`, finding 4 + open concern):

- **Cottage wall-raise.** Target ratios `ridgeToEave 1.4145, roofShare 0.293`. With the bent ruler
  corrected (S-139), the residual was still `≈1.7 / 0.45` — walls genuinely too short relative to
  the roof. The model aimed the correct wall-raise in 5/6 workshop rounds; every aim was refused
  by **the rustic `storeyHeight` band `{min:3,max:4}` plus the building-program schema `storeys ≤ 4`**.
  The one *accepted* move (`storeys:3`) the bent ruler mislabelled wrong-direction.
- **Barn pitch ceiling.** Target `ridgeToEave 2.1, roofShare 0.5238` — a steep roof. Both barn runs
  (rustic + saltcrag-skinned) land class-1 pitch as the single surviving proportion-flavored gap;
  rustic's `pitchClasses [1]` forbids the steeper class. Flagged to the reviewer across E-31..E-33.

## The pack file — `packs/rustic.json`

`proportions` block (the only thing this ticket changes the data of):
```json
"proportions": {
  "storeyHeight": { "min": 3, "max": 4 },
  "pitchClasses": [1],
  "openingRhythm": { "minSpacing": 2, "maxSpacing": 5 }
}
```
The taste record lives in `provenance` (free-text): `setting`, `sources{}`, `wealthClass`,
`roofingEconomy`. **`provenance` is `additionalProperties:false`** (style-pack schema) — no new key
can be added; a justification must extend an existing field. `roofingEconomy` today already names
"the steep 45° pitch class"; `wealthClass`/`setting` carry the build economy.

Comparison anchor: **`packs/saltcrag.json` already ships `pitchClasses [2, 1, 0.5]` and
`storeyHeight {min:3,max:4}`** — saltcrag is the precedent that class-2 pitch is realizable and
in-vocabulary; it is **ratified and must stay untouched** (it carries a `ratification` block).

## The gates that read these rows

### Pack-vocabulary gate — `src/recognition/program.mjs` `validateProgramAgainstPack`
- Line 166 destructures `{ storeyHeight, pitchClasses, openingRhythm } = pack.proportions`.
- Line 206-208: `if (!pitchClasses.includes(m.roof.pitchClass)) err(... "outside the pack
  vocabulary [...]")` — **the pitch refusal**, message lists the pack array.
- Line 211-212: `if (m.storeyHeight < min || > max) err(... "outside the pack band [min, max]")` —
  **the storeyHeight refusal**, message names the pack band.
- There is **no `storeys`-count check here** — the storey count is bounded only by the schema.

### JSON-schema gate — `schema/building-program.schema.json`
Per-mass caps (`assertBuildingProgram` → AJV):
- `storeys`: integer **min 1, max 4** (line 60) — the schema ceiling the cottage hit.
- `storeyHeight`: integer **min 2, max 6** (line 61-66) — **already looser than the pack band**, so
  the pack is the binding constraint for storeyHeight today and would remain so up to a pack max of 5.
- `roof.pitchClass`: number, `exclusiveMinimum 0`, **no upper cap** (line 128) — so the pack
  `pitchClasses` array is already the only binding constraint on pitch.

### Style-pack schema — `schema/style-pack.schema.json`
- `proportions.storeyHeight` is `$defs/intRange` (min/max integers ≥1); `pitchClasses` is an array
  of numbers `exclusiveMinimum 0`, `minItems 1`. Both `{min:3,max:5}` and `[1,2]` are schema-valid.
- `provenance` allows only `setting`, `sources`, `wealthClass`, `roofingEconomy`
  (`additionalProperties:false`) — confirmed above.

## The lever — `src/workshop/geometry.mjs` `applyGeometryAdjust` (the "adjust-params" form)
- `GEOMETRY_PARAM_KEYS = [pitchClass, eaveHeight, storeys, storeyHeight, width, depth]`.
- `storeyHeight`/`storeys` set the mass field directly; `eaveHeight` is exclusive and factorizes via
  `factorEave` (`src/recognition/measured-program.mjs:96`) over `STOREYS_RANGE [1,4]` ×
  `STOREY_HEIGHT_RANGE [2,6]`, lexicographically preferring (exact eave) then (in pack band).
- `pitchClass` re-aims the idiom across the steep door: `roofIdiomForPitch` swaps
  `roof.gable ↔ roof.gable.steep` (T-138-01) so a >1 aim crosses the 45° contract.
- Every candidate is re-validated by `gateSource` → `assertBuildingProgram` (schema) **then**
  `validateProgramAgainstPack` (pack). A finding throws; the round records `apply-failed` — the
  honest refusal. So a pack-band/pitch refusal surfaces here verbatim.
- `factorEave` returns the closest factoring even when it lands out-of-band (the band is the 2nd lex
  key, error is the 1st); `gateSource` then refuses it. Net: an `eaveHeight` aim that needs
  `storeyHeight 5` is refused under band `{3,4}` and accepted under `{3,5}`.

## Tests that read the live rustic rows (will break or extend)

- **`src/workshop/geometry.test.mjs`** — loads `packs/rustic.json`. `makeSource` fixture is
  `storeys:2, storeyHeight:4, pitchClass:1`.
  - **G3** (74-78): rustic `pitchClass:3` expects `/outside the pack vocabulary \[1\]/` — the array
    becomes `[1, 2]`, so the **message regex breaks** (3 stays refused).
  - **G3b** (81-100): saltcrag `pitchClass:2` lands via the steep door — unchanged.
  - **G3c** (102-107): rustic `pitchClass:2` expects refusal — **inverts**: class 2 now lands.
  - **G3d** (109-123): saltcrag down-aim — unchanged.
- **`src/recognition/program.test.mjs`** — loads rustic. Line 110 mutates `pitchClass = 2` expecting
  `/outside the pack vocabulary/` — **breaks** (2 now valid); 3 is the new off-vocabulary value.
- **`src/recognition/compile.test.mjs:150`** — constructs `pitchClass:2` deliberately **un-validated**;
  its comment "rustic declares pitchClasses [1]" goes **stale** (test still passes; compile never gates).
- Synthetic-fixture snapshots that do **not** read rustic.json (no change): `formation.test.mjs:225,320`
  (`PROPS`/`mk(...)`), `style-pack.test.mjs:37,116`, `conformance.test.mjs:199`,
  `measured-program.test.mjs:124` (passes `[1]` explicitly).
- Other rustic-loaders (`actions/seed/critique/rerecognize/replay.test.mjs`, `prompt.test.mjs`,
  `baml/fixtures.test.mjs`, `backlog.test.mjs`) — grep shows none assert a pitch/storeyHeight
  refusal or snapshot the loaded `proportions`; the `declarations.proportions` deepEquals carry a
  separate synthetic object, not `pack.proportions`.

## Conformance / validation surface (AC4)
- `npm run pack:validate` → `scripts/validate-pack.mjs packs/rustic.json` re-derives palette
  `valueCheck` and schema-validates. This ticket touches **only `proportions` + `provenance` text** —
  no palette/valueCheck/idiom/conformance-checks change, so the value re-check and the
  vocabulary-authority single composition point (`composeVocabulary`/`ownSetsOf`, unrelated to
  proportions) stay green.
- `conformance.checks` in rustic (`courses-even, symmetry-held, openings-rhythm, palette-in-pack,
  watertight, single-component`) read realized cells, not proportion rows — unaffected.

## Constraints / invariants surfaced
1. `provenance` cannot gain a new field — justifications fold into `roofingEconomy`/`wealthClass`/`setting`.
2. Saltcrag is ratified and out of scope.
3. No per-building constants (E-31): the change is per-STYLE pack data only.
4. No judge runs, no chain re-runs, no pin rotations (T-143 owns the re-verdict) — proof is at the
   lever (unit/integration), not the judge.
5. A refusal must name the **pack row**, not a hidden schema ceiling (the T-138-02 conflation).
