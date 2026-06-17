# T-186-01 — DESIGN (anchor "expected" on the picture; pack = vocabulary only)

The seam is `diagnose.mjs` + the `DiagnoseBuild` prompt. The term's arithmetic
(`styleFidelityScore`) is right; the judge is fed the wrong **standard of correctness** (the pack
grammar). The fix re-anchors that standard on the **concept image**, demoting the pack to a naming
vocabulary. This is a prompt/serializer change, not a scoring-core change.

## The decision

**Approach A (CHOSEN): Picture-anchored expectation via prompt re-frame + block re-label.** Combines
LOCALIZATION candidates #1 (picture-anchored expectation) and #3 (decouple `styleProfileBlock` from
the pack-as-standard). Concretely:

1. **`DiagnoseBuild` prompt prose** — make the concept image the SOLE standard:
   - The expected roof/walls/openings are **what the CONCEPT IMAGE shows**, not what the style
     grammar lists.
   - The style/material blocks below are a **naming vocabulary** to *describe* what you see — NOT the
     target. The inverting sentence: *"A build that matches its concept image is correct even if its
     materials differ from this vocabulary; a build that does NOT match its concept image is wrong
     even if every material is drawn from it."*
   - `expected/present/missing/kind` are filled **build-render-vs-concept-image**: `replace` ⇒ the
     build's element is built **unlike the concept image** (genuinely different form/material as the
     PICTURE shows it); `add` ⇒ an element the concept image shows is absent; `match` ⇒ reads like the
     picture.

2. **`styleProfileBlock` / `paletteBlock` headers** (`diagnose.mjs`) — re-label from
   *"THE STYLE'S CONSTRUCTION GRAMMAR (… what a build **should read as**)"* to a **vocabulary** frame:
   *"NAMING VOCABULARY (materials/idioms available to DESCRIBE the build and its concept — NOT the
   standard; the concept image is the standard)."* Body (the role→block / idiom lists) is unchanged,
   so DG5/DG7 body assertions still hold; only the framing line flips.

3. **Scoring core: unchanged.** `itemStyleClass` / `styleFidelityScore` keep counting `replace`/
   wrong-style breadth. Because the prompt now defines `replace` as *departs from the picture*, the
   same arithmetic measures picture-distance. **No edit to `bakeoff-score.mjs`.**

### Why this is the right cut

- **It attacks the exact localized seam.** T-185-01 named `styleProfileBlock`/`diagnoseRenderArgs` and
  the prompt as the place "expected" is pack-derived. A re-frame there is the minimal, on-target change.
- **It buys real decoupling, not a re-coupling.** The pack literally stops being the standard; the
  concept image becomes it. The crux cells move because the judgement axis changed, not because a
  constant was tuned (the claim's stated failure mode).
- **It is cheap and architecture-preserving.** No new recognition pass, no new model call per state, no
  schema change, no scoring-core change. One prompt + two header strings + a golden re-pin.
- **It keeps the scoring core pure and small** — minimizing S-185's eventual freeze surface
  ([[recognition-not-reconstruction]]: the picture is the spec, the pack is the substrate vocabulary).

## Alternatives considered & rejected

**Approach B — explicit build-vs-image term folded into `styleFidelityScore`.** Add the proxy glance
(a direct "does this render match this concept image" image-pair judge, already in the harness as
`proxyJudge`) as a second signal, blend it into the scalar (e.g. multiply or gate the cap by the
image-match verdict). *Rejected as primary:*
- It is a **blend, not a re-anchoring** — the pack-anchored half still rides along and can still
  dominate; partial decoupling risks the claim's "rose only by re-coupling" failure.
- It **grows the scoring core** (a second model call inside the term; `styleFidelityScore` stops being
  pure arithmetic over a Critique), enlarging the freeze surface and breaking the
  `bakeoff-score.mjs` purity contract (runs under the `src/**/*.test.mjs` glob, no model).
- It **double-counts**: the proxy is also the gate's *label* source — using it inside the term too
  would make the term and its judge non-independent, weakening the agreement signal.
- Kept as the **spike comparison** (AC: "≥2 candidate approaches") and as a fallback IF the re-gate
  shows the prompt re-frame alone under-moves the effect (then a *bounded* image-match gate could be
  added). Documented, not built, unless A under-delivers.

**Approach C — derive `style_profile` from a recognition pass over the concept image.** Run
`RecognizeBuild` (or similar) on the concept, feed its grammar as `expected`. *Rejected:* a new model
call per state, a new dependency from the term into recognition, and the concept image is **already in
the prompt** — telling the judge to read it directly is strictly simpler and avoids a recognition-error
layer between the picture and the standard. C is what B/A approximate without the extra hop.

## How we know it worked — and how it fails (anti-hedge)

**Re-gate** `style-agreement-run.mjs` on the unchanged S-183 corpus at VOTES=6. The claim holds iff
ALL of:
- **PICTURE-DRIVEN**: `conceptImageEffect > packEffect + NOISE(12)`.
- **hard-middle agreement ≥ 0.70** against the proxy labels (self-consistency already ≥ 0.67 — labelable).
- **crux cells move the right way**: `*-wrongpack` (foreignRight: gh-wrongpack, ct-wrongpack) **rise
  off the floor**; `*-samepack-*` / `bn-cross` (matchedWrong) **fall**.

**Fails (and we record the failure, do not promote) if:**
- the picture effect rises only because matched builds ALSO rose (no real spread — check
  matchedRight≈unchanged, foreignRight rose, matchedWrong fell — not all three up);
- **matched builds regress** (gh/ct/bn-match drop materially — the re-frame broke the easy case);
- the decomposition stays PACK-DRIVEN / MIXED / INCONCLUSIVE, or hard-middle misses 0.70.

A split or a PACK-DRIVEN re-run is **the result** — honest record, `measurements/` untouched, term
stays in `src/`. Promotion is licensed only by the human gate (proxy ⇒ `licensing:false` ⇒
`go∈{false,null}` this loop). The staging path is the T-185-01 template; we do not invoke it
autonomously.
