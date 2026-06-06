# T-044-01 — Review: region-lock-and-observe

Handoff document. What changed, how it's tested, what a reviewer should scrutinize, and the known
limits passed to S-045.

## What changed

Two new source files + one new live test; no existing file modified or deleted. New directory
`src/revise/` — the E-15 surgical-revision-loop home (S-045's loop and S-046's LLM editor will sit
beside `region.mjs`).

| File | Lines | Role |
|------|------|------|
| `src/revise/region.mjs` | ~280 | Pure region addressing + the per-region lock; one lazy GL leaf `observeRegion`. |
| `src/revise/region.test.mjs` | ~230 | 16 pure unit tests (Groups A–E). |
| `render/test/observe-region.test.mjs` | ~70 | 2 GL-gated live crop renders on the committed koi. |

Commits: `562b74e` (region core + pure suite), `e315fc5` (observeRegion + live proof).

## Public surface (`src/revise/region.mjs`)

- **Addressing:** `selectRegion(artifact, spec, {fraction?}) → R`. `spec` ∈ `{min,max}` |
  `{bbox}` | `{part}` | `{where}` | a bare `where` string. `R = {schema, spec, subBounds,
  placements, indices, fraction}` (frozen). `subBoundsOf(R)`.
- **Resolution helpers (pure, exported for testing/reuse):** `placementBounds`, `artifactBounds`,
  `coordInBounds`, `boundsContain`, `clampBounds`, `resolveNamedRegion`, `resolveWhereRegion`.
- **The lock:** `applyRegionEdit(artifact, R, edit) → artifact'` where `edit` is a replacement
  placement array **or** a `(inRegion) => placements` editor fn. Throws `RegionEditOutOfBoundsError`
  (`.code = "region_edit_out_of_bounds"`) on any out-of-R voxel.
- **Observe (live, lazy GL):** `observeRegion(artifact, R, {outPath,view,width,height,strict?}) →
  {path, bytes, view, bounds}`.
- **Vocabulary:** `REGION_SCHEMA`, `DEFAULT_FRACTION`, `PART_NAMES`.

## How acceptance criteria are met

- **`selectRegion` (bbox / named part / `where`)** — `selectRegion` dispatch + Group B/C tests; the
  three spec forms all reduce to integer `subBounds` clamped to the build.
- **Region-lock rejects out-of-R, permits in-R, stays AJV-valid** — `applyRegionEdit` validates
  every edit voxel ⊆ `subBounds`; Group D proves reject (`RegionEditOutOfBoundsError`), permit
  (round-trips through `assertArtifact`), and the **outside-R byte-identical invariant** on the real
  koi artifact. Manifest is rebuilt so swapped-in blocks are declared.
- **`observeRegion` = `framedCamera(subBoundsOf(R))`** — the live leaf builds the full world and
  frames on R's sub-bounds via `renderWorldToPng({bounds})` (which calls `framedCamera`); no new
  camera math. Proven by the koi crop render.
- **Unit tests + one live crop render, GL-isolated** — 16 pure tests (no GL) + 2 GL-gated live
  renders under `render/`. Group E statically asserts the pure graph has no top-level GL import.
- **`npm test` green** — 415/415 pure; `render/` 38/38 (GL present).

## Test coverage assessment

**Strong.** Sub-bounds math, every spec form, membership, the lock's reject/permit, the invariant on
a real 60-placement sculpture, manifest rebuild, empty-guard, purity, and a static reuse-boundary
scan are all covered. The live path is proven end-to-end on the committed koi (correct PNG, framed
tighter than the whole build, visually a head close-up).

**Gaps / not covered (intentional):**
- `observeRegion` is **not** unit-tested under `npm test` (it is GL — proven only in the GL-gated
  render suite). This is the deliberate E-11 review-seam isolation; if GL is absent in CI those 2
  tests **skip** (not fail), so the live proof is environment-dependent. Mitigation: the framing math
  it depends on (`framedCamera`, `boundingSphere`) is itself unit-tested off-GPU in `render/test/`.
- No test pins `observeRegion`'s pixel content — only structural properties (signature, bytes,
  framing radius). A pixel/segmentation assertion belongs with S-043's form metric, not here.

## Open concerns for a reviewer

1. **`where` union semantics.** Multiple keywords union to a bounding box (conservative, never
   empty), so `"top-front"` on a cube balloons to the whole cube rather than the corner. This is the
   documented, safe choice (an over-broad crop just observes more; the loop re-observes and
   accept-gates). If S-045 wants corner-precision it should pass a bbox, or we add an explicit
   intersection mode. **Flagged, not a bug.**
2. **Geometric, not anatomical, part names.** `front/back` are the major-axis high/low ends by
   convention — they make **no** claim about a subject's actual orientation (the koi's head is at
   min-x, i.e. `back` under this convention). Semantic part addressing is deliberately a caller-
   supplied bbox. Anyone reading `selectRegion(koi,{part:"front"})` as "the koi's face" would be
   wrong; the doc comment says so explicitly.
3. **Full-containment membership.** A placement straddling R's boundary is **out-of-R** (frozen), so
   the loop cannot rewrite the cells it owns this round. Correct and additive (the P14 spirit), but
   it means a region whose contents are mostly large straddling fills may select **few** in-R
   placements — a region-scoped tweak there has little to edit until a finer region is chosen. S-045
   should be aware when picking region granularity.
4. **`observeRegion` renders the whole world per call.** Fine for single-build sculptures; if S-045
   observes many regions per iteration, each is a full build+render. A future optimization could
   cache the world across observes of the same artifact (not needed now).

## What this ticket deliberately does not build (downstream)

No control flow (loop / accept-gate / diagnosis) — S-045. No LLM form-editor — S-046 (it plugs into
`applyRegionEdit`'s function-form `edit`). No GLB form-target — S-047. No form metric — S-043 (the
parallel root). `observeRegion` returns a render report, not a score.

## Risk level

**Low.** Additive (no existing code touched), pure core fully unit-tested, the one GL boundary
isolated and proven, both test suites green. The interfaces are the seams S-045/S-046 were designed
to consume (`edit` as a function; `R`/`observeRegion` report as the accept-gate's inputs).
