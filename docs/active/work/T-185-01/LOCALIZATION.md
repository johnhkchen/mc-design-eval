# T-185-01 — LOCALIZATION (the concept-image-conditioning residual, named precisely)

The DO-NOT-PROMOTE verdict (see `FINDINGS.md`) is PACK-DRIVEN: `packEffect = 45 ≫ conceptImageEffect = 8`. This
document names **exactly where** the term conditions on the pack instead of the picture, and the **falsifiable
repair**. It is a localization, not a fix — the fix is the `T-186-01` / `E-47` follow-on's scope.

## The defect, in one sentence

`styleFidelityScore` grades the build's renders against a **style spec derived entirely from the recognized
pack**, while the **concept image is passed only as ancillary grounding** — so a build is scored on
*pack-material agreement*, not on *whether it looks like its picture*.

## The exact seam — `src/workshop/diagnose.mjs`

`diagnoseRenderArgs({ program, pack, azimuths })` (`:91`) assembles the DiagnoseBuild inputs:

```
style:         program?.style ?? pack.style            // :96 — the style LABEL is pack-derived
style_profile: styleProfileBlock({ pack })             // :102 — the EXPECTED GRAMMAR is pack-derived
palette_block: <pack palette roles>                    // the EXPECTED MATERIALS are pack-derived
program_block: programBlock({ program })               // form/masses grounding
image_list / images: { concept, renders }              // the concept image + the 4 build renders
```

`styleProfileBlock({ pack })` (`:57`) literally emits *"THE STYLE'S CONSTRUCTION GRAMMAR (what a `${pack.style}`
build's roof / walls / openings should read as…)"* — **the entire "expected" half of the diagnosis comes from
the pack.** The DiagnoseBuild prompt then asks the judge to compare the *renders* against this *pack-described*
expectation. The concept image rides along as one more image but is **not** the thing the build is measured
against.

### Why this produces packEffect ≫ conceptImageEffect

- **matchedWrong** (right pack, WRONG picture) keeps a high score (45, vs matchedRight 53): the build matches
  the pack grammar/palette the spec describes, so it earns few wrong-style items — *even though it doesn't look
  like its concept.* The wrong picture is invisible to the grading axis.
- **foreignRight** (WRONG pack, right picture) collapses (8): the build looks like its concept, but the spec is
  the *foreign* pack's grammar, so every department reads as wrong-style. `ct-wrongpack` → flat 0.
- **gatehouse CIE = −12**: `gh-samepack-classical` (a classical *concept* built in the rustic *pack*) scores
  *higher* (59) than the faithful gatehouse (47) — the classical-concept build happens to satisfy the
  pack-derived rustic spec slightly better. The picture is not in the loop.

This is structural, not a tuning miss. The E-45 recalibration changed *how wrong-style items are penalized*
(severity-weighted, graded cap, replace→add against own concept) — it did **not** change *what "expected"
means*. "Expected" is still the pack. So the term reads materials, not the picture.

## The falsifiable repair (the follow-on's claim)

**The term must condition the wrong-style judgement on the rendered-build-vs-concept-image match, not on
pack/material agreement.** Concretely (candidates for E-47 to spike — diverge before converge
[[diverge-before-converge-experiment-freedom]]):

1. **Picture-anchored expectation.** Derive the "expected roof/walls/openings" the judge grades against from the
   **concept image** (a recognition pass over the concept), with the pack supplying only the *material
   vocabulary to name* departures — so a build in the wrong pack but matching its picture is *not* all-wrong,
   and a right-pack build that ignores its picture *is* penalized.
2. **Build-vs-image term.** Add an explicit "does this render match this concept image" signal (a direct
   image-pair judgement, the proxy glance the T-184 labeler already uses) and make `styleFidelityScore`
   condition on it, demoting pack-agreement to a secondary axis.
3. **Decouple the spec from the pack in `styleProfileBlock`.** Pass the concept-derived grammar as the
   expectation; keep `pack` for palette naming only.

**How E-47 knows it worked (the bar):** re-run the T-184 decomposition (`style-agreement-run.mjs`) on the same
S-183 corpus and show **`conceptImageEffect` dominates** (PICTURE-DRIVEN: conceptImageEffect > packEffect +
NOISE), AND hard-middle agreement clears 0.70, AND `ct-wrongpack`/`gh-wrongpack` (right picture, wrong pack)
rise off the floor while `gh-samepack-*` (wrong picture, right pack) fall. Same instrument, same corpus — the
gate is already built; only the term changes.

## What this localization does NOT do

- No edit to `src/workshop/bakeoff-score.mjs`, `src/workshop/diagnose.mjs`, the BAML `DiagnoseBuild` prompt, or
  anything under `measurements/`. The term stays in `src/`, unpromoted; the instrument stays untouched
  ([[pin-guard-is-structural]]). The repair is the next epic's deliberate, validated work — not a same-loop
  patch to a term we just showed is measuring the wrong thing.
</content>
