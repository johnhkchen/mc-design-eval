---
id: E-32
title: brush-factory
type: epic
status: open
priority: high
depends_on: [E-31]
spec: "§1, §5, §7, §9"
stories: [S-128, S-129, S-130, S-131, S-132]
---

## Background (read this first — self-contained)

**Milestone rung: M2 — "A style we invented in an afternoon"** (`docs/knowledge/milestones.md`).
The glance test outranks the gate (clause 3); numbers are diagnostics, never destinations.

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. E-31 (in flight) pivots the build path to **recognition and substitution**: the model
reads concept + conditioned sketch, names the parts in pattern-book vocabulary, canonical generators
realize them, and a workshop loop lets the model revise its own work — graded once by the frozen gate.

**The three ideas this epic industrializes (2026-06-11 discussions):**

1. **Brushes.** A build technique — a gable course, a timber panel rhythm, a dormer, a window dressing,
   a mossy-weathering pass — is a **brush**: parametrized, composable, unit-tested, preview-carded,
   designed once and reused everywhere. The project already owns a dozen-plus (the E-23..E-30
   generators, the E-31 idiom registry) but they accreted as epic-specific fixes. Building a *large*
   brush library is **relatively trivial work that compounds** — it is the strength we have been
   scared of tapping, and it is exactly what AI coding is good at: highly reusable components with
   clear contracts, designed one at a time, composed without limit.
2. **Material choice is diegetic, not optical.** TRELLIS textures are an amalgam of other games'
   assets — the barn's GLB walls sample from exotic dimensions, and the kit value-check's
   `flagged-mismatch` entries (T-121/T-122) were the optical system *correctly reporting that optics
   cannot decide materials*. In Minecraft logic a building is made from what the place affords —
   "locally quarried stone and plaster" — so palettes derive from a **material story** (geology,
   timber, wealth, trade), authored in language space (where the model's vernacular-architecture
   knowledge is excellent) and ratified by a human once per style. GLB textures are **never read**.
3. **BAML, back at the center.** The project's early facade era — the era whose output looked good —
   ran on **typed BAML functions** (`baml_src/`: conceptart, facade, materialmap, judge, review,
   revise; `@boundaryml/baml` is still a dependency). The geometric era sidelined it into ad-hoc
   prompt+AJV seams. Every model call in the design system becomes a **typed, schema-validated,
   testable BAML function** again — recognition, critique, vernacular reasoning, decomposition —
   because "design once, reuse many" applies to prompts exactly as it does to brushes.

**The factory.** The model is good at breaking a concept down. So the system that *grows itself*: a
style/theme concept goes in → the model decomposes it into a **backlog of brush work-items** (each a
self-contained spec: name, parameters, composition notes, test plan, preview subject) → a human
promotes items → AI coding (lisa) implements each as a reusable component → the library compounds →
every later style and town composes from it. Design work becomes a managed backlog, not an emergency.

## Goal

**Form a style, grow the brushes it needs, build with them.**

```
theme brief ("a fishing village on a cold coast")
  ─▶ STYLE FORMATION (BAML)   material story (local availability) → palette → proportions → brush needs
  ─▶ DESIGN BACKLOG (BAML)    decompose into brush work-item DRAFTS — spec'd, testable, human-promoted
  ─▶ AI CODING (lisa)         each brush implemented once: parametrized, composable, preview-carded
  ─▶ BRUSH REGISTRY           one contract over all build techniques — generators, dressings, weathering
  ─▶ E-31 WORKSHOP            the model composes brushes into a building, revises, declares done
  ─▶ THE FROZEN GATE, ONCE    the instrument untouched
```

## Rules of engagement (binding)

1. **Design once, reuse many.** A brush is parametrized, composable, unit-tested, and ships with a
   **preview card** (rendered on a synthetic subject). A one-off placement helper is not a brush; an
   epic-specific fix that could be a brush gets *written as one*. The registry is the only door.
2. **Typed LLM functions only.** Every model call in the design system is a **BAML function** —
   schema-validated input/output, raw replies committed, testable with pinned fixtures. No ad-hoc
   prompt strings in runners. **Transport rides the `claude -p` subscription shim, never metered API
   keys** — the BAML layer is authoritative for schemas/prompts/tests; if BAML-native transport
   cannot ride the shim, a thin adapter executes through the existing `sdk-binding` seam (the
   facade-era `ClaudeStub` precedent). The **frozen judge is exempt**: its contract is instrument
   surface and is not migrated.
3. **The factory emits drafts; humans promote.** Generated work-items land in
   `docs/active/backlog/` — **outside lisa's scan dirs** — as lisa-*shaped* drafts. A human (or the
   planner under explicit user direction) promotes a draft into `docs/active/tickets/`. The system
   never schedules its own work. (The runaway-backstop twin of the T-119 judge-isolation rule.)
4. **Materials are diegetic.** Palettes derive from the style's material story; precedence: explicit
   concept evidence > pack assignment > vernacular default; **GLB textures are never read for
   materials**. The story is authored by a BAML vernacular-reasoning function and **ratified by a
   human once per style** (the taste step — the human edge, amortized).
5. **Inherited in full:** the E-31 mode split (workshop iterates, may never call the judge; the gate
   convenes once), reproducible-by-replay, per-style-not-per-building, the frozen instrument, pins
   and rotation policy (T-119), reply robustness (T-114).

## Scope

**In:** (a) the **brush contract + registry** — one interface over all build techniques (the E-31
idiom registry is the seed; spray/dressing/weathering ops join it), catalog with preview cards; (b)
the **BAML design-function layer** — recognition, critique, vernacular reasoning, and decomposition as
typed functions in `baml_src/`, transport via the shim; (c) **style formation** — theme brief →
material story → palette → proportions → brush-needs list, human-ratified, emitting an E-31 style
pack; (d) the **design-backlog factory** — style concept → brush work-item drafts (spec, params,
tests, preview subject), promotion flow documented; (e) the **factory milestone** — one **new** style
formed end-to-end, its missing brushes built off the backlog, one building in the new style composed
through the E-31 workshop, graded once.

**Out:** the town composer (still the epic after — this epic builds its supply chain); migrating the
frozen judge to BAML (instrument freeze); auto-promotion of generated tickets (Rule 3); sculpture
subjects; the brief/rubric (immutable).

## Candidate stories & DAG

```
S-128 brush-registry ─────────────┬─▶ S-131 design-backlog-factory ─┐
S-129 baml-design-functions ──┬───┘                                 ├─▶ S-132 factory-milestone
                              └─▶ S-130 style-formation ────────────┘
```

- **S-128 — brush-registry.** The brush contract (parameters, composition interface, test +
  preview-card requirements) and the registry over everything we own: the E-31 idiom generators, the
  E-23 spray/paint ops, dressing, hollowing, floorplans — plus the catalog (one page, every brush, its
  card). The unit of capability becomes visible and countable.
- **S-129 — baml-design-functions.** The facade-era pattern, revived for the new seams: recognition
  (T-125), workshop critique (T-126), vernacular reasoning, and concept decomposition as typed BAML
  functions with fixtures/tests; transport through the subscription shim (adapter if needed); raw
  replies committed (the T-114 ledger pattern). Ad-hoc prompts in the new runners retired.
- **S-130 — style-formation.** Theme brief in → **material story** (local availability: geology,
  timber, wealth, trade) → palette derivation with per-role rationale → proportions → brush-needs
  list → an E-31-format style pack out — authored by BAML functions, **human-ratified** before the
  pack is committed (Rule 4). The diegetic layer, productized.
- **S-131 — design-backlog-factory.** The decomposition function: style concept + registry state →
  **brush work-item drafts** in `docs/active/backlog/` (each self-contained: spec, parameter schema,
  composition notes, test plan, preview subject — lisa-shaped, not lisa-scheduled). Promotion flow
  documented; duplicate-vs-registry detection (don't request a brush we own).
- **S-132 — factory-milestone (terminal).** **One new style, end-to-end**: theme brief → formed style
  (ratified) → backlog generated → the gap brushes implemented off promoted drafts → **one building
  in the new style** composed via the E-31 workshop → **one frozen-gate run**. Plus the compounding
  receipt: registry count before/after, reuse stats (brushes shared with `rustic`), and the
  design-once-reuse-many claim measured.

## Definition of done

- **The registry is the single door:** every build technique reachable through one contract, each
  with tests + preview card; the catalog renders complete.
- **No ad-hoc prompts in the design system:** the new seams run as BAML functions with fixtures; raw
  replies committed; transport on the shim, zero API keys anywhere.
- **A style can be formed:** theme → story → palette → pack, human-ratified, with per-role rationale
  citing the story; GLB textures provably unread (grep/review).
- **The backlog works:** generated drafts are genuinely self-contained (a promoted draft runs through
  lisa without rework); promotion is the only path in; duplicates against the registry are caught.
- **The milestone:** a building in a brand-new style, composed from registry brushes (≥K reused from
  `rustic`, the new ones built via the backlog), through the workshop, graded once — verdict and
  sheets recorded honestly either way; journal + E-12.

## Orchestration notes (for the autonomous run)

- **Sequenced after E-31's seams exist**: S-128 needs the idiom registry (T-124), S-129 migrates
  T-125/T-126's seams (so it follows them); S-130/S-131 compose; S-132 follows the E-31 terminal
  (T-127) so the workshop it composes through is proven. Within that, S-128 and S-129 are disjoint
  and can run in parallel.
- **BAML codegen** (`npm run baml:gen`) is part of the build; the generated client is not
  hand-edited; `baml_src/` is the source of truth (the facade-era convention).
- **The factory's cost shape**: formation + decomposition are a handful of strong-tier calls per
  style — cheap; the compounding value is in the implemented brushes. Light-tier candidates per E-23
  routing: preview-card conformance reads, duplicate detection.
- **Honesty.** If a formed style's palette reads wrong despite ratification, if a generated work-item
  needed substantial human rework (measure it), or if the new-style building grades worse than
  `rustic`'s, those are recorded findings. The epic's claim is that design capability *compounds* —
  the receipt is the milestone's reuse stats, not the assertion.
