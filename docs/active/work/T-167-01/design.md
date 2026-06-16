# T-167-01 Design — Corpus shape, labels, and loader

Decisions, grounded in Research. Lead with how the falsifiable claim fails.

## Falsifiable claim (restated, with the failure modes I will report)

> A single rater can label these states reliably enough to be ground truth: an unambiguous worst
> department on most states, and a consistent pairwise "more faithful to its concept" on the wrong-style
> pairs.

**Fails if** (and I will report it honestly): (a) I cannot reliably pick the more-faithful build on the
wrong-style pairs → style fidelity isn't a stable human signal, which wobbles E-40's premise; or (b)
most states lack a single unambiguous worst department → the dispatch metric needs multi-label.

What I found while labeling (reported, not buried): on the cross-style pairs the more-faithful pick is
**not close** — a rustic stone gatehouse against a polychrome Babylonian triumphal arch is an obvious
call (high confidence). So (a) does **not** fail for *cross-style* distance. The genuine wobble lives
at *sub-threshold same-style* tint (cottage cream→pink, E-38's flat blind-rank) — which I therefore
**exclude** rather than launder into a fake `moreFaithful`. For (b): most single states have a clean
worst department, but **massing/proportion has no department at all** (S-163), so massing-worst states
are flagged/excluded, not force-fit — that is the multi-label signal the claim asks me to report.

## Decision 1 — Two state kinds in one corpus, not two files

**Chosen:** one `defect-corpus.json` with a `kind` discriminator (`"single"` | `"pair"`).
- `single`: `{worstDepartment ∈ DEPARTMENTS, confidence}` — feeds `dispatchCorrectness.ground` (S-169)
  and gives S-168 negative controls (a roof/wall defect is missing-element, not present-but-wrong-style).
- `pair`: `{matchedConcept, wrongStyleConcept, moreFaithful, confidence}` — feeds S-168's style-distance
  validation (present-but-wrong-style should cap the score) and S-169's crater re-run.

**Rejected:** separate `single-states.json` + `pairs.json`. More files, two loaders, two schemas, and
the consumers (S-168/S-169) want one self-describing asset. A discriminated union in one array is the
least surface area.

## Decision 2 — `worstDepartment` keyed on `DEPARTMENTS`, massing is off-contract

`worstDepartment` must validate against `DEPARTMENTS` imported from `src/pack/departments.mjs` (single
composition point, exactly like `bakeoff-score.mjs`). Massing/proportion is **not** a department; a
state whose worst defect is massing gets **no** single-state entry — it goes to `excluded` with reason
`"massing-worst: off-contract axis (S-163), no single department"`. This keeps the dispatch metric
honest and surfaces the multi-label question instead of hiding it behind a defaulted WALL.

**Rejected:** adding a synthetic `"MASSING"` department to the corpus. That would diverge from
`DEPARTMENTS` and break the single-composition-point rule the whole E-39/E-40 line depends on.

## Decision 3 — Wrong-style pairs sit on CLEAN builds (not gated on the roof)

Pairs use `builds/gatehouse/new-roof` and `builds/cottage/new-roof` — both have a present, reading roof.
The pair varies only the *concept* (matched vs wrong-style), mirroring `clean-wrong-style.mjs`'s A-vs-B
design. So a low style-fidelity score on the wrong-style concept cannot be blamed on a missing roof; it
must come from style distance. This satisfies the AC's "not gated on the roof".

Two wrong-style concepts per clean build (`arc-A` classical + `chapelle-A` gothic), echoing
`clean-wrong-style.mjs`'s B/B2 triangulation: arc-A carries a polychrome-palette confound; chapelle
triangulates it. This is principled triangulation, **not** padding.

**Rejected:** reusing the *defective* gatehouse from the E-38 wrong-style-probe. That was the confound
the whole E-39 line named (a broken build scored against same-style concepts). Clean builds only.

## Decision 4 — Validation via `ajv` JSON Schema + light semantic checks (repo idiom)

Follow `style-pack.mjs`: a committed `schema/defect-corpus.schema.json`, Ajv2020 strict + addFormats,
memoized validator, non-throwing `parseDefectCorpus` + fail-fast `loadDefectCorpus`, `formatErrors`
reused from `artifact.mjs`. On top of JSON Schema (which can't express it), semantic checks in code:
- `single.worstDepartment ∈ DEPARTMENTS`;
- unique `id`s; `kind`-appropriate label fields present;
- `moreFaithful ∈ {"matched","wrongStyle"}`;
- every referenced path (`concept`/`renderDir`/`matchedConcept`/`wrongStyleConcept`) **exists on disk**
  — caught in the test so a moved asset fails `npm test` (the assets are committed, so this is stable).

**Rejected:** a hand-rolled validator. The repo has one validation idiom; matching it keeps reviewers
fluent and reuses `formatErrors`.

## Decision 5 — Where the files live

- Corpus data: `experiments/eval-alignment/corpus/defect-corpus.json` (the AC's suggested path; it is
  eval-alignment infrastructure, beside the harnesses that consume it).
- Schema: `schema/defect-corpus.schema.json` (with the other contracts).
- Loader: `src/workshop/defect-corpus.mjs` (beside `bakeoff-score.mjs`, the referee's pure core that
  S-168 extends) + `src/workshop/defect-corpus.test.mjs` (runs under `test:unit`).

**Rejected:** loader under `experiments/`. `experiments/` is not on the `src/**/*.test.mjs` glob, so its
test wouldn't run in `npm test` (an AC). `src/workshop/` is the home of the bake-off referee and is the
natural import site for S-168.

## Final corpus composition (8 states, ≥8 met; exclusions logged)

Single (4): `barn-roofless`→ROOF/high; `barn-holey-walls`→WALL/medium; `cottage-plain-upper`→WALL/medium
(secondary CHIMNEY noted in `note`, confidence medium not high — honest); `gatehouse-gaping-gate`→
OPENING/medium.

Pairs (4): `gatehouse-vs-arc`, `gatehouse-vs-chapelle`, `cottage-vs-arc`, `cottage-vs-chapelle` — all
`moreFaithful:"matched"`, high confidence.

Excluded (logged): `barn-round-3`, `barn-final` (duplicate frames of roofless); `cottage-round-1`
(chaotic, no single worst dept); `cottage-cream-vs-pink` (sub-threshold tint, ambiguous moreFaithful —
the E-38 wobble); `*/autonomy`, `barn--saltcrag` (no renders).

Axis coverage: roof ✓, structural integrity ✓, surface relief ✓, opening ✓, palette/material + style →
covered by the wrong-style pairs (a polychrome arch IS the wrong-palette/wrong-relief case). Gap, stated:
massing/proportion has no clean single-department state (off-contract) — represented only as exclusions.
