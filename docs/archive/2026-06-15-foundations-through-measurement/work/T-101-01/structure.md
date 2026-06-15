# T-101-01 styled-milestone — Structure

## Files touched

| File | Action | What |
|---|---|---|
| `benchmarks/sculpture/challenge-milestone.mjs` | modify (1 word) | `export` the existing `runChain` |
| `benchmarks/sculpture/placement-grammar.mjs` | modify (refactor) | extract + export `grammarStage` and `renderSheet`; `runGrammar` becomes a thin disk wrapper |
| `benchmarks/sculpture/styled-milestone.mjs` | **create** (~420 lines) | the E-26 terminal runner |
| `package.json` | modify | `styled:cottage`, `styled:gatehouse`, `styled:church` scripts |
| `docs/knowledge/design-learnings.md` | modify (append) | `## Concept style kit (E-26) …` section + E-12 handoff |
| `benchmarks/sculpture/styled/<subj>.{json,md}` + `styled/<subj>/*artifact.json` | generated, committed | milestone records + chain artifacts |
| `pr/assets/frames/styled-<subj>-{before,after}.png`, `pr/assets/styled-<subj>-kit.md` | generated, committed | AC2 evidence (gate writes `pr/assets/frames/multi-angle-<subj>-styled.png` itself) |

No files deleted. No pure-core (`src/`) changes — the runner is composition only; if any new
decision logic appears during Implement, it moves to a pure module with tests (deviation to be
recorded in progress.md).

## Module boundaries & public interfaces

### `challenge-milestone.mjs` (modified)

```js
export async function runChain(def, paths)
// def: a durable-skin SUBJECTS entry (registry data)
// paths: { baseAbs, shellAbs, shellRel } — caller-owned locations (styled runner passes styled/<subj>/…)
// → { provision: stats|null, base: artifact, shell: {artifact, strip, openings, closureBefore, voids, plug}, skin: <buildSkin return> }
// Throws on any stage gate (provision inputs, closure, skin coverage/band) — caller maps to pipeline-failed.
```

Nothing else becomes public. `main()` already guarded by the `import.meta.url` check, so the import
is side-effect-free.

### `placement-grammar.mjs` (refactored)

```js
export function grammarStage(build, { bands, roof, policy, substitution, kitRec, zoneOpts })
// build: artifact to paint (geometry re-read here: artifactOccupancy → structuralZones(occ, zoneOpts ?? {}) → zonesFromBands)
// bands/roof: the concept-derived zone map (caller asserts source === "concept" before calling)
// policy: SHIPPED-space fill policy; substitution: value-true map (plain object)
// kitRec: committed kit/v1 record — sub composed HERE as {...substitution, ...kitRec.overrides} (the one renaming point)
// → { grammar, final, coverage, gate, bands, bandNames }
// THROW gates unchanged & in this order: no frame binding · frameRefilled !== 0 · frame-not-in-preserve
//   per band · binding-disagrees-with-policy · post-paint T-088 coverage · T-090 band evidence.

export async function renderSheet(artifact, label, outDir)
// 4 config gate azimuths → { renders: [{angle, path}], sheetPath } (unchanged body, moved up + exported)
```

`runGrammar(def)` keeps its exact signature/return (`{skinRec, build, grammar, final, coverage,
gate, bands, bandNames, policy}`) — it loads the committed skin record/artifact/kit, asserts
preconditions (records exist, `kit/v1`, `zoneMap.source === "concept"`), then delegates to
`grammarStage`. **Invariant: `grammar:cottage -- --offline` and `grammar:gatehouse -- --offline`
must still pass byte-identically after the refactor** (committed records untouched).

### `styled-milestone.mjs` (new)

Header comment: the E-26 terminal claim, chain order, determinism contract, honest failure,
generalization rule, usage lines — the challenge-milestone format.

```js
const RECORD_SCHEMA = "styled-milestone/v1";
const GATE_LABEL = "styled";
const OUT_DIR = benchmarks/sculpture/styled;
```

Internal functions (none exported):

- `styledChain(def, paths)` — the deterministic stretch:
  1. `const { provision, base, shell, skin } = await runChain(def, paths)` (writes base/shell
     artifacts to styled paths; `zoneMapRecord: null` handled inside runChain).
  2. Assert `skin.zoneMap.source === "concept"` (grammar binds to derived bands; THROW otherwise —
     same message as the grammar runner).
  3. `const g = grammarStage(skin.final, { bands: skin.zoneMap.bands, roof: skin.zoneMap.roof,
     policy: skin.policyS, substitution: skin.substitution, kitRec, zoneOpts: def.zoneOpts })`.
  4. Dressing (T-100 recipe): `apertures = extractApertures(artifactOccupancy(refBuild))` where
     `refBuild` = the chain's *raw input build* (provisioned base for `def.provision` subjects,
     else `def.build`) — THROW if empty; `treatments = treatmentsFromKit(kitRec)`;
     `dress = dressOpenings(artifactOccupancy(g.final), apertures, treatments)`;
     `styled = applyDressing(g.final, dress.placements)`; `assertArtifact(styled)`.
  5. Return `{ provision, base, shell, skin, grammar: g, dress, treatments, apertures, styled }`.
- `spawnGate(key, artifactRel)` — challenge idiom, label `styled`.
- `kitReportMd(def, kitRec, gateRec)` — renders `pr/assets/styled-<subj>-kit.md` from the committed
  kit entries + the gate's `kitPresence`/`overall` (pointers to canonical records; no new claims).
- `renderMd(record)` — the committed `styled/<subj>.md` (challenge `renderMd` shape + grammar +
  dressing + kit-presence sections; pipeline-failed variant included).

`main()` control flow:

1. Parse `--subject` (registry), `--offline`, `--repro`. Paths: `styled/<subj>/{base-,shell-,grammar-,}artifact.json`,
   `styled/<subj>/artifact.json` (the styled final), record `styled/<subj>.{json,md}`.
2. **Named precondition** (before any chain work, all modes except offline): `def.kitRecord` set and
   the file a `kit/v1` record. If absent → write `{schema, subject, status: "pipeline-failed",
   stage: "kit", error: "no committed kit record — kit extraction requires a committed zone-map
   record, blocked upstream (run kit:extract once the subject's chain passes its skin gates)"}` +
   md, exit 1. Data-driven (`def.kitRecord == null`), not a subject branch.
3. `--offline`: record exists; if `status === "pipeline-failed"` print stage + error, exit 1
   (challenge behavior). Else assert: schema; AJV on shell/grammar/styled artifacts; sha256 of
   shell/grammar/styled (+base when provisioned) vs `record.reproducible.sha256`; kit sha vs
   `record.inputs.kitSha256`; gate record present, schema-valid, label `styled`, decided XOR
   refusal; `record.gate.overall` consistent with gate record; sheet + frames + kit report exist.
   Exit 1 on any miss.
4. `--repro`: re-run `styledChain` fresh (no GL/judge), compare base/shell/skin-final/grammar-final/
   styled shas vs committed record. Judge not re-run (its pin is the committed gate record).
5. Live: `mkdir`s → run `styledChain` **twice**, byte-compare all five stage artifacts (base when
   provisioned, shell, skin final, grammar final, styled) — challenge Rule 5 idiom. Any throw →
   pipeline-failed record `{stage, error}` (stage inferred: kit/provision/shell/skin/grammar/
   dressing) + md, exit 1.
6. Write artifacts + shas. Console-narrate each stage (challenge format): provision?, shell strip/
   voids/plug/closure, skin zone-map/fill/salt/coverage, grammar bindings/frame counts/frameRefilled,
   dressing placements/conflicts/unfulfilled.
7. Evidence (try/catch, degrade to "frames unavailable"): `renderSheet(kitlessBuild, "before")` where
   `kitlessBuild = durable-skin/<subj>/artifact.json` **if it exists** (data-gated — church has
   none; recorded as `before: null (no committed kit-less build)`), `renderSheet(styled, "after")`;
   copy to `pr/assets/frames/styled-<subj>-{before,after}.png`.
8. `spawnGate` → read `multi-angle/<subj>-styled.json` → distill `{outcome, gapCount, gapBudget,
   perView, kitPresence, overall, record, sheet}` into the milestone record (challenge `gate`
   shape + the T-100 fields).
9. Write `kitReportMd` → `pr/assets/styled-<subj>-kit.md`.
10. Write record + md; `process.exitCode = gateCode` (0 PASS both · 1 FAIL either · 2 REFUSAL).

Record shape (`styled-milestone/v1`): challenge record fields (`inputs` incl. `kitSha256`,
`provision`, `shell`, `skin`, `reproducible.sha256.{base,shell,skinFinal,grammarFinal,styled}`,
`renders`, `frames`) plus `grammar` (T-098 record's `grammar` block distilled), `dressing`
(`{placements, perOpening, conflicts, unfulfilled, derivations}`), `gate` (incl. `kitPresence`,
`overall`), `pipelineOrder: "kit (committed) → shell → skin (zones·fill·coherence·gates) → grammar
→ dressing → kit-aware multi-angle gate"`.

### `package.json`

```json
"styled:cottage":   "node benchmarks/sculpture/styled-milestone.mjs --subject cottage",
"styled:gatehouse": "node benchmarks/sculpture/styled-milestone.mjs --subject gatehouse",
"styled:church":    "node benchmarks/sculpture/styled-milestone.mjs --subject church"
```

## Ordering (matters)

1. **Export `runChain`** — standalone, zero behavior change.
2. **`grammarStage`/`renderSheet` extraction** — then immediately verify `npm test` +
   `grammar:cottage -- --offline` + `grammar:gatehouse -- --offline` still pass (refactor proof).
3. **`styled-milestone.mjs` + npm scripts** — then the cottage live run (`styled:cottage`): the AC2
   subject, both gates. Commit records + evidence.
4. **Gatehouse + church live runs** — same untuned command; outcomes recorded as they land
   (gatehouse may FAIL resemblance; church expected pipeline-failed at kit/skin — both named).
5. **Reproducibility passes** — `--repro` + `--offline` for every subject that produced a record;
   `kit-extract --offline` re-cited for the extraction pin.
6. **`design-learnings.md` E-26 section** + E-12 handoff; final `npm test`.

Each numbered item is one atomic commit (6 commits, T-098/T-100 cadence).

## Dependencies & invariants

- Stage seams consume `buildSkin`'s return values, never re-derive (one renaming point lives in
  `grammarStage`; the styled runner contains no Lab/color/zone logic).
- Frozen contracts untouched: gate azimuths/judge/prompt, kit immutability, E-24 Rule 1 (every
  placement from a recorded op), E-25 Rule 3 (no subject keys/branches in the new runner — grep
  recorded in review.md).
- `npm test` never invokes GL/LLM; the new runner stays out of the suite.
