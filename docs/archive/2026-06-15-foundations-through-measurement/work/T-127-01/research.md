# T-127-01 styled-house-milestone — Research

Phase artifact 1/6. Descriptive map of what exists for the E-31 terminal milestone: the
pattern-book end-to-end (cottage + barn), the frozen-gate judging, and the head-to-head against
the metrology-path bests. No solutions proposed here.

## The ticket's chain, stage by stage — what is already committed

### Conditioned sketch (T-123)
`benchmarks/sculpture/form-sketch.mjs` (`sketch:cottage|barn|…`). Committed per subject under
`benchmarks/sculpture/form-sketch/`: `<key>.json` (the conditioned read: median-smoothed
roofProfile etc.) and `<key>-sheet.png` (the sheet shown to the model). Both cottage and barn
exist — `recognize.mjs` consumed them live in T-125.

### Model-recognized program (T-125) — COMMITTED for both subjects
`benchmarks/sculpture/recognize.mjs` (`recognize:cottage|barn|offline`). Live mode: concept PNG +
sketch sheet → `claude -p` shim, `MODEL_TIERS.strong`, T-114 `runReplyPolicy` with
`PROGRAM_REPLY_BUDGET = 3`; accepted reply parses through `parseProgramReply` (schema + pack
gates). Committed under `benchmarks/sculpture/recognition/`: `<key>.program.json` (the
building-program/v1), `.replies.json` (full raw texts + ledger), `.prompt.md`, `.artifact.json`
(the realized first draft), `.record.json`, `.md`, 4 render PNGs per subject. Both subjects pass
all six pack conformance checks; `recognize:offline` re-derives the artifact byte-identically.
T-125 review: zero judge calls on this path so far — **S-127 owns the epic's only judge calls**.

### Canonical realization (the compile seam)
`src/recognition/compile.mjs` `compileProgram(program, pack)` → `{ workshopProgram }` —
deterministic lowering of building-program/v1 to **workshop-program/v1** (the T-126 contract):
elements (shell + idiom constructs from the T-124 registry), declarations (bands as y-slices
carrying exactly the assigned blocks, `mixed: true` where >1; openings; `symmetry: null` always).
**`budget: { rounds: 1 }` is hardcoded** in the compiled output (T-125 committed the draft;
revision budgeting was explicitly left to the workshop's consumer). `realizeProgram` +
`assertWorkshopProgram` live in `src/workshop/program.mjs`; conformance via
`runConformance({ occ, declarations }, pack)` (`src/pack/conformance.mjs`).

### Workshop revision (T-126) — machinery committed, only `fixture` ran
`benchmarks/sculpture/workshop.mjs` — impure runner. Subjects are a **local frozen data table**
(`SUBJECTS`) with ONE entry: `fixture` (`program`/`concept`/`pack` paths, ROOT-relative).
Modes: live (preflightPins on ledger/digest/final under **domain "workshop"**, render 4 gate
azimuths @512², strong-tier `workshop-critique` exchange under `runReplyPolicy`, ONE action per
round, conformance cage with lexicographic score and rollback) / `--replay` (committed program +
ledger → byte-identical final, no model no GL, exit-coded) / `--offline` (`offlineAssert`).
Loop core `src/workshop/loop.mjs`: `budget = program.budget?.rounds ?? LOOP_DEFAULTS.rounds`;
termination structural; ledger carries critique/action/conformance-both-sides/renders/raw
replies/askCount per round. Evidence frames auto-copied to
`pr/assets/frames/workshop-<subject>-{before,after}.png`. Round renders are gitignored
(`.gitignore: benchmarks/sculpture/workshop/**/*.png`).

**Judge isolation (the T-126 receipt)**: `src/workshop/isolation.test.mjs` — precise-token source
scan (the judge's six seam names + the gate-record namespace) over every `src/workshop/` module
AND `benchmarks/sculpture/workshop.mjs`; plus `src/form/pin-guard.mjs`
`GATE_RECORD_NAMESPACES = ["benchmarks/sculpture/multi-angle/"]` — a workshop-domain write there
throws regardless of `--rotate-pins` or sanction (group-F tests).

### The frozen gate (the epic's only judge calls)
`benchmarks/sculpture/multi-angle-gate.mjs` (`gate:multi -- --subject <key> [--label L]
[--artifact REL] [--reference REL] [--offline|--rejudge] [--rotate-pins]`).
- Subject registry = durable-skin `SUBJECTS` (+ synthetic-hut). Needs per subject: `concept`,
  `map`, `glb`, `build` (default reference), `kitRecord`, `policy` (fallback prior). Cottage and
  barn both have full rows (barn kit `kit/barn.json`, zone map `zone-map/barn.json`).
- `--artifact` and `--reference` are paths **relative to `benchmarks/sculpture/`**; the judged
  contract (4 azimuths 45/135/225/315 @30°, 512², gapBudget 2, coverage threshold) is CONFIG —
  no flag changes it.
- Per view: T-088 coverage precondition on own materials (zones derived live from concept +
  material map, value-true substitution mapped into the artifact's SHIPPED palette via
  `allowedPalette` guard, kit overrides composed by `composeVocabulary`) → judge triptych
  (concept | GLB silhouette | render) through `runReplyPolicy`, pinned `PHASE1_MODEL_ID`
  (claude-opus-4-8), full `replies[]` ledger on the view. Coverage fail = judge never called.
- Kit presence (T-100) companion: needs kitRecord + concept-derived bands + a `--reference`
  build for aperture extraction; ANDs with resemblance via `composeKitAwareVerdict`.
- Output: `multi-angle/<key>-<label>.{json,md}` (pin-guarded records) + the contact sheet →
  `pr/assets/frames/multi-angle-<key>-<label>.png`. Exit 0 pass / 1 fail / 2 refusal.
- `--rejudge` (T-114): completes unparsed views ONLY, instrument-diff must be `[]`
  (`record.rejudge.instrumentDiff`), the sanctioned in-place write. The receipts the ticket
  names (`diffs: []`) are this field; a fresh record without re-judging has no `rejudge` block.
- T-119: a live gate run on an EXISTING record path needs `--rotate-pins`; a new label's first
  write is free (untracked → no rotation, nothing retired).

## The baselines to beat (T-122's committed records, verified just now)

- `multi-angle/cottage-generated.json`: aggregate FAIL, **gaps 10/2**, same-object **2/4**
  (+x+z, +x-z same-object with minors; −x−z, −x+z drifted — majors: roof near slope form,
  shingle coverage, apex/ridge, offset gapped slabs). Kit presence PASS.
- `multi-angle/barn-generated.json`: aggregate FAIL, **gaps 12/2**, same-object **0/4** — every
  view drifted; majors are roof form / shingle coverage on all four (the T-121-deferred barn-kit
  recognition residual), minors palette/material-zoning.
- Artifacts judged: `generated/<key>/artifact.json` (the E-29 generate-first chain, T-122 ridge
  closure applied). These are the "project-best profiles" of the metrology path.

## Precedents that bind this ticket's shape

- **Chain runner**: `generated-milestone.mjs` is the model — stage track, honest
  `pipeline-failed` records, self-grep generalization embedded in the record, deterministic
  chain run twice + byte-compared, `--repro` (fresh-process re-proof, no GL no judge),
  `--offline` (re-assert committed record), `--skip-gate`, and it SPAWNS the gate via its own
  CLI with `--label generated --reference <raw base>`.
- **But the workshop is different**: T-126's isolation means anything composing the workshop
  must not also reach the judge. The gate run must be convened "from outside the workshop"
  (T-126 header: "S-127 convenes the judge once, from outside the workshop").
- **Pin discipline (T-119)**: `preflightPins` BEFORE any spend in every metered runner;
  `guardedWriteRecord` for every committed record; workshop writes carry `domain: "workshop"`.
- **Reply policy (T-114)**: malformed ≠ verdict; bounded same-prompt re-asks; `gate:rejudge`
  completes committed records only.
- **npm flag swallowing**: `npm run X -- --flag` or direct `node` (a dropped flag once
  live-swept pins).

## Constraints and open facts relevant to design

1. **Workshop budget for real subjects is undeclared.** Compile hardcodes rounds 1; fixture
   declared 6. Whoever commits `workshop/<key>/program.json` decides the declared budget.
2. **T-126 open concern #1 (static band declarations)** predicts cage rollbacks of legitimate
   stylistic upgrades (stair roof courses, timber studs) on real subjects — S-127 was told it
   would hit this. No declaration-co-edit action exists. Honest recording is the AC's posture.
3. **Gate coverage/kit-presence vs the pack vocabulary**: the gate derives zones from the
   CONCEPT (cottage kit has verified overrides; barn kit shipped no overrides). The
   pattern-book build's palette comes from rustic-pack roles via the model's program. Whether
   pack dominants meet the concept-derived zone dominants per view is empirical; a mismatch
   fails coverage (judge not called on that view) or presence — both are first-class findings
   under the AC ("missed with named causes").
4. **`re-recognize` applier is still unwired** (T-125 deferred it; the model reached for it in
   the fixture run round 4 → recorded `action-unavailable`).
5. **Concept paths**: durable-skin `concept` is HERE-relative (`runs/...`); workshop `SUBJECTS`
   uses ROOT-relative paths. `runs/` PNGs exist on disk and gate/recognize treat them as
   immutable references (existsSync-checked).
6. **Records that exist on these paths today**: `workshop/fixture*` only — cottage/barn
   workshop program/ledger/final and `multi-angle/<key>-patternbook.*` would all be FIRST
   writes (untracked, no rotation needed).
7. **`docs/knowledge/design-learnings.md`** ends with the E-30 section (line ~2518); E-31
   section is appended there per the AC. `pr/assets/` holds curated mds + `frames/` (sheets
   auto-land there from the gate and workshop runners).
8. **Tests**: suite currently 1818/1818 green (`npm test` = artifact self-test + unit glob
   `src/**/*.test.mjs`). Runners are conventionally untested (impure); pure pieces carry tests.

## Files inventoried

- `benchmarks/sculpture/recognize.mjs` (258), `workshop.mjs` (230), `multi-angle-gate.mjs`
  (729), `generated-milestone.mjs` (621), `form-sketch.mjs` (143).
- `src/recognition/{program,prompt,compile}.mjs` (+31 tests), `src/workshop/{program,actions,
  critique,loop,replay}.mjs` + `isolation.test.mjs` (+~50 tests), `src/form/pin-guard.mjs`,
  `src/form/judge-reply.mjs`, `src/form/multi-angle-gate.mjs` (pure gate parts),
  `src/pack/conformance.mjs`, `src/model-tier.mjs` (`workshop-critique → strong`).
- Committed data: `recognition/{cottage,barn}.*`, `form-sketch/{cottage,barn}*`,
  `multi-angle/{cottage,barn}-generated.*`, `generated/{cottage,barn}/artifact.json`,
  `kit/{cottage,barn}.json`, `packs/rustic.json`.
