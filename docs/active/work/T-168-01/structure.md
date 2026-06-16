# T-168-01 Structure — file-level blueprint

The shape of the code, not the code. Changes are additive to one module + its test, plus one feedback doc.

## Files touched

| File | Change | Why |
|------|--------|-----|
| `src/workshop/bakeoff-score.mjs` | **modify** (additive) | the style-distance term lives in the referee's pure core |
| `src/workshop/bakeoff-score.test.mjs` | **modify** (append) | new tests BO8–BO11; BO1–BO7 unchanged |
| `docs/active/work/T-168-01/schema-feedback.md` | **create** | the scoped E-39 typed-grammar-tag gap (AC bullet 3) |

No new source module: the term is two small pure functions + one constant beside `PENALTY`/`styleFidelityScore`.
No schema file, no corpus edit, no harness edit (T-169 wires the live re-run). Frozen instrument untouched.

## `src/workshop/bakeoff-score.mjs` — additive surface

### New constant (beside `PENALTY`, line ~26)

```js
/** The style-distance term's constants — one source, the PENALTY pattern. A present-but-wrong-style
 *  item forces a MAJOR weight, adds `distance`, and CAPS the score at `cap` regardless of completeness. */
export const WRONG_STYLE = Object.freeze({ cap: 40, distance: 12 });
```

### New helper — `itemStyleClass(item)` (pure, exported)

- **Input**: a `CritiqueItem`-shaped object `{ present?, missing?, severity?, kind? }`.
- **Output**: `"wrong-style" | "absent" | "match"`.
- **Rule** (reads emptiness of the triple, the sanctioned add/replace/remove vocabulary — NOT content):
  1. If `item.kind` is one of `"add"|"replace"|"remove"` (the *typed* tag, when Layer A ships it per the
     schema feedback): `replace → "wrong-style"`, `add → "absent"`, `remove → "match"`. Typed wins.
  2. Else fall back to structure: `present` non-empty **and** `missing` non-empty ⇒ `"wrong-style"`;
     `present` empty ⇒ `"absent"`; `present` non-empty and `missing` empty ⇒ `"match"`.
- Trim-and-nonempty via a private `nonEmpty(s)` (mirror critique.mjs's `isNonEmptyString`).
- No throw — defensive defaults (missing fields ⇒ treated empty ⇒ `"absent"`, preserving BO4/BO5).

### Modify — `styleFidelityScore(critique)`

Replace the single reduce with a per-item loop:

```
for each item:
  cls = itemStyleClass(item)
  if cls === "wrong-style":
     penalty += PENALTY.major + WRONG_STYLE.distance   // forced major + distance unit
     wrongStyleCount += 1
  else:
     penalty += PENALTY[item.severity] ?? PENALTY.minor   // UNCHANGED old path (absent/match)
score = clamp(100 - penalty, 0, 100)
if wrongStyleCount > 0: score = min(score, WRONG_STYLE.cap)   // the CAP
return score
```

Invariant preserved: a critique whose items have no `present` field ⇒ all `"absent"` ⇒ identical to the
old function. Empty critique ⇒ 100.

### Modify — `critiqueEvidence(critique)` (additive fields only)

Add two fields, keep the existing four byte-for-byte:
```
nWrongStyle: items.filter(i => itemStyleClass(i) === "wrong-style").length,
wrongStyleCapped: <that count> > 0,
```
`score/nItems/nMajor/departments/missing` unchanged ⇒ `clean-wrong-style.mjs` unaffected.

### Export additions

`export { ... }` already names the public functions; add `WRONG_STYLE` and `itemStyleClass`. `clamp` stays
private.

## `src/workshop/bakeoff-score.test.mjs` — new tests (append BO8–BO11)

- **BO8 — itemStyleClass over the triple**: `{present:"x", missing:"y"}` → `wrong-style`;
  `{present:"", missing:"y"}` → `absent`; `{present:"x", missing:""}` → `match`; missing fields → `absent`;
  the typed `kind` short-circuit: `{kind:"replace", present:""}` → `wrong-style` (typed wins over structure).
- **BO9 — matched vs wrong-style now SEPARATE (was tied)**: build a `matched` critique (1 `absent` major)
  and a `wrongStyle` critique (3 `wrong-style` items). Assert: (i) a *severity-only* recompute (inline,
  the old math) would score them **within the E-38 noise band of 12** (≈ tied); (ii) the new
  `styleFidelityScore` separates them by ≥ 50, with wrongStyle ≤ `WRONG_STYLE.cap`. Makes "was tied" concrete.
- **BO10 — incomplete-but-right-style NOT over-penalized by the new term**: an `absent`-kind critique
  (`present:""`, 1–2 majors). Assert it is **not** capped (`> WRONG_STYLE.cap`) and equals the pure
  `100 − Σ severity` (the new term did not fire). Pins AC test (b).
- **BO11 — the F1 boundary is pinned as a KNOWN over-penalty**: an item `{present:"plain plaster",
  missing:"timber studs"}` (right base, missing detail) is currently classed `wrong-style` and capped.
  Assert that (documenting the limitation), and comment-link the schema feedback. The test encodes the
  *current* behavior so a future typed-tag fix flips it deliberately.
- Extend the imports to include `WRONG_STYLE`, `itemStyleClass`.

## `docs/active/work/T-168-01/schema-feedback.md` — the scoped E-39 gap

A short, scoped feedback doc (NOT a code change to baml): the structural classifier cannot separate
`replace` (wrong material) from `add`-onto-partial (right material, missing detail) without reading
content; recommend Layer A (`baml_src/department.baml::CritiqueItem`) emit a typed discriminator
(`kind: "add"|"replace"|"remove"` or `wrongStyle: bool`). States the one-line schema delta, the test that
would flip (BO11), and that the scoring core *already reads the typed field* when present (forward-compatible).

## Ordering

1. `WRONG_STYLE` + `itemStyleClass` (no behavior change yet — nothing calls it).
2. `styleFidelityScore` rewrite + `critiqueEvidence` fields (behavior change; BO4/BO5 must stay green).
3. BO8–BO11.
4. `schema-feedback.md`.
Each is independently runnable via `npm test`; steps 1–3 commit together (one coherent term), step 4 is docs.
