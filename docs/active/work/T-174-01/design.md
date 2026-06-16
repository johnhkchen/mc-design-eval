# T-174-01 — Design: how to spike the candidates cheaply

Goal: find the **glance-winner** among the E-43 candidate articulation approaches, on the gatehouse, beside
the concept — cheaply. The decision the spike must inform: *which approach does S-175 build, and is the real
lever the **method** or the **amplitude**?*

## The pivotal observation from Research

The brushes (`quoin`, `eaveOverhang`, `surfaceRelief`, `dressOpenings`) already exist and run. On the
faithful gatehouse they fire at **token amplitude** (quoins = 4 cells / cobblestone:4, no trim band, arch
reads as a void). So a spike does **not** need new geometry primitives — it composes existing brushes at
different **amplitudes and compositions**. That makes A/B/D cheap, pure, deterministic, and directly
comparable. It also means the spike's sharpest question is built-in: *if A, B, D all read about the same once
amplitude is cranked, the lever is amplitude, not method* — a named, valuable failure mode (→ redirect S-175).

## Candidate-by-candidate: how each becomes a cheap spike

### A. Compositional treatment grammar — **build it**
Edges-from-geometry, **uniform moderate amplitude**, every edge treated systematically. Spike = a tiny
declarative layer stack applied generically:
- quoins on **all 4 corners**, full wall height (`run = eaveY-floor+1`), `headerDepth = 2` (rubble cobble);
- an eave **trim band** (`eaveOverhang`, stone_bricks, one course at eaveY) + a verge band one row down;
- opening **reveal** (timber `dark_oak_log` frame around the gate via `dressOpenings`).
The point of A: it's *generic and systematic* — no per-subject tuning. Tests "does a uniform geometry-derived
grammar read?"

### B. Curated style pattern-book — **build it**
A hand-tuned **rustic-gatehouse** recipe: pick the right subset and tune amplitude **per edge** for *this*
subject. Spike:
- **bold** rubble quoins (`headerDepth = 3`, full height) — deliberately louder than A;
- a **2-course** lighter stone eave/verge band (reads as a distinct band, not a single course);
- timber arch frame + reveal (`dressOpenings`);
- a subtle coursed-field belt (`surfaceRelief` row rhythm, low amplitude) for the dressed-stone read.
The point of B: highest *immediate* quality, least general. Tests "does curated/bold beat generic — or read
busy?"

### D. Iterative critique-amplification — **build it (simulated loop, deterministic)**
Start from the **token baseline** (quoin `run=4, headerDepth=1` — the E-42 amplitude) and apply 2 targeted
amplitude bumps, each fixing the weakest-reading element (the bump a render-critique *would* request):
- round 0 = token; round 1 = "quoins thin → `headerDepth=2`, full height"; round 2 = "arch absent → timber
  reveal". Render the **final** state; the progression is documented.
The point of D: it leans on what exists and closes the loop — but the spike runs the loop **by hand** (no LLM
this pass; the loop's *value* is automating the amplitude decision, which we can fake deterministically and
note). Its final state lands near A by construction → that comparison **is** the method-vs-amplitude test.

### C. Reference/concept-driven placement — **NOT built this pass (documented, not silently dropped)**
The model reads the concept/GLB and emits explicit relief for *this* build. It is the **most expensive**
(an LLM call per build) and **least reusable** candidate, and for the gatehouse the relief it would emit is
exactly what A/B encode by hand (bold corner quoins, timber arch, eave band) — so it cannot *out-glance* a
hand-tuned B on this subject; it can only match it at higher cost. Spiking it requires a `claude -p`
concept-read seam that does not yet exist, which is more than a scouting ticket should build. **Decision:**
defer C to S-176 (sourcing) where an LLM authors treatments for *unseen* subjects — that is where
concept-driven earns its keep (generality), not on a subject we can hand-author. Recorded as dropped-with-why
(anti-hedge: no silent truncation).

## Why this set (3 built: A, B, D) satisfies the spike

- **≥3 rough builds + beside-concept renders** (AC-1). ✓ A, B, D.
- It directly tests the load-bearing question (**method vs amplitude**) because A and D converge by
  construction and B is the louder/curated arm — the glance discriminates curated-vs-generic and
  bold-vs-busy.
- A **token baseline** panel is rendered too (the E-42 starting point) so the glance has a "before" — the gap
  the epic claims is real or it isn't.

## Rejected alternatives

- **Re-render via `wallSkin` directly.** `wallSkin` is the S-160 fixed recipe — but on the gatehouse its
  per-storey field no-ops and its quoins fire at the *default* run (token). Driving it gives ~the E-42
  baseline, not an amplitude sweep. Rejected as the spike vehicle; kept as the baseline reference (it's what
  "token" looks like). The spike instead drives `quoin`/`eaveOverhang`/`surfaceRelief` directly with explicit
  amplitudes — that *is* the experiment.
- **A real LLM critique loop for D.** Too slow/costly for a scouting ticket; the amplitude decisions a
  critique would make are obvious here (thin→deep) and can be applied deterministically. Noted as the thing
  S-175/S-176 would automate.
- **Touching production brushes.** Out of scope — spike lives entirely in `experiments/`; brushes unchanged.
- **Scoring the builds.** Explicitly *glance over score* (S-174 note). No judge, no corpus-referee.

## Decision

Build **A, B, D** as deterministic brush compositions over `builds/gatehouse/faithful/artifact.json`, plus a
**token baseline**, each rendered beside the concept into the work dir. Defer **C** to S-176 with rationale.
The recommendation in `review.md` will name the glance-winner (or call the tie / busy ceiling) and tell S-175
what to build, grounded on the renders.
