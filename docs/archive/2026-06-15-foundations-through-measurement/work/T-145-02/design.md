# T-145-02 Design — storey-aware facade recognition

Decisions, with rejected alternatives. Grounded in `research.md`.

## D1 — How the storey band is represented in the grammar

The band must be (a) recognizable (the model emits it), (b) free of per-building constants (the y-range
derives from the mass's own geometry), (c) additive (absent ⇒ today's whole-wall behavior, byte-identical).

**Options**

- **(A) Named band enum** `band ∈ {"ground","upper","all"}` per face. The compiler maps the name to a
  y-range via the mass's `storeyHeight`/`eaveY`. Reuses the program's existing ground/upper wall split
  (`m.walls.ground` / `m.walls.upper`). Natural for the model ("the upper plaster storey"; "the whole
  wall below the eave").
- **(B) Storey-index range** `band:{from,to}` (0-indexed, inclusive). More expressive but asks the model
  to reason in storey indices; over-general for the two subjects in scope.
- **(C) Explicit y-band** `band:{yLo,yHi}` in cells. Direct but couples the grammar to absolute geometry
  — a per-building constant, breaks if `storeyHeight` changes; violates AC#4.

**Decision: (A) named enum.** It maps cleanly to both subjects (cottage `"upper"`, barn `"all"`),
reuses an existing semantic vocabulary, keeps the y-range derived (no constants), and is the most
recognition-natural. The y-range mapping (compiler-side, from `sh = storeyHeight`, `eaveY = storeys*sh`):
- `"ground"` → `[0, sh-1]`
- `"upper"`  → `[sh, eaveY-1]` (storeys 1..n-1 — the existing "upper" wall band)
- `"all"`    → `[0, eaveY-1]` (whole wall **below the eave** — excludes the gable triangle, so no roof punch)

`band` is **optional**; absent ⇒ no zone restriction emitted ⇒ byte-identical legacy plan. (B)/(C)
rejected as above. Extensibility to a `{from,to}` form later is not precluded — the field can grow.

## D2 — How the band reaches the brushes (pure-data plan)

The plan is replay-stable pure data; a `zoneOf` **function** cannot ride in `params` (research §compiler).

**Options**

- **(A) Band as data in params; brush builds the predicate.** `facadeArticulationPlan` derives
  `{yLo,yHi}` from the named band and adds `band:{yLo,yHi}` to the pilaster / infill-panel / quoin
  params. Each brush, when `band` is present, constructs `zoneOf=(pos)=>pos[1]>=yLo&&pos[1]<=yHi?…` and
  threads it into `surfaceRelief` (composing with quoin's existing `restrict`). Plan stays pure data.
- **(B) `applyArticulation` translates band→zoneOf before calling the brush.** Keeps the brush interface
  but puts facade-specific band logic into the generic apply loop (it iterates brushes by name) — a leak.
- **(C) Put the zoneOf function in the plan.** Violates the pure-data / replay-stable invariant.

**Decision: (A).** Band travels as pure `{yLo,yHi}` data; the brush owns predicate construction. This
keeps `facadeArticulationPlan` replay-stable, `applyArticulation` generic, and concentrates the
band→predicate logic in the brushes that already accept `zoneOf`. The existing `zoneOf`/`zone` direct
params stay (back-compat, unit-test injection); `band` is a higher-level convenience that derives them.

## D3 — Recognition: teaching the model to emit the band

`facadeDigest` gains a short clause: per-mass storey structure is already printed (`storeys×storeyHeight`);
add the band vocabulary and per-subject cue — "name the storey band each face's articulation occupies:
`ground` / `upper` / `all` (whole wall below the eave). Half-timber framing belongs to the plaster
`upper` storey; a stone field that runs full-height is `all`." The facade sub-schema (handed verbatim)
will carry `band`, so the typed shape teaches it too.

Changing `facadeDigest` changes its sha → **regen `fixtures/facade/prompt.txt`** via the production fn
([[pack-edit-blast-radius]]), and re-pin the cottage/barn live `prompt.md`/records when the live pass runs.

**Rejected:** leaving the prompt silent and only documenting the band in the schema description — the
model reads the digest as the primary instruction; a silent field invites omission or guesses.

## D4 — Validation of the band

`validateProgramAgainstPack` check 9 + `assertBuildingProgram` (schema). The schema constrains
`band` to the enum. The code gate adds one consistency rule: **`band:"upper"` requires `storeys ≥ 2`**
(a single-storey mass has no upper band). `"ground"`/`"all"` are always valid. `band` is geometry, so
`assertFacadeDiegetic` is untouched (no new material role).

**Rejected:** deriving the band from `treatment`/`walls` instead of recording it — that re-introduces a
hard-coded heuristic ("timber-frame ⇒ upper") and the spike's whole lesson is that the band must be
*recognized and recorded*, not inferred at apply time.

## D5 — Fixing the barn grammar roles

`relief/barn-grammar.json` is mis-rolled and bandless. Two parts:
1. **Live recognition** (AC#1) is the real producer: run the pass for cottage + barn with
   `--ticket T-145-02`; the model emits correct per-subject roles + band; commit the offline records.
2. The stray hand-authored `relief/barn-grammar.json` is corrected for consistency
   (`memberRole: wall.dressing`, add `fields.role: wall.field.ground`, `band:"all"`) so the repo holds
   no mis-rolled grammar. It is not on the compile path; it is reference/spike scaffolding.

## D6 — Render proof

`renderBesideConcept` over the **realized + articulated** build:
- Cottage: clean workshop build (`workshop/cottage/final-artifact.json`) → `compileProgram` articulation
  (or the recognized grammar) → `applyArticulation` → render beside the cottage concept.
- Barn: rides S-159's watertight seed for a clean shell; until then the barn proof is best-effort and the
  cottage carries the primary proof (the spike already proved cottage; AC#3 names the cottage as the
  now-provable subject).
- Output to `pr/assets/frames/`. Judge-free (`render-beside.mjs`), GL probed loudly.

## D7 — Environment reality (live model + GL)

The deterministic core (schema, validation, prompt, compiler threading, unit tests) is fully achievable
offline and is the bulk of the value. The **live recognition run** and **GL render** are
environment-dependent. Plan: land + commit the deterministic core first (tests green); then attempt the
live pass and render; if the shim or GL is unavailable in-session, record it as the remaining
producer/CI step in `progress.md`/`review.md`, with the corrected hand-authored grammars + an
offline-replayable record as the proof-of-shape. Faithful reporting over a green-looking but unrun claim.

## Acceptance-criteria mapping

- **AC1 storey-aware live grammar, correct roles** → D1 (band field) + D3 (prompt) + D5 (live run).
- **AC2 compiler honors the band** → D2 (band data → brush zoneOf) + the threading in
  `facadeArticulationPlan`.
- **AC3 render proof** → D6.
- **AC4 byte-identical offline + fixture + npm test + no constants** → D1 (optional, derived), D2 (pure
  data), D4 (additive validation), D3 (regen fixture prompt via production fn).
