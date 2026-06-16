---
id: E-43
title: surface-treatment-grammar
type: epic
status: open
priority: high
depends_on: [E-42]
spec: "§9"
stories: [S-174, S-175, S-176]
---

## Background (read this first — the architecture is the point)

**Milestone rung: M1, the surface finish — "the build reads as detailed as its picture."** E-42 makes the
build *faithful* (right materials, real roof) but *plain*: the gatehouse came out a clean grey box with
**token** articulation (quoins ~4 cells, an arch that reads as a void, no trim band). The brushes exist and
even *run* — they just fire as isolated, under-amplitude stamps. This epic replaces that with a
**compositional surface-treatment grammar**. Governed by `docs/knowledge/project-direction.md` +
`docs/knowledge/anti-hedge-directive.md`.

### The abstraction

A **declarative, layered treatment** applied over an element's geometry. Per surface, an ordered stack:

1. **base** — a course/step at the bottom edge (e.g. a stone-brick stair plinth).
2. **plane** — a recess or proud offset of the field, by **exclusion** (not an air-op, not a buried fill —
   the standing `facade-recess-by-exclusion` lesson).
3. **field** — a pattern over that plane (coursing, checker, …).
4. **edges** — treated *differently from the field* and **derived from the element's geometry**: corners →
   quoins, top → cornice/eave band, bottom → water-table, opening-perimeter → reveal + frame + head.

**The load-bearing idea is (4): edges are computed from geometry.** That makes "trim ABC on the edges" work
on any shape, and it unifies element types — every element is *a field with edges and a base*:

| element | field | edges (derived) |
|---|---|---|
| wall | wall plane | corners (quoins), top (cornice), bottom (plinth) |
| roof | slope | eave + verge (overhangs), ridge (trim) |
| opening | the void | perimeter (reveal), head (arch), sill |

So trim/band/quoin/overhang/reveal stop being independent stamps and become **edge-treatments of a recessed
field** — one vocabulary across walls, roofs, doors, windows.

### Two load-bearing decisions

1. **Amplitude is first-class.** Each layer carries depth + repetition (a 3-course band, a 2-cell recess)
   so it READS at building scale. Token amplitude is the disease; this is the cure.
2. **Prove the engine before auto-sourcing it.** Validate with a HAND-AUTHORED treatment first (does a
   composed treatment read?), THEN source specs — recognition / a style pattern-book emits them, and
   E-39's structured critique ("trim thin / arch absent") refines amplitude.

### Relationship to what exists

This **promotes** E-35's `applyArticulation` seam + the idiom-registry brushes (quoin, eave-overhang,
clinker, surface-relief, dressOpenings, plinth) from a *flat role→pass list* into a *structured, edge-aware,
amplitude-carrying grammar*. The brushes become the layer *implementations*; the grammar composes, orders,
and amplifies them. `wall-skin.mjs`'s fixed rustic recipe becomes one instance of a general treatment spec.

### The compositional grammar is the LEADING candidate, not the mandate — spike first

This epic explores *how* to get readable articulation before committing. The compositional treatment
grammar above is the leading candidate; it earns its place against alternatives on the gatehouse render, by
the glance. Candidate approaches to spike (build rough, render, judge — diverge then converge):

- **A. Compositional treatment grammar** (above) — declarative layered spec, edges-from-geometry, amplitude.
- **B. Curated style pattern-book** — hand-craft a few high-quality per-style treatments; apply by declared
  style. Likely the highest *immediate* quality, least general — and a legitimate winner.
- **C. Reference/concept-driven placement** — the model reads the concept (and/or GLB) and emits explicit
  relief for *this* build, not a generic grammar. Most faithful, least reusable.
- **D. Iterative critique-amplification** — the E-39 critique loop aimed at articulation: render → "quoins
  thin, deepen" → amplify → re-render, until the glance matches. Closes the loop; leans on what exists.
- (a hybrid is a fine outcome — e.g. a grammar engine seeded by a pattern-book, refined by the critique.)

## Stories

- **S-174 — explore candidate approaches (spike → glance-judge → commit).** Build *rough* versions of the
  candidates on the gatehouse, render each beside the concept, and pick the impressively-strong one (or
  hybrid) by the glance. Output: a chosen approach + the evidence. Freedom to add a candidate not listed.
- **S-175 — build the chosen approach to readable amplitude + prove.** Implement the winner properly (if
  it's A, that's the spec + compositor + edge-from-geometry vocabulary at readable amplitude; if B, the
  pattern-book; etc.), recess-by-exclusion closure-guarded; prove a gatehouse treatment makes the arch,
  quoins, trim band, and recess **visibly read** — without breaking wall-track closure.
- **S-176 — sourcing + generalization.** Source treatments (recognition / style pattern-book; E-39 critique
  refines amplitude) and generalize the SAME approach to **roof** (eave/verge overhangs, ridge) and
  **openings** (reveal, frame, arch). Prove the gatehouse lifts above the token baseline (42) AND reads.

## How this epic can fail (state it up front)

- **Readable amplitude reads as BUSY.** Bold quoins + bands + recess + pattern may over-articulate — a human
  finds it noisy, not richer. The render (the glance), not the score, is the judge; report it.
- **Recess-by-exclusion reopens holes.** A recessed plane can break watertightness/closure the wall track
  fought — guard with `closureOf`; a recess that regresses closure is the finding.
- **Recognition can't author good treatments.** If auto-sourced specs are worse than hand-authored, the
  honest answer is a curated style pattern-book, not LLM-authored treatments — name it (S-176).
- **Edge-derivation breaks on hard geometry.** L-masses, gables, and corners-of-corners may defeat the
  geometric edge classifier — if so, that classifier is the real sub-problem.

## Done when

A treatment spec + compositor builds base/recess/field/edge layers from geometry at readable amplitude; a
hand-authored gatehouse treatment makes trim, quoins, the arch, and a recess visibly read (no closure
regression); the same vocabulary spans roof overhangs and opening reveals; and sourced treatments lift the
gatehouse above the token-relief baseline while reading as the concept — with the busy-vs-rich call made on
the render. Frozen instrument untouched.
