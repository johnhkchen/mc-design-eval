# T-167-01 Review — Assemble and label the defect corpus

Handoff document. What changed, what's tested, what to watch.

## What changed

| file | status | what |
|---|---|---|
| `schema/defect-corpus.schema.json` | **new** | draft-2020-12 contract: `oneOf` discriminated on `kind` (single/pair), `additionalProperties:false`, `minItems:8`, `confidence`/`moreFaithful` enums. `worstDepartment` is a free string here on purpose. |
| `src/workshop/defect-corpus.mjs` | **new** | pure ajv loader following the `style-pack.mjs` idiom: memoized validator, non-throwing `parseDefectCorpus`, fail-fast `loadDefectCorpus`, IO-free `assertSemantics`, `singleStates`/`pairStates`/`statePaths`. |
| `experiments/eval-alignment/corpus/defect-corpus.json` | **new** | the data: 8 states + 6 logged exclusions + `rater` + `notes`. |
| `src/workshop/defect-corpus.test.mjs` | **new** | DC1–DC9. |
| `package.json` | **edit (+1 line)** | `corpus:check` no-spend reader. |
| `docs/active/work/T-167-01/*` | **new** | research / design / structure / plan / progress / review. |

No deletions. Single commit `0730b39` (files are mutually dependent).

## Acceptance criteria — status

- **[x] Versioned corpus JSON, ≥8–10 states, concept path + render dir + labels; wrong-style pairs carry
  `{matchedConcept, wrongStyleConcept, moreFaithful}`; `rater` field present.** 8 states (4 single + 4
  pairs); `schema:"eval-alignment/defect-corpus/v1"`; single-rater string with the no-aggregation
  limitation spelled out.
- **[x] Excluded candidates logged with a reason — no padding.** 6 exclusions: 2 duplicate barn frames,
  chaotic cottage round-1, sub-threshold cream/pink tint, render-less dirs, and the off-contract
  massing axis. Each with a `reason` (DC1 asserts every exclusion has one).
- **[x] Wrong-style pairs use clean fixtures — not gated on the roof.** Pairs sit on
  `builds/gatehouse/new-roof` and `builds/cottage/new-roof`, both with a present reading roof; only the
  *concept* varies (matched vs wrong-style), mirroring `clean-wrong-style.mjs`.
- **[x] Pure loader + schema check; `npm test` green; no model spend to read.** `node --test` glob picks
  up `defect-corpus.test.mjs`; full suite **2235** green (+9). `corpus:check` reads it with zero spend.

## Test coverage

DC1 load+shape (≥8 states, rater, exclusions w/ reasons) · DC2 every `worstDepartment` ∈ `DEPARTMENTS` ·
DC3 pair label completeness + valid `moreFaithful` · DC4 single/pair partition exact · DC5 id uniqueness
across states+excluded · DC6 **on-disk existence of every referenced concept/renderDir** (catches a
moved asset in CI) · DC7 non-throwing rejection of malformed input (too-few-states, bad JSON) · DC8
`assertSemantics` throws on a non-department `worstDepartment` · DC9 throws on duplicate id.

**Gaps in coverage (deliberate):** the *labels themselves* are human judgement and cannot be unit-tested
— the test gates structure and asset existence, not whether `ROOF` is the *right* call. That correctness
is the rater's responsibility and is documented per state in the `note` fields. Mitigated by labeling
from direct render inspection (recorded in progress.md), not from filenames.

## Findings on the S-167 falsifiable claim (the point of the ticket)

The claim: a single rater can label these reliably — unambiguous worst department on most states, and a
consistent pairwise more-faithful on the pairs.

- **Pairwise more-faithful held (high confidence).** A rustic stone gatehouse / Tudor cottage against a
  polychrome classical or gothic concept is an obvious pick. Cross-style fidelity **is** a stable human
  signal — so failure mode (a) did not trigger *for cross-style distance*. This is the green light E-40
  needs: the present-but-wrong-style signal it wants to score is real and label-able.
- **The genuine wobble is sub-threshold same-style tint**, not cross-style. cottage cream→pink (E-38's
  flat blind-rank) is genuinely ambiguous, so it is `excluded`, not laundered into a fake `moreFaithful`.
  Honest report rather than a manufactured label.
- **Massing/proportion has no department (S-163).** No clean single-department massing-worst state
  exists, so it is logged as `massing-proportion-axis` in `excluded`. This is failure mode (b)'s honest
  surfacing: if E-40 ever wants the dispatch metric to cover massing, it needs multi-label or an
  off-contract axis — not forced into WALL.

## Open concerns / for the human reviewer

1. **Confidence is `medium` on 3 of 4 single states.** `barn-holey-walls`, `cottage-plain-upper`,
   `gatehouse-gaping-gate` each have a defensible secondary department (the cottage notably also lacks a
   chimney). The "unambiguous worst department on *most* states" bar is met (4/4 have a clear primary),
   but S-168/S-169 should treat medium-confidence single states as softer ground truth than the
   high-confidence pairs.
2. **Single-rater.** This is one rater's labels by design (S-167 sanctioned it). If E-40's promotion
   recommendation (S-169) leans hard on the corpus, a second rater on at least the medium-confidence
   states would firm it up. Recorded as a limitation, not hidden.
3. **Count fixed at 8 via `minItems:8` + only 8 states.** Pruning any asset later would break the schema
   floor. Intentional (S-168/S-169 want a stable ≥8); documented in `notes`. If the corpus grows, raise
   states first, the floor second.
4. **Render coverage is thin upstream.** Only gatehouse/cottage/barn `new-roof` + barn rounds had usable
   4-azimuth renders; `autonomy`/`saltcrag` had none. A broader corpus (the AC's "≥8–10") would need
   more rendered builds — out of scope here, flagged for whoever extends it.
5. **Palette/material axis is covered only via the wrong-style pairs**, not a standalone single state (no
   clean supra-threshold palette-only defect build exists). Acceptable for E-40's purpose (wrong-style IS
   the wrong-palette case) but noted.

## Next ticket

T-168-01 (S-168) imports `singleStates`/`pairStates` from this loader to validate the new style-distance
severity term: pairs prove present-but-wrong-style should cap the score; single states are the
missing-element controls. No changes to this corpus should be needed for that work.
