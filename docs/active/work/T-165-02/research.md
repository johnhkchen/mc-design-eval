# T-165-02 — Research

**Ticket:** second-genuinely-different-style (Story S-165, Epic E-39). Supply a **second, non-rustic**
style as a Layer-A `expected` profile whose roof/wall/opening expectations differ in *grammar*, not just
block choice — and a concept to test it against. Descriptive map only; no solutions here.

## Where the `expected` profile comes from (the mechanism T-165-01 built)

The Layer-A judge (`DiagnoseBuild`) forms its `expected` from `src/workshop/diagnose.mjs`:
`styleProfileBlock({ pack })` (diagnose.mjs:57) renders THE STYLE'S CONSTRUCTION GRAMMAR — three lines:

- **ROOF**: palette materials whose `role` ∈ `roof.*`; covering idioms where `departmentOf(name)==="ROOF"`;
  `pitchClasses`.
- **WALLS**: palette materials whose `role` ∈ `wall.*` / `frame.*`; idioms where `departmentOf==="WALL"`.
- **OPENINGS**: palette materials whose `role` ∈ `door.*` / `window.*` / `opening.*`; idioms where
  `departmentOf==="OPENING"`.

`diagnoseRenderArgs` (diagnose.mjs:91) keys `style` on `program?.style ?? pack.style` and emits
`style_profile` + `palette_block`. So **the entire `expected` profile is a pure function of the pack** —
its palette roles, its idiom list, and its `pitchClasses`. There is no per-subject table; editing the pack
is the only lever. A "second style" therefore = a new validated pack whose three grammar lines read
differently.

## The grammar vocabulary — and its ceiling (the crux of this ticket)

`styleProfileBlock` buckets idioms with `departmentOf` (`src/pack/departments.mjs:50`), which keys on idiom
NAMES. Crucially, a pack's idioms are **not free text**: `validateStylePack` step 2
(`src/pack/style-pack.mjs:129`) rejects any idiom not in `IDIOM_REGISTRY`
(`src/pack/idiom-registry.mjs:206`). A committed pack that names a foreign idiom fails loud. So the
expressible grammar is exactly the registry's 26 idioms — I cannot invent `roof.flat` to fake a second
language.

The full registry, bucketed by `departmentOf` (derived, confirmed by running it):

- **ROOF**: `roof.gable`, `roof.gable.steep`, `roof.hip`, `roof.pyramid`, `roof.thatch`, `dormer`,
  `surface.roof-courses`. **Every one is a PITCHED roof.** There is no flat, parapet, mansard, gambrel,
  dome, vault, or deep-eave idiom. This is the registry ceiling on roof form.
- **WALL** (fall-through): `pilaster`, `quoin`, `infill-panel`, `eave-overhang`, `jetty`, `plinth`,
  `timber-frame`, `course.stairs`, `course.slab`, `surface.clinker`, `surface.limewash`, `surface.relief`,
  `surface.fill`, `surface.paint`, `surface.strip-salt`. **Rich** — classical (`pilaster`/`quoin`) and
  vernacular (`timber-frame`/`jetty`) wall systems both exist as distinct idioms.
- **OPENING**: `arch`, `head.flat`, `opening-dressing`. Round-arch vs flat-lintel are **distinct idioms**.
- **CHIMNEY**: `chimney`. **ROOM**: `hollow`, `floorplan`.

**Implication, stated up front (the falsifiable claim's failure mode lives here):** a second style can
genuinely differ on WALL grammar (`pilaster`/`quoin` vs `timber-frame`) and OPENING grammar (`arch` vs
`head.flat`) at the *idiom* level — not a recolor. But the ROOF axis can only vary *within* the pitched
family (hip vs gable, shallow vs steep, stone vs timber courses). A roof language orthogonal to "pitched"
is **not expressible** with the current registry. That gap is a candidate finding, not a thing to paper
over.

## How rustic and saltcrag already sit (the baseline T-165-01 shipped)

Both are **vernacular rustic-family** styles (`packs/rustic.json`, `packs/saltcrag.json`):

- rustic: steep timber gable (`roof.gable`/`hip`/`pyramid`/`dormer`, pitchClasses `[1,2]`, `spruce_planks`);
  `timber-frame` + `jetty` walls (`frame.timber`=`dark_oak_log`, plaster `white_terracotta`); `head.flat` +
  `arch` openings (lattice `dark_oak_trapdoor`).
- saltcrag: dark-oak tarred gable (`roof.gable` only, pitchClasses `[2,1,0.5]`); NO `timber-frame`
  (limewash + `surface.*`); `head.flat` openings, NO `arch`.

DG5 (diagnose.test.mjs:67) already proves these two differ — but both are pitched-roof stone+timber
vernacular. The ticket's bar ("genuinely different", "not a rustic reskin") is precisely about reaching a
*different family* (polite/classical) rather than a third vernacular variant.

## What a pack must satisfy (constraints on a new pack)

`validateStylePack` (style-pack.mjs:110) is fail-loud on a committed pack (`loadStylePack` throws):

1. **Provenance referential integrity** — every `palette[].provenance` key ∈ `provenance.sources`.
2. **Idioms resolve in the registry** + their style `params` satisfy the idiom's `paramsSchema`.
3. **`valueCheck` snapshot is TRUE** against the committed block-Lab table: `formClass` re-derived (cube iff
   in the 305-table, `rail` by name, else `fixture`), `inTable`, `family` (= `familyOf(block)`), and for a
   cube the exact `lab` triple; a cube must not be an excluded candidate (ore/gravity).
4. **Proportions** sane; `pitchClasses ⊆ {0.5,1,2,3}` (the generator vocabulary).
5. **Conformance** check names ∈ `CONFORMANCE_CHECK_NAMES`.
6. **Zone seats** — every named band has exactly one `dominant`; a `preserve` entry needs a dominant in its
   band.

I derived correct `valueCheck` snapshots for classical-stone blocks by running the same functions the
validator uses (`derivedFormClass`/`familyOf`/`loadBlockTable`): e.g. `smooth_stone`
lab`[65.491,-0.002,0]`, `stone_bricks` `[51.223,-0.002,0]`, `chiseled_stone_bricks` `[50.148,0.578,-0.414]`,
`polished_diorite` `[78.121,0.368,-1.002]`, `deepslate_tiles` `[23.069,-0.001,0]`; `stone_brick_stairs`/
`stone_brick_slab` are `fixture`/`inTable:false`/`family:"stone"` (no `lab`); `dark_oak_door` `fixture`/
`family:null`; `glass_pane` `rail`. All non-excluded.

`ratification` is **optional** (schema:138) — rustic itself omits it. A new eval-only profile can omit it
honestly (it is an `expected` profile for the creation-loop judge, not yet a human-ratified build style).

## Consumers and blast radius

- **diagnose** reads any pack passed to it — no enumeration, no count. Adding `packs/guildhall.json` touches
  nothing automatically.
- **No test globs `packs/*.json`** or asserts a pack count (grep: `style-pack.test.mjs` references
  `rustic.json` by path; `diagnose.test.mjs`/`fixtures.test.mjs` reference specific packs). So a new pack
  file breaks no existing pin; the FX-DB1 diagnose golden (barn+rustic) is untouched.
- **Build path (out of scope here):** `seed.mjs`/the workshop would only realize this style if a build were
  routed to it; this ticket supplies the **Layer-A `expected` profile + a wrong-style fixture**, not a built
  guildhall. The frozen instrument carries no BAML/pack dependency (TG4).

## Concepts available on disk

`benchmarks/temple-facade/concepts/` holds non-rustic stone concepts (`arc-*` triumphal arch — dressed
ashlar + round arch; `mausoleum-*`, `chapelle-*`, `taj-*`, `horyuji-*`). The domed/minareted ones are NOT
registry-buildable (no dome idiom). `arc-A-flash.png` is the closest *grammar* match (dressed stone, round
arch) but is a monument, not a house-scale building. A perfectly house-scale matched concept render is
S-166's bake-off asset (S-166 AC2: "renders beside both concepts"); sourcing a fresh image is an
outward/metered image-gen call, out of scope to fire unprompted.

## Open questions for Design

1. Which architectural language maximizes idiom-level (grammar) contrast to rustic *within the registry*?
   (Polite/classical: `pilaster`+`quoin`+`arch`+dressed ashlar + shallow hip — vs vernacular
   `timber-frame`+`head.flat`+steep gable.)
2. How to record the ROOF-form ceiling honestly (AC3) — what exactly routes to a generator epic.
3. What is the T-165-02 *provable* witness (a deterministic wrong-style fixture, mirroring DG5/DG6) vs what
   is deferred to S-166 (the live crater + matched render).
</content>
</invoke>
