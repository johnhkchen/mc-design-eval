# The Pipeline — structure and philosophy

*Ratified 2026-06-11 (after the E-16..E-30 retrospective; realized by E-31 `pattern-book-builder` and
E-32 `brush-factory`, and unified into one executable chain by E-37 — `benchmarks/sculpture/build.mjs`;
the plain-language retelling + barn/cottage proof is the E-37 capstone in `design-learnings.md`). This
document is the project's standing answer to "what is our approach?" —
agents should treat it as the architecture of record and challenge specific stages with evidence, not
re-derive the whole from scratch.*

## The unifying principle

**AI is applied at every stage, but always in the representation where that stage's task is native.**

Every major failure of the project's middle era (E-16..E-30) was a representation mismatch: materials
decided by optics (colorimetry provably cannot separate brick from cobble; TRELLIS textures are an
amalgam of other games' assets), form decided by mesh-fitting (the build inherited the decimated
mesh's noise — and the cage *enforced* fidelity to that noise), block placement decided by LLM tokens
(a 57k-voxel cloud overflows any context). The architecture that works is a relay race where each
runner only runs their leg.

The companion insight: **resemblance lives in idealization, not measurement.** A human resembles
concept art by *recognizing* forms and substituting canonical realizations — "that lumpy thing is a
gable roof" — and builds *more* regular than the reference. Recognition is robust to exactly the noise
that breaks fitting. (See `design-learnings.md` E-27..E-31 sections for the receipts.)

## The stages

### Stage 0 — World-building (language)
**What:** a theme brief becomes a **material story** — local availability: geology, timber, wealth
class, roofing economy, trade ("a cottage is cost-effectively made from locally quarried stone and
plaster"). The style pack's palette derives from it, role by role, with cited rationale.
**AI:** a typed BAML vernacular-reasoning function.
**Why capable here:** pure world-knowledge — no vision, no geometry, nothing to mismeasure. Material
choice is **diegetic, not optical**; the model's vernacular-architecture knowledge is excellent and
was simply never asked while material decisions were routed through optics.
**Human:** ratifies taste once per style — amortized over every building, and later the town
(one material story per place = palette coherence for free).

### Stage 1 — The target (image generation)
**What:** the concept art — one beautiful, coherent view of the idea.
**AI:** an image model (the `vConcept` path).
**Why capable here:** image generators excel at a *single* stylistically unified visual statement —
which is all that's needed, because this artifact becomes the **immutable contract** everything
downstream is judged against. It doesn't need to be buildable; it needs to be worth building.

### Stage 2 — Form evidence (3-D generation, then code)
**What:** TRELLIS image→3D, then deterministic **conditioning**: decimate, snap face normals to
Minecraft's ~8 legal orientations (6 axes + 45° roofs), apply detected symmetry, fit a rectilinear
footprint → the **conditioned form sketch**.
**AI:** the 3-D generator — used *only* for gross massing and proportions.
**Why this division:** image-to-3D is good at shape and terrible at semantics. Take exactly what it's
good at (silhouette, proportion) and let code strip what it's bad at. **The mesh is evidence, never
substrate; its textures are never read *to decide materials*** (they are non-diegetic amalgam — the
barn's `flagged-mismatch` kit entries were the optical system correctly reporting that optics cannot
decide materials; palette stays diegetic, from the brief).

*Narrowed 2026-06-14 (E-35, ratified by the reviewer).* "Textures never read" is a **material-identity**
rule, not a blanket ban. Multi-angle renders of the *textured* GLB may be read for **spatial
articulation layout** — *where* studs / openings / pilasters / courses fall, and the rhythm — on the
faces the single concept view never shows (back, sides, roof), feeding **Stage 3 recognition** (the
splat method anticipated in E-23). The mesh is still never the substrate, and texture still never
decides a material. Honest caveat: TRELLIS bakes detail as flat texture on a near-smooth mesh, so this
yields *layout* evidence, not measurable relief depth — relief depth is idealized by the brushes
(Stage 4), never fit to the mesh.

### Stage 3 — Design (vision-language recognition)
**What:** the model reads concept + sketch and writes the **building program** in pattern-book
vocabulary: idiom instances with parameters (gable 45°, two dormers; jettied timber-frame upper;
stone plinth; openings on a rhythm) — schema-validated against the style pack.
**AI:** a typed multimodal BAML function.
**Why capable here:** recognition/enumeration into a constrained vocabulary is a core VLM strength
and is robust to noise — naming "that's a gable" doesn't require the gable to be clean. **This is the
moment the model designs** — the capability the project exists to measure.

### Stage 4 — Construction (pure code)
**What:** **brushes** — parametrized, composable, unit-tested, preview-carded generators (the idiom
registry: roofs, arches, frames, dressings, floorplans, weathering) — realize the program clean by
construction.
**AI:** none at runtime, deliberately. The AI contribution happened upstream, once, when the brush
was written (Stage F).
**Why:** precision placement is the LLM's weakest representation and parametrized code's perfect one.
Straight walls and even courses are the generator's *native output*, not properties recovered from
noise by surgery. Regularity — what eyes key on first — is free here.

### Stage 5 — The workshop (vision-language critique + tool use)
**What:** the model views 4-azimuth renders of its own build beside the concept, names what's wrong,
and revises through tools — re-recognize a part, adjust parameters, spray-paint details — in
conformance-gated, fully ledgered rounds, within a declared budget, until it declares done.
**AI:** typed critique function + the same tools as Stage 3/4.
**Why capable here:** judging a rendered image is perception (VLM home turf); revising through tools
exercises judgement without requiring motor control. This is where **iteration** — the thing every
human builder relies on — lives, legally separated from grading. The workshop is *structurally unable*
to call the judge.

### Stage 6 — Measurement (the frozen instrument)
**What:** deterministic preconditions first (coverage, kit presence, integrity, conformance — so the
judge only sees qualified work), then **one** gate run: categorical same-object/drifted per azimuth
with named gaps, fresh renders, receipts (`instrument.diffs: []`), reply-robustness (malformed ≠
verdict), pins guarded against silent rewrite.
**AI:** the pinned LLM judge.
**Why capable here:** categorical judgement with named gaps is within LLM-judge reliability *when the
instrument is frozen and ungameable* — which is what the fooled-gate ledger (aliasing, invisible
stairs, census identity, single angles) bought. The verdict is trustworthy because the instrument
cannot be moved by the thing it measures.

### Stage F — The factory (agentic coding; runs alongside)
**What:** a formed style decomposes (LLM) into self-contained **brush work-item drafts** in
`docs/active/backlog/` — *outside* the scheduler's scan dirs; a human promotes; coding agents (lisa)
implement each as a registry brush with tests and a preview card.
**Why capable here:** writing well-specified reusable components against a clear contract is what
coding agents do best, and the registry contract makes "done" checkable. **Design once, reuse many** —
each style is cheaper than the last; the receipt is measured reuse, not assertion.

## The two cross-cutting rules

1. **Creation is iterative and free; measurement is frozen and singular.** Collapsing these two modes
   into one rulebook was the project's deepest self-inflicted wound (no-re-roll leaked into building;
   pinned first drafts became infrastructure; the cage anchored creation to noise). The split is now
   structural: the workshop cannot reach the judge; the judge convenes once; reproducibility means
   **replay of the committed program + ledger**, not denial of drafts.
2. **Humans appear at exactly two cheap, high-leverage points** — ratifying taste (once per style)
   and promoting work (once per backlog item) — plus steering strategy. Everything else is the
   machine's job, receipted.

## One line

*Language decides what and why; image generation decides what it should look like; 3-D generation
hints at shape; recognition translates it into a buildable program; code builds it straight; the
model polishes its own work; a sealed instrument tells the truth about the result — with an agent
workforce growing the tool library underneath.*

This is not only a Minecraft pipeline. It is a general template for AI-built creative work at scale —
the town, and everything after the town, is built on it.
