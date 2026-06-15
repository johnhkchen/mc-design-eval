# T-025-01 Plan — massing-bookend

Ordered, independently-verifiable steps. Each is commit-sized; the whole ticket is small
enough to land as one commit after the suite is green, but the steps below are how it is
built and checked. Testing strategy and verification criteria are inline.

## Step 1 — `massing.mjs`: constants + contract + `conceptGridSource`

- Module header (boundaries: spine-only imports; no `image-grid` import; the adapter is
  the one concept-grid-aware spot). `MASSING_BLOCK`, `MASSING_STYLE`, the
  `MassingSource`/`Proportions` typedefs.
- `conceptGridSource(gridResult, {flipY=true})`: read `.grid/.n/.m`; `occupied()`
  generator yields `{x:gx, y: flipY ? m-1-gy : gy}` for each `grid[gy][gx] !== null`.
- **Verify:** none yet (covered by Step 4 tests). Lint by eye against structure.md.

## Step 2 — `massing.mjs`: `proportionsOf`

- `occupiedCells(state)`; empty → zeros + `bounds:null`. Else min/max over x,y; bbox
  `width`/`height`, `aspect=round2(w/h)`, `occupied`, `fill=round2(n/(W*H))`.
- `round2` local helper.
- **Verify:** Step 4 group 6.

## Step 3 — `massing.mjs`: `mass` + `compileMassing`

- `mass(source)`: `createBuildState` → `defineStage({name:"massing", run})` setting
  `occupied:true` per `source.occupied()` cell → `runStages` → `{state, proportions:
  proportionsOf(state)}`.
- `compileMassing(state, opts)`: `toDesignArtifact(state, {defaultBlock:MASSING_BLOCK,
  style:MASSING_STYLE, ...opts})`.
- **Verify:** Step 4 groups 3,4,5,7,8.

## Step 4 — `massing.test.mjs` (the eight groups from structure.md)

Test fixtures (pure, no decode):

- `gridOf(rows)` helper: take an array of strings where each char is `#` (occupied →
  any block id, e.g. `"minecraft:white_wool"`) or `.` (air → null); produce
  `{grid, n, m}`. Lets a test draw a silhouette literally:
  ```
  gridOf(["..#..",
          ".###.",
          "#####"])   // a 5×3 triangle; bottom row full
  ```
- A `laterStage(patch)` helper using `defineStage` to attempt a write over `mass`'s
  locked state, for the lock-enforcement group.

Groups:
1. adapter occupancy + flip (top row → max Y; `flipY:false` passthrough; all-air → no
   cells).
2. adapter no-leak (items are `{x,y}` only; source keys are `width,height,occupied`).
3. mass sets occupied; material null / relief 0; un-yielded cells air.
4. mass locks only `occupied`; lockLog `[{stage:"massing",fields:["occupied"]}]`;
   material/relief unlocked.
5. S-024 enforcement: occupancy flip → `LockViolationError` (write-time); bypass →
   `StageRejectedError` (accept-time); a material/relief write SUCCEEDS.
6. proportions: bounds/width/height/aspect/occupied/fill on a known silhouette; empty
   state → nulls/zeros; `mass().proportions` equals `proportionsOf(mass().state)`.
7. gray compile: `manifest === [MASSING_BLOCK]` (single material); round-trips
   `parseArtifact`/`assertArtifact`; one voxel per occupied cell at `[x,y,0]`;
   `style.name==="massing"`; metadata override flows.
8. end-to-end: grid → mass → compileMassing → `assertArtifact` ok; placement count ===
   filled cells; Y matches the flip.

- **Verify:** `node --test src/sculptor/massing.test.mjs` green. Watch the
  `assert.throws()` returns-`undefined` gotcha — assert with `(fn, /regex/)`.

## Step 5 — barrel + README

- `index.mjs`: append the massing re-export block (additive).
- `README.md`: add the short massing-bookend subsection.
- **Verify:** `node -e "import('./src/sculptor/index.mjs').then(m=>console.log(typeof m.mass, typeof m.conceptGridSource))"` prints `function function`.

## Step 6 — full suite + commit

- `npm test` — expect the prior 230 green **plus** the new massing tests, all passing;
  schema self-tests unaffected.
- Commit: `feat(sculptor): massing bookend — locked gray shell from a form source (T-025-01)`.
- Write `progress.md` alongside.

## Testing strategy summary

- **Unit, pure, no I/O** — every assertion runs on hand-built grids/states; no image
  decode, no GL, consistent with the spine's `*.test.mjs` and `image-grid.test.mjs`.
- **Real gate, not a mock** — the compile round-trip asserts against the live
  `src/artifact.mjs` AJV validator (the same gate the render tool's door uses), which is
  this codebase's accepted proof that render/judge/export stay unchanged (the "renders"
  AC). Full GL render stays out of `npm test` by project convention.
- **Lock proof is behavioral** — group 5 drives a real later stage through `runStages`
  over the locked shell and asserts the throw/reject, rather than only inspecting the
  `locked` set.

## Risks & mitigations

- **R1 — orientation wrong (facade upside down).** Mitigated by the explicit flip test
  (group 1/8 assert top image row → max Y) and the `flipY` switch for Y-up GLB sources.
- **R2 — accidentally locking `material`/`relief`.** The massing stage writes only
  `occupied`; group 4 asserts the other two stay unlocked and group 5 asserts a later
  material/relief write succeeds. If this fails, the bookend would wrongly block T-027/8.
- **R3 — concept-grid leak.** Group 2 asserts the source exposes no block ids; the module
  not importing `image-grid.mjs` is the structural guarantee.
- **R4 — `assert.throws()` undefined-return gotcha** (already hit in this module). Use
  the `(fn, /regex/)` form, never read the return value.
