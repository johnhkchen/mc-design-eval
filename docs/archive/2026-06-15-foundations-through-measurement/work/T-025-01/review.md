# T-025-01 Review — massing-bookend

Handoff for a human reviewer: what changed, how it's tested, and the open concerns. The
work produces the **locked gray massing shell** — bookend 1 of the staged sculptor
(E-11 / S-025) — behind a form-agnostic `MassingSource` interface. Committed as `fd56b61`.

## What changed

| File | Status | Summary |
|------|--------|---------|
| `src/sculptor/massing.mjs` | **new (≈160 ln)** | `MassingSource`/`Proportions` types; `MASSING_BLOCK`, `MASSING_STYLE`; `conceptGridSource`, `mass`, `proportionsOf`, `compileMassing` |
| `src/sculptor/massing.test.mjs` | **new (14 tests)** | adapter, lock, proportions, gray-compile + AJV round-trip, end-to-end |
| `src/sculptor/index.mjs` | **modified** | additive re-export of the massing surface |
| `src/sculptor/README.md` | **modified** | one massing-bookend subsection |
| `docs/active/work/T-025-01/*` | **new** | research, design, structure, plan, progress, this review |

No spine source (`build-state`/`orchestrator`/`compile`) was touched — the bookend is
purely additive and composes the existing spine, as the dependency boundary requires.

## How it works (one paragraph)

`conceptGridSource(gridResult)` adapts an E-10 `GridResult` (`{grid,n,m}`, `null`=air,
rows top-down) into a neutral `MassingSource` — `{width, height, occupied()}` in build
coordinates, **Y-flipped** so the image's top row lands at the highest build Y (facade
renders upright). `mass(source)` sets `occupied:true` on each yielded cell via a single
`"massing"` stage run through `runStages`, which **locks exactly `occupied`** on accept
(the proportion lock) while leaving `material`/`relief` unlocked for T-027/T-028. It
returns `{state, proportions}`. `proportionsOf(state)` is a pure projection (bounds,
bbox width/height, aspect, occupied count, fill) the S-026 critic can recompute any time.
`compileMassing(state)` pins `defaultBlock` to one gray block, so every placement is gray
→ a single-material artifact that passes the live AJV gate.

## Test coverage

`npm test` → **244 / 244** (baseline 230 + 14 new). All pure: hand-built silhouette grids
(`gridOf`) and states, `node:test` + `node:assert/strict`, no decode, no GL.

Mapped to AC:

- **AC1 (interface + impl; occupied set & locked, material/relief unset)** — adapter
  occupancy/flip tests; `mass` sets occupied / leaves material null + relief 0; locks only
  `occupied` with `lockLog [{stage:"massing",fields:["occupied"]}]`.
- **AC2 (proportion metadata for the critic)** — `proportionsOf` bounds/width/height/
  aspect/occupied/fill on a known triangle and on an empty state; `mass().proportions ===
  proportionsOf(state)`.
- **AC3 (occupancy locked — later stage can't change it; gray artifact passes AJV)** —
  write-time `LockViolationError` and accept-time `StageRejectedError` over the locked
  shell, **plus** a positive test that a later material/relief write *succeeds* (proving
  the lock is scoped to occupancy, not the whole state). Gray compile asserts `manifest
  === [MASSING_BLOCK]`, round-trips `parseArtifact`/`assertArtifact`, one voxel per cell.
- **AC4 (form behind the interface; GLB drop-in)** — no-leak test (source keys are only
  `width/height/occupied`, items only `{x,y}`); structurally, `massing.mjs` does not import
  `image-grid.mjs`; `flipY` switch lets a Y-up GLB source skip the flip.
- **AC5 (`npm test` green)** — 244/244.

## Open concerns / known limitations

1. **"Renders" is proven at the AJV gate, not a real GL render.** This is deliberate and
   matches the spine's own `compile.test` and the project convention (the GL/prismarine
   render is explicitly *not* run by `npm test`; `render-tool.mjs createRenderServer` is
   the live path). The compiled gray artifact passes the *same* validator the render
   tool's door uses (`coerceArtifact → parseArtifact`), so render-ability is established at
   the contract. A full visual render (facade right-side-up, single gray block) would be a
   good manual smoke before the showcase but is out of unit-test scope. **Reviewer action:
   confirm this proxy is acceptable** (it is the established norm here).
2. **Orientation is a judgement call.** Default `flipY:true` assumes an image whose top is
   the facade top. Correct for the locked E-10 concept series; a source with a different
   convention must pass `flipY:false`. Covered by tests both ways, but it is a real
   coordinate assumption worth a glance.
3. **`MASSING_BLOCK = minecraft:stone`.** Reuses the compile default (gray, survival-
   obtainable). If the showcase wants a more obviously "massing model" gray (e.g.
   `gray_concrete`), it is a one-constant change — but that would add a block to validate
   against the block table; `stone` is already proven.
4. **`opts` on `mass` is reserved/unused.** Intent passthrough is stubbed for symmetry with
   the stage interface; no plan side-channel is consumed at this bookend. Not dead code in
   intent, but flagged so a reviewer doesn't expect it to do anything yet.
5. **Empty-source behaviour.** An all-air form yields an empty, *unlocked* state (no stage
   contribution → no lock). `compileMassing` would then throw (`toDesignArtifact` requires
   ≥1 placement). That is correct — there is no facade to lock or compile — but callers
   feeding arbitrary images should expect the throw on a fully-background input.

## Downstream readiness

- **T-027 / T-028** consume `mass().state`: `occupied` locked, `material`/`relief` free —
  write via `runStages`, lock on accept. Verified by the positive material-write test.
- **S-026 review critic** calls `proportionsOf(lockedState)`.
- **GLB source** implements `{width,height,occupied()}` directly (build coords) and skips
  `conceptGridSource`; the rest of the pipeline is unchanged.

No critical issues. Nothing requires human intervention beyond confirming concern #1.
