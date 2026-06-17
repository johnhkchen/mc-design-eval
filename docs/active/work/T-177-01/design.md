# T-177-01 — Design

**Decision:** add a **focused, recognition-program-driven runner** that carves the realized faithful
artifact above the program-derived eave and re-covers it with `generateRoof({covering:true})` in the
build's own roof material, writing one crater-ready build dir. Reuse the existing library (no new
production geometry code). The seam is the **post-realize artifact swap** — the same seam `roof-climb.mjs`
proved — applied to the *faithful* artifact and driven entirely from the program.

## What "compose cleanly" means here (the seam, named)

The two pipelines do **not** compose *inside* `compile.mjs` — covering the recognition `roofBlocks` prism
in-path trips the `gableWallKeys` conformance gate and needs a judge-pin rotation (T-172-01 review). That
is a real seam and the AC says name it, don't paper it. The clean composition is **downstream of both
pipelines**: a finished `artifact.json` (walls from recognition, roof from `roofBlocks`) is carved by
`y > eaveY` and re-covered. The carve is block-agnostic, so it removes the `roofBlocks` prism exactly as
it removed the generate-first blob. **This is a geometry swap on the artifact, not a pipeline merge** —
and that honesty is the AC #4 finding.

## Options considered

### Option 1 — teach `compile.mjs`/`roofBlocks` to emit a covering (in-path merge)
- *Pro:* one pipeline; the recognition build would natively produce a covered roof.
- *Con:* trips the conformance gate (not `gableWallKeys`-aware), needs a judge-pin rotation, and is a
  family-resolution rewrite — explicitly scoped out by T-172-01. High blast radius, touches the measured
  conformance path. **Rejected:** disproportionate; risks the frozen instrument and the gate.

### Option 2 — reuse `roof-climb.mjs` as-is, repoint its gatehouse entry at the faithful build
- *Pro:* zero new files.
- *Con:* `roof-climb.mjs` is built on a per-subject `SUBJECTS` map with **hardcoded** `eaveY`, artifact
  path, and a **spruce** family — exactly what the AC forbids ("no `SUBJECTS` map — drive from the
  recognition program"). It also carries the metered `--score` crater (T-178-01's job) and the
  solid-prism census scaffolding. Bending it to the faithful build would deepen the hardcoding. **Rejected.**

### Option 3 — focused runner, fully program-driven, library-reuse (CHOSEN)
- A small runner `experiments/eval-alignment/faithful-roof.mjs` that:
  1. reads a build artifact + its recognition program (flags, gatehouse defaults — **no dispatch map**);
  2. **derives** `eaveY = storeys*storeyHeight − 1`, `ridgeAxis` and `pitch` from the program;
  3. **derives** the roof field family from the carved cells (modal block above the eave) so material
     stays faithful automatically — no hardcoded `dark_oak`;
  4. carves `y > eaveY`, builds one single-bbox gable from the eave footprint + program `ridgeAxis`,
     covers it (`generateRoof`), `gableBlock` = modal eave block;
  5. renders 4 azimuths + beside-concept, reports census + `closureOf`, writes the build dir.
- *Pro:* honors "drive from the program, no hardcoding"; reuses all proven library functions (no new
  geometry); leaves `roof-climb.mjs` and the frozen instrument untouched; output is crater-ready.
- *Con:* a second runner that overlaps `roof-climb.mjs` conceptually. Accepted: the AC's no-hardcoding
  bar and the faithful-material requirement make a clean-room program-driven runner the honest fit, and
  the overlap is library calls, not duplicated logic.

**Chosen: Option 3.**

## Derivations (the no-hardcoding core)

| value | source | gatehouse |
|-------|--------|-----------|
| `eaveY` | `masses[0].storeys * storeyHeight − 1` | 4·5−1 = **19** ✓ (= measured wall top) |
| `ridgeAxis` | `masses[0].roof.ridgeAxis` | **"x"** ✓ (= measured prism narrowing axis) |
| `pitch` | `pitchClass` (1→1) | **1** |
| roof field | modal block among carved (`y>eaveY`) cells | `minecraft:dark_oak_planks` (faithful) |
| `stairs/slab` | name-morph the field stem + `minecraft:` ns | `dark_oak_stairs` / `dark_oak_slab` |
| `gableBlock` | modal block at the eave layer of kept walls | `minecraft:stone_bricks` (= `gableRole`) |
| footprint | min/max x,z of the eave-layer kept cells | x[0,14] z[0,14] |
| `ridgeY` | `eaveY + floor(perpSpan/2)`, perpSpan ⟂ ridge | 19 + ⌊14/2⌋ = **26** |

Single near-square mass ⇒ skip `registerRect` (it is ambiguous here, T-172-01); a single-bbox gable from
the eave footprint with the program's `ridgeAxis` is unambiguous and correct for one mass. (If a future
build has multiple masses, the runner can fall through to the `roof-climb` registration path; not needed
for the gatehouse and not built speculatively.)

## Material faithfulness — why detection, not a constant

Hardcoding `dark_oak_*` would re-introduce per-subject knowledge. Instead the field is the **modal block
of the carved roof volume** — for the faithful gatehouse that is `dark_oak_planks` by construction, so
the covering inherits the build's *own* roof material. The result is the *same dark-oak roof*, only built
as a hollow covering with stair/slab slope courses instead of a solid prism. Materials stay faithful by
derivation, not by assertion. (`dark_oak_stairs`/`_slab` are dark-oak family — still "dark oak roof".)

## Risks & how each shows up

- **Stairs/slab `unmapped` at render.** Both are standard blocks; the glance render is the check. If a
  shaped id is missing, `generateRoof`'s family fallback uses full blocks — visible, not silent.
- **Covering reopens closure.** The carve keeps every `y ≤ eaveY` cell verbatim and the covering authors
  only `y > eaveY`, so the wall-band ring is untouched; `closureOf(eaveCols)` is reported and compared to
  the faithful input. If it moves, that is a finding (it must not).
- **Reads worse than the prism at the glance.** Then the covering pipeline isn't gatehouse-ready →
  localize in `review.md` (the falsifiable-claim branch). The 4-azimuth beside-concept is the judge.
- **Overhang loss.** The prism overhangs z by 1; the parametric gable sits on the eave footprint (no
  overhang). Acceptable — the eave/verge band is S-179's job; this ticket's bar is "covered, not a prism."

## Output

`builds/gatehouse/faithful-covered/` — `artifact.json` + `view-{+x+z,+x-z,-x-z,-x+z}.png` +
`beside-concept.png`. Crater-ready: S-178's `CRATER_BUILD` points straight at it. The faithful walls dir
(`builds/gatehouse/faithful/`) is left untouched as the prism baseline for comparison.
