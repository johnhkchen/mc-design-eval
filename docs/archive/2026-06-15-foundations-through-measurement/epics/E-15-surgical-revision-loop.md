---
id: E-15
title: surgical-revision-loop
type: epic
status: open
priority: high
depends_on: [E-02, E-04, E-11, E-13]
spec: "§1, §5, §9"
stories: [S-043, S-044, S-045, S-046, S-047]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via constrained,
styled Minecraft builds. The working pipeline (`vConcept`) is: a single **term** → an imagined **design
doc** → a **concept image** (Nano-Banana, the self-made reference) → a **build** (the model emits a JSON
`DesignArtifact` of voxel placements) → a **render** (headless `prismarine-viewer` → PNG) → a **judge**
(a categorical rubric). Builds compile to one canonical `DesignArtifact`, so render/judge/export are
shared across facade builds and freestanding 3-D sculpture builds alike.

**What we already measured (the motivation).** Running `vConcept` across 8 sculptural subjects (E-13)
charted a *fidelity-vs-concept frontier*. Text→JSON reliably holds **palette + part-inventory** but loses:
- **value** (the moai realized faithfully but its `gray_concrete` body rendered far darker than the pale
  tuff the concept showed) — *this half is now CLOSED by E-14*: a shared block-Lab palette + a concept↔render
  Δvalue gate pulled the moai from 6.97 to 2.31 ΔE.
- **line** (organic forms: a koi's swimming **S-curve** flattens to a straight chunky body; an
  anatomical heart's **aortic arch never builds as a loop**) and **point** (thin members: a bow's arrow
  foreshortens to a speck). **This half — FORM — is still open.** It is the subject of this epic.

**What E-11 built, and where it stops (the gap this epic fills).** E-11 (the "staged sculptor") built the
substrate for working like a real builder — *stage the build, each stage operating on a locked prior
substrate*, so "improve" is **additive, never destructive**. Concretely, in `src/sculptor/`:
- a **lock-additive build-state** (`build-state.mjs`: `draftState`/`commit`; writing a LOCKED field
  throws `LockViolationError`),
- ordered **passes** over locked priors (`massing` → `material` → `relief`), each a pure
  `(state, intent) → state` that locks exactly the fields it added (`orchestrator.mjs`),
- a **diagnose-and-route critic** (`review.mjs`): it renders the state and emits
  `{ defect, where, route }[]` over a defect vocabulary `{flat, ringing, under-detailed-focal,
  proportion}`, naming *which stage should re-run* — it **routes, never blanket-re-emits**.

The diagnose-and-route design exists **because a blanket "improve it" 2nd pass once regressed by detaching
masses** (recorded as P14). Routing the defect to the responsible stage over a locked prior is the
structural cure. **But the loop was never closed:** `staged-loop.mjs`'s `runStagedLoop` runs *one* forward
pass (mass→material→relief) and produces a diagnosis that **nothing consumes** — its own header says it
"adds NO new capability." And the critic is **whole-object** (`where` is free text, not an addressable
region) and **facade-shaped** (a 2.5-D grid + a single relief depth per cell — it does not reach the
full-3-D sculpture builds where the form gaps actually live).

## Goal

Close that loop and make it **surgical**. Build the missing bookend — *render-review-**iterate*** — as a
**region-scoped observe → diagnose → bounded tweak → re-observe → accept-if-improved** cycle that operates
on the compiled `DesignArtifact`, so the **same loop revises a facade or a 3-D sculpture**. This is the
move a great builder makes that every monolithic pass skips: *look closely at one section, make a small
local adjustment, step back, keep it only if it helped, move on* — bounded so it converges and locked so
it can never regress what already worked (the P14 cure, extended from per-field to per-region).

```
build (DesignArtifact)
  ─▶ pick region R  (bbox / named part / the critic's `where`)
       ─▶ OBSERVE   render a tight crop on R  (camera framed to R's sub-bounds)
       ─▶ DIAGNOSE  what's wrong in R, and is it a KNOWN defect or a FORM defect?
       ─▶ TWEAK     known → a scoped procedural pass (relief/material) bounded to R
                    form  → an LLM block-edit (add/remove/move/swap) bounded to R
       ─▶ RE-OBSERVE + ACCEPT-IF-IMPROVED   keep the tweak only if the metric rose; else roll back
       ─▶ LOCK R, next region   (bounded total iterations / per-region budget)
  rest of the build stays REGION-LOCKED the whole time
```

## Design decisions (settled — a weighted rubric drove these; here so no one re-litigates them)

1. **Operate on the region-locked `DesignArtifact`, not on E-11's facade build-state.** Reuses E-11's
   *philosophy* (diagnose-route, lock-additivity) but at the artifact level, so the loop reaches the 3-D
   sculptures (where the gaps are) and is the natural place a **GLB form-target** plugs in later. The new
   primitive is a **region-lock**: everything outside region R is frozen; only unlocked cells inside R may
   change. (Chosen over "extend the facade build-state," which is cheaper but facade-only and cannot touch
   the sculptures — i.e. high marks on everything except the one thing that matters.)
2. **Two tweak primitives behind one accept-gate.** *Procedural scoped passes* for the **known** defect
   taxonomy (flat→relief, drab→material — deterministic, lock-safe, reuses E-11), and *freeform LLM block
   edits* for **form** defects (curve/loop/taper — which no procedural pass encodes). The critic routes
   each defect to the right hand. (Chosen over "passes only," which can't fix the form gaps that are the
   whole point, and over "LLM only," which has no deterministic floor and thrashes.)
3. **Phase it: deterministic cage first, model lever second.** Build the whole observe→tweak→re-observe→
   **accept-if-improved** machinery driven *only* by deterministic passes first (S-045) — prove the cage is
   tight (regions lock, edits never bleed out, the accept-gate actually prevents regression, the loop
   converges within budget) **without** model-in-loop variance confounding it. *Then* add the LLM
   form-edit route (S-046) as just another editor behind the already-proven gate. You don't trust a
   freeform model editor until the cage around it is demonstrably tight.
4. **Measurability up front.** Color had a clean number (Δvalue/ΔE); **form does not yet**. So the very
   first story builds a **form-fidelity metric** — silhouette **IoU** between the build's render and the
   concept image at the matched 3/4 view (both are background-segmentable: the concept floats on solid
   black, the render on a flat sky), plus a **per-region** IoU so the accept-gate has a *local* signal.
   Without this the form loop is "looks better to me," which is exactly the undisciplined thing we avoid.
5. **GLB form-hint is a deferred SEAM, not built now.** The per-region **form-target** is an interface.
   Today its target comes from the concept image / occupancy heuristics; later a GLB-derived per-region
   target swaps in with no change to the loop. We build the seam (S-047), not the GLB.

## Scope

**In:** the form-fidelity metric (silhouette IoU, whole + per-region); region addressing + the region-lock
+ region-render ("observe a section"); the closed observe→tweak→re-observe→accept-if-improved loop with
bounded iteration, driven first by deterministic scoped passes (the proven cage); the LLM form-edit route
behind the same accept-gate; the GLB-target seam (interface only); a demo on ≥2 measured-gap sculptures
(koi, heart) with before/after numbers + the journal + an E-12 handoff.

**Out:** the GLB / TRELLIS implementation (E-09 — only the target seam is built here); new craft passes
beyond E-11's relief/material (a later epic plugs more in); the rubric and the brief (immutable during
measurement); whole-scene multi-object composition. The loop is single-build, single-subject.

## Candidate stories & DAG

```
S-043 form-fidelity metric ─┐
                            ├─▶ S-045 deterministic loop (cage) ─▶ S-046 LLM form-edit ─▶ S-047 GLB-seam + demo
S-044 region-lock + observe ┘
```

- **S-043 — form-fidelity-metric.** A computable form number: silhouette **IoU** (build render vs concept,
  matched 3/4 view) + a **per-region** IoU for the accept-gate. Pure/segmentation-based, unit-tested.
  This is the "is it actually better" signal the whole loop hill-climbs on.
- **S-044 — region-lock-and-observe.** Two primitives over the compiled `DesignArtifact`: (a) **region
  addressing + region-lock** — select a sub-region (bbox / named part / the critic's `where`), freeze
  everything outside it, permit only bounded in-region edits (generalize E-11's field-lock to a spatial
  lock); (b) **observe-a-section** — a tight crop render of R via `framedCamera(subBounds)` (the rig
  already frames an arbitrary voxel bounds). Unit-tested; the live render is the one boundary-crosser.
- **S-045 — deterministic-revision-loop.** Close the loop with the **deterministic** tweak primitive only:
  observe R → diagnose → run a **scoped procedural pass bounded to R** → re-observe → **accept-if-improved**
  (hill-climb; roll back a non-improving tweak via the lock/commit model) → lock R → next, under a bounded
  iteration / per-region budget. Proves the cage: converges, never regresses (P14-safe), edits never bleed
  past the region-lock. No model in the loop yet.
- **S-046 — llm-form-edit-route.** Add the **freeform LLM block-edit** editor behind the *same* accept-gate:
  observe R's crop → the model proposes a bounded edit (`add`/`remove`/`move`/`swap` placements within R)
  → apply under the region-lock → keep only if the **per-region form IoU** improved. The lever for form
  defects no pass encodes. A/B on the koi (S-curve) and the heart (aortic loop).
- **S-047 — glb-seam-and-demo.** The per-region **form-target interface** (concept/heuristic today, GLB
  later — seam only). Run the full loop end-to-end on ≥2 measured-gap sculptures; record **before/after
  form-fidelity (IoU) + judge** vs the E-13 baseline; journal the result honestly (where surgical revision
  helped, where it didn't, what it cost in iterations); hand improved renders + before/after to E-12.

## Definition of done

- A finished `DesignArtifact` (a 3-D sculpture) runs the **region-scoped loop** end-to-end and comes out
  with a **measurably higher form-fidelity (silhouette IoU)** than its E-13 baseline, on ≥2 subjects.
- **Lock holds spatially:** an accepted/locked region is never altered by a later iteration; a tweak that
  doesn't improve the metric is **rolled back**, not kept (the P14 cure, now per-region + per-iteration).
- The loop is **bounded and convergent** (iteration cap + per-region budget; it stops, it doesn't thrash).
- **Two editors, one gate:** a procedural pass and an LLM edit are interchangeable behind the accept-gate;
  adding the LLM editor required no change to the loop's control flow (proven by S-045 predating S-046).
- The **GLB form-target is an interface** the loop already consults — swapping a GLB-derived target in
  needs no change to observe/diagnose/accept.

## Notes

- **This is the missing bookend, not a new monolith.** E-11 gave us staged construction + a routing critic
  but never let the critic *act in a loop*. E-15 is that loop — and making it *region-scoped* is what keeps
  it P14-safe: a local, accept-gated, lock-bounded tweak is the opposite of the blanket re-emit that
  regressed.
- **Color (E-14) and form (E-15) are the two halves of the same gap.** E-14 closed value with a shared
  palette + a Δvalue gate; E-15 closes form with a region loop + a silhouette-IoU gate. Same disciplined
  shape: a measured number, an additive fix, honest reporting of the residual.
- **Input-agnostic by construction.** The loop only ever sees a `DesignArtifact` + a form-target interface,
  so the day a GLB gives us a real 3-D target, the same loop gets sharper for free — the sculptor keeps
  final say; the 2D/3D tool only sharpens the target it aims at.
