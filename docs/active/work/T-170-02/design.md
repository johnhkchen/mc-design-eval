# T-170-02 Design — rerun-crater-with-typed-kind

Epic **E-41** / Story **S-170**. Decisions for re-running the corpus referee with the `kind`-emitting
Layer A and reporting the three ACs honestly. Grounded in `research.md`.

## The three decisions

1. **How to capture & report `kind` reliability** (AC #2) — the corpus has no per-item labeled kind.
2. **How much to change the harness** vs re-run unchanged.
3. **Where the outputs go** (don't clobber the T-169-01 E-40 baseline).

---

## Decision 1 — `kind` reliability: condition-level expectation, not per-item join

**Chosen:** report `kind` reliability as a **per-condition tag distribution** measured against the
condition's *expected* kind-class, and report it **separately from the score** (AC #2 wording).

- For each crater condition, expectation is structural, not per-item:
  - **MATCHED** (build vs the concept it matches): divergences *should* be `add` (right style, detail not
    built) or `remove` (foreign element) — **non-capping**. A `replace` here is either a true material
    defect (the E-42 confound) or a false over-cap; we cannot separate those two without a faithful build,
    so we report the `replace` rate and name the confound rather than scoring it as "wrong".
  - **WRONG** (build vs a foreign-style concept): divergences *should* be `replace` (the build's materials
    are wrong for that concept) — **capping**. Here `replace` is the *correct* tag.
- The metric: per condition, the count of `{add, replace, remove}` over items, plus the derived
  capping-rate (`itemStyleClass==="wrong-style"` / nItems). The **reliability signal** is the *contrast*:
  does the WRONG condition show a higher `replace` rate than MATCHED? If MATCHED still shows ~100%
  `replace`, the tag is unreliable (over-cap persists for a new reason). If MATCHED's `replace` rate drops
  for *detail-only* divergences while WRONG stays high, the tag discriminates.

**Why not a literal per-item ground-truth reliability.** The corpus (`defect-corpus.json`) labels
departments and faithfulness, never a per-item add/replace/remove. Inventing per-item kind labels now
would be (a) out of scope, (b) single-rater laundering. The condition-level expectation is the strongest
claim the existing labels license; stating "no per-item ground truth exists; reliability is condition-level
and confounded by the build's real material errors" is the anti-hedge-honest framing.

**Rejected:** hand-labeling a kind per corpus item (scope creep, no second rater); skipping reliability
(an AC); a string-similarity heuristic between `present` and the pack material (the very brittleness BO8
exists to avoid).

## Decision 2 — minimal additive harness change (capture `kind` + a reliability section)

**Chosen:** extend `corpus-referee.mjs` additively — no behavioural change to scoring, which already reads
`kind`:

1. `itemsOf` (line 77) adds `kind: it.kind ?? null` to each persisted item — so the raw tag the judge
   chose is auditable beside the `styleClass` the scorer derived.
2. A new pure helper `kindReliability(conditions)` (added to `bakeoff-score.mjs` with a unit test, so the
   one new piece of logic is single-sourced and pinned — mirrors how T-169-01 added `pairAgreement`) that
   tallies per-condition kind distribution + capping-rate and computes the MATCHED-vs-WRONG `replace`-rate
   contrast.
3. `runCrater` calls it and folds a `kindReliability` block into its returned object; the top-level result
   doc gains a `kindReliability` section; the console summary prints the contrast line.

**Why extend, not rewrite or leave unchanged.** The recommendation said "re-run unchanged — it reads
`kind` automatically," which is true *for the score*. But AC #2 (reliability) and AC #3 (report `kind`
beside the score) require capturing the tag, which the current `itemsOf` drops. The change is the smallest
that satisfies the ACs and keeps the score path identical. Co-locating the tally in `bakeoff-score.mjs`
(tested) rather than inline in the harness keeps the "harness is untested live IO, but its new logic is
pinned" property that T-169-01 established.

**Rejected:** a brand-new harness file (duplicates the asset-guard, corpus load, diagnose loop —
violates the single-composition-point lesson); inline-only tally in the harness (untested new logic);
editing `styleFidelityScore` (it already reads `kind` — touching it would risk the frozen-adjacent scoring
and is explicitly not needed).

## Decision 3 — route outputs to T-170-02, preserve the E-40 baseline

**Chosen:** parameterize the two output sinks via env vars with **T-169-01 defaults** (back-compat), and
run this ticket with them pointed at T-170-02:

- `REFEREE_OUT_DIR` (default `docs/active/work/T-169-01`) → the beside PNGs.
- `REFEREE_RESULTS` (default `experiments/eval-alignment/results/corpus-referee.json`) → the result doc.
- This ticket runs with `REFEREE_OUT_DIR=docs/active/work/T-170-02` and
  `REFEREE_RESULTS=experiments/eval-alignment/results/corpus-referee-kind.json`.

**Why.** The committed `corpus-referee.json` IS the E-40 baseline the harness loads for its side-by-side
(`baseline` block reads `clean-wrong-style.json`/`bakeoff.json`, not itself, so it is safe) — but the
*FINDINGS and recommendation.md* cite the committed `corpus-referee.json` numbers (2/0/2/0). Overwriting it
would erase the E-40 evidence the comparison rests on. Writing to a new file (`-kind.json`) keeps both the
pre-`kind` and post-`kind` runs on disk for the before/after the AC demands. The new package script passes
the env or I invoke `node` directly with the env prefix.

**Rejected:** overwriting `corpus-referee.json` (destroys the baseline); a `--out` CLI flag (env is the
established pattern — `GUARD_ONLY` is already env-gated; consistency).

## Decision 4 — what the verdict can and cannot be (the E-42 hand-off, pre-committed)

The design *pre-commits* to the honest verdict shape because the build is fixed and material-wrong:

- **Expected:** MATCHED gatehouse stays capped (its WALL/OPENING items are genuine `replace` vs its own
  concept — correct), so the crater will NOT separate. The *new* information is whether any matched
  divergence that is *detail-only* now tags `add` (over-cap reduced) vs everything still `replace`
  (over-cap persists). Either way is reportable.
- **Recommendation update:** if MATCHED's capping is now driven by *true* `replace` items (material
  errors) rather than the structural rule mislabeling `add` items, the term is **no longer the bug — the
  build is**; recommendation moves from "do-not-promote (term over-caps)" toward "do-not-promote-yet;
  hand to E-42 for a faithful build, then re-run." If MATCHED still caps on items that *should* be `add`,
  the tag is unreliable and the term still over-caps. The report states which, with the per-item evidence.
- **No faked crater.** If no faithful matched build exists (it does not), the report names the E-42
  hand-off explicitly (AC #3) and does not manufacture separation.

## Test strategy

- New `kindReliability` helper → a `bakeoff-score.test.mjs` case (BO13): per-condition distribution,
  capping-rate, MATCHED-vs-WRONG contrast, empty-input safety. Pure, deterministic, no IO.
- Harness itself stays live/untested (the established `experiments/` property).
- `npm test` must read **2242** (2241 + BO13) and stay green; frozen instrument + transport-guard
  untouched.
- Live run validated by `GUARD_ONLY=1` first (assets present), then the full metered run; the persisted
  per-item `kind`+`styleClass` audit trail is what makes the verdict falsifiable.
