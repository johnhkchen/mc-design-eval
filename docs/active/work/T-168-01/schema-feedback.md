# Scoped E-39 schema feedback — a typed grammar tag on `CritiqueItem`

**From:** T-168-01 (E-40 / S-168, style-distance severity in the scoring core)
**To:** the E-39 Layer A contract — `baml_src/department.baml :: CritiqueItem`
**Status:** RECOMMENDED, not yet implemented. Filed per AC bullet 3 ("if a typed grammar tag from Layer A
is needed, document it as scoped E-39 schema feedback — do not hardcode brittle keyword matching to fake
it"). The scoring core is already forward-compatible (reads the tag if present); this is what would let it
read the tag *honestly* on the one case it currently mis-classes.

## The gap (the falsifiable-claim failure mode F1, observed)

`styleFidelityScore` derives a per-item grammar class structurally from the emptiness of the
expected/present/missing triple (the repo's sanctioned vocabulary — `department.baml` 19-21:
*missing→add, present-but-wrong→replace, absent→remove*):

- `present` empty → **add** (`"absent"`): element not built yet → incomplete-but-right-style.
- `present` non-empty + `missing` non-empty → **replace** (`"wrong-style"`): a *different* thing is here
  → capping major.

This is reliable for the two clean cases the AC tests (a complete wrong-style build is `present`-everywhere
→ capped; an absent element is `present:""` → not capped). It has **one blind spot**, pinned by test BO11:

> A build with the RIGHT base material but a MISSING DETAIL —
> `present="plain plaster", missing="timber stud framing"` — is structurally **indistinguishable** from a
> wrong-material replace (`present="polychrome brick", missing="rustic masonry"`). Both are
> `present`-non-empty + `missing`-non-empty. So the structural rule classes the detail-incomplete item as
> `"wrong-style"` and **caps the score** — an over-penalty of an incomplete-but-right build.

The corpus's `cottage-plain-upper` state is exactly this shape (plaster present, timber studs missing,
scored against its *matched* concept). Separating the two without a tag requires comparing the *content* of
`present` vs `expected` (is the present material a subset/variant of the expected one?) — i.e. substring /
token-overlap string ops. That is brittle (phrasing-dependent, synonym-blind) and AC-forbidden. The honest
remedy is a typed signal from the judge that already *saw* the render.

## The recommended schema delta (one field, additive)

In `baml_src/department.baml`, add a discriminator to `CritiqueItem`:

```diff
 class CritiqueItem {
   department Department
   expected string @description("what the concept's style calls for here")
   present string @description("what the build currently has (empty string if absent)")
   missing string @description("what is absent vs expected (empty string if nothing missing)")
+  kind "add" | "replace" | "remove" @description("add = element absent; replace = present but WRONG style/material; remove = an element that should not be there")
   severity "minor" | "major"
 }
```

`kind` makes the add/replace/remove vocabulary the comments already name **explicit and judged**, instead
of inferred from emptiness. The Layer A prompt (`DiagnoseBuild`) would gain one line: *"tag each item with
its kind — `add` if the element is absent, `replace` if something is present but in the wrong
style/material, `remove` if an element is present that the style does not want."* The judge — which can
see whether the plaster is the right base material — decides, where the scalar cannot.

A boolean `wrongStyle` would also work, but `kind` aligns with the existing element-vocabulary comments and
also captures the `remove` case (an extra element), so it is the better-shaped tag.

## Already done on the scoring side (no further code needed when the tag lands)

`itemStyleClass` (src/workshop/bakeoff-score.mjs) **already** short-circuits on `kind`:
`replace → "wrong-style"`, `add → "absent"`, `remove → "match"`, **before** the structural fallback. So
the moment Layer A emits `kind`, the scoring core reads it with no change here, and BO11's pinned
over-penalty flips to the correct `"absent"` (the test already asserts both the current behavior and the
tagged correction). The structural rule remains the fallback for legacy/untagged critiques.

## Blast radius / cost

- One additive enum field + one prompt line. It will drift the `DiagnoseBuild` prompt golden
  (`promptSha256`) — a deliberate re-pin in the *owning* E-39 ticket, not here (recognition-prompt-embeds-
  program-schema discipline: never re-pin another ticket's record).
- T-169-01 should decide whether to land this tag *before* its live corpus run: if the live Layer A on the
  matched `cottage-plain-upper` is mis-capped without it, the tag is on the critical path; if the structural
  rule already separates the corpus cleanly, the tag is a precision upgrade, not a blocker. Either way the
  decision is reported, not assumed — this doc is the flag.
