---
id: E-11
title: staged-sculptor-framework
type: epic
status: open
priority: high
depends_on: [E-01, E-02, E-04, E-10]
spec: "§1, §5, §9"
stories: [S-024, S-025, S-026, S-027, S-028, S-029]
---

## Goal

Build the **staged sculptor** — the framework that turns *form* (a concept image now, a GLB later) into a
**good** Minecraft build by working the way a great builder does: **stage the build, each stage operating
on a locked prior substrate**, framed by the two bookends the monolithic passes skip — *massing-first* and
*render-review-iterate*. This is the keystone of the "our system is the sculptor" thesis: the framework is
where every block-craft technique lives, and it is **input-agnostic** (the same stages run whether the
massing came from a concept image or a perfect 3-D scan), so it is the toolkit that makes the final build
good regardless of how good the reference gets.

## Why it matters

Both failed approaches are **monolithic**: the text-JSON pass resolves massing + material + detail in one
shot (so the quality dimensions trade off — we measured it, P9), and a Falcraft-style voxelizer samples
massing + material + detail all at once in 3-D (the same flaw, different medium). A great builder never
does this. They **block out the gray massing first**, lock it, then add material/shading, then depth, then
detail — each pass on a stable substrate — and they **render and critique** at the end and iterate. Those
two bookends are what make the middle techniques composable instead of fighting each other. This epic
builds that staging spine; the individual craft passes plug into it.

## The architecture (a great builder's process, as a pipeline)

Three hands do the work — the framework threads an **intent/plan** (LLM judgment) alongside the **build
state** (geometry), and a stage reads both:

```
form ─▶ [MASSING]* ─▶ [material] ─▶ [relief] ─▶ [curves] ─▶ [detail] ─▶ [REVIEW]* ─▶ iterate
        gray shell    hue-family    inset/pop   circle/    focal       diagnose &
        + lock        noise         lips        dome algo  detail      route
        └ bookend 1                  └────── pluggable craft passes ──────┘   bookend 2 ┘
```

- **Form input** supplies massing and (later, via GLB) the 3-D structure relief/curves need.
- **LLM judgment** owns the *planning* (focal hierarchy, calm fields, palette-to-mood) and the *review*
  (name the defect, route it back) — the two bookends.
- **Procedural craft passes** own the middle (material noise, self-shadow relief, curve idioms) — each a
  `(buildState, intent) → buildState` transform over a *locked* prior.

**Lock semantics are load-bearing:** once a stage is accepted, later stages may not undo it (only add
within bounds). This is the structural fix for the regression we measured when a blanket 2nd pass detached
masses (P14) — staging + locks make "improve" additive, never destructive.

## Scope

**In (the keystone — the spine + both bookends + enough to prove it):**
- **Staged build-state model + lock semantics** — a richer intermediate than the flat `DesignArtifact`,
  carrying per-cell occupancy (massing), material, relief depth, and per-stage lock flags; it **compiles
  down to a `DesignArtifact`** at the end (so render/judge/export are unchanged).
- **Stage-pass interface + orchestrator** — the `(buildState, intent) → buildState` contract, run in
  order, locking each; this is the plug every craft pass implements.
- **Bookend 1 — massing** — form (the E-10 concept→block grid today) → a gray proportioned **massing
  shell**; an LLM/critic **proportion lock** before any detail.
- **Bookend 2 — review** — render the current state (E-02) → an LLM **diagnostic critic** that names
  *where it's flat, where curves ring, where the focal point is under-detailed, where proportion is off*
  and **routes the defect back to the responsible stage** (diagnose-and-route, NOT a blanket re-emit).
- **Two seed craft passes** — to prove the spine *composes locked stages*, not just one pass:
  - **material-noise** — per surface, a same-hue block *set* (2–3 IDs) mixed for texture and varied by
    height (fake shading; an upgrade of E-10's single-block match). Operates on the locked massing.
  - **self-shadow relief** — inset recesses −1, pop trim/cornices +1, a lip under horizontals. Operates on
    the **material-locked** state (so a pass demonstrably builds on a *prior pass's* locked output, not
    just on massing). The marquee depth move — it attacks our oldest ceiling, flat fields.
- **End-to-end demo on facades** — massing → relief → review, producing a relief facade `DesignArtifact`,
  rendered and critiqued — runnable **now**, before TRELLIS.

**Out (plug into this framework as follow-on epics):**
- The rest of the craft-pass library — the **curve idiom router** (detect dome/cylinder/thin-member →
  procedural generator instead of sampling) and **structural decomposition** (named parts). Each is a later
  epic that implements the stage interface. (material-noise + relief are seeded here as proof.)
- TRELLIS / GLB (E-09 stages 2–3) — the framework consumes whatever form; GLB swaps in at the massing
  bookend later, unchanged downstream.
- Whole-structure vs facade — the model should be agnostic; we **test on facades first** (cheap,
  comparable) and let whole-structure be the reason the GLB is needed.

## Candidate stories (lisa chain)

```
S-024 spine
   ├─ S-025 massing ─> S-027 material-noise ─> S-028 relief ─┐
   └─ S-026 review ───────────────────────────────────────────┴─> S-029 consolidate
```

- **S-024** — staged build-state model, stage-pass interface, orchestrator, lock semantics; compiles to a
  `DesignArtifact`. Unit-tested.
- **S-025** — massing bookend: concept→block grid → gray proportioned shell + LLM/critic proportion lock.
- **S-026** — review bookend: render → diagnostic critic (flat / ringing / focal / proportion) → route to
  the responsible stage; no blanket re-emit.
- **S-027** — seed pass A: **material-noise** (same-hue block set per surface, vary by height) over locked
  massing.
- **S-028** — seed pass B: **self-shadow relief** (inset/pop/lip Z-depth) over the **material-locked**
  state — proves a pass composes on a prior pass + attacks flat fields.
- **S-029** — consolidate: the GLB-reuse hook (massing swaps to a 3-D source, downstream unchanged), the
  journal section, and how the pass library extends the spine.

## Definition of done

- A facade build runs through the **staged pipeline** end-to-end — gray massing locked, self-shadow relief
  added over it, reviewed by the diagnostic critic — and compiles to a valid `DesignArtifact` that renders
  and scores, demonstrably **less flat** than the same massing without the relief stage.
- The **stage interface** is real: the relief pass is a `(state, intent) → state` transform with no special
  casing, so a second pass (material-noise) could be added without touching the orchestrator.
- **Lock semantics hold:** the relief stage cannot alter the locked massing; the review critic *routes*
  rather than re-emits.
- The framework is **input-agnostic** — the massing bookend's only form dependency is an interface, so a
  GLB source can replace the concept-grid source later with no change to the middle or review stages.

## Notes

- **This is the through-line of the project.** Every craft pass and the LLM judgment live *post-form*, in
  our system, input-agnostic — exactly the "we are the sculptor, we get final say" thesis. The 2D→3D tool
  only touches the massing bookend's input.
- **Staging answers the monolith** in 2-D (the JSON pass) and 3-D (the naive voxelizer) with one
  architecture, so the work transfers directly to the GLB path.
- **Review critic = diagnose-and-route**, per the P14 lesson (a blanket "improve it" regressed by
  detaching masses). The critic's job is to *name the defect and hand it to a stage*, never to rebuild.
