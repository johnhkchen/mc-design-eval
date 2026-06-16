# T-168-01 Plan — ordered, verifiable steps

Small steps, each `npm test`-green. One squash commit for the term (code+tests), one for docs — mirroring
T-167-01's "one coherent commit" choice. Verification command throughout: `npm test` (AJV + node:test glob).

## Step 1 — constants + classifier (no behavior change)

Add to `src/workshop/bakeoff-score.mjs`, right after `PENALTY`:
- `export const WRONG_STYLE = Object.freeze({ cap: 40, distance: 12 });`
- a private `const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;`
- `export function itemStyleClass(item)` implementing: typed `kind` short-circuit
  (`replace→wrong-style`, `add→absent`, `remove→match`) else structural
  (`present∧missing→wrong-style`, `¬present→absent`, `present∧¬missing→match`).

**Verify**: `npm test` still green (nothing calls `itemStyleClass` yet; BO1–BO7 untouched).

## Step 2 — fold the term into the score + evidence

- Rewrite `styleFidelityScore` as the per-item loop (structure.md): `wrong-style` ⇒
  `penalty += PENALTY.major + WRONG_STYLE.distance` and count it; else the unchanged
  `PENALTY[severity] ?? PENALTY.minor`. After clamp, `if wrongStyleCount > 0: score = min(score, WRONG_STYLE.cap)`.
- Add `nWrongStyle` + `wrongStyleCapped` to `critiqueEvidence` (additive; keep the four existing fields).
- Add `WRONG_STYLE`, `itemStyleClass` to the export list.

**Verify**: `npm test` green — BO4 (severity-only items ⇒ all `absent` ⇒ old math) and BO5 (items with
`missing` but no `present` ⇒ `absent`) must pass **unchanged**. If either fails, the back-compat invariant
is broken — stop and fix before adding new tests.

## Step 3 — unit tests BO8–BO11

Append to `bakeoff-score.test.mjs`; extend imports with `WRONG_STYLE`, `itemStyleClass`.

- **BO8** `itemStyleClass` truth table (incl. typed-`kind` short-circuit + defensive defaults).
- **BO9** matched-vs-wrong-style separation — the AC's headline test. Concretely:
  - `matched = { items: [{ department:"WALL", present:"", missing:"a quoin course", severity:"minor" }] }`
    → 1 `absent` minor → new score `100 − 8 = 92`.
  - `wrongStyle = { items: [ three items with present non-empty + missing non-empty, severity "major" ] }`
    → 3 `wrong-style` → penalty `3×(20+12)=96` → `clamp(4)=4` → `min(4,40)=4`.
  - **old-math witness**: recompute each as `100 − Σ(PENALTY[sev]??minor)` inline. matched(old)=92,
    wrongStyle(old)=`100 − 3×20 = 40`. Spread old = `92 − 40 = 52`?  → that is already > noise; so to make
    "was tied" honest, the wrongStyle critique's *severity-only* signal must match the matched one. Use
    **the same severity profile** on both: give `matched` the same count of items but with `present:""`
    (absent) and identical severities, so old-math scores are EQUAL and only the new `present`-aware term
    separates them. See BO9 construction note below.
  - Assert: `styleFidelityScore(wrongStyle) <= WRONG_STYLE.cap`; `styleFidelityScore(matched) -
    styleFidelityScore(wrongStyle) >= 50`; and the inline old-math scores are within 12 (≈tied).
- **BO10** incomplete-but-right-style (`absent` kind, `present:""`): assert `> WRONG_STYLE.cap` and equals
  `100 − Σ severity` (term did not fire).
- **BO11** F1 boundary: `{present:"plain plaster", missing:"timber studs", severity:"major"}` ⇒
  `itemStyleClass === "wrong-style"` and the score is capped — pinned as the KNOWN over-penalty, with a
  comment pointing at `schema-feedback.md`.

### BO9 construction note (making "was tied" real)

To prove the *new* term is what separates them, hold the *old* signal equal:
- `matched`: 3 items, each `{present:"", missing:"…", severity:"major"}` → old=`100−60=40`, new=`40`
  (all `absent`, no cap).
- `wrongStyle`: 3 items, each `{present:"…", missing:"…", severity:"major"}` → old=`100−60=40` (identical
  old signal — **tied**), new=`clamp(100−3×32)=4`, capped `min(4,40)=4`.
- Spread: old `40−40 = 0` (tied); new `40−4 = 36`. Assert old-spread ≤ 12 and new-spread ≥ 30. (If a wider
  separation reads better, raise matched to fewer items; the invariant tested is old-tied → new-separated.)

**Verify**: `npm test` green; the new tests assert the separation and the boundary.

## Step 4 — commit the term

One commit: `feat(T-168-01): style-distance capping-major in styleFidelityScore (E-40/S-168)`.
Files: `bakeoff-score.mjs`, `bakeoff-score.test.mjs`.

## Step 5 — schema feedback doc + progress

- Write `docs/active/work/T-168-01/schema-feedback.md` (the scoped E-39 typed-tag gap — AC bullet 3).
- Write `progress.md`.
- Commit: `docs(T-168-01): E-39 typed-grammar-tag schema feedback + progress`.

## Testing strategy

- **Unit (gating)**: BO8–BO11 in the `src/**/*.test.mjs` glob — pure, no GL/IO/model. This is the whole
  test surface; the term is pure arithmetic.
- **No integration test here**: feeding *real* Layer A critiques through the corpus is T-169-01 (live,
  metered). T-168 deliberately stops at the synthetic scoring core (ticket Note: "scoring core only").
- **Back-compat assertion**: BO4/BO5 unchanged green is the regression guard for the additive change.

## Verification criteria (maps to AC)

- [ ] pure classifier in `bakeoff-score.mjs` assigning capping MAJOR + distance, folded into
      `styleFidelityScore`; one source for constants (`WRONG_STYLE`, the `PENALTY` pattern) — Steps 1–2.
- [ ] BO9 (matched-vs-wrong-style now separates, was tied) + BO10 (incomplete-but-right-style not
      over-penalized) — Step 3.
- [ ] typed-grammar-tag gap documented as scoped E-39 schema feedback (no brittle keyword hack) — Step 5.
- [ ] `npm test` green; pure; frozen instrument untouched — every step.
