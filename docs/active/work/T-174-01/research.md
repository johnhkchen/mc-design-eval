# T-174-01 — Research: articulation-approaches spike on the gatehouse

Epic **E-43** (surface-treatment-grammar), Story **S-174**. This is a **scouting spike**: build rough
versions of the candidate articulation approaches on the gatehouse, render each beside the concept, pick the
glance-winner (or hybrid). Cheap over finished; glance over score; frozen instrument untouched. Descriptive
only — options live in `design.md`.

## What the concept asks for (the articulation gap)

Concept: `benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-…/concept.png`. A small grey stone
gatehouse under a steep gable. The articulation that *reads at the glance*:

1. **Bold rubble quoins** — rough cobblestone corner columns, ~2 cells wide, running the full wall height on
   **every** corner. The single loudest detail.
2. **Timber-framed arched gate** — a dark-timber reveal/frame around the gable-end arch (currently reads as a
   plain void).
3. **A lighter stone eave/verge band** on the dark roof — a course distinct from the roof field.
4. **Coursed dressed-stone field** between the quoins (subtler; the field vs quoin material contrast).

## The base build (post-E-42, material-faithful)

`builds/gatehouse/faithful/artifact.json` — the staged S-171 recognition build, re-named for the T-173-01
crater (see `builds/gatehouse/faithful/SOURCE.md`). Loaded via `artifactOccupancy` (src/view/occupancy.mjs):

- bounds min `[0,0,-1]` max `[14,28,15]`; **2287 cells**.
- materials: `stone_bricks` **1064** (wall field, y **0–19**), `dark_oak_planks` **1215** (roof prism, y
  **20–28**), `dark_oak_log` 4 + `cobblestone` 4 (a token door frame).
- ⇒ **eaveY = 19**; the wall band is y 0–19, roof above.
- The rubble quoins the concept shows are **essentially absent** (cobblestone:4) — this *is* the "token
  articulation / plain grey box" the epic names. Walls are faithful stone; the gap is relief amplitude.

Note: `builds/gatehouse/roof-covering/artifact.json` is the *other* gatehouse build (real covering roof, but
`polished_basalt` walls — material-unfaithful, a different pipeline per T-173-01 FINDINGS). The spike is
about **wall/opening** articulation (quoins, arch, trim, field), so the material-faithful `faithful` build is
the correct substrate; the prism-vs-covering roof question is orthogonal and out of scope here.

## The brushes that already exist (E-35 / E-42) — the spike's material

All pure, `occ → {placements, report}`, byte-stable, charter-bound (proud cells only in front of existing
exterior shell cells; recess by exclusion; idempotent). The epic's thesis is these *run* but fire at **token
amplitude** — the spike tests whether amplitude/composition is the lever.

- **`src/view/facade-articulation.mjs`** — `quoin(occ,{material,faces,run,headerDepth})` (corner columns,
  alternating stretcher/header depth, corners derived from `faceSkin` geometry); `eaveOverhang(occ,{material,
  faces,depth,eaveRow})` (one proud course at a row — reusable as a trim band); `pilaster`, `infillPanel`.
- **`src/view/surface-relief.mjs`** — `surfaceRelief(occ,{material,faces,rhythm{axis,every,span,phase},depth,
  zoneOf,zone})`, the shared proud-emission op (column/row rhythm). `reliefNoRegress(...)` is the no-regress
  predicate (in-plane mask + height ratios byte-identical) — the closure/silhouette guard the epic wants.
- **`src/view/wall-skin.mjs`** — `wallSkin(occ,{program,pack,floor,eaveY,extractApertures,dressOpenings})`
  and `wallSkinPlan(...)`: lowers a program's declared wall **roles** into an ordered relief plan (per-storey
  field → clinker → quoin → limewash → plinth) via `applyArticulation`; dresses openings via an injected
  seam. **The S-160 instance of a fixed recipe** — the thing E-43 wants to generalize. NB: on the gatehouse
  the per-storey-field brush no-ops (ground==upper role) so wallSkin's quoins fire at the default `run`.
- **`src/view/opening-dressing.mjs`** — `extractApertures(occ)` + `dressOpenings(occ,apertures,{slots})` for
  the arch reveal/frame/door (registry technique; reached via the injected seam, never imported by a brush —
  the brush-door tripwire).
- **`src/recognition/compile.mjs`** — `applyArticulation(occ, plan)` (the registry door, plan→placements),
  `roleBlock(pack, role)` (role→block authority).
- Idiom registry brushes (`src/pack/idiom-registry.mjs`): `quoin`, `eave-overhang`, `surface.clinker`,
  `surface.limewash`, `surface.fill`, `archConstruct`, etc. — the layer *implementations*.

## The render path (the glance, judge-free)

`src/view/render-beside.mjs` — `renderBesideConcept(artifact, conceptPath, outPath, {label})`: renders the 4
gate azimuths (`MULTI_ANGLE_GATE.azimuths`) textured + headless and prepends the concept panel.
`assertGlAvailable()` makes a GL-less host LOUD. **GL is available in this session** (the authoritative probe
is `render/src/render.mjs`'s `GL_AVAILABLE`, NOT a repo-root `require('gl')` which false-negatives).
`rebuildArtifact(occ, rawArtifact)` (src/view/shell-integrity.mjs) turns an edited occupancy back into a
renderable artifact (preserving palette/metadata).

## The proven runner pattern

`experiments/eval-alignment/skin-beside.mjs` and `roof-climb.mjs` are the template: load artifact →
`artifactOccupancy` → apply brush ops (each returns placements; fold into `occupancyFromCells([...occToCells,
...placements])`) → `rebuildArtifact` → `renderBesideConcept` into `docs/active/work/<ticket>/`. Concept path
for gatehouse: `benchmarks/sculpture/runs/015-…/concept.png`. These live under `experiments/` (unswept by the
brush-door tripwire, so they may import `opening-dressing` directly and inject the dressing seam).

## Constraints / assumptions

- **Cheap, throwaway, glance-judged.** Deliverable = a decision + beside-concept renders, not a system.
- **`npm test` must stay green** — spike code goes in `experiments/` (not swept by `src/**/*.test.mjs`); add
  no production-module edits. Frozen instrument (`measurements/`, pin-guard) untouched.
- The brushes are **additive proud relief** — quoins/bands/arch reveal cannot reopen closure (they only add
  cells in front of the existing shell). The "recess-by-exclusion reopens holes" risk applies to a *recessed
  field*; if a candidate uses one, `reliefNoRegress` is the guard.
- Roles → blocks for this gatehouse (rustic pack): quoins `cobblestone` (rubble), field `stone_bricks`
  (dressed), arch frame `dark_oak_log` (timber), roof trim `dark_oak_planks`.
- **Anti-hedge:** the spike can fail honestly — all candidates tie (lever = amplitude not method → S-175
  is amplitude), all stay flat (gated upstream), or the winner reads busy (ceiling = taste). Report which.
