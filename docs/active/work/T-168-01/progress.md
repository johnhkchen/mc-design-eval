# T-168-01 Progress

## Status: COMPLETE — all AC met, `npm test` green (2239 pass), ready for Review.

## What landed

### `src/workshop/bakeoff-score.mjs` (additive)
- `WRONG_STYLE = Object.freeze({ cap: 40, distance: 12 })` — the style-distance constants, beside
  `PENALTY` (one source, the same pattern). `PENALTY` untouched (BO7 holds).
- `itemStyleClass(item)` — pure structural classifier over the expected/present/missing triple
  (`"wrong-style" | "absent" | "match"`), with a typed-`kind` short-circuit for the future Layer A tag.
  Reads emptiness, never free-text content → no brittle keyword matching.
- `styleFidelityScore` — rewritten as a per-item loop: present-but-wrong-style items are a **capping
  major** (`PENALTY.major + WRONG_STYLE.distance`, then `min(score, WRONG_STYLE.cap)`); absent/match items
  keep the unchanged severity path. Back-compat: an item with no `present` ⇒ `absent` ⇒ pre-E-40 math.
- `critiqueEvidence` — additive `nWrongStyle` + `wrongStyleCapped` (the crater cause for T-169); existing
  four fields byte-unchanged so `clean-wrong-style.mjs` is unaffected.

### `src/workshop/bakeoff-score.test.mjs` (append)
- BO7 extended to pin `WRONG_STYLE`.
- BO8 — `itemStyleClass` truth table + typed-`kind` short-circuit + defensive defaults.
- BO9 — **the headline AC test**: matched vs wrong-style with an *identical severity profile* (old scalar
  ties them at 40); the new term separates them (matched 40, wrong-style 4, capped). Proves "was tied".
- BO10 — incomplete-but-right-style (`absent`) is docked only for severity (72), never capped.
- BO11 — pins the **known F1 over-penalty** (present-but-detail-incomplete classed wrong-style) and the
  typed-tag correction, linking `schema-feedback.md`.

### `docs/active/work/T-168-01/schema-feedback.md`
The scoped E-39 schema feedback (AC bullet 3): add `CritiqueItem.kind: "add"|"replace"|"remove"` so Layer A
disambiguates replace (wrong material) from add-onto-partial (missing detail) at the source. The scoring
core already reads `kind` when present — forward-compatible, no further change here when the tag lands.

## Deviations from plan
- **One squash commit for code+tests** (Step 4) rather than separate Step-1/2/3 commits — the term is a
  single coherent change and the intermediate states are not independently meaningful (mirrors T-167-01's
  choice). Docs (`schema-feedback.md` + this file) are the second commit.
- BO9's exact spread came out to **36** (matched 40 − wrong-style 4), comfortably past the ≥30 assertion
  and the E-38 noise band (12); the plan's illustrative numbers held.

## Falsifiable claim — adjudicated honestly
- **Separates without tanking the incomplete-but-right build?** YES for the clean cases (BO9 + BO10): a
  complete wrong-style build caps at ≤40 while its incomplete-but-right twin stays at 72 / its severity
  floor. The term reads `present`, which the E-39 scalar ignored — the "blindness is in severity→scalar,
  not reading" diagnosis, fixed in the scalar.
- **F1 (free-text unclassifiable) — does it bite?** YES, on exactly one shape: present-but-detail-incomplete
  (BO11). Reported, not faked: classed wrong-style today, remedied by the typed `kind` tag (schema-feedback),
  never by brittle string overlap. The scoring core is already wired to read the tag.
- **F2 (binary over/under-penalizes)** — the distance grades by *breadth* (count of wrong-style depts) now;
  per-item *depth* needs the typed tag and is validated live in **T-169-01**, as the ticket routes it.
- **F3 (Layer A emits identical `present` for both ⇒ still tie)** — that is a *reading* failure upstream of
  this scalar; T-169-01's live run is the gate. T-168 proves the scalar separates *given* a distinguishing
  read; if the live read collapses, route back to Layer A (the typed tag also helps there).

## Not in scope (correctly deferred)
- Live re-run of `clean-wrong-style.mjs` / corpus agreement — **T-169-01**.
- Editing `baml_src/department.baml` to add `kind` — owning E-39 ticket (prompt-golden re-pin discipline).
