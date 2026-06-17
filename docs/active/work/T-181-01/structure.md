# T-181-01 — Structure

The blueprint. Two separable change-sets (S then R), each its own commit. No signatures change; all edits
are internal arithmetic + additive evidence fields + one prompt sentence + one regenerated fixture.

## Files

### MODIFY — `src/workshop/bakeoff-score.mjs` (S fix)

- **`WRONG_STYLE` doc comment** (lines 28-35) — rewrite to describe the graded cap: `cap` is now the
  wrong-in-all FLOOR, `distance` is the per-item surcharge AND the per-department cap-grade step (double
  duty). Value object **unchanged** (`{cap:40, distance:12}`) so BO7 holds.
- **`styleFidelityScore`** (lines 152-167) — replace the body's wrong-style branch + the cap line:
  - wrong-style penalty: `PENALTY[it?.severity] ?? PENALTY.major` + `WRONG_STYLE.distance` (severity-
    respecting; missing→major).
  - track breadth in a `Set` of `it?.department ?? \`__item${i}\``.
  - cap: `if (breadth > 0) score = Math.min(score, Math.max(WRONG_STYLE.cap, 100 - breadth*WRONG_STYLE.distance))`.
  - Update the JSDoc (lines 139-151): the STYLE-DISTANCE term is now a graded breadth cap, not a binary one.
- **`critiqueEvidence`** (lines 174-187) — additive only: compute `wrongStyleDepts` (distinct departments of
  wrong-style items), add `wrongStyleBreadth: size` and `gradedCap: size? max(cap,100-12·size): null`. Keep
  existing fields (`score`, `nItems`, `nMajor`, `departments`, `missing`, `nWrongStyle`, `wrongStyleCapped`).
- A small **`wrongStyleBreadth(items)` helper** (module-local, not exported unless a test needs it) so
  `styleFidelityScore` and `critiqueEvidence` share one definition of breadth (single source).

### MODIFY — `src/workshop/bakeoff-score.test.mjs` (S tests)

Append a **BO14** block (graded style-distance), leaving BO1-BO13 byte-untouched:
- **BO14a faithful-except-one vs wrong-in-all** — the headline AC. faithful (1 major ROOF replace, else
  complete) = 68; wrong-in-all (5 major replace, one/department) = 0; assert `faithful >= 60`,
  `wrongInAll <= 5`, and `faithful - wrongInAll >= 50`. The legit dark-oak roof is the faithful item
  (present="brown dark_oak stepped roof", missing="grey stone courses", kind:"replace", severity:"major").
- **BO14b the regression fixture (old binary-cap collapse)** — recompute the OLD math inline (forced-32 +
  `min(score,40)`), show OLD crushes faithful to 40 (same band as two-wrong's 36), NEW lifts it to 68 clearly
  above two-wrong's 36. Makes "collapse gone" concrete, the way BO9 pins the old severity-only scalar.
- **BO14c monotonicity** — `score(b)` strictly decreasing for b=1..5 distinct wrong-style departments
  (otherwise-complete): proves graded, not binary.
- **BO14d severity-respecting** — a single MINOR wrong-style scores above a single MAJOR wrong-style (20 vs
  12 surcharge → 80 vs 68); missing severity defaults to major (=68).
- **BO14e legit-roof explicit** — faithful-except-(legit roof:replace) ranks clearly above wrong-in-all (the
  ticket's named case), and `critiqueEvidence` reports `wrongStyleBreadth:1`, `gradedCap:88`.
- **BO14f back-compat guard** — re-assert BO9's matched=40 / wrong=4 numbers survive the new math (defensive
  duplicate so a future edit can't silently drift the E-40 pins).

### MODIFY — `baml_src/department.baml` (R fix)

- `DiagnoseBuild` prompt — append the concept-conditional sentence to the `kind`-tagging instruction (after
  "...remove if an element is present that the style does not want."). One sentence; no schema/signature
  change; `kind` enum unchanged.

### REGENERATE — `src/baml/fixtures/diagnose/prompt.golden.txt` (R re-pin)

- Deterministic re-render via a throwaway node script using `bamlBatch` (render mode, no model call). The new
  golden differs from the old by exactly the inserted sentence (+ Jinja whitespace). Verified by FX-DB1.

### CREATE — `docs/active/work/T-181-01/prompt-diff.txt`

- The recorded `git diff` of `department.baml` + `prompt.golden.txt` (AC#3: "prompt diff recorded"), so the
  re-pin is auditable and deliberate, not a silent overwrite.

## Untouched (asserted)

- **`measurements/`** — nothing. The frozen instrument stays frozen.
- `src/workshop/diagnose.mjs` (serializer), `departments.mjs`, `route.mjs`, `critique.mjs`, the
  `CritiqueItem`/`Critique` BAML classes, `expected.json`/`reply.txt` (parse pin) — all unchanged.
- All other `bakeoff-score.mjs` exports (dispatch/pair/kind aggregators) — unchanged.

## Ordering (matters)

1. **S fix** (`bakeoff-score.mjs`) → **S tests** (BO14) → `npm test` green → **commit 1**. Self-contained;
   the falsifiable-claim deliverable. If R is later contested, S stands.
2. **R fix** (`department.baml`) → regenerate golden → capture `prompt-diff.txt` → `npm test` green (FX-DB1
   re-pinned) → **commit 2**.

Splitting the commits means a failure or doubt in the R re-pin never blocks the proven S mechanism.

## Interfaces (all stable)

- `styleFidelityScore(critique) -> int 0..100` — same signature, recalibrated body.
- `critiqueEvidence(critique) -> {…, wrongStyleBreadth, gradedCap}` — additive fields only.
- `WRONG_STYLE` — same shape/values; only the doc semantics shift.
- `DiagnoseBuild(...) -> Critique` — same signature; one extra instruction sentence.
</content>
