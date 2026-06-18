# T-196-01 — RESEARCH: where orientation + scale could be SEEN, and the re-climb wiring

Story **S-196** / Epic **E-51**. M1 capstone for the gatehouse. Two jobs: (1) **widen the picture-critique**
so it sees **roof-orientation-vs-facade** and **scale/proportion**; (2) **re-run the gatehouse climb** with all
E-51 hands (carve S-194 + relief S-195) + the wider eyes. Descriptive only — no solutions here.

## 1. The critique pipeline today (what it sees, and what it is forbidden to see)

- **`baml_src/department.baml`** — `DiagnoseBuild(...) -> Critique`. The judge compares build renders to the
  CONCEPT IMAGE (E-47 anchoring). `CritiqueItem = {department, expected, present, missing, kind∈{add,replace,
  remove}, severity∈{minor,major}}`. `Critique = {items[]}`. The prompt **explicitly excludes** size: *"Judge
  element-level construction … AS THE CONCEPT IMAGE SHOWS IT, **NOT overall size or proportion**"* (line 101).
  No mention of roof orientation / gable direction / facade-facing anywhere.
- **`src/workshop/diagnose.mjs`** — `diagnoseRenderArgs({program, pack, azimuths, maxItems})` serializes the
  typed string inputs. `programBlock` emits per-mass JSON (roof idiom, wall roles, openings). `styleProfileBlock`
  emits per-pack NAMING vocabulary only (the concept image is the standard). No orientation, no proportion.
- **`src/pack/departments.mjs`** — `DEPARTMENTS = ["CHIMNEY","OPENING","ROOF","ROOM","WALL"]`. Mirror-pinned to
  `enum Department` in the .baml by `departments.test.mjs` (DPT3). **Every department must own ≥1 idiom**
  (conformance DPT) — a bare ORIENTATION/SCALE department would name zero idioms and break the partition.
- **The S-163 decision, recorded in FIVE places** (`departments.mjs:19-25`, `department.baml:17-21`,
  `diagnose.mjs:9-11`, `defect-corpus.mjs:14`, prompt line 101): *proportion/massing is a SEPARATE AXIS, not a
  department; no registry idiom resizes a mass, so it rides the mass `adjust-params` geometry levers off this
  contract. A structured proportion critique, if ever needed, is a **schema-v2 axis**, not forced here.*
- **`src/baml/fixtures/diagnose`** — DiagnoseBuild has **byte-pinned golden fixtures** (FX-DB1 in
  `src/baml/fixtures.test.mjs` / `critique-contract.test.mjs`); any prompt or arg-serializer change re-bakes them.

**Consequence:** orientation and scale cannot be added as CritiqueItem departments without breaking the
partition, and cannot be taught to the VLM prompt without re-baking pinned fixtures and inviting exactly the
absolute-size false-positives the ticket warns against. The recorded sanctioned path is a *separate axis*.

## 2. The data that already exists for orientation + scale (deterministic, not VLM)

- **Roof orientation datum — `ridgeAxis`.** `schema/building-program.schema.json:129` carries `roof.ridgeAxis ∈
  {"x","z"}` per mass. It is pervasive: `measured-program.mjs:162` (`mass.roof.ridgeAxis`), `form/roof-fit.mjs:93`
  (eave-dir perpendicularity), and `picture-climb.mjs:69-70` reads `program.masses[0].roof.ridgeAxis` into `CFG`.
  The gable END is perpendicular to the ridge; the gable faces ±(ridgeAxis direction). **The datum exists but is
  never compared to the front/gate, and never surfaced into the critique.**
- **Declared front / gate.** `gatehouse.program.json` openings carry an arched door (`kind:"door", head:"arch",
  w:4, h:8`) on the **−x** wall. `src/building.mjs:161` asks the brief to state "the entry side." So the FRONT is
  declared in the program (the gate-bearing wall). The "gable faces the declared gate" test is fully derivable:
  `frontAxis == ridgeAxis ?`.
- **Proportion machinery (exists, on the FUSED path — off the picture-climb).** `measured-program.mjs:344`
  `silhouetteRatios(workshopProgram)` → `{ridgeToEave, roofShare, aspect}` (NB: takes a *compiled* workshop
  program with `elements[]/spec`, **not** the recognition program-JSON the picture-climb loads). `:365`
  `sketchTargetRatios(sketch)`. `critique.mjs:59-66` runs a `proportion-vs-concept` check; `loop.mjs:62-87`
  reads `proportionRegression`. **None of this is wired into `picture-climb.mjs`.** The picture-climb's program
  is the recognition `masses[]` JSON, not a workshop `elements[]` program — so `silhouetteRatios` is not directly
  callable there; build ratios must come from occupancy or the recognition masses.
- **Pack proportions.** `packs/rustic.json` carries `proportions.pitchClasses`, `storeyHeight`. Declared target
  height = `storeys × storeyHeight`; declared footprint = mass `rect.w/d`.

## 3. The climb runner and its gate (what re-running needs)

- **`experiments/eval-alignment/picture-climb.mjs`** (515 lines, no npm script; `node …`).
  - Seed wiring (56-62): `SUBJECT=gatehouse`, `SEED_ARTIFACT`, `PROGRAM_PATH`, `PACK_PATH=packs/rustic.json`,
    `MATERIAL_MAP_PATH`, `CONCEPT` (the 015 gatehouse run). `CFG.ridgeAxis` ← program (69-70).
  - **Nine hands** in `TOOLS`/`MENU`/`agentPick` JSON enum (300-312, 369): incl. `carve_arch` (T-194-01) and
    `relief_walls` (T-195-01) — **already wired** (confirmed in all four places + `climb-gate.mjs`
    `TOOL_DEPARTMENTS`). Each hand is a pure `(occ)=>occ`.
  - **Loop** (435-490): round-0 `scoreBuild` → `agentPick`; per round apply hand → no-op guard (digest) →
    `scoreBuild` cand → `acceptsRound` (department-dominant override) → keep/rollback → `agentPick` next →
    `stoppingDecision`. `CLIMB_DEFAULTS = {margin:4, stallK:2, maxRounds:5, minRounds:3}`.
  - `scoreBuild` (332-348): renders 4 azimuths + `renderBesideConcept`, then VOTES=3 median `DiagnoseBuild`.
    **GL required** (`assertGlAvailable`, 379). `GUARD_ONLY=1` renders the seam + beside sheet and exits before
    any LLM spend (the zero-spend wiring proof).
  - `agentPick` (352-373): builds the prompt from the **top-5 critique items** + history + MENU. **This is where
    a new "eyes" signal must be injected** for the agent to act on it.
  - Trajectory written to `CLIMB_OUT ?? docs/active/work/T-188-01/trajectory.json` (496-504), schema
    `picture-climb/v1`, with `inventory` from `classifyInventory`. Per-round renders under
    `builds/gatehouse/picture-climb/round-*/`.
- **`src/workshop/climb-gate.mjs`** (pure, in npm test): `TOOL_DEPARTMENTS` (all nine hands),
  `acceptsRound`/`departmentDominant` (the accept-gate), `stoppingDecision`, `classifyInventory` (eyes-vs-hands:
  a department NAMED in a critique but reached by no accepted tool is **EYES-ONLY**). The inventory keys on
  **departments** — framing (not a department) would need its own residual channel.

## 4. The two E-51 hands this re-climb must exercise (from the sibling reviews)

- **`carve_arch` (T-194-01):** carves the declared gate to width-8, single continuous dressed aperture,
  `arched=true`, 12-cell arch ring; `closureOf 0.05→0.05`, 0 non-aperture columns dropped; self-reverts to
  `frame_arch` if the aperture-coherence gate rejects. **Named gap:** never exercised by a live metered pick.
  Readability waits on a dense wall shell (S-195).
- **`relief_walls` (T-195-01):** recolor 3632→`stone_bricks` + 215 proud quoin + 106 plinth cells (321 proud vs
  0 from `articulate_walls`); `closureOf 0.615→0.779`, 0 dropped. Glance "richer, not busier." **Named gap:** the
  WALL-major-clears claim is **unproven until this metered re-climb** — if the critique is relief-blind, that is
  the S-196 coverage gap, localized to here.

## 5. Constraints any change must respect

- **DPT3 mirror + DPT idiom-ownership** pin the department set — do not add a department.
- **FX-DB1 byte-pinned fixtures** re-bake on any DiagnoseBuild prompt / arg-serializer change.
- **Frozen instrument** (`measurements/`, `bakeoff-score.mjs` scalar, schema, BAML judge) must stay untouched
  (E-32 Rule 2). The scorer is **department-breadth driven** — folding an unfixable framing penalty into the
  scalar would lower every score uniformly (noise) and the AC explicitly forbids mis-fire.
- **No hand fixes orientation/scale** → seeing them yields a *named residual*, not a climb action. The ticket
  designs for this: "a fourth gap → name for E-49."
- **Proportion ≠ absolute pixels** — a uniform up-scale must read as a framing caveat (quiet), only a
  proportion DISTORTION is a divergence. This is the genuinely-uncertain hard middle (anti-hedge).
- The picture-climb is GL+LLM (out of `npm test`); the wider-eyes logic must be a **pure module** to be
  unit-tested (flags-when-wrong / quiet-when-right on the gatehouse + fixtures).
