# Design — T-143-01 straight-ruler-reverdict

Decide the re-run shape, grounded in the Research findings (esp. the free repro probes).

## The pivotal empirical fact

`npm run patternbook:repro` (and `:saltcrag:repro`) **reproduce all three chains
byte-identically under the post-T-139/140/141 code** (sketch → program → **seed** → replayed
final). The deterministic stages — measured re-seed and ledger replay — are unchanged by the
upstream landings. Therefore:

- A live re-run does **not** change the seed; it changes only (a) the **workshop trajectory**
  (the model's eyes now measure proportions through the *straightened* eave, T-139, so its aims
  are scored correctly and its wall-raises can land on the *widened* pack, T-141), and (b) the
  **judge verdict** (fresh renders of the new build, decided under the corrected gate + v2 budget).
- The seed's declared **pitch target reproduces** → it is still class 1. T-140's concept-precedence
  pitch reads the TRELLIS-flattened (≤45°) sketches and snaps to class 1; the class-2 door
  (T-141) is *available but undemanded*. This pre-answers AC3-Q2: **concept-measured pitch stays
  within class 1, recorded not forced** — unless a live re-measure says otherwise (it won't, the
  seed is deterministic).

## Decision 1 — Re-run scope: seed-forward, NOT recognize

**Chosen:** consume the **committed recognition program** as-is (verified byte-identical by
`recognize:offline`); re-run from `pattern-book` (measured re-seed + live workshop) through
`gate` (live judge).

Rationale:
- AC1 says "measured programs **re-seeded** by the chain" — a seed-stage scope, not a
  re-recognition. T-140's pitch precedence and T-139's eave fix both live at seed/measure/gate,
  never at recognition.
- `pattern-book.mjs` already **verifies** (byte-compares), not re-asks, recognition. Re-running
  recognize would inject fresh material/massing variance unrelated to the proportion question,
  muddying the verdict-movement attribution against the baseline, and spend judge-grade tokens for
  no measured reason.
- T-141 changed the recognition *prompt sha* (the pack rows embed in it), but `recognize:offline`
  proves the committed program still realizes byte-identically. The program is self-consistent.

**Rejected:** live `recognize` re-ask. Adds noise, cost, and a confound; the AC does not ask for it.

## Decision 2 — Run order: clean case first

`barn` (rustic) → `barn--saltcrag` → `cottage`.

Rationale: the barns are 4/4 same-object and the T-144 calibration already showed
`barn-patternbook` **PASSES v2**. Running barn first validates the live path (auth, GL, pin
rotation, witness round-trip) on the case most likely to land cleanly, before the cottage — the
epic's true question (does the 4-major / 2-of-4 residual collapse to real-only under the
straightened eave?). Each subject is committed before the next begins, so a mid-run failure leaves
a clean, partial, reproducible state.

## Decision 3 — Pin rotation under T-119, registry under T-142

Every committed record this ticket re-writes is rotated **explicitly** with `--rotate-pins`, and
its prior (T-138) source is **named in `retired-pins.json`** per that registry's stated "T-143 bar":

Records rotated per subject (chain → judge → witnesses → milestone):
- `pattern-book/{runKey}.{json,md}` and `workshop/{runKey}.json` + `workshop/{runKey}/…`
  (the ledger/seed/final) — rotated by `patternbook --rotate-pins`.
- `multi-angle/{slug}.{json,md}` + `pr/assets/frames/multi-angle-{slug}.png` — rotated by
  `gate --rotate-pins` (the **only** judge runs of the epic, AC2).
- `proportion/{runKey}.{json,md}` and `visibility/{slug}.{json,md}` — re-derived and rotated by
  `proportion --rotate-pins` / `visibility --rotate-pins` so they are **GREEN against the new
  records** (the rotation-proof bar).
- `pattern-book/proportion-milestone.{json,md}` + `pr/assets/proportion-milestone.md` +
  `pr/assets/pattern-book-milestone.md` — recomposed (`milestone:proportion --rotate-pins`).

**`retired-pins.json` additions:** the cottage/barn `proportion[]` entries currently name the
T-138 ledger shas. After T-143 rotates the ledger, the witness is re-derived to pin the *new*
ledger (→ GREEN, no registry needed for the witness itself). But the **previous** committed source
(the e1abd583/11ec20dd T-138 ledgers, and the T-138 gate-record shas in `visibility[]`) becomes a
retired source; the registry note requires T-143 to add its own rotation entries. **Exact
bookkeeping resolved in Implement** against the actual post-rotation shas (the witnesses are
re-run with `--rotate-pins`, so GREEN is the primary mechanism; the registry entries are the
audit trail the AC's "retired pins named" demands).

**Baselines are frozen:** `proportion-baselines.json` is **never** re-banked (it is the
pre-rotation comparison). `milestone:proportion --baselines` is **not** re-run.

## Decision 4 — Witnesses before / after (the rotation-proof bar, AC2)

- **Before** (captured this session): `proportion:repro` = cottage/barn **SKIP-named** (retired by
  T-138); `visibility:repro` = the three patternbook slugs **SKIP-named**; `milestone:proportion:repro`
  **DIVERGES** (pre-existing staleness — the milestone is T-138-01 but the records moved under
  T-138-02 + T-144; resolved by the T-143 recompose, not introduced by it).
- **After**: re-run the witnesses with `--rotate-pins`, then `:repro` must be **GREEN-or-named-SKIP**;
  `milestone:proportion:repro` GREEN. Both states recorded in `progress.md`/`review.md`.

The two known tripwires (E-33 learning): rotated **gate records** make `visibility:repro` DIVERGE
and geometry-bearing **ledgers** make `proportion:repro` throw — *unless* the witness is itself
rotated to the new source (then it re-derives GREEN) or the old source is registered. T-143 does
the former for every witness and registers the retired old sources for the audit trail.

## Decision 5 — Budget v2 is automatic; both arithmetics recorded

The T-144 gate runner already emits `aggregate.policy` (v2: identity-first, severity-aware,
`minorBudget=10`) **beside** legacy `gapBudget≤2`. No budget code changes. The milestone composer
(`arithmeticsOf`) already reads both. The re-verdict is **decided under v2, legacy reported beside**
(AC3). No per-building constants — the budgets are config-frozen in `src/form/multi-angle-gate.mjs`.

## Decision 6 — The glance + learnings (E-12 handoff, AC4/AC5)

- Glance pages refresh through the milestone composer (`pr/assets/proportion-milestone.md`,
  `pr/assets/pattern-book-milestone.md`); sheets land in `pr/assets/frames/`.
- `docs/knowledge/design-learnings.md` gains a **straight ruler (E-34)** section after the E-33
  one (line ~2750): what each upstream ticket straightened, the three answered questions with
  numbers, the honest read of what stayed (class-1 pitch, any residual cottage defect), and the
  E-12 handoff pointer. No per-building constants anywhere.

## Rejected alternatives (summary)

1. **Re-run recognize live** — unrelated variance, cost, confound; AC says "re-seeded."
2. **Force barn pitch to class 2** — AC says "recorded, not forced"; concept-precedence + flattened
   sketches keep it class 1; the seed reproduces, confirming it.
3. **Re-bank the baselines** — forbidden; they are the frozen comparison.
4. **Repair the cottage eave here** — already shipped by T-139; T-143 only re-verdicts.
5. **Re-judge only (skip the workshop)** — AC1 requires re-seed + workshop + new ledgers committed.
6. **Run all three before committing any** — rejected for incremental safety; commit per subject.
7. **Skip retired-pins entries (rely on GREEN witnesses only)** — AC2 says "retired pins named";
   add the audit entries even though re-run witnesses are GREEN.

## Risk register

- **Live workshop non-determinism**: the new ledger is a fresh model trajectory; the build may
  differ from the T-138 build in ways beyond proportion. Mitigation: the *seed* and *target* are
  pinned/deterministic; the witnesses measure the *realized* ratios under the straight ruler, so
  the comparison is honest regardless of trajectory.
- **Judge cost/singularity**: AC2 makes these the epic's only judge runs. Mitigation: rotate pins
  explicitly, commit per subject, re-run nothing already decided; `--rejudge` exists only for
  malformed replies (T-114), not for re-rolling a clean verdict.
- **A live verdict that still FAILs the cottage**: that is a legitimate recorded outcome (the
  residual is "part-real" per the baseline). The ticket records movement honestly; it does not
  require a PASS.
