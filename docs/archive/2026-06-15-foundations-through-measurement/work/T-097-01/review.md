# T-097-01 fixture-path-proof — Review

Handoff summary. Suite: **1156/1156 green** (`npm test`; was 1129 at start). Five implementation
commits on main; no schema change was needed.

## What changed

### Created
- `src/form/fixture-card.mjs` — `CARD_ROWS` (25 rows: trapdoor ×6 incl. all four open facings,
  fence ×5 with explicit connection booleans, stairs ×5, slab ×3, door ×4 as two lower/upper pairs,
  lantern ×2), `cardLayout` (deterministic family-per-z-line grid on a smooth_stone baseplate),
  `fixtureCard()` (full schema-valid artifact). The grammar (S-099) imports `CARD_ROWS` — the proven
  state vocabulary — instead of restating states.
- `src/form/fixture-card.test.mjs` — 11 tests: live-gate acceptance (AC #2 pinned offline forever),
  family/orientation coverage, layout invariants, synthetic-descriptor radix pins, and a per-row
  `blockStateId → decodeStateId` round-trip against real 1.20.1 data.
- `benchmarks/sculpture/fixture-card.mjs` + npm `card:fixtures` — the verification ladder runner.
- `benchmarks/sculpture/fixture-card/` — committed regression reference: card.json, record.json
  (`fixture-card/v1`), fixture-card.md, five 1024² renders (four gate azimuths + front).

### Modified
- `render/src/version.mjs` — `stateProps(block, states, stateId)` (pure inverse decoder, shared
  radix walk with the encoder via `decodeIndices`) and `decodeStateId(stateId)` (binary search over
  the version's state-id ranges). `blockStateId` behavior unchanged.
- `src/view/occupancy.mjs` — the third class (AC #3): sparse `forms`/`states` maps, `formOf`,
  `solid`, `solidOccupancy` (returns the SAME object for cube-only builds — back-compat is
  identity); `artifactOccupancy` carries state and classifies via the kit ground-truth classifier
  (injectable `opts.formOf`). `cells`/`has`/`block` untouched.
- `src/view/structural-read.mjs` — `openings` detects on the solid view, so a dressed aperture keeps
  its window/door identity (AC #5) and reports `dressing: {cells, blocks}`.
- `src/view/shell-integrity.mjs` — `closureCheck` skin is solid cells + allow regions; returns
  `dressed: {cells}` (AC #4: dressed-not-hole; no region → breach, a fixture cannot fake skin). New
  `strayFixtures(occ, regions)` detector (flaggable, never changes the verdict). `rebuildArtifact`,
  `componentStrip`, `plugClosure` all carry forms/states through their rebuilds (a strip no longer
  silently undresses a window).

## Acceptance criteria

| AC | status |
|---|---|
| Test-card rendered, every placement verified, `unmapped` empty, reference committed | **Done** — 349/349 placed, unmapped 0, 25/25 state read-backs correct, renders committed (one lens residual, below) |
| Live AJV gate accepts every card state | **Done, no schema change** — the stringly `blockState` map already admits everything; pinned as a unit test |
| Occupancy third class, pure, unit-tested | **Done** — 6 new occupancy tests |
| Closure: dressed passes as dressed, stray still flaggable, tested both ways | **Done** — dressed+regions → closed with tally; same dressing without regions → breach; stray flagged without changing the verdict |
| `openings` finds a dressed opening | **Done** — identity + dressing annotation, composes through `openingRegions` into closure end-to-end |
| No subject-specific constants; `npm test` green | **Done** — 1156/1156 |

## Test coverage

- 27 new unit tests across fixture-card (11), occupancy (6), structural-read (3), shell-integrity (7).
- Deterministic integration = the runner ladder (gate → mapping → read-back); renders are evidence
  only (`reproducibility-excludes-gl-from-decisions`).
- Gaps: `decodeStateId`'s binary search is exercised only via the card rows (sparse ids untested);
  `fillVoids`/`zone-fill`/`hollow-carve` behavior on fixture-bearing occupancies is unchanged-by-design
  (they read `occ.has`) but has no fixture-specific tests; hollow-carve's rebuild does NOT carry
  forms/states (out of scope — flagged below).

## Open concerns

1. **NAMED RESIDUAL — stairs are invisible in renders.** prismarine-viewer 1.33.0 meshes NO stair
   block at any state (probed oak/stone_brick/cobblestone, default + explicit). Placement is proven
   by read-back; this is a lens defect (the E-22 pattern). Recorded in record.json/md. **S-099 must
   not rely on stair pixels** (judges, resemblance) until the viewer is fixed — likely worth its own
   ticket (patch or upgrade the viewer, then re-cut the reference renders).
2. Slab `type=top` renders correctly (verified from the front elevation), but at oblique gate angles
   top-vs-bottom is nearly indistinguishable — a future visual judge should use an elevation view
   for slab verification.
3. `derivedFormClass` calls cube only what's in the 305-block Lab table; a true cube absent from
   that table would classify as fixture and stop counting as closure skin. All current manifests
   live inside the table; `artifactOccupancy({formOf})` is the escape hatch. Acceptable now, worth
   revisiting if the vocabulary widens.
4. `hollow-carve.mjs` rebuilds occupancies without carrying `forms`/`states` (pre-existing path,
   untouched). If hollowing ever runs on a fixture-bearing build, dressing metadata is dropped there.
5. Door upper halves render with the correct hinge but the open-pair sweep direction was only
   eyeballed at one angle; if S-099 places doors programmatically, add a hinge-specific visual check.
6. Mid-flight concurrency: a sibling session added `challenge:*` npm scripts to package.json while
   this ticket ran; merged cleanly (my addition is one line, `card:fixtures`).

## How to re-verify

`npm test` (offline, includes the gate pin and decode round-trips), then `npm run card:fixtures`
(exit 0 ⇔ gate + mapping + read-back all pass; regenerates the reference renders in place).
