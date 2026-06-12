# Review — T-141-01 rustic-headroom (E-34 / S-141)

Handoff for the reviewer. The two E-33 proportion refusals were rustic **pack rows**, not bugs;
this ticket edits the rows (with the taste justification recorded), reviews the schema caps, and
proves the previously-refused aims now round-trip — without running a judge. Landed in one commit,
`e908d76`. `npm test` 2020/2020.

## What changed

### Pack data — `packs/rustic.json` (the only production change)
- `proportions.storeyHeight.max`: **4 → 5**.
- `proportions.pitchClasses`: **[1] → [1, 2]**.
- Two vernacular justifications folded into existing `provenance` free-text (the field is
  `additionalProperties:false`, so no new key) — **echoed here per AC1**:
  - **wealthClass** (the storey-column raise): *"The frame carries the household's ambition where
    stone cannot: a generous open hall storey runs tall (storey columns up to 5 blocks), the one
    proportion a timber-framed yeoman spends on."*
  - **roofingEconomy** (the class-2 pitch): *"The steeper pitch class (class 2, above 45°) is
    period-plausible too — a steep plank/shingle roof sheds the lowland's rain and snow and crowns
    the taller-walled hall, so the pack carries both the 45° and the steep class."*

### Schema caps — reviewed and **explicitly kept** (no `building-program.schema.json` edit) — AC2
- `storeyHeight` schema max **6** is already `> 5`, so the pack band `{3,5}` is the binding
  constraint; a `storeyHeight 6` aim is refused **by the pack, naming `[3, 5]`** while the schema
  admits it (proven by test G3f). The pack is *strictly* tighter — a refusal is legible as the pack
  row, not a hidden schema ceiling (the exact T-138-02 conflation this AC targets).
- `storeys` schema max **4** kept: the wall-raise is a taller-column move, not a floor-count move; a
  5-floor cottage is not vernacular. The target eave is reachable via `storeyHeight ≤ 5 × storeys ≤ 4`.
- `pitchClass` has no schema upper cap, so `pitchClasses` already binds. Kept.

### Lever tests — `src/workshop/geometry.test.mjs` (AC3, proof at the lever)
- **G3c** rewritten — rustic `pitchClass:2` now **lands**, re-aiming to `roof.gable.steep` and
  realizing (the barn's class-1 ceiling unblocked, on rustic's own vocabulary).
- **G3e** new — the cottage wall-raise: `eaveHeight:10` factorizes to `storeys 2 × storeyHeight 5`,
  shell rises to 10, realizes — the move the band `{3,4}` refused in 5/6 E-33 rounds.
- **G3f** new — honest refusal: `storeyHeight:6` throws naming the pack band `[3, 5]`.
- **G3** updated — `pitchClass:3` still refused, message `[1, 2]`. **G3b/G3d** untouched (saltcrag
  regression guard — the precedent still holds).

### Test + comment maintenance
- `program.test.mjs` — off-pitch case `2→3`; storeyHeight-band case `5→6` (both follow the band).
- `compile.test.mjs:150` — stale "rustic declares [1]" comment corrected.

### Regenerated deterministic fixtures (NOT judge verdicts)
The recognition prompt (`prompt.mjs:73-74`) and pack summary (`backlog.mjs`) embed the proportion
rows verbatim, so six derived snapshots drifted. All regenerated via the production functions,
minimal diffs:
- `benchmarks/sculpture/recognition/{cottage,barn}.replies.json` — `promptSha256` only.
- `src/baml/fixtures/decompose/{inputs.json,prompt.txt,ledger.json}` — one Proportions line + its sha.
- `packs/drafts/rustic-rederived/comparison.json` — the proportions block (README byte-identical).
- `measured-program.test.mjs` MP7 / `prompt.test.mjs` / `critique.test.mjs` — band/literal updates.

## Test coverage
- **AC3 round-trips fully covered at the lever**: accepted aims (G3c class-2 via steep door, G3e
  wall-raise via eaveHeight→storeyHeight 5) and honest refusals (G3f storeyHeight 6 names the pack
  band, G3 pitchClass 3 names the pitch vocabulary). Saltcrag G3b/G3d guard no-regress.
- **AC2 binding-constraint** proven by G3f (pack refuses a schema-legal value) and program.test:142.
- **AC4**: `pack:validate` green (schema + value-consistent); `npm test` **2020/2020**; design.md
  records the rejected envelope choices (max-6, raise-storeys, add-0.5, dedicated provenance field,
  idiom-row edit, touch-saltcrag).
- No new gap: every assertion is a pure unit test over the levers/gates; no GL, no model, no IO.

## Open concerns / handoff
1. **The cottage may still FAIL its proportion target** after this unblock. That is **expected and
   out of scope** — AC3 proves the aim *round-trips*, not that the ratio closes. **T-143 owns the
   re-verdict** (re-running the chain + judge with the widened pack). I deliberately ran no judge,
   no chain, and rotated no pins; `proportion-baselines.json`, the patternbook gate records, and the
   proportion-milestone are untouched.
2. **Blast radius of a pack edit.** Six deterministic derivations drifted from two data lines —
   the proportion rows are embedded in prompts/summaries/comparisons far from the pack. Reviewers of
   future pack edits should expect (and budget for) regenerating these snapshots; they are *not*
   verdicts but they do gate `npm test`. A `scripts/regen-pack-fixtures.mjs` would make this
   one-command instead of an ad-hoc script (suggested, not built — out of scope here).
3. **`storeyHeight 5` sufficiency is unverified by this ticket.** The pack now *admits* the taller
   column; whether the cottage's model picks it and whether it closes `roofShare 0.45→0.293` is a
   live-run question for T-143. The corrected E-33 residual says the move is needed; this ticket only
   removes the refusal that blocked it.
4. **`pitchClasses` order `[1, 2]`.** Validation is set-membership (order-free); I kept `[0]==1` as
   the legacy default. If any downstream code treats `pitchClasses[0]` as "the" style pitch, it still
   sees class 1 — intended.

## AC ledger
- **AC1 headroom landed + recorded justification, saltcrag untouched, no per-building constants** —
  met (rows edited, two provenance lines echoed above, saltcrag byte-untouched, change is per-style
  pack data only).
- **AC2 schema caps reviewed alongside** — met (explicitly kept with reasoning; G3f proves the pack
  band is the binding, legible constraint).
- **AC3 proof at the lever, honest-refusal coverage, no judge/chain/pins** — met (G3c/G3e accept,
  G3f/G3 refuse; zero judge/chain/pin activity).
- **AC4 conformance + npm test green, design.md records rejected choices** — met (`pack:validate`
  green, 2020/2020, six rejected alternatives in design.md).
