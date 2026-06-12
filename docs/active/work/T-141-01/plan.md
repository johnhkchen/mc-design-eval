# Plan — T-141-01 rustic-headroom

Ordered, independently-verifiable steps. The change is small; the discipline is proving the
previously-refused aims round-trip without running a judge.

## Step 0 — Baseline (verify, don't change)
- `npm test` to confirm the green starting point and capture the count.
- Confirm working tree is clean of in-scope files (`packs/rustic.json`, the three test files).
- **Verify:** suite passes (note any pre-existing reds from sibling tickets — out of scope).

## Step 1 — Pack data: the two rows
Edit `packs/rustic.json` `proportions`:
- `storeyHeight.max`: `4` → `5`.
- `pitchClasses`: `[1]` → `[1, 2]`.
- **Verify:** `npm run pack:validate` green (schema-valid, palette value-consistent). The JSON
  parses; `storeyHeight {min:3,max:5}` and `pitchClasses [1,2]` are schema-valid.

## Step 2 — Pack provenance: the recorded taste justification
Edit `packs/rustic.json` `provenance` (fold into existing free-text — no new key):
- `wealthClass`: append the taller-storey-column (storeyHeight→5) line.
- `roofingEconomy`: append the class-2 steeper-pitch line.
- **Verify:** `npm run pack:validate` still green (free-text only); the two lines read as vernacular
  justification, one per changed row.

> Steps 1–2 are one logical change (the pack's per-style data) and commit together with their tests
> (Steps 3–4). Splitting the data from its proof would leave a red intermediate commit.

## Step 3 — Lever tests: the G3 family (`src/workshop/geometry.test.mjs`)
- **G3** (rustic honest refusal): change expected regex `\[1\]` → `\[1, 2\]` (still `pitchClass:3`).
- **G3c** (rewrite): rustic `pitchClass:2` now **lands** — assert `revised.masses[0].roof.idiom ===
  "roof.gable.steep"`, the compiled `main-roof` element `idiom === "roof.gable.steep"` and
  `spec.pitch === 2`, and `realizeProgram(program).cells.length > 0`. Retitle to name the unblock.
- **G3e** (new — cottage wall-raise): `applyGeometryAdjust(ctx(), {massId:"main",
  params:{eaveHeight:10}})` → assert `source.masses[0]` is `storeys:2, storeyHeight:5`,
  `main-shell` `spec.height === 10`, roof eave moved to 10, cells realize. Comment: the move the
  band `{3,4}` refused.
- **G3f** (new — pack is binding): `assert.throws(() => applyGeometryAdjust(ctx(),
  {massId:"main", params:{storeyHeight:6}}), /outside the pack band \[3, 5\]/)` with a comment that
  the schema (`storeyHeight` max 6) admits 6 — the **pack** refuses, so the refusal names the row.
- **G3b / G3d**: leave untouched (saltcrag regression guard).
- **Verify:** `node --test src/workshop/geometry.test.mjs` green; G3/G3b/G3c/G3d/G3e/G3f all pass.

## Step 4 — Gate test + stale comment
- `src/recognition/program.test.mjs` line 110: mutation `pitchClass = 2` → `= 3`.
- `src/recognition/compile.test.mjs` ~line 150: update the stale comment to "rustic now declares
  pitchClasses [1, 2] (T-141-01); constructed directly to isolate compile from validation".
- **Verify:** `node --test src/recognition/program.test.mjs src/recognition/compile.test.mjs` green.

## Step 5 — Full suite + conformance sweep
- `npm test` (runs `validate-artifact` self-tests + `test:unit` over `src/**/*.test.mjs`).
- `npm run pack:validate`.
- **Verify:** both green; diff scope is exactly the four files (`packs/rustic.json`,
  `geometry.test.mjs`, `program.test.mjs`, `compile.test.mjs`). No runner/chain/judge/pin command
  was invoked; no new file outside `docs/active/work/T-141-01/`.

## Step 6 — Commit
One atomic commit (data + provenance + the four test/comment edits are the single consequence of the
two-row change):
```
feat(T-141-01): rustic headroom — storeyHeight max→5, pitchClasses gains class 2

The two E-33 refusals were the rustic pack rows: the cottage's wall-raise (storeyHeight
band {3,4}) and the barns' class-1 pitch ceiling. Raise storeyHeight max to 5 (the pack
stays strictly binding below the schema's 6) and add class 2 (saltcrag's proven steep
class); both carry a vernacular justification in the pack provenance. Schema caps reviewed
and kept (pack is the binding constraint). Proof at the lever: cottage wall-raise + class-2
pitch round-trip; honest refusals (storeyHeight 6, pitchClass 3) name the pack row. No
judge runs, no pin rotations.
```
Branch: already on `main` (Lisa's same-branch model); the lock serializes the commit.

## Testing strategy
- **Unit (authoritative here):** the G3 family + program.test cover every claim — accepted aims
  (eaveHeight→sh5, pitchClass 2 via steep door) and honest refusals (storeyHeight 6 names the pack
  band, pitchClass 3 names the pitch vocabulary). Saltcrag G3b/G3d are the no-regress guard.
- **Schema/value:** `pack:validate` proves the pack stays well-formed and value-consistent.
- **No integration/judge:** explicitly excluded by AC3; T-143 owns the re-verdict.
- **Regression backstop:** full `npm test` catches any unforeseen rustic-loading test that asserted
  the old refusals.

## Risks & mitigations
- *A hidden test asserts the old `[1]`/`max:4`*: caught by Step 5's full run; fix in place.
- *factorEave returns a different factoring for eaveHeight 10*: verified unique (`2×5`); if a fixture
  changes upstream, assert on `storeyHeight===5` rather than the exact storeys split.
- *Cottage still fails its ratio target*: out of scope (AC3 proves the round-trip, not closure).
