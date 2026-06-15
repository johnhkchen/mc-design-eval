---
id: E-22
title: faithful-render-and-resemblance-gate
type: epic
status: open
priority: high
depends_on: [E-19, E-20, E-21]
spec: "§2, §6, §9"
stories: [S-075, S-076, S-077]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. The pipeline now: a concept image (Nano Banana) → a TRELLIS image→3D **GLB mesh** →
voxelized into a `DesignArtifact` → materials assigned (E-14 value, E-18/E-19 clean regions, E-21
concept-grounded zoning) → rendered headless to a PNG and judged.

**The one thing this epic is about.** The Minecraft build should **look like its references** — the
**concept image** ("the picture") and a **render of the GLB mesh** ("the mesh one"). Same object, same
massing, same material zoning, same palette. That is the entire goal. Everything else (speckle scores,
block counts, IoU) is a *diagnostic that explains a verdict* — never the verdict.

**Why this epic exists (the failure that motivated it).** On the scale-64 gatehouse the build scored
`speckle: 0.001`, `distinct: 4`, `offPalette: 0`, `valueDeltaE: 1.73`, `formIoU: 0.929` — **clean by every
metric we had** — yet the render reads as grey static. Root cause (diagnosed, evidence in the work dir):
the build is genuinely clean (2.0% surface neighbor-disagreement over 25,608 exposed voxels), but at scale
64 the building spans ~64 voxels framed into ~400px of a 512×512 image → **~6 px per block** while each
Minecraft texture is **16×16**. The viewer atlas minifies those busy grey stone/cobble/deepslate textures
with `minFilter = THREE.NearestFilter`, **no mipmaps** (`worldrenderer.js:91-92`), and the renderer has
**no antialiasing** (`render/src/render.mjs:75`). Point-sampling a 16px texture down to 6px makes adjacent
screen pixels grab unrelated texels → minification aliasing → static. **We designed a clean building and
photographed it through a broken lens.**

**The deeper lesson — the gate was gameable.** An agent that satisfied `speckle`, `distinct`, and `IoU`
did *exactly what it was told* and produced a build that looks wrong. The metrics weren't cheated; they
were the **wrong target**. This epic fixes the lens (so a clean build photographs clean) **and** moves the
acceptance gate onto **visual resemblance to the fixed references**, so "the numbers are green" can never
again stand in for "it looks like the picture."

> **Note on prior verdicts.** Builds judged before this epic were photographed through the aliasing lens,
> so their *visual* verdicts (not their block metrics) are suspect. S-077 re-photographs and re-judges the
> headline builds through the fixed render — expect some "clean per metrics" builds to read differently
> (better, once the static clears; or worse, if real material drift was hidden under the noise). Both are
> honest results.

## Goal

(1) Make the Minecraft render a **faithful photograph** of the build at the high scale — kill the
minification aliasing so a clean build reads clean (no shrinking the build to dodge it). (2) Replace the
proxy-metric sign-off with a **reference-anchored resemblance gate**: the build's render placed beside the
**concept image** and the **GLB mesh render** at the same view, scored perceptually *and* judged
categorically ("same object / drifted / different object"). (3) Re-photograph the headline builds through
the fixed lens and report, honestly, which now read as the same object and where the residual gap is.

```
concept image ─┐
GLB mesh ──────┤── render all three at ONE shared view (BUILDING_VIEW_3Q) ──▶ TRIPTYCH
minecraft build┘        (minecraft render FIXED: faithful at high scale)        │
                                                                                ▼
              perceptual resemblance (form IoU + palette/material agreement) + CATEGORICAL JUDGE
                                                                                │
                                          "same object" ──▶ pass   │   "drifted/different" ──▶ named gap
```

## Rules of engagement (state the goal clearly so agents can't cheat or quit)

These are **binding for every ticket in this epic** and exist because the gate has been gamed by accident
before. They define what "done" means so there is no honest way to weasel out of it.

1. **The references are fixed inputs.** The concept image and the GLB mesh are given. An agent may **not**
   regenerate, swap, crop, recolor, or "improve" a reference to make the gate pass. The thing being
   measured is the build, not the reference.

2. **The verdict is the triptych, not a number.** "Done" = the Minecraft render, shown beside the concept
   image and the mesh render at the same view, reads as **the same object** to a human glance **and** to
   the categorical judge. Proxy metrics (`speckle`, `distinct`, `IoU`, `valueDeltaE`) **explain** the
   verdict; they never *are* it. **A green metric over an ugly triptych is a FAIL** — and reporting it as
   success is the exact failure this epic exists to stop.

3. **Resolution floor — do not shrink the build to hide the problem.** The build is rendered at the high
   scale (the E-20 building scale, ≥48). Lowering the scale so blocks render bigger and the texture
   aliasing "goes away" is a **cheat, not a fix** — it abandons the high-fidelity goal. Faithfulness must
   be achieved by fixing the *render*, so a high-scale build reads clean. (Picking the best-reading scale
   *for fidelity* among a set is fine — per [[scale-fidelity-is-form-dependent]]; dropping scale to dodge
   the lens is not.)

4. **Every claim cites a fresh artifact.** No reporting "it now looks like the concept" without the PNG. A
   change ships with a **before/after render pair**, both produced **this run**, both paths in the report.
   No success asserted on a stale render. No "should look like X" — show the X.

5. **No weakening the gate to pass it.** No skipped tests, no `todo`/commented-out asserts, no softened
   judge prompt, no relaxed threshold, no quietly widened tolerance. Moving the goalposts is a defect and
   is caught in the review phase. The rubric, the references, and the resemblance gate are **immutable
   during the loop**.

6. **Reproduce before you claim.** A defect or a fix asserted without reproducing it against the actual
   pixels or the actual code is **not accepted** (the false-bug-list lesson: agents have synthesized
   plausible bugs that did not exist). Evidence — a path, a pixel count, a diff — or it didn't happen.

7. **A gap is a result, not a defeat.** If the build genuinely cannot resemble the reference, **quantify
   the gap and report it plainly** (which view, which region, how far off, why). "Throwing in the towel" =
   silently relabeling the goal as met, deferring the core goal, or hiding the gap under a green metric.
   Reporting "we reached X, the residual gap is Y, here is the cause" **is the job** and is a *success* of
   this epic, not a failure. Honesty about a shortfall always beats a faked pass.

## Scope

**In:** (a) a **render-fidelity fix** — supersample (render at N× and box-downscale to the contract 512²)
and/or mipmapped minification, so the busy textures stop aliasing at high voxel density; deterministic and
owned in `render/src/render.mjs` (no reliance on hand-patching `node_modules`). (b) a **resemblance gate** —
a saved triptych (concept | mesh | minecraft) at one shared view, a perceptual resemblance score (reuse the
silhouette IoU for form + a palette/material-agreement measure), and a **categorical multimodal judge** that
sees all three and rules same/drifted/different, with the references immutable. (c) **consolidation** —
re-photograph gatehouse + cottage + 2 sculptures through the fixed lens, build the triptychs, run the gate,
journal which read as the same object and the residual gaps; E-12 handoff.

**Out:** changing the build's form or materials (geometry from E-16/E-20, materials from E-14/E-18/E-19/E-21
are the *subject* being photographed, not edited here — if the gate says a material is wrong, that is a
**finding routed back to E-21**, not a fix made in this epic); SAM / pixel-accurate textures (deferred);
the brief/rubric (immutable); per-photo camera tuning that differs build-to-build (the render contract stays
deterministic and comparable — E-02).

## Why now / why this shape

- **It's the failure the building surfaced** and it sits *under* every visual verdict the pipeline makes:
  if the lens lies, every judge call upstream (E-13..E-21) was reading static. Fix the lens once, here.
- **It directly answers the standing complaint** — "the texturing/speckling looks bad" — by separating two
  causes that have been conflated: *render aliasing* (this epic) vs *material drift* (E-21). The clean
  block metrics prove the scale-64 static is mostly the lens, not the palette.
- **It hardens the instrument against agent shortcuts** by making the deliverable a human-inspectable
  artifact (the triptych) anchored to immutable references — structurally, you cannot pass by gaming a
  number or quit by deferring, because the gate *is* the picture comparison.

## Candidate stories & DAG (gated after the building chain, on main, journaled)

```
S-075 faithful-photography ─▶ S-076 resemblance-gate ─▶ S-077 consolidation
   (fix the lens: supersample/    (triptych concept|mesh|minecraft   (re-photograph the headline builds;
    mipmaps; clean at high scale)   + perceptual + categorical judge)  which read as the same object?)
```

- **S-075 — faithful-photography.** Fix `render/src/render.mjs` so a high-scale build photographs without
  minification static: supersample (render at 2–3× the 512² contract and box-downscale) and/or enable
  mipmapped minification (`NearestMipmapLinearFilter` + `generateMipmaps`, keeping `NearestFilter` on
  magnification so the pixel-art look survives when blocks are large). Prove on the **existing scale-64
  gatehouse render**: *same artifact*, before/after — the static clears. Render stays deterministic and
  comparable (E-02). Resolution floor honored (Rule 3).
- **S-076 — resemblance-gate.** A reusable gate: render concept image, GLB mesh, and the Minecraft build at
  one shared view (`BUILDING_VIEW_3Q`) into a **triptych**; compute a perceptual resemblance (silhouette
  IoU for form + a palette/material-agreement score); run a **categorical multimodal judge** over the three
  images → `same object | drifted | different object` + the named gap. References immutable (Rule 1); the
  triptych is the deliverable a human inspects (Rule 2).
- **S-077 — consolidation.** Apply the fixed render + gate to **gatehouse + cottage + 2 sculptures**;
  save the triptychs; report which read as the same object and the residual gap per subject (Rule 7);
  journal (`design-learnings.md`: the aliasing root cause, the lens fix, the gate, and what re-photographing
  changed about prior verdicts); E-12 handoff.

## Definition of done

- A clean build **photographs clean at the high scale** — the scale-64 gatehouse static is gone with the
  *same* artifact (before/after saved); the render is still deterministic and comparable (E-02).
- The **resemblance gate** exists and is the sign-off: triptych + perceptual score + categorical judge,
  anchored to the immutable concept image and GLB mesh render.
- The headline builds are **re-photographed and re-judged** through the fixed lens; for each, the report
  states "same object" or names the residual gap (Rule 7) — no green-metric stand-ins.
- `npm test` green; the Rules of engagement were honored (review phase confirms: no shrunk builds, no
  weakened gate, no stale-render claims); journal + E-12 handoff.

## Orchestration notes (for the autonomous overnight run)

- **Runs after the building chain (E-19 → E-21 → E-20)** so it photographs the matured builds. The lead
  ticket gates on E-20's terminal (`T-070-01`) to avoid preempting that chain. **Tension worth flagging to
  the operator:** the render fix (S-075) makes *every* upstream visual verdict trustworthy, so there's a
  real argument to land it *first*; we gate it last to avoid disrupting a running chain. If starting fresh,
  consider running S-075 ahead of the building chain so E-20/E-21 are judged through the fixed lens.
- **GL-free where it counts.** The supersample/downscale math and the perceptual resemblance scorer are
  **pure/deterministic** (built + unit-tested on synthetic images — the lisa env has no headless GL); the
  actual GL render and the multimodal judge are the impure edges, run where GL + the metered `claude -p`
  seam exist.
- **The Rules of engagement above are binding.** A run that produces a green metric over an ugly triptych,
  shrinks the build to dodge aliasing, weakens the gate, or claims a fix without a fresh render has **not**
  satisfied this epic — that is precisely the behavior it exists to prevent.
