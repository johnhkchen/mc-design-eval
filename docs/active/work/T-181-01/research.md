# T-181-01 — Research

Implement the T-180-01 locus fix (E-45 / S-181). T-180-01's `AUDIT.md` decided **BOTH loci active**:
WALL is an R mis-read (judge tags `replace` on faithful stone), OPENING/ROOF are S (the binary cap floors
an otherwise-faithful build, anchored by the legit dark-oak roof). This maps the code we must touch and the
pins/contracts that constrain the change. Descriptive only — no solution here.

## The S locus — creation-loop scoring (`src/workshop/bakeoff-score.mjs`)

PURE arithmetic referee; runs under the `src/**/*.test.mjs` glob (no GL/IO/Date/random/model). Keyed on
`DEPARTMENTS` (5 members: ROOF, WALL, OPENING, CHIMNEY, ROOM — `src/pack/departments.mjs`).

- **`PENALTY`** = `{ major: 20, minor: 8 }` (frozen). One source; cited by tests + FINDINGS.
- **`WRONG_STYLE`** = `{ cap: 40, distance: 12 }` (frozen). The style-distance constants.
- **`itemStyleClass(item)`** → `"wrong-style" | "absent" | "match"`. Typed `kind` (`add`/`replace`/`remove`)
  short-circuits; else the structural triple read (present∧missing → wrong-style; ¬present → absent; else
  match). The R defect (faithful material tagged `replace`) lives UPstream of this — it forbids brittle
  string/keyword matching, so it can't tell "right material, missing detail" from "wrong material" without
  the concept. That conditioning belongs in the judge, not here.
- **`styleFidelityScore(critique)`** (lines 152-167) — the binding mechanism:
  ```
  for it in items:
    if wrong-style: penalty += PENALTY.major + WRONG_STYLE.distance   (forced 32, SEVERITY-BLIND)
                    wrongStyle += 1
    else:          penalty += PENALTY[severity] ?? minor
  score = clamp(100 - penalty, 0, 100)
  if wrongStyle > 0: score = min(score, WRONG_STYLE.cap)              (BINARY hard cap = 40)
  ```
  Two defects per the AUDIT: (a) **forced-32 per replace** is severity-blind and is the binding floor for a
  build with several replaces; (b) **the flat cap=40** compresses every ≥1-wrong-style build into [0,40],
  throwing away the breadth information that should rank faithful-except-one well above wrong-in-all.
- **`critiqueEvidence(critique)`** — reports `score`, `nWrongStyle`, `wrongStyleCapped` (= nWrongStyle>0).
  Consumed by the crater harness (`experiments/eval-alignment/corpus-referee.mjs`) and FINDINGS.
- Other exports (`regionToDepartment`, `worstDepartmentOf*`, `dispatchCorrectness`, `pairAgreement`,
  `kindReliability`) are E-39/E-40/E-41 evidence aggregators — out of scope; must stay green.

### The mechanism, reproduced (AUDIT lines 94-97)

Feeding the 6 matched votes' `kind`/`severity` into `styleFidelityScore` reproduces `[0,4,20,28,28,0]`
exactly. The binding floor is the **forced 32-per-replace**, cap=40 secondary. So the graded term must
soften the **per-replace forced major**, not only the cap.

## The R locus — Layer A judge (`baml_src/department.baml` → `DiagnoseBuild`)

The diagnostic judge. Prompt instructs: `add` = element absent, `replace` = present but WRONG style/material,
`remove` = present that the style doesn't want. **It has no concept-conditional rule**: a right-base-material
element with a missing within-style detail (faithful stone wall, missing cobble quoins) gets tagged `replace`
(the WALL 6/6 R mis-read). The serializer is `src/workshop/diagnose.mjs` (PURE render-args; programBlock +
styleProfileBlock ground the prompt). The prompt change, if made, is one concept-conditional sentence.

### The golden / pin system (constrains AC#3)

- **`src/baml/fixtures/diagnose/`** — `inputs.json` (barn grounding), `prompt.golden.txt` (rendered prompt),
  `reply.txt` (raw model reply), `expected.json` (parsed).
- **`src/baml/fixtures.test.mjs`**:
  - **FX-DB1** byte-compares the RENDERED `DiagnoseBuild` prompt (`R[15].prompt`, `mode:"render"`, **no model
    call** — Jinja render only, deterministic) against `prompt.golden.txt`. Changing the prompt template
    breaks FX-DB1; **re-pin = regenerate the golden via `bamlBatch([{fn:"DiagnoseBuild",mode:"render",...}])`
    and write the file** — free, local, no metered spend.
  - **FX-DB2** parses `reply.txt` → `expected.json` (independent of the prompt text; unaffected by an
    instruction-only prompt edit).
  - Render goes through `bamlBatch` (`src/baml/bridge.mjs`, one batch spawn). FX-DB1 passes in the current
    suite, so the bridge renders in this environment.
- **Critically:** DiagnoseBuild's golden is a LOCAL fixture file. Only **FX-R1 (recognition)** pins a prompt
  to a live record's `promptSha256` ([[recognition-prompt-embeds-program-schema]] is scoped to RECOGNITION,
  not DiagnoseBuild). So a DiagnoseBuild prompt edit re-pins one local golden — it does **not** drift any
  committed live record's sha, and [[pin-guard-is-structural]] (git-tracked status) does not block a
  same-ticket fixture update.

## Existing test pins that constrain the change (`bakeoff-score.test.mjs`)

- **BO4/BO5** — penalty sum, clamp, empty=100; `critiqueEvidence` field-by-field (no whole-object deepEqual).
- **BO7** — `assert.deepEqual(WRONG_STYLE, { cap: 40, distance: 12 })`. **Adding a key to WRONG_STYLE breaks
  this** → reuse the two existing constants, don't add a third (or BO7 must change deliberately).
- **BO9** — the headline: 3 absent-majors (matched=40) vs 3 wrong-style-majors (ROOF/WALL/OPENING). Asserts
  `mNew==40`, `wNew==4`, `wNew<=cap`, spread≥30. Any new math must keep these numbers.
- **BO10** — incomplete-but-right-style (absent) docked only for severity, never capped (=72).
- **BO11** — F1 boundary: present-but-detail-incomplete classed `wrong-style` (pinned; the typed-tag fix).
- **BO13** — `kindReliability` (uses `itemStyleClass`) — unchanged.

## Predecessor decision (T-180-01 `AUDIT.md`) — the spec we implement

- R/S split ≈ **6/10**: WALL 6R, OPENING-gable 6S, OPENING-slit 1S, ROOF 3S. BOTH loci.
- **R required**: WALL (6/6) is faithful stone tagged `replace`; concept-conditional → `add` (recoverable).
- **S required**: the dark-oak roof is genuinely brown vs grey concept — a *correct* `replace` that STILL
  floors the build under the binary cap. Concept-conditioning alone can't lift matched while the cap is
  binary. The anchor: any term that can't rank "faithful + one legit off element" above "wrong-in-all" is
  mis-calibrated.

## Constraints & assumptions

- **Frozen instrument untouched** — nothing under `measurements/`. `npm test` green.
- **Recommend-not-freeze** — no pin rotation; same-ticket fixture re-pin only.
- **Principled over tuned** — a term that only separates *this* fixture is the over-fit failure mode; report
  any constant + sensitivity. Breadth is sanctioned as DEPARTMENTS ("more wrong-style departments ⇒ lower").
- **R efficacy is not unit-provable** — whether the judge actually stops tagging faithful stone `replace` is
  a live question (S-182). Unit tests can only prove the SCORING mechanism (S) and that the prompt carries a
  concept-conditional rule (R, contract level).
- **Assumption**: items carry a `department` (CritiqueItem does) for breadth counting; undefined falls back
  to a per-item key (conservative — counts as breadth).
</content>
</invoke>
