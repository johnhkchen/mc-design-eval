# T-101-01 styled-milestone — Design

Goal restated: one named `npm run` per subject takes committed concept inputs to a **styled, gated
build** in the E-26 chain order — kit (committed record) → zones → grammar → fill → dressing →
integrity/coherence → kit-aware check + multi-angle gate — reproducibly, with honest failure, zero
subject-specific code. Cottage must pass both gates; gatehouse + church run the same untuned path.

## Decision 1 — a new terminal runner, `benchmarks/sculpture/styled-milestone.mjs`

**Chosen.** A sibling of `challenge-milestone.mjs` (the E-25 terminal precedent), with the chain
extended by two stages:

```
[provision (data-gated)] → shell integrity (T-091) → buildSkin (T-086→T-096→seal→T-092→T-090→splat→T-087→T-088)
  → GRAMMAR (T-098, in-process)  → DRESSING (T-099, in-process)
  → multi-angle gate + kit-presence (T-093 ∘ T-100, spawned via the gate's own CLI, label "styled")
```

Rejected alternatives:

- **Extend `challenge-milestone.mjs` with grammar/dressing stages.** Rejected: T-095 is a *done*,
  committed milestone — its records (`challenge/<subj>.json`) and semantics ("the E-25 chain") are
  frozen evidence. Mutating its chain would silently re-define what those records claim, and every
  re-run would overwrite E-25 artifacts with E-26 output.
- **Orchestrate by spawning the existing stage runners** (`skin:*` → `grammar:*` → `dress:*` →
  `gate:multi`). Rejected: each stage runner writes its *own committed proof records*
  (`placement-grammar/<subj>.json`, `dress-openings/cottage.json`) — chaining them would overwrite
  prior tickets' evidence on every milestone run; and the chain would no longer be one deterministic
  double-run unit (each runner double-runs internally but byte-compares only its own slice).
- **Start the chain from the committed durable-skin artifact** (skip shell + skin re-run). Rejected:
  AC1 names full-shell fill and E-24/E-25 integrity as chain stages, and the E-25 precedent runs
  them; reading a committed intermediate would make the "end-to-end" claim a splice.

## Decision 2 — reuse the E-25 chain by export, not duplication

`challenge-milestone.mjs` gets one new export: **`runChain(def, paths)`** (already a self-contained
function: provision? → shellStage → buildSkin with `zoneMapRecord: null`, writing only the
base/shell artifacts to caller-supplied paths). The styled runner imports it and points it at
`styled/<subj>/…` paths. `provisionBase`/`shellStage`/`decodeTexture` stay internal.

Rejected: copying `shellStage` + `provisionBase` (~80 lines) into the new runner — memory
`parallel-roots-duplicate-shared-deps` is explicit that shared deps get one owner; and a future
T-091 fix would have to land twice. The precedent for cross-runner export already exists
(`durable-skin.mjs` exports `buildSkin` + `SUBJECTS`; `kit-presence.mjs` exports `PROOF_SCHEMA`).
Side-effect risk is nil: the module's `main()` is guarded by the `import.meta.url` check.

The D5-style note from E-25 carries over verbatim: the chain skins the **shell-repaired** build, so
the committed zone-map record's agreement assert does not apply (`zoneMapRecord: null`); derived
bands are recorded and diffed against the committed record as audit, not gate.

## Decision 3 — grammar runs in-process via an extracted, exported stage

`placement-grammar.mjs`'s `runGrammar` is disk-coupled (reads `durable-skin/<subj>.json` +
artifact). Refactor it into:

- **`grammarStage(build, { bands, roof, policy, substitution, kitRec, zoneOpts })`** — exported.
  Contains everything from geometry re-read through the gates: `structuralZones` → `zonesFromBands`
  → `placementGrammar` → the four THROW gates (frame binding exists, `frameRefilled === 0`,
  frame-in-preserve, binding-agrees-with-policy) → `applyPaint` → re-asserted T-088 coverage +
  T-090 band evidence (also THROW). Returns `{ grammar, final, coverage, gate, bands }`.
- `runGrammar(def)` becomes a thin wrapper: load the committed skin record + artifact + kit, call
  `grammarStage`. **Zero behavior change** — the T-098 committed records and `--offline` checks
  must remain valid as-is.

The styled runner feeds `grammarStage` from `buildSkin`'s return value, which carries exactly the
fields the disk record would supply: `policy = skin.policyS` (SHIPPED space), `bands/roof =
skin.zoneMap.bands/.roof` (must assert `source === "concept"`, same as the grammar runner),
`substitution = skin.substitution`, kit overrides composed the same way (`{...substitution,
...kitRec.overrides}` → `sub`). Rejected: re-deriving any of these in the styled runner (a second
renaming point is exactly the bug class memory `reference-grounds-craft-not-color` warns about).

## Decision 4 — dressing composes from pure cores inline

Four calls, the proven T-100 recipe (`kit-presence.mjs:141-148`): `apertures =
extractApertures(occupancy(def.build reference))` (the raw pre-seal build whose openings the
concept declared; for provisioned subjects this is the provisioned base — registry data either
way), `treatments = treatmentsFromKit(kitRec)`, `dress = dressOpenings(occupancy(grammarFinal),
apertures, treatments)`, `styled = applyDressing(grammarFinal, dress.placements)`. No refactor
needed; `unfulfilled` slots and conflicts are recorded, never silent. Gatehouse's kit ships no
opening treatments — the stage runs, places ~0, records the unfulfilled slots (named, untuned).

## Decision 5 — the gate is the existing CLI; its `overall` IS the AC2 verdict

Spawn `multi-angle-gate.mjs --subject <key> --label styled --artifact styled/<subj>/artifact.json`
(the challenge `spawnGate` idiom). Post-T-100 the gate already: computes kit presence
deterministically against the *given* artifact (kit verbatim, apertures from the reference build),
renders the 4 frozen azimuths, applies the per-view coverage precondition, judges, and composes
`overall = resemblance AND presence` into record + exit code. So "both gates pass" is read off one
committed record (`multi-angle/<subj>-styled.json`) — no re-implementation, no second gate path.
Rejected: running `kitPresence` again inside the styled runner (it would be a duplicate verdict
source that could disagree with the gate's; one verdict artifact per claim).

## Decision 6 — kit extraction enters the chain as its committed, pinned record

The named command **consumes** `kit/<subj>.json` read-only and records its sha256 (the E-26 Rule 2
idiom). Reproducibility statement for AC4: LLM-authored inputs (material map, kit) are one-time
committed records — the verbatim model reply is pinned at `kit/<subj>.raw.json` and `kit-extract
--offline` reproduces the kit record byte-identically; the deterministic stretch
(provision→shell→skin→grammar→dressing) runs twice in-process and must byte-match (shas recorded),
`--repro` re-proves from a fresh process, `--offline` re-asserts committed records; the judge is
the pinned model, single sample per view, verdicts committed in the gate record. Rejected: live
extraction inside the chain — an LLM call inside the deterministic stretch breaks the double-run
contract, and re-extraction would mutate what T-096 committed.

## Decision 7 — church runs the same untuned path and is allowed to fail, named

Current data: church `challenge` run died at the skin coverage gate (`band0 stone=0.332 < 0.5`),
*before* any styling stage. Its kit cannot exist yet: `kit-extract` requires a committed zone-map
record (`bandRefsFromZoneRecord`), `zone:map --subject church` would call `buildSkin` and throw at
the same coverage gate, so the missing kit is **blocked by the same upstream finding, not by
wiring**. Design: the styled church run is the full untuned chain; when a stage throws, the runner
writes `{status: "pipeline-failed", stage, error}` (E-25 Rule 6) and exits 1; the missing-kit
precondition is itself a *named* recorded condition (`kit record absent — blocked by: …`), checked
before the chain so the record says exactly why church can't be styled today. AC3's escape clause
("fails with named gaps — a valid finding") applies; review.md flags that epic-done needs explicit
reviewer acceptance for church (and for gatehouse if its gate verdict stays FAIL). Rejected:
church-specific fallback code or a synthetic church kit — both violate E-25 Rule 3 (the grep for
zero subject-specific code is an AC), and a kit consumed by nothing proves nothing.

## Decision 8 — records, evidence, scripts

- **Record**: `benchmarks/sculpture/styled/<subj>.{json,md}` (schema `styled-milestone/v1`) +
  `styled/<subj>/{base-,shell-,grammar-,}artifact.json` committed; structure mirrors the challenge
  record plus `grammar`, `dressing`, and the gate's `kitPresence`/`overall` distilled in.
- **Evidence** (AC2): the gate writes the contact sheet
  (`pr/assets/frames/multi-angle-<subj>-styled.png`). The styled runner adds 4-azimuth before/after
  sheets — **before = the committed kit-less build** (`durable-skin/<subj>/artifact.json`, the
  T-100 negative), after = the styled artifact — at `pr/assets/frames/styled-<subj>-{before,after}.png`
  (the `grammar-*` sheet precedent), plus a kit report `pr/assets/styled-<subj>-kit.md` generated
  from the committed kit record + the gate's presence verdict (pointers to canonical records, no
  new claims). GL stays evidence-only: render failure degrades to "frames unavailable", never a
  gate.
- **npm scripts**: `styled:cottage`, `styled:gatehouse`, `styled:church` → `node
  benchmarks/sculpture/styled-milestone.mjs --subject <k>`; flags `--offline`, `--repro` (challenge
  semantics).
- **Docs** (AC5): append `## Concept style kit (E-26) — …` to `docs/knowledge/design-learnings.md`
  in the established epic-section format: the five-whys (color-role contract vs block recognition),
  recognize-don't-match, the fixture path (CARD_ROWS state vocabulary; stairs lens gap), the
  kit-aware fixpoint gate, over-reach (shading-offset judgment call, species-fence derivation,
  own-vocabulary residue tolerance) and under-reach (door detection, church blocked upstream,
  roof-form resemblance gap), and the E-12 handoff.

## Known risk, stated up front

AC2's resemblance half is empirical: every committed multi-angle verdict judged *kit-less* skins
and FAILed on roof form at obliques (cottage challenge: 8 gaps). The styled build adds frame +
dressed openings — material identity, not roof form. If the styled cottage still fails the judge,
that is recorded honestly (Rule 6) and review.md says so plainly; nothing in this design weakens
the gate to manufacture a pass. The kit-aware half is expected to pass (T-100 proved the composed
build, 0 gaps). Memory `multi-angle-gate-findings` also notes the budget edge is flappy — the
single pinned sample is the instrument's named property, not something to smooth.

## Test strategy (sketch — Plan owns the detail)

No new pure logic is introduced: the runner is composition. The `grammarStage` extraction is
covered by (a) existing `placement-grammar.test.mjs` core tests (untouched), (b) `grammar:* --offline`
re-asserting the committed T-098 records still verify byte-identically after the refactor, and
(c) the styled chain's own double-run byte-compare. `npm test` stays GL/LLM-free and green.
