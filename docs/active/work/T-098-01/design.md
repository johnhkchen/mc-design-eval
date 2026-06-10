# T-098-01 placement-grammar — Design

## The decision in one paragraph

Two new pure cores + one impure runner. `src/view/frame-lines.mjs` derives the structural feature
instances (frame lines: floor-line beams, corner posts, roofline crown = eave beams + gable rakes;
bounded fields between them; roof courses) from an occupancy — geometry only, no materials.
`src/form/placement-grammar.mjs` binds kit entries to those instances (frame block, per-band panel
block, course block, per-opening treatment) and emits concrete placements. A new runner
`benchmarks/sculpture/placement-grammar.mjs` (npm `grammar:cottage` / `grammar:gatehouse`) composes
the grammar AFTER the committed durable-skin artifact — recorded pipeline order `durable-skin
(fill) → grammar` — re-asserts the fill contract by re-running `zoneFill` over the grammar output
(frame lines must be kept, not refilled), re-runs the coverage + band gates, proves double-run
byte-equality, renders before/after at the four config gate azimuths, and writes the committed
record + frames. No change to `buildSkin`, no change to committed durable-skin/challenge records.

## Decision 1 — composition point: downstream of durable-skin (chosen) vs inside buildSkin

**Chosen: downstream.** The runner reads `durable-skin/<subj>/artifact.json` (committed, sha-pinned)
plus the committed kit and zone-map records, and emits its own record. Rationale:
- AC#2 asks for *one recorded pipeline order*, not a rebuilt monolith. `durable-skin → grammar →
  (T-099 openings)` is that order; the record states it.
- buildSkin's outputs are agreement-asserted, sha-pinned committed records for cottage AND gatehouse,
  and challenge-milestone imports buildSkin — inserting a stage silently invalidates E-24/E-25
  records and the church challenge chain. A downstream stage leaves all of it byte-stable.
- "Frame lines survive the full-shell fill" is provable *as a property*, stronger than as a side
  effect: after applying grammar placements, re-run `zoneFill` (same zones/policy/skin) and assert
  zero of the grammar's frame cells get refilled — the declared-secondaries contract (T-090-01)
  doing exactly what it promises. Inside buildSkin this proof is unobservable (the fill runs first).

**Rejected: new stage 5b in buildSkin.** Would put grammar before splat/salt (nice layering) but
forces regenerating durable-skin + challenge records and frames for every subject this ticket
doesn't own, and couples T-098 acceptance to the budget-edge-flappy multi-angle judge
(`multi-angle-gate-findings`). Can be revisited when E-26 consolidates (a T-100-style ticket).

## Decision 2 — module split: geometry in src/view, binding in src/form

`frame-lines.mjs` answers "where are the lines/fields/courses" from occupancy alone — that is
structural-read's charter (pure, no GL, no materials), kept as a sibling module rather than growing
structural-read past its remit. `placement-grammar.mjs` answers "which kit entry goes on which
instance" — material semantics, sibling of kit.mjs. Each is unit-testable on synthetic data
(AC#1's "unit-tested on synthetic structural reads"). Rejected: one combined module (mixes layers,
harder synthetic tests); extending zone-fill (the fill is a base-coat painter; making it draw lines
overloads its keep/fill contract).

## Decision 3 — frame-line derivation (geometry, all from existing reads)

Inputs: `occ` (solidOccupancy of the artifact — fixtures are never recolored), `structuralZones`
(floorLines, storeyDivide, upperTop, roofKeys), `footprint`. Wall cell := occupied, side-exposed
(any of ±x/±z neighbor is air), and NOT a roofKeys member. Classification, in precedence order
(a cell takes its first matching kind; precedence recorded):

1. **cornerPost** — cell in a *corner column*: column (x,z) whose footprint-level exposure includes
   two perpendicular horizontal air directions (convex corner of the outline). Runs the column's
   full wall height → the rhythm shows on both storeys (AC#3) by construction.
2. **roofline** (eave beams + gable rakes, one derivation) — wall cell 6-adjacent to a roofKeys cell
   or to air above with `y ≥ upperTop - 1`. On flat-eave faces this traces the horizontal eave
   beam; on gable ends it traces the rake diagonal. One rule, no per-face special case.
3. **floorLine** — wall cell with `y ∈ interior floorLines` (floorLines strictly above the ground
   layer and strictly below upperTop — the storey boundaries; ground slab and eave line excluded,
   the latter already covered by roofline).

**Fields** = per band (zoneOf ∈ wall bands), the wall cells that are none of the above. For instance
identity (the "bounded fields" semantics + record stats), each ortho side face is projected
(`projectSurface`), frame cells masked, and `airComponents` of the masked silhouette enumerate the
field instances per face; placements, however, come from the world-cell predicate (exposure-robust —
projection under-covers oblique shells, T-090). **Roof courses** = roofKeys cells. **Openings** =
`openings(occ, dir)` per side face, passed through as instances (bbox, kind, dressing).

Known acceptable artifact: a chimney passing the roof plane gets a one-course roofline ring where it
meets the roof (adjacency rule); counted in the record, not special-cased (E-25 Rule 3 — no
subject-specific carve-outs).

## Decision 4 — binding rules (kit → feature), deterministic and data-only

All bindings consider **cube** entries only, excluding entries with
`valueCheck.verdict === "flagged-mismatch"` (the kit's own don't-trust flag; `thin-sample`/null
allowed — the kit had no swatch, not a contradiction). Ranking within candidates:
**whereUsed-specificity first** (fewer whereUsed terms = more specific claim — per
`kit-verification-shading-offset`), then confidence (high > medium > low), then block id
lexicographic (total order ⇒ determinism).

- **frame** ← candidates with `"trim" ∈ whereUsed`. Cottage: `spruce_planks` (sole candidate).
  Gatehouse: `cobblestone`. The AC's "stripped-log frame" names the concept's depicted material;
  the *shipped* block is the kit's recognition (E-26 thesis: recognition beats snap; E-25 Rule 3:
  no subject constants). Recorded as `bindings.frame` with the candidate list.
- **panel(band)** ← candidates with that band name ∈ whereUsed, minus the frame-bound block (fields
  are *between* frame lines — the frame block cannot also be the panel). Cottage band0:
  `stone_bricks`; band1: `smooth_sandstone` (specificity 1 beats spruce_planks' 3).
- **course(roof)** ← candidates with `"roof" ∈ whereUsed`. Cottage: `spruce_planks` (cobblestone is
  flagged-mismatch). Gatehouse: `deepslate_bricks`.
- **opening instance** ← kit fixture/rail entries with `"openings" ∈ whereUsed`; chosen treatment by
  kind: `door` openings take the candidate whose block id ends in `_door`/`door`; `window` openings
  take the highest-ranked remaining candidate (cottage: spruce_trapdoor). Block-id semantics are
  vocabulary facts, not subject constants. The binding (instance → treatment, state-capable
  placement schema) is emitted; **application is T-099's** — the grammar's placement list contains
  no fixture placements this ticket.
- **No candidate ⇒ no binding**: the feature class is skipped and recorded (`bindings.frame: null`,
  reason). Never a throw — church has no kit at all; the grammar must degrade to a no-op with an
  honest record.

Placements = recolor ops only (`{op:"voxel", pos, block}`) on existing cells — no air, no geometry
motion (`facade-recess-by-exclusion`). The core emits the complete binding (fields included even
where the cell already carries the panel block); the runner applies a diff (skip cells already
correct) so the artifact delta and the record's counts are meaningful.

## Decision 5 — gates in the runner (all deterministic; GL is evidence only)

1. **Fill-survival proof (AC#2)**: re-run `zoneFill` on the grammar output with the durable-skin
   record's shipped policy + zone map; assert no frame-line cell is refilled. Precondition asserted
   first: the bound frame block ∈ preserve of every wall band it paints into (it is — trim is a
   declared cross-band secondary by T-090-01; if a future kit binds a block outside the policy,
   that's an honest THROW, not a silent pass).
2. **Coverage gate + band evidence re-run** on the grammar output (same thresholds as durable-skin).
   Frame lines reduce the dominant's share; the contract says the skin must still be
   coverage-dominant. THROW on failure (E-25 Rule 6 honest-failure record).
3. **Reproducibility**: deterministic core twice, byte-identical artifacts, sha256 recorded;
   `--offline` re-asserts.
4. Renders: before (durable-skin artifact) / after (grammar artifact) at the four config gate
   azimuths (`MULTI_ANGLE_GATE.azimuths`, E-25 Rule 4 — config, not flags); composed labeled sheets
   → `pr/assets/frames/grammar-<subj>-{before,after}.png` (committed); raw PNGs gitignored.

## Rejected approaches (summary)

- **Inside buildSkin** — record blast radius across subjects/epics (Decision 1).
- **LLM-placed frame** — violates E-24 determinism; the whole point is a *grammar*.
- **Per-face 2-D line drawing as the placement source** — projection skins under-cover oblique
  shells (T-090); world-cell predicates over the exposure skin are the placement source, faces are
  used only to *enumerate field instances*.
- **Binding corner posts to corners-edges kit entries** — the ticket binds ALL frameLines to the
  frame block; corners-edges entries keep their preserve-only role (and cottage's quoin share in
  the concept bands is 0.002 — the concept itself says timber corners).
- **Requiring `verified` for all bindings** — would unbind gatehouse's frame (thin-sample) and any
  first-contact subject; flagged-mismatch exclusion is the right trust boundary.
