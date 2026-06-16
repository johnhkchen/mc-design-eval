# T-170-01 Research — emit-typed-kind-from-layer-a

Epic **E-41** / Story **S-170**. Make Layer A (`DiagnoseBuild`) emit the typed `kind ∈ {add,
replace, remove}` discriminator on `CritiqueItem`, so the style-distance term in the scoring core
reads the judge's tag instead of inferring grammar from triple-emptiness. The scoring core already
reads `kind`; this ticket lands the emission + a deliberate prompt-golden re-pin.

This is descriptive. What exists, where, how it connects, what constrains the change.

## The contract carrier — `baml_src/department.baml`

- `class CritiqueItem` (lines ~28-33) carries `department Department`, `expected`, `present`,
  `missing` (all strings with `@description`), `severity "minor" | "major"`. **No `kind` yet.**
- `function DiagnoseBuild(...) -> Critique` (lines ~50-90) is the Layer A diagnostic judge. Its
  prompt instructs: *"For each CONSTRUCTION DEPARTMENT that diverges, state one item: ... expected
  ... present ... missing ... Tag each item with the department that owns it ..."*. Then
  `{{ ctx.output_format }}` dumps the schema, then the concept + render images.
- The file header encodes hard rules: **E-39 hard rule 1** (creation-loop contract, NOT the frozen
  judge — no gate vocabulary, no verdict aggregation); **E-39 hard rule 2 / single composition
  point** (`enum Department` MIRRORS `src/pack/departments.mjs`, pinned by `departments.test.mjs`
  DPT3). The header also records the **S-163 decision**: the expected/present/missing triple IS an
  element vocabulary — *missing→add, present-but-wrong→replace, absent→remove*. `kind` makes that
  comment **explicit and judged**; it is not a new axis.
- `transport-guard.test.mjs` (TG) scans `department.baml` (line 95 list includes it) — it forbids
  gate/verdict vocabulary leaking into the creation-loop BAML. `kind`/add/replace/remove are
  element-grammar words, not gate words, so the guard does not bite (verify after edit).

## The scoring core — `src/workshop/bakeoff-score.mjs` (ALREADY forward-compatible)

- `itemStyleClass(item)` (lines 61-71) **already short-circuits on `kind`**:
  `replace → "wrong-style"`, `add → "absent"`, `remove → "match"`, BEFORE the structural fallback
  (present+missing non-empty → wrong-style; present empty → absent; else match). **No change needed
  here** — landing `kind` in the data is sufficient.
- `styleFidelityScore` (152-167): a `"wrong-style"` item forces `PENALTY.major + WRONG_STYLE.distance`
  and CAPS at `WRONG_STYLE.cap (40)`. So the moment a BO11-shaped item is tagged `add`, it stops
  capping. `critiqueEvidence` reports `nWrongStyle` / `wrongStyleCapped`.
- Tests `bakeoff-score.test.mjs`: **BO8** already asserts the typed short-circuit
  (`itemStyleClass({kind:"replace"|"add"|"remove", ...})`); **BO11** pins the F1 over-penalty
  (untagged `present="plain plaster", missing="timber studs"` → wrong-style) AND that
  `{...detailIncomplete, kind:"add"}` → `"absent"`. These already encode the target behaviour and
  must stay green untouched.

## The Layer-A serializer — `src/workshop/diagnose.mjs`

- `diagnoseRenderArgs({program, pack, azimuths, maxItems})` builds the string params the BAML
  template renders around (style, image_list, program_block, palette_block, style_profile,
  departments, max_items). It does NOT shape items — `kind` is judged at reply time, not serialized
  in. So **diagnose.mjs needs no change**. Its tests assert per-style `expected` divergence only.

## The fixtures (where the re-pin lands)

Two fixture families exercise `DiagnoseBuild`; both are driven by `src/baml/bridge.mts` (render +
`b.parse`, never transport), one batch spawn per test file.

1. **`src/baml/fixtures/diagnose/`** — `inputs.json` (barn grounding string args),
   `prompt.golden.txt` (the **byte-pinned rendered prompt**), `reply.txt` (canonical raw reply),
   `expected.json` (the minted parse, 3 items ROOF/WALL/OPENING). Pinned by
   `fixtures.test.mjs`:
   - **FX-DB1** (render): `R[15].prompt === read(diagnose/prompt.golden.txt)` byte-for-byte, plus
     `assert.match` checks for `THE RECOGNIZED PROGRAM`, `roof.gable`, the department list, the
     construction-grammar block. Render images = concept + 4 azimuth = 5.
   - **FX-DB2** (parse): `dropNulls(R[16].parsed) === diagnose/expected.json`; every item has a
     valid department and non-vacuous expected/present/missing.
2. **`src/baml/fixtures/critique-contract/`** — `reply.txt`, `expected.json` (3 items),
   `reply-bad-department.txt`. Pinned by `critique-contract.test.mjs`:
   - **CC1** (accept): `dropNulls(R[0].parsed) === expected.json`; departments parse to
     `[ROOF, WALL, OPENING]`.
   - **CC2** (enum leniency): the `BASEMENT` item is DROPPED → `{items:[]}` (SAP filters unknown
     enum, does not gate). The bad item also lacks `kind` — both reasons drop it; result unchanged.
   - **CC3** (prose): bare prose rejects (`ok:false`).

## How the golden is (re)generated

There is **no dedicated diagnose mint script** (`scripts/mint-baml-fixture.mjs` only handles
`vernacular`/`decompose`, and minting requires a live spend). But FX-DB1 compares against a pure
**render** (`bamlRender({fn:"DiagnoseBuild", args: inputs.json})`) — no model call. So the golden
can be regenerated deterministically by rendering through the bridge after `npm run baml:gen` and
writing the output to `prompt.golden.txt`. The render output changes in exactly two places when
`kind` lands: (a) the new prompt tagging line, and (b) the `{{ ctx.output_format }}` schema dump
(which now lists `kind`).

## Constraints / assumptions (anti-hedge framing)

- `npm run pretest` runs `baml:gen` (`baml-cli generate --from baml_src`) — the BAML client is
  regenerated before every test run, so editing the `.baml` is picked up automatically.
- **Re-pin in THIS ticket only** (recognition-prompt-embeds-program-schema discipline): the
  `DiagnoseBuild` golden is owned by the E-39 Layer-A contract; T-170-01 IS the owning ticket for
  this prompt change. Do NOT touch the recognition/critique/route/vernacular goldens.
- **Falsifiable failure modes to watch:** (1) if the SAP can't reliably carry a required union
  field, or if adding `kind` perturbs unrelated parse fixtures (CC2's empty-list, FX-DB2 vacuity
  guard), the change leaked scope — report, don't paper over. (2) The fixtures are author-chosen
  canonical replies; the real "can the judge separate replace from add" question is a LIVE run —
  that is **T-170-02**, explicitly out of scope here. This ticket proves the *plumbing* (schema +
  prompt + golden + a tagged fixture), not the live separability.
- Frozen instrument + transport-guard must stay untouched (AC bullet 4).
