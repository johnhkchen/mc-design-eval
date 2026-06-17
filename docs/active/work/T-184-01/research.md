# T-184-01 — Research

**Ticket:** build the pairwise labeling instrument over the S-183 hard-middle pairs, collect labels (human
gate; LLM-proxy fallback flagged non-licensing), and the agreement + decomposition harness that reports
term-vs-human agreement (overall AND hard-middle separately), inter-label agreement, and the
pack-effect-vs-concept-image-effect decomposition generalized from T-182's C-control. Output is evidence +
a GO/NO-GO recommendation for S-185 — **not** a promotion. Nothing under `measurements/`.

Descriptive only. What exists, where, and the seams S-184 plugs into.

## The substrate this ticket consumes (T-183-01, committed `3105b53`)

`experiments/eval-alignment/corpus/style-corpus.json` — 12 states, 3 subjects, 2 packs. Each state is a
`(build, pack, concept)` triple with `cellType` ∈ {match, same-pack-wrong-picture, wrong-pack-right-picture,
cross, hard-middle} and `intendedFaithfulness` ∈ {high, middle, low}. **The decoupling is by construction:**
every state hands the scorer a pack file and a concept file as INDEPENDENT `diagnose()` arguments — recognition
is bypassed — so pack-effect and concept-image-effect are separable. This is the corpus generalization of the
referee's single-subject A/B/C-control.

The 12 states (from the manifest):

| id | subject | cellType | pack | concept | intended |
|---|---|---|---|---|---|
| gh-match | gatehouse | match | rustic | gatehouse | high |
| ct-match | cottage | match | rustic | cottage | high |
| bn-match | barn | match | rustic | barn | high |
| gh-samepack-classical | gatehouse | same-pack-wrong-picture | rustic | classical arc | low |
| gh-samepack-cottage | gatehouse | same-pack-wrong-picture | rustic | cottage | low |
| ct-samepack-gatehouse | cottage | same-pack-wrong-picture | rustic | gatehouse | low |
| gh-wrongpack | gatehouse | wrong-pack-right-picture | guildhall | gatehouse | high |
| ct-wrongpack | cottage | wrong-pack-right-picture | guildhall | cottage | high |
| bn-cross | barn | cross | rustic | cottage | low |
| gh-mid-material | gatehouse | hard-middle | rustic | gatehouse | middle |
| gh-mid-gate | gatehouse | hard-middle | rustic | gatehouse | middle |
| ct-mid-plain | cottage | hard-middle | rustic | cottage | middle |

`intendedFaithfulness` is a **single rater's** label (the corpus `rater` field says so explicitly) — NOT human
ground truth. S-184's human labels are the gate; the intended labels are only a sanity reference.

### The loader S-184 imports — `src/workshop/style-corpus.mjs`

Pure data + validation, **no** dependency on `bakeoff-score.mjs` (the scorer stays unaware of the corpus; the
harness joins them). Exports: `loadStyleCorpus()`, `byCellType(corpus, type)`, `cruxCells`, `hardMiddle`,
`matchedRows`, `statePaths(state)` → `[renderDir, pack, concept, beside]`, the frozen `CELL_TYPES` /
`CRUX_CELL_TYPES` / `FAITHFULNESS` constants, `REPO_ROOT`. `renderDir` (not `build`) is where the four
`view-{±x±z}.png` live. `beside` is the committed beside-concept composite per state.

## The term being validated — `src/workshop/bakeoff-score.mjs` (PURE, in `npm test`)

The recalibrated (E-45/T-181-01) style-distance term. Key exports the harness needs:
- `styleFidelityScore(critique)` → 0–100 scalar. Wrong-style items (`itemStyleClass` = "wrong-style") cost
  `PENALTY[severity] + WRONG_STYLE.distance`; the score is capped by `gradedCapFor(breadth)` =
  `max(40, 100 − 12·breadth)` where breadth = distinct wrong-style departments. `WRONG_STYLE = {cap:40,
  distance:12}`, `PENALTY = {major:20, minor:8}`.
- `itemStyleClass(item)` — typed `kind` ("replace"⇒wrong-style, "add"⇒absent, "remove"⇒match) wins; falls back
  to the structural present/missing triple.
- `critiqueEvidence(critique)` — score + `nWrongStyle`, `wrongStyleBreadth`, `gradedCap`, departments.
- `pairAgreement(rows)` — EXISTING, but for the defect-corpus shape (one build vs its matched-vs-wrong concept,
  bucketed by `confidence`). **Not** directly reusable: S-184's pairwise is BETWEEN two states (state A vs
  state B), not within-state matched-vs-wrong. The bucketing-by-difficulty idea transfers; the row shape does
  not. New pure functions are warranted.

## The scoring path — `diagnose()` (the referee's helper, `experiments/eval-alignment/corpus-referee.mjs`)

```
diagnose({program, pack, concept, renders}) =
  diagnoseRenderArgs({program, pack, azimuths}) → bamlRender(DiagnoseBuild)
  → runTieredOp(strong) → bamlParse → { ev, items, score: styleFidelityScore(critique) }
```
- `program` (`src/workshop/diagnose.mjs::programBlock`) is the recognized "what the build SHOULD read as" —
  **per-subject** (gatehouse vs cottage vs barn have different `masses`). The referee hard-codes ONE synthetic
  gatehouse `PROGRAM`. For a 3-subject corpus the program must match the subject or it injects false missing
  items. The corpus deliberately carries NO per-state program (review handoff #4) — the harness supplies a
  fixed per-subject program, held CONSTANT across that subject's pack/concept conditions (so pack and
  concept-image stay the only varied factors).
- `style` flows from `program.style ?? pack.style` (`diagnoseRenderArgs`) — today the pack id (rustic /
  guildhall) drives the style profile.
- `pack` → `styleProfileBlock` selects the expected roof/wall/opening grammar from the pack palette + idioms.
- `concept` + `renders` are the images. The R-fix (concept-conditional `DiagnoseBuild`) is in the live BAML
  prompt — matched builds now earn `add`/absent (recoverable) against their own concept rather than `replace`.

This is **metered** (model spend): one `diagnose()` = one DiagnoseBuild call. NOT in `npm test`.

## The decomposition precedent — T-182-01 C-control

The referee's `runCrater` scored ONE gatehouse build under 4 conditions and reported `spreads`:
- **A-matched** = rustic pack + rustic concept; **B** = guildhall pack + wrong concept;
  **C-control** = rustic pack + WRONG concept (isolates pack vs concept-image).
- **pack effect** = C − B (swap pack, hold wrong concept) = **+29**;
  **concept-image effect** = A − C (swap concept, hold rustic pack) = **−7**.
- Finding: the term's signal rode the **pack**, not the picture → PROMOTE-LEANING, gate on a population corpus.

S-184 generalizes this to a 2×2 (`pack ∈ {matched, foreign}` × `picture ∈ {right, wrong}`) across subjects.
Mapping cellType → design cell: match/wrong-pack-right-picture = picture-RIGHT; same-pack-wrong-picture/cross =
picture-WRONG; pack=rustic⇒matched, guildhall⇒foreign. Cells present: (matched,right)×3, (matched,wrong)×4,
(foreign,right)×2, (foreign,wrong)×0. So **conceptImageEffect = mean(matched,right) − mean(matched,wrong)**
and **packEffect = mean(matched,right) − mean(foreign,right)** — direct population analogues of A−C and (via
the held-right pair) the pack lever. Hard-middle states vary the BUILD, not pack/concept, so they are excluded
from the decomposition and used for the agreement test.

## Conventions to mirror

- **Pure scoring core** (`bakeoff-score.mjs`, `defect-corpus.mjs`): unit-tested, no GL/IO/model/Date/random,
  runs under `src/**/*.test.mjs`. The agreement + decomposition arithmetic belongs here (a new module), NOT in
  the metered harness shell.
- **Metered harness** (`corpus-referee.mjs`, `corpus-build.mjs`): asset-guard-before-spend, `GUARD_ONLY=1`,
  `VOTES` env (default keeps prior runs byte-identical), beside-PNG composites via local `composeTwo`
  (decodeImage, no GL), no re-ask on malformed (a zero-token notice reply only burns budget — memory
  `spend-limit-reply-failure-mode`), writes a results JSON + a console verdict. NOT in `npm test`.
- **No-flag-swallow** (`npm-run-flag-swallowing`): scripts read `process.argv`/env; a package script needs
  `--` or direct `node`.
- **PinGuard / freeze** (`pin-guard-is-structural`): `measurements/` is the frozen-instrument prefix; touching
  it is S-185, behind human sign-off. S-184 writes only to `experiments/` and `docs/active/work/`.

## Constraints & assumptions

- The human cannot be summoned inside an autonomous loop. S-184 must therefore (a) **prepare** the human
  instrument fully (pair composites + a fillable labels template) and (b) **run the LLM-proxy fallback** and
  flag it explicitly non-licensing (refute-only) — both, honestly. The AC permits exactly this.
- The proxy labeler must be **independent of the term** (a holistic "which build is more faithful to its
  concept" glance judge, not the DiagnoseBuild scorer) or the agreement is circular.
- One human rater ⇒ true inter-rater agreement is not computable from a human alone; the proxy panel's
  self-consistency stands in (reported as a labelability signal, flagged as not human inter-rater).
- The pair set must be SMALL (focused session, not all-pairs) and report the hard middle SEPARATELY — a term
  that only nails the obvious pairs is not validated.
- Renders are evidence, not a byte-gate (GL pixels aren't host-stable); the per-state score is the datum.
