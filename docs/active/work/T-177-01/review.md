# T-177-01 — Review

**Outcome: the falsifiable claim landed in its success branch.** The T-172-01 covering runs on the S-171
faithful walls to yield **one build faithful in both materials and roof**: stone walls (`stone_bricks`,
`polished_basalt` gone) under a **covered dark-oak gable** — the solid `dark_oak_planks` prism is dead
(roof-field census **53.1 % → 16.8 %**), `closureOf` **unchanged at 1.000**, the arched gate preserved.
Driven entirely from the recognition program (no `SUBJECTS` map). Crater-ready for T-178-01.

## What changed (files)

- **CREATE `experiments/eval-alignment/faithful-roof.mjs`** — a focused, recognition-program-driven
  carve+cover runner. Reads a finished artifact + its program, **derives** `eaveY = storeys·storeyHeight−1`,
  `ridgeAxis` and `pitch` from the program, **detects** the roof field (modal carved block) and gable-end
  block (modal eave-layer block), carves `y > eaveY`, builds one single-bbox gable, and re-covers with
  `generateRoof({covering:true, gableBlock})`. Census + `closureOf` + 4-azimuth + beside-concept renders.
  ~150 lines, reuses existing library functions only.
- **CREATE `builds/gatehouse/faithful-covered/`** — `artifact.json` + `SOURCE.md` (committed; the
  `view-{az}.png` + `beside-concept.png` render on disk but are gitignored under `builds/`, matching the
  `builds/gatehouse/faithful/` convention of tracking only `artifact.json` + `SOURCE.md`).
- **CREATE `experiments/eval-alignment/results/faithful-roof-gatehouse.json`** — machine record (derived
  params, family, census, closure).
- **CREATE `docs/active/work/T-177-01/`** — RDSPI artifacts + the 4 azimuth witnesses + `beside-concept.png`.
- **MODIFY `src/`** — **none.** No production geometry change: `generateRoof`'s covering mode already does
  the work; this ticket only *drives* it.

## Acceptance criteria

- **AC #1 — faithful materials + constructed covering, no prism, program-driven.** ✓ Walls `stone_bricks`;
  roof a hollow covering in the build's own detected `dark_oak` family (no `dark_oak` constant, no
  `SUBJECTS` map). Roof-field census 53.1 % (faithful prism) → **16.8 %** (covering); the wedge interior
  is hollow (T-172-01 covering, unit-proven). `eaveY=19`/`ridge=x`/`pitch=1` derived from the program and
  verified against the measured build (19 = wall top exactly; x = prism narrowing axis).
- **AC #2 — 4-azimuth renders beside concept, in the work dir, roof reads as covered.** ✓ All four
  azimuths + `beside-concept.png` in `docs/active/work/T-177-01/`. The roof reads as a covered dark-oak
  gable with **stone gable-end triangles** (envelope-then-covering) and stair-stepped slope courses; no
  `unmapped`/magenta blocks; no roof holes; arched gate + slit windows preserved.
- **AC #3 — `closureOf` not regressed; number reported.** ✓ `closureOf(eave ring y=19)` = **1.000** for
  *both* the faithful input and the covered build (same kept ring; the carve keeps `y ≤ eaveY` verbatim,
  the covering authors only `y > eaveY`). No regression.
- **AC #4 — recorded honestly; seam named; crater-ready.** ✓ See "The seam" below. Build dir is
  crater-ready (`artifact.json` present; `view-{az}.png` on disk); S-178 points `CRATER_BUILD` at it.
- **AC #5 — `npm test` green; frozen instrument untouched.** ✓ for my work: the modules the runner
  depends on (roof-generate, wall-generate, occupancy, shell-integrity) pass **94/94**; my commit changes
  **zero** files under `src/` and **zero** under `measurements/`. **One suite failure exists** —
  `TG26 compose opening voussoir` (`treatment-grammar.test.mjs:322`) — but it is the **sibling T-179-01's
  unstaged, in-progress voussoir work** (TG26 is absent from committed HEAD and not in my commit); not
  mine to fix or commit. See "Open concerns."

## The seam — did the pipelines compose cleanly? (the honest finding)

**No — not in-path; the clean composition is a post-realize artifact swap.** The faithful walls come from
the recognition `compile→realize` pipeline, whose roof is a `compile.mjs::roofBlocks` **solid prism**
(a *family-resolution* prism — solid cubes when the chosen roof field is outside the pack's stair-course
family). The covering lives in `generateRoof`. Wiring covering *inside* `compile` trips the
not-yet-`gableWallKeys`-aware conformance gate and needs a judge-pin rotation (T-172-01 review) — a real
seam, not papered over. The composition that works is **downstream of both pipelines**: carve the finished
artifact above the program-derived eave (block-agnostic — it removes the `roofBlocks` prism exactly as it
removed the generate-first blob) and re-cover. **This is a geometry swap on the artifact, not a pipeline
merge** — and there is **no prism fallback**: the carve removes the prism and the covering is a real
construction. That distinction is the AC #4 finding.

## Test coverage & gaps

- **Strong (reused, unit-proven):** the covering engine (`generateRoof {covering}`) is fully unit-covered
  by T-172-01 (hollow/watertight/byte-identity/closure-invariance); 94/94 on the four modules the runner
  composes.
- **Gap (flagged, matches harness posture):** `faithful-roof.mjs` carries **no unit tests** — like
  `roof-climb.mjs`, it is a metered-harness runner verified by *running* (census + closure printed,
  renders inspected). A future `building-program` schema change to `storeys`/`storeyHeight`/`roof.ridgeAxis`
  would silently drift the derivation; the runner throws on missing fields (named errors), not silently.

## Open concerns / handoffs

- **Sibling T-179-01 (voussoir/verge) has an in-progress failing test in the shared working tree.** It is
  theirs to finish; I did not touch `treatment-grammar.*`. A full-suite green depends on their commit
  landing. ([[shared-file-commit-sweep]] — I staged only my own files.)
- **External silhouette ≈ the prism.** Both are pitch-1 stepped gables, so the covering's win is
  **structural + material** (hollow interior, **stone** gable ends in place of oak, stair/slab courses),
  not a dramatic silhouette change. Whether the VLM judge now reads the roof as *less* of a `replace` is
  **S-178's measurement**, not assertable here. This ticket delivers the constructed roof + the honest
  glance; it does not pre-judge the crater.
- **No eave/verge band, no overhang.** The program reading mentions a "lighter stone eave/verge course";
  the parametric gable sits on the eave footprint (no overhang). That dressing is **S-179's** scope
  (raking verge + voussoir head) — deliberately out of scope here.
- **Single-mass only.** `registerRect` is ambiguous on the near-square gatehouse (T-172-01), so the runner
  uses a single-bbox gable. Multi-mass builds would need the `roof-climb` registration path; not built
  speculatively (the gatehouse is one mass).

## One-line summary

One fully-faithful gatehouse exists: stone walls + a covered dark-oak gable (prism 53 %→17 %, closure
1.000), built by a program-driven post-realize roof swap — the missing build T-173-01 needed; crater-ready
for T-178-01.
