# T-168-01 Design — the style-distance severity term

Decisions, grounded in Research. Lead with how the falsifiable claim fails.

## Falsifiable claim (restated, with the failure modes I will report)

> The `expected`-vs-`present` mismatch is a reliable enough signal that a clean wrong-style build scores
> far below its matched twin, **without** tanking a build that is merely incomplete-but-right-style.

**Fails if** (and I report it, not bury it):
- (F1) the free-text `expected`/`present` can't be classified into a grammar mismatch reliably → Layer A
  needs a **typed grammar tag** (scoped E-39 schema feedback, flagged not faked with brittle string ops);
- (F2) the term over-/under-penalizes as a **binary** → needs a graded distance, validated in T-169-01;
- (F3) matched and wrong-style still tie because Layer A emits **identical `present`** for both → the
  reading is the gate, route back to Layer A, report.

What I commit to below is honest about exactly where F1 bites: the structural classifier is reliable for
the *clean wrong-style* case (the whole build is the wrong material everywhere) and for the *absent*
incomplete case (`present` empty), but it **cannot** separate "present, wrong material" from "present,
right material, missing a detail" without comparing content — and that boundary is precisely F1. I ship
the term, prove the two AC tests, and **file the typed-tag gap** rather than fake the boundary.

## The core decision — classify by the EMPTINESS of the triple, not its CONTENT

The repo's own element vocabulary (`department.baml` 19–21, `departments.mjs` 24–26) is the design:
**missing→add, present-but-wrong→replace, absent→remove.** So per item:

| `present` | `missing` | class | meaning | scoring |
|-----------|-----------|-------|---------|---------|
| empty | non-empty | `absent` | element not built yet (add) | existing severity penalty, **no cap** |
| non-empty | non-empty | `wrong-style` | build put a *different* thing here (replace) | **capping MAJOR + distance** |
| non-empty | empty | `match` | noted, nothing missing | severity penalty only, no cap |

This reads which field is empty — the schema's own `@description` ("empty string if absent") — **not** the
free-text. That is the difference between a sanctioned structural read and the brittle keyword matching the
AC forbids. I am not parsing "rustic stone" vs "polychrome brick"; I am reading "did the build put
*something* here that differs from what the style wants."

**Why this separates the two AC cases:**
- *Clean wrong-style* (gatehouse vs arc-A): every department has a present (wrong) material and a missing
  (right) grammar → many `wrong-style` items → capped low.
- *Incomplete-but-right-style, absent kind* (`barn-roofless` vs barn): the roof's `present` is empty →
  `absent` → severity penalty only, **not** capped. Scores well above the wrong-style floor.

## Decision 1 — present-but-wrong-style is a CAPPING major, not just a heavier penalty

A clean wrong-style build can be 100% *complete* (every element present) yet 100% *wrong*. A pure additive
penalty would let completeness buy the score back up. So the term **caps**: if any item is `wrong-style`,
`styleFidelityScore` is `min(score, WRONG_STYLE.cap)`. Completeness cannot rescue a wrong-style build —
this is the ticket's "capped low regardless of completeness."

The capping item also contributes as a **forced major** (`PENALTY.major`, overriding the item's declared
`minor|major`) plus a **distance** unit, so the score still *grades below* the cap as more departments go
wrong-style. `WRONG_STYLE.cap = 40`, `WRONG_STYLE.distance = 12` (one source, frozen, beside `PENALTY`).

**Rejected:** a non-capping extra penalty. Fails the AC's "capped low *regardless of completeness*" — a
fully-built wrong-style build would out-score a half-built right-style one. That is the exact inversion
E-40 exists to fix.

## Decision 2 — the distance term grades by BREADTH now; DEPTH is the typed-tag seam

"Graded distance" (F2) has two readings: *breadth* (how many departments are wrong-style) and *depth* (how
far rustic is from classical for a single department). Breadth is a **reliable structural count** —
`Σ WRONG_STYLE.distance` over wrong-style items — and I ship it: 4 wrong departments score below 1. Depth
requires understanding the *content* of `expected` vs `present`, which is F1's typed-tag territory. I do
**not** fake depth with string distance. T-169-01 validates whether breadth-grading suffices or depth (a
typed per-item distance from Layer A) is needed — exactly where the ticket puts that validation.

**Rejected:** Levenshtein/Jaccard between `expected` and `present` as the distance. That is the brittle
string op the AC forbids, and it would conflate "wrong material" with "synonym of the right material."

## Decision 3 — the honest F1 boundary: file the schema feedback, don't hack it

`cottage-plain-upper` (corpus, matched concept) is the hard case: `present="plain plaster"`,
`missing="timber stud framing"` — right base material, missing a detail. Structurally that is
*indistinguishable* from `wrong-style` (present non-empty + missing non-empty) without reading content. My
classifier **will** mark it `wrong-style` and cap it. That is an over-penalty of an incomplete-but-right
build — F1, live.

I do not paper over this. I:
1. ship the structural term (it passes both *required* AC tests — see Decision 4 on the chosen incomplete
   fixture);
2. write a unit test that *documents* the boundary (a present-non-empty-but-detail-incomplete item is
   currently classed wrong-style) so the limitation is pinned, not hidden;
3. **file a scoped E-39 schema feedback** (`docs/active/work/T-168-01/schema-feedback.md`) recommending
   Layer A emit a typed discriminator — e.g. `CritiqueItem.kind: "add" | "replace" | "remove"` or a
   boolean `wrongStyle` — so `replace` (wrong material) is separated from `add`-onto-partial (missing
   detail) at the source. The scoring core reads the typed field when present and falls back to the
   structural rule otherwise.

**Rejected:** inventing a "right base, wrong detail" heuristic via substring containment
(`present ⊆ expected`). Brittle, AC-forbidden, and it would silently mis-grade on phrasing.

## Decision 4 — the two required unit tests use UNAMBIGUOUS fixtures

The AC requires (a) a matched-vs-wrong-style pair that **now separates** (was tied), and (b) an
incomplete-but-right-style build **not** over-penalized by the new term.

- (a) **matched**: a critique with 0–1 `absent` items → ~92–100. **wrong-style**: a critique with 3–4
  `wrong-style` items (present non-empty everywhere) → capped ≤ 40 (and driven toward 0 by distance). Under
  the *old* math both would score by `missing` severity alone and could tie (the E-39 result); under the
  new math they separate by ≥ 50. The test asserts the *old* function would have tied them (compute the
  severity-only score inline) and the *new* one separates — making "was tied" concrete.
- (b) **incomplete-but-right-style** uses the `absent` kind (`present:""`, the `barn-roofless` shape): the
  new term does **not** fire (no cap), score = `100 − severity` only. Asserts it is **not** capped and sits
  well above the wrong-style floor. This is the literal AC: not over-penalized *by the new term*.

The Decision-3 boundary (present-non-empty-but-incomplete) gets its **own** test that pins it as a *known*
over-penalty + points at the schema feedback — so the reviewer sees the limit and the remedy together.

## Decision 5 — additive evidence + backward compatibility

`critiqueEvidence` gains `nWrongStyle` (count of capping items) and `wrongStyleCapped` (bool) — **additive**,
so `clean-wrong-style.mjs` (reads `score/nMajor/departments/missing`) is unaffected and T-169 can report
the crater cause. `BO4`/`BO5` items have no `present` ⇒ classed `absent` ⇒ old severity path ⇒ those tests
stay green unchanged. The new constants are a **new** frozen object (`WRONG_STYLE`); `PENALTY` is untouched
so `BO7` holds.

**Rejected:** editing `PENALTY` to hold the cap. Two unrelated concerns (severity weights vs the
style-distance cap) in one object invites a reviewer to mis-tune one and move the other; separate frozen
objects keep each single-sourced.
