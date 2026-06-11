---
id: E-31
title: pattern-book-builder
type: epic
status: open
priority: high
depends_on: [E-30]
spec: "§1, §5, §7, §9"
stories: [S-123, S-124, S-125, S-126, S-127]
---

## Background (read this first — self-contained)

**Milestone rung: M1 — "One house that looks like its picture"** (`docs/knowledge/milestones.md`).
The glance test outranks the gate (clause 3); numbers are diagnostics, never destinations.

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds, with a hardened, frozen measurement instrument (kit-aware + 4-azimuth same-object
gate, receipts, immutable references).

**The strategic diagnosis this epic acts on (2026-06-11, after E-16..E-30).** Fourteen epics of records
converge on one pattern: surfaces *re-authored from clean geometry* pass their checks; surfaces
*inherited or fitted from the TRELLIS mesh* fail. The deeper read: **we built a metrology pipeline for
what is a recognition task.** A human looking at the lumpy TRELLIS roof doesn't measure it — they think
"that's a gable roof" and place the *canonical Minecraft gable roof*. Resemblance to concept art lives
in **idealization** (straight lines, even courses, symmetry, canonical forms), and our own rules worked
against it: the no-regress cage anchored to the mesh **forbade being cleaner than the noise**; the
no-re-roll rule leaked from grading into building and **banned look-adjust-look**; pinned single-sample
LLM outputs froze first drafts into infrastructure (the barn's auto-flagged kit silently disabled its
own roof); and per-subject anti-tuning — right for *code* — wired the model's legitimate per-building
judgement out of the loop. We have been measuring the harness, not the model.

**The reframe: recognition and substitution, not reconstruction.** The mesh's job drops from "ground
truth to fit within ±1 block" to "a 3-D sketch you glance at for forms and proportions" — a far lower
bar that mesh noise doesn't threaten. Minecraft building is a finite, highly conventional **pattern
language** (gable, hip, dormer, chimney, jetty, timber panel, arch, plinth, porch); the model's job —
the thing it is demonstrably good at — is **naming the parts and their proportions**; deterministic
generators realize each name canonically, clean by construction. Per-**style** code is sanctioned
product engineering (a style pack serves every building of that style, and later, the town); per-
**building** code remains forbidden — a building's specifics live in the model's program, not in code.

**The product question is "can we do a good town?", not "what's our delta?"** This epic builds the
house-level machinery (the town composer is the next epic): conditioned form sketches, style packs over
an idiom library, LLM recognition, and the **workshop loop** — the model viewing renders of its own
build and revising with the tools we spent E-23..E-30 building, which finally get a player.

## Goal

**A styled house the model designed**: concept → conditioned sketch → the model names the idioms →
canonical generators realize them → the model revises in the workshop until satisfied → the frozen gate
convenes **once**.

```
concept (immutable) + GLB
  ─▶ CONDITIONED SKETCH      decimate → snap normals to Minecraft's grammar (6 axes + 45°) → symmetry → rectilinear footprint
  ─▶ STYLE PACK              palette + idiom set + proportion rules + decoration vocab (+ its own conformance checks)
  ─▶ IDIOM RECOGNITION       the LLM names parts + parameters in pattern-book vocabulary (the building program)
  ─▶ CANONICAL REALIZATION   each named idiom generated clean-by-construction — no fitting, no tolerance vs the mesh
  ─▶ WORKSHOP LOOP           the model views 4-azimuth renders of its own build and revises; bounded budget; conformance-checked
  ─▶ THE FROZEN GATE, ONCE   same judge, same azimuths, fresh renders, receipts — the instrument untouched
```

## Rules of engagement (binding — the product/measurement split)

1. **Two modes, one ruler.** In the **workshop** (building time): iteration, re-sampling, and revision
   are allowed and expected — the model may re-recognize, re-generate, and re-paint freely within its
   declared budget, guided by renders and the pack's deterministic conformance checks. The workshop
   **may not call the frozen judge** — no peeking at the grader. At **grading time**: the frozen gate
   convenes exactly once per finished build, fresh renders, receipts, no re-rolls (T-114 governs
   malformed replies only). The instrument is untouched by this epic.
2. **Per-style code, never per-building code.** A style pack (palette, idioms, proportions, checks) is
   sanctioned, reusable engineering. A building's specifics enter only through the model's recognized
   program and pack parameters. The generalization grep now checks for *building* names, not style
   names.
3. **Recognition over reconstruction.** No fit tolerances against the mesh; no cage-vs-mesh on this
   path. The conditioned sketch informs recognition and proportions; the canonical realization wins
   over mesh fidelity, always. What survives from the integrity stack: watertight shell, single
   component, dressed openings, render-state validity — properties of *good construction*, not of
   mesh-faithfulness.
4. **Regularity is the default, checked cheaply.** Generators emit clean geometry; a deterministic
   **style-conformance check** (courses even, symmetry held where declared, openings aligned, palette
   in-pack) gates each workshop iteration — pointing at what eyes actually see, instead of mesh-IoU
   pointing at faithfulness to noise.
5. **Reproducible by replay, not by sterility.** Creation may sample; the committed **program +
   revision ledger** replays byte-identically through a named `npm run`. Durability means a reviewer
   can reproduce the build from its committed design history — not that the model was denied drafts.
   Pins, guarded writes, and the rotation policy (T-119) apply to the committed records unchanged.

## Scope

**In:** (a) **GLB conditioning** — decimation, normal-snap to the Minecraft grammar, symmetry
detect/apply, rectilinear footprint fit (deterministic, the "smarter voxelization"); (b) the **style
pack contract + idiom library** — pack format, the canonical generators registered (most exist:
gable/hip/pyramid, arch, grammar, dressing, hollow, floorplan) plus the gaps the milestone needs
(dormer, chimney, jetty/porch as the pack demands), pack-curated palettes (which structurally retires
the barn's flagged-kit failure mode — a human curates the palette once per style, not per subject);
(c) **idiom recognition** — the model reads concept + sketch and emits the building program in
pattern-book vocabulary; (d) the **workshop loop** — render → model critique → revision via
program/idiom/paint tools, bounded, conformance-gated, fully ledgered; (e) the **styled-house
milestone** — cottage and barn rebuilt through the full path, judged once each.

**Out:** the town composer (next epic — streets, lots, archetype instancing, set dressing at scale);
any change to the frozen gate; mesh-fit improvements, cage-vs-mesh tolerances, and per-region surgical
repair (the metrology branch goes dormant on this path, retained for sculpture/organic subjects);
sculpture subjects (no pattern language); the brief/rubric (immutable).

## Candidate stories & DAG

```
S-123 glb-conditioning ────────┬─▶ S-125 idiom-recognition ──┬─▶ S-127 styled-house-milestone
S-124 style-pack-and-idioms ───┤                             │
                               └─▶ S-126 workshop-loop ──────┘
```

- **S-123 — glb-conditioning.** Decimate the GLB to a coarse face set, **snap face normals to
  Minecraft's grammar** (6 axis directions + 45° roof planes), detect the mirror plane and apply the
  better half, fit a rectilinear footprint. Output: a **conditioned form sketch** (clean planes +
  proportions) that recognition reads — walls straight and footprints rectangular *by construction*.
- **S-124 — style-pack-and-idioms.** The pack contract (palette + idiom set + proportion rules +
  decoration vocab + conformance checks), the idiom registry over the existing generators, the gap
  generators the milestone's pack needs (dormer, chimney, jetty), and the first pack (rustic/Tudor —
  covering cottage and barn). Pack palettes are human-curated once per style.
- **S-125 — idiom-recognition.** The model reads concept + conditioned sketch and emits the **building
  program**: idiom instances with parameters (roof: gable 45° + 2 dormers; walls: timber-frame, jettied
  upper; plinth: stone; openings: rhythm + treatments) — validated against the pack, realized by the
  registry. Recognition is re-sampleable inside the workshop (Rule 1); the accepted program is
  committed.
- **S-126 — workshop-loop.** The loop the system never had: build → 4-azimuth renders → the model
  critiques its own work against the concept → revises (re-recognize a part, adjust parameters,
  spray-paint details) → conformance check → repeat within budget → model declares done. Every round
  ledgered; the final build replays from the ledger (Rule 5). No frozen-judge calls inside (Rule 1).
- **S-127 — styled-house-milestone (terminal).** **Cottage and barn** through the full path — sketch →
  recognition → realization → workshop → **one frozen-gate run each**. Targets: beat the project-best
  verdict profiles (cottage generated 10/2 with 2/4 same-object; barn 12/2 0/4), pass the pack's
  conformance checks, and — the product bar — sheets a human reads as *clean builds of the concept's
  building*. Honest outcomes recorded either way; head-to-head table vs the metrology-path bests.

## Definition of done

- **The sketch is clean by construction:** conditioned forms with grammar-snapped planes, applied
  symmetry, rectilinear footprints — unit-tested on synthetic and real GLBs.
- **The pack is real:** contract + registry + first pack with curated palette and working conformance
  checks; the milestone's idioms all realize canonically (render-state valid, `unmapped` empty).
- **The model designs:** committed building programs for both subjects in pack vocabulary, produced by
  the model from concept + sketch — with the recognition prompt/schema documented.
- **The workshop works:** ledgered revision rounds with render evidence; the final build replays
  byte-identically from the committed program + ledger via a named `npm run`.
- **The verdict:** one frozen-gate run per subject, receipts (`diffs: []`), recorded honestly —
  targets met or missed with named causes; the head-to-head vs the metrology path journaled; E-12
  handoff with the sheets.

## Orchestration notes (for the autonomous run)

- S-123 and S-124 are independent and can start immediately; S-125 needs both; S-126 needs the pack
  (S-124) and can develop against existing builds in parallel with S-125; S-127 composes and **owns
  the only judge runs in the epic** (one per subject, at the end).
- **The workshop's model calls run on the `claude -p` subscription shim** (strong tier for
  recognition/critique; light tier candidates for narrow conformance reads per E-23 routing) — never
  the metered API. Budgets declared in the runner; every reply ledgered.
- **GL-free where it counts:** conditioning, pack checks, realization, and replay are
  pure/deterministic and unit-tested; renders and the model's workshop calls are the metered edges;
  the frozen gate is the single grading expense.
- **Honesty.** If recognition mis-names a form (hip read as gable), the workshop loop is the product
  answer — the model sees the render and corrects; if it doesn't, that is the *finding* (a measured
  limit of the model's visual judgement — which is, at last, the thing this project set out to
  measure). The head-to-head vs the metrology path is reported whichever way it falls.
