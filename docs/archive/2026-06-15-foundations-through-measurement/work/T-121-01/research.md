# T-121-01 barn-proof-milestone — Research

Descriptive map of what exists for the E-30 terminal proof: the `generated:barn` first run, the
single legacy re-judge, pin rotation, and the journal/E-12 handoff. No solutions proposed here.

## 1. The named run and its runner

`npm run generated:barn` → `benchmarks/sculpture/generated-milestone.mjs --subject barn`.

Pipeline (one process, deterministic chain run **twice in-process**, byte-compared at
`generated-milestone.mjs:517–526`):

1. **Evidence** — voxelize `glb/barn.glb` at registry scale 48, condition blob in-memory via the
   T-102 cage (`challenge-milestone.mjs` imports, lines 114–132). Never written.
2. **Fit** — `fitProvision()` (`src/form/provision-fit.mjs:52`): masses, roof planes (incl.
   `fitRidgeLine` with the T-118 protrusion-exclusion repair), wall slabs, openings. Refusals are
   named findings (E-29 Rule 1), not silent omissions.
3. **Generate** — `generateProvision()` (`src/form/provision-generate.mjs:85`) from the committed
   zone map + kit. **Zero-blob machine check**: `assertGeneratedProvenance()`
   (`provision-generate.mjs:276`) — every cell's provenance ∈ {mass, roof, opening-head}.
   Regenerate-from-serialized-fit must be byte-identical (`generated-milestone.mjs:167–171`).
4. **Skin** — `buildSkin()` from `durable-skin.mjs` (vocabulary authority via
   composeVocabulary/ownSetsOf, T-113). Barn has `valueSelectRecord: null` — first run IS the
   value-true result (church precedent).
5. **Grammar / dressing / settle** — `styledStretch()` from `styled-milestone.mjs:102–174`,
   settle fixpoint ≤4 iterations, tolerated residue recorded.
6. **Gate** — `spawnGate()` subprocess: `multi-angle-gate.mjs --subject barn --label generated
   --artifact … --reference <generated base>` (`generated-milestone.mjs:555`). Kit-aware: overall
   verdict = kit-presence AND 4-azimuth resemblance aggregate.
7. **Record** — `generated/barn.json` + `.md`, `instrument` (same-ruler) receipt, head-to-head,
   `generalizationGrep()` (`generated-milestone.mjs:391–396`), reproducible SHAs.

Flags (`generated-milestone.mjs`): `--repro` (lines 487–509) re-proves the judge-free chain in a
fresh process against the committed record's SHAs; `--offline` (lines 449–478) validates committed
record + artifact hashes without recomputation. **Neither receipt has ever existed for barn.**

All record writes go through `guardedWriteRecord` (T-119); the gate preflights its verdict pins
before any spend (`multi-angle-gate.mjs:256–265`). `--rotate-pins` passes through both milestone
runners to the gate subprocess (`generated-milestone.mjs:555`, `styled-milestone.mjs:524`); npm
swallows flags without `--` (known footgun, fail-closed).

## 2. Barn preconditions — all satisfied (T-117/T-120)

- Registry: `durable-skin.mjs:229–267` — barn fully registered; `zoneMapRecord: "zone-map/barn.json"`,
  `kitRecord: "kit/barn.json"`, `provision/generated scale 48`, concept under `runs/017-…tithe-barn…/`.
- Zone map: committed at T-117 (`source: "concept"`, band0 cobblestone share 1.0, `fieldResolution`
  {stone_bricks→cobblestone, oak_planks→cobblestone}); prior refusal preserved beside it.
- Kit: `kit/barn.json` committed (stone_bricks pillars / oak_planks wagon doors / dark_oak_planks roof).
- Registration smoke: PASS (`runs/017-…/registration-smoke.{json,md}`, T-120); GLB smoke PASS
  (`glb/smoke/barn@48.json`, 1-cell speck of 3,579, fraction 0.000279).
- Inputs on disk: `glb/barn.glb` (6.5MB), `challenge/barn/base-artifact.json` (registry build path).
- **`benchmarks/sculpture/generated/barn/` is empty; `multi-angle/barn-generated.json` does not
  exist.** The run has never produced records — every barn write is a first derivation (pin-guard
  writes freely; no rotation needed for the barn leg).

## 3. The pinned bar and the legacy profiles

Pinned by T-116 from the T-111 cottage profile: **kit presence PASS, ≥2/4 same-object azimuths,
≤ the 10-gap/2-budget profile** ("≤10/2 gaps": gapCount vs gapBudget=2; budget from `config.mjs`).

On-disk comparison records (verified directly):

| record | verdict | gapCount | same-object views | kit |
|---|---|---|---|---|
| `multi-angle/cottage-styled.json` | FAIL | 10 | 135°, 225° (2/4) | PASS |
| `multi-angle/gatehouse-styled.json` | FAIL | 12 | 0/4 (all drifted, 3 gaps each) | PASS |
| `multi-angle/church-generated.json` | FAIL | 12 | 0/4 (all drifted) | PASS |

These are exactly the ticket's named baselines (cottage 10/2 with 135°/225° holds; gatehouse 12/2;
church 12/2 generated). The matching chains: `styled:cottage`, `styled:gatehouse`,
`generated:church`. Also extant: `cottage-generated.json`, `gatehouse-generated.json`,
`cottage-current.json` (kit FAIL, 9 gaps), challenge-label records, and the synthetic-hut fixture.

## 4. Gate mechanics relevant to the re-judge

- 4 fixed azimuths (45/135/225/315 @ 30°, 512²), triptych = concept + mesh silhouette + render;
  fixed v2 prompt; T-088 coverage precondition short-circuits a view (`verdict: null`,
  `reason: "coverage"`).
- Aggregate: REFUSE on any unrendered/unparsed view; pass ⟺ coverage pass everywhere AND 4×
  "same object" AND total minor gaps ≤ 2. Gap = {region, attribute∈form|massing|material
  zoning|palette, severity}.
- T-114 judge-reply policy (`src/form/judge-reply.mjs`): malformed ≠ verdict, ≤3 same-prompt asks,
  ledger committed; `gate:rejudge` completes **unparsed** views only — all legacy views are parsed,
  so the re-judge must be a **live gate run** (fresh judge, one run per view) under `--rotate-pins`.
- Instrument receipts, two distinct shapes:
  - `gateInstrumentDiff(before, after)` (`src/form/multi-angle-gate.mjs:217–240`) — used by
    `--rejudge`; compares schema/subject/label/artifact/contract/zones/kitPresence **and parsed
    verdicts byte-for-byte**. A live re-judge legitimately changes verdicts, so this exact function
    reports verdict paths; its non-verdict field set is the instrument-frozen core.
  - Milestone-record `instrument` (`generated-milestone.mjs:326–344`, also reconstructed-milestone)
    — `{frozen, comparedTo, diffs: [], judgeModels}` comparing contract fields
    (azimuths/elevation/width/height/gapBudget/coverageThreshold) + judge models vs the committed
    styled-label record. **This is the `diffs: []` receipt named in the AC.** `styled-milestone.mjs`
    has **no** instrument field — cottage/gatehouse receipts have no native home.
- Pin policy (T-119, `docs/knowledge/pin-rotation-policy.md`): owning ticket names the rotated
  records in its AC (T-121 does), runs with `-- --rotate-pins`, commit names every retired pin.
  Verdict pins here: `multi-angle/{cottage-styled,gatehouse-styled,church-generated}.{json,md}` plus
  each chain's milestone records (`styled/{cottage,gatehouse}.json`-family, `generated/church.json`,
  artifact JSONs) — all guarded.

## 5. T-118 refit state (what the re-judge actually tests)

Per `docs/active/work/T-118-01/{review,findings}.md`:
- Refits **refuted** for cottage ridge-raise/verge-tips and gatehouse intersect-resolution; church
  pyramid rung stays. The landed change is the `fitRidgeLine` **evidence repair** (protrusion
  exclusion, commit `ad18214`) — reconstructed-path placements re-asserted byte-identical.
- The **generated** path consumes `fitRidgeLine` inside provision-fit → generated artifacts can
  move; T-118 explicitly deferred "generated cottage cross-gable ridge fix (−3.445)" to S-121
  ("re-running that chain re-judges; S-121 owns verdicts"). The named comparison profile for
  cottage, however, is the **styled** 10/2 record.
- Roof-diff instrument (`diff:roof`, `roof-diff.mjs`): committed records + sheets for
  cottage/gatehouse/church (generated+reconstructed paths); **barn both paths SKIPPED** with named
  reason (pre-T-117); auto-picks barn once `generated/barn/*` exists. Writes are plain `writeFile`
  (not pin-guarded). Sheets → `pr/assets/frames/roof-diff-<subject>-<path>.png`. These are "the
  T-118 diff deltas" the AC wants cited beside each verdict.

## 6. Evidence & journal conventions

- Contact sheets: gate writes `pr/assets/frames/multi-angle-<subject>-<label>.png` (committed) and
  `multi-angle/<slug>.md`. Durable-skin writes `durable-<subject>-{before,after}.png`. Census +
  fit tables live in `generated/<subject>.md` (renderMd).
- `docs/knowledge/design-learnings.md` ends at "E-29 Generate-first" (~line 2432); E-30 section
  follows the `## E-NN <name> — … · YYYY-MM-DD` convention.
- "E-12 handoff" (per T-038/T-101/T-107/T-111 precedent): curated committed frames under
  `pr/assets/` + an explicit note in learnings/review of what is delivered.
- Working-tree note: `pr/assets/frames/roof-gatehouse-cap{45,135}-{before,after}.png` +
  `roof-church-ridge-after.png` are uncommitted leftovers (T-118 era); `docs/active/work/T-120-01/`
  artifacts committed at `1f2149b`.

## 7. Constraints & risks (observed, not invented)

- **One judge run per view, no re-rolls** (E-28 Rule 4); T-114 governs malformed replies only.
  Judge = pinned PHASE1_MODEL_ID via the `claude -p` shim; renders need headless GL — both proven
  in this environment today (T-111…T-116 judge runs).
- Budget-edge flap: cottage 135°/225° holds flipped at the budget edge before (T-111/T-116 note) —
  honest recording either way is the AC's "honest-fallback convention".
- Settle non-convergence (church) closed at T-113; barn is a single rectangular mass + one gable
  ridge — the exact shape the roof ladder's first rung accepts (T-116 fallback decision).
- `npm test` baseline: 1601 green (T-120 exit state).
- Sibling-session check: no T-121 work dir existed, last commits are T-120 (done) — no concurrent
  thread on this ticket.
