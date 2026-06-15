# T-107-01 reconstructed-milestone — Structure

File-level blueprint. Two sites of change: the render lens (`render/`) and the terminal evidence
runner (`benchmarks/sculpture/`). Root `src/` is untouched except one comment line.

## Created

### `render/scripts/patch-viewer-lens.mjs`
The on-disk lens patch (Design D1). Exports a pure core + CLI:
- `patchSource(src) → {patched, changed}` — exact-string replace of
  `if (block.name.includes('air')) return []` with the three-name exact match; returns input
  unchanged if already patched; THROWS if NEITHER pattern is found (viewer drifted — never guess).
- CLI (no args): resolves `prismarine-viewer/viewer/lib/models.js` from `render/`, applies, writes
  only on change, prints `patched|already-patched`. Idempotent; wired as `postinstall`.

### `render/src/lens-guard.mjs`
Import-time tripwire: synchronously reads the installed `models.js`; if the buggy
substring-`includes('air')` pattern is present, THROW
(`stair-lens unpatched — run \`npm install\` in render/ (postinstall applies the lens patch)`).
Imported for side effect at the top of `render/src/render.mjs` so no render can happen through the
broken lens. Exports `assertLensPatched()` for the test.

### `render/test/stair-mesh.test.mjs`
GL-free mesher regression (runs under render's `node --test`):
- viewer `World` + `getSectionGeometry` on a section with one `oak_stairs` (default state and one
  explicit facing/half=top) → `positions.length > 0`; with `oak_slab` → still > 0 (no collateral);
  with true `air` → 0 (the original intent preserved).
- `patchSource` unit: applies once, idempotent on second pass, throws on unknown input.
Guard: skip with a named reason if `node_modules` is unpatched AND the test runs pre-install (the
tripwire test asserts the THROW instead).

### `benchmarks/sculpture/reconstructed-milestone.mjs`
The terminal runner (Design D2), shaped on `component-skin.mjs`. No subject keys/constants/branches
— subjects are `SUBJECTS` registry data; the styled-vs-challenge choice is
`Boolean(def.kitRecord)`; baseline paths derive from the subject key.

Flow per subject `key`:
1. `paths`: milestone record (`styled/<k>.json` | `challenge/<k>.json`), gate record
   (`multi-angle/<k>-{styled|challenge}.json`), final artifact, baseline
   (`reconstructed/<k>/e26-baseline.json`), outputs (`reconstructed/<k>.{json,md}`).
2. **Pre-capture**: read committed gate record (if any) → `{contract, judgeModel}` for the
   instrument diff.
3. **Verify component layer**: import `verifyComponentLayer` (new export from
   `component-skin.mjs` — same code, no duplication) → findings.
4. **Spawn milestone** (`spawnMilestone` pattern, stdio inherit): the full chain incl. gates runs
   there; non-zero exit → distill the failure record honestly (status `pipeline-failed`, stage,
   measured cause), do not throw early.
5. **Distill**: chain stage summary + reconstruction seams (from milestone record), gate verdicts
   per view, kit presence, settle residue.
6. **Instrument** (AC #2): deep-diff fresh gate-record `contract` + judge model vs pre-captured →
   `instrument: {frozen: bool, diffs: [], judgeModel, note}`; absent pre-record (church, first
   gate run) → compare against `src/config.mjs` values, named as such.
7. **Metrics** (AC #3): `protrusionCensus` + `raggedColumnRate`
   (`src/view/shell-regularize.mjs`) over baseline artifact occupancy AND fresh final occupancy
   (same census basis as the 265/276 baselines — full occupancy, stair cells occupied); roof fit
   distilled from `roof/<k>.json` (`fit.gables[].sides[]` pitch vs glbPitch + status); cage
   outcomes from the milestone record's regularize stage; church band0 from the chain's coverage
   gate result (pass value or the THROW's census decomposition).
8. **Sheets** (AC #4): `renderSheet` (import from `placement-grammar.mjs`) on baseline + final →
   `pr/assets/frames/reconstructed-<k>-{before,after}.png`. The gate's labeled 5-panel sheet is
   already written by the gate run.
9. **Record + md**: schema `reconstructed-milestone/v1` — `{schema, subject, runner, chain,
   instrument, verdicts, metrics: {censusBefore, censusAfter, roofFit, cage, church?},
   baseline: {sourceCommit, sourcePath, sha256}, sheets, findings, generalization, reproducible}`.
   `reproducible` carries the milestone's sha256 set + the distillation determinism note
   (component-skin precedent).
- Flags: `--repro` → forward to the milestone spawn, then re-distill and byte-compare the
  regenerated record against the committed one (volatile-free by construction — no timestamps);
  `--offline` → re-assert committed record: referenced files exist, SHAs match, instrument diffs
  empty, no recompute.

### `benchmarks/sculpture/reconstructed/<k>/e26-baseline.json` (×3, committed evidence inputs)
Wrapper `{schema: "e26-baseline/v1", sourceCommit, sourcePath, note, artifact}` extracted ONCE from
git history (Design D3): cottage/gatehouse from `styled/<k>/artifact.json` at their T-101-close
commits (cottage: `5574d70`; gatehouse: its own last E-26 commit, found by `git log`); church from
`challenge/church/artifact.json` at its last pre-T-106 commit. Extraction is a manual implement
step recorded in progress.md; the runner only ever reads the committed file.

### Generated evidence (by runs, committed)
`benchmarks/sculpture/reconstructed/<k>.{json,md}`; `pr/assets/reconstructed-milestone.md` (epic
sheet: per-subject verdict tables, metric deltas, links); `pr/assets/frames/reconstructed-<k>-{before,after}.png`;
refreshed `styled/{cottage,gatehouse}*`, `challenge/church*`, `multi-angle/*` records + sheets and
the refreshed `fixture-card` record/PNG (stairs now visible).

## Modified

- `render/package.json` — add `"postinstall": "node scripts/patch-viewer-lens.mjs"`.
- `render/src/render.mjs` — one import line: `import './lens-guard.mjs'` (side-effect assert).
- `package.json` (root) — `reconstructed:{cottage,gatehouse,church}` scripts pointing at the new
  runner. Existing prefixes untouched.
- `benchmarks/sculpture/component-skin.mjs` — export `verifyComponentLayer` (extract the existing
  local function; behavior unchanged; `reskin:*` untouched).
- `benchmarks/sculpture/fixture-card.mjs` — the `stairs-invisible` finding becomes
  `stairs-rendered (lens fixed, T-107)`: text + any structured finding code; re-run refreshes the
  committed record + card PNG.
- `benchmarks/sculpture/roof-program.mjs` — `LENS_NOTE` updated (stairs render as of T-107; solid
  wedge note retired).
- `src/form/shaped-vocab.mjs` — line-14 comment updated (lens fixed; ring stays full-cube by
  design — visibility was the rationale, arch geometry unchanged this ticket).
- `docs/knowledge/design-learnings.md` — append the E-27 section (five-whys → per-ticket items
  T-102…T-107 → per-subject outcomes → over/under-reach → E-12 handoff).

## Not touched (boundaries)

- `src/form/multi-angle-gate.mjs`, gate runner contract, `src/config.mjs` thresholds/azimuths/
  model — the frozen instrument (AC #2). The instrument diff in the record PROVES this.
- `styled-milestone.mjs` / `challenge-milestone.mjs` / `durable-skin.mjs` — the chain is consumed,
  not edited.
- `component-plan.mjs`, `reconstruct-compose.mjs`, kit/zone/value records — T-106's seams.
- Committed PNGs of earlier epochs — records pin their own renders; no retroactive re-rendering.

## Ordering (matters)

1. Lens: patch script + postinstall + tripwire + tests + apply + fixture-card refresh + prose pins
   (roof-program, shaped-vocab) — ONE commit. Everything downstream renders through the fixed lens.
2. Baseline snapshots ×3 — one commit (evidence inputs with provenance).
3. Runner + npm scripts + component-skin export — one commit (code, no evidence).
4. `reconstructed:cottage` → evidence commit; `reconstructed:gatehouse` → evidence commit;
   `reconstructed:church` → evidence commit (honest-failure branch likely).
5. `--repro` fresh-process proofs + `--offline` re-asserts (recorded in progress.md).
6. Learnings section + `pr/assets/reconstructed-milestone.md` — docs commit.

## Interfaces summary

- `patchSource(src)` — pure, tested, throws on drift.
- `assertLensPatched()` — throws before any render if unpatched.
- `verifyComponentLayer(def, key, root)` — existing logic, now exported.
- `reconstructed-milestone.mjs` CLI: `--subject <k>` (required), `--repro`, `--offline`.
- Record schema `reconstructed-milestone/v1` as in §Created.
