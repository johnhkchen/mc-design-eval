# T-044-01 — Plan: ordered implementation steps

Each step is independently verifiable and commits atomically. Test strategy is interleaved: the
pure suite gates `npm test`; the live crop render is GL-gated under `render/`'s own runner.

## Step 1 — Pure region core: bounds + resolution + `selectRegion`

**Write** `src/revise/region.mjs` with the module header and the pure half:
- `REGION_SCHEMA`, `DEFAULT_FRACTION`, `PART_NAMES`.
- `placementBounds`, `artifactBounds`, `coordInBounds`, `boundsContain`, `clampBounds`,
  `subBoundsOf`.
- `resolveNamedRegion`, `resolveWhereRegion`, `selectRegion`.
- Import only `expandPlacement` from `../expand.mjs` (for `placementBounds`/`artifactBounds` corner
  scan — actually corners come straight from `pos`/`from`/`to`, so the top-level import may be
  unnecessary here; keep the geometry self-contained and pull `expandPlacement` only where the lock
  needs full voxel enumeration in Step 2). Decide in code: prefer **no** top-level expand import if
  corner math suffices, to keep the graph minimal.

**Verify:** `node -e` smoke — `selectRegion(koiArtifact,{part:"top"})` yields a subBounds in the
upper half and a non-empty placement subset.

## Step 2 — The lock: `applyRegionEdit` + `RegionEditOutOfBoundsError`

**Add** to `region.mjs`:
- `RegionEditOutOfBoundsError` (named, `.code`, `.index`, `.coord`, `.subBounds`).
- `applyRegionEdit(artifact, R, edit, opts?)`: resolve edit (array|fn) → validate every voxel via
  `expandPlacement` ⊆ `subBounds` → assemble `outOfRegion ++ newInRegion` → rebuild manifest →
  guard `minItems:1` → return fresh artifact. **Top-level import** `expandPlacement` from
  `../expand.mjs` here (the validation genuinely needs voxel enumeration + inherits the line guard).

**Verify:** `node -e` smoke — an in-R swap round-trips through `assertArtifact`; an edit placing a
voxel outside subBounds throws `RegionEditOutOfBoundsError`.

## Step 3 — Pure unit suite (Groups A–E)

**Write** `src/revise/region.test.mjs`:
- Synthetic minimal artifacts (the `artifactWith` idiom from `value-build.test.mjs`) + the committed
  koi artifact read by relative URL.
- Group A sub-bounds math; B named/where resolution; C `selectRegion`; D the lock (permit/reject,
  the outside-R invariant via `expandArtifact`, manifest rebuild, empty-guard, purity); E the
  static import-scan reuse boundary (no GL at top level).

**Verify:** `npm test` green; confirm the new suite is collected by `src/**/*.test.mjs` and the full
suite count rises by the new tests with **zero** failures and **no GL loaded** (the run completes on
a GL-less assumption — these tests never touch GL).

**Commit 1:** `feat(E-15 T-044-01): region addressing + region-lock on the DesignArtifact`
(region.mjs pure core + the pure suite). The repo is green here even though `observeRegion` and the
live proof are not yet present.

## Step 4 — The observe leaf (lazy GL)

**Add** to `region.mjs`:
- `observeRegion(artifact, R, opts?)` — `async`, **lazy-`import()`** `buildWorldFromArtifact`
  (`../../render/src/world.mjs`) and `renderWorldToPng` (`../../render/src/render.mjs`); build the
  full world; `renderWorldToPng(world, world.center, {bounds: subBoundsOf(R), view, outPath, width,
  height})`; return `{path, bytes, view, bounds}`.

**Verify:** the **pure** suite still loads no GL (re-run `npm test`; Group E static scan still passes
because the render imports are **dynamic**, not top-level). A manual `node -e` (GL present here)
renders a koi crop to a PNG and prints bytes > 0.

## Step 5 — GL-gated live crop render proof

**Write** `render/test/observe-region.test.mjs` mirroring `render-tool.test.mjs`:
- Skip when `!GL_AVAILABLE` with the captured reason.
- `selectRegion(koi, {part:"top"})` → `observeRegion(koi, R, {outPath: ../out/observe-koi-top.png})`.
- Assert PNG signature + non-trivial bytes + that the crop's framed `radius` is **smaller** than a
  whole-build frame's radius (proves it's a tight crop, not the whole build).

**Verify:** `cd render && node --test test/observe-region.test.mjs` passes (GL present) — one live
render. Re-run top-level `npm test` to confirm it is **unaffected** (the render test is outside its
glob).

**Commit 2:** `feat(E-15 T-044-01): observeRegion crop render + GL-gated koi live proof`.

## Step 6 — Final verification & review

- `npm test` (schema self-tests + `src/**/*.test.mjs`) fully green.
- `cd render && node --test` green (GL-gated live proof runs).
- Write `progress.md` (running) and `review.md` (handoff).

## Testing strategy summary

| Concern | Test | Runner |
|---|---|---|
| sub-bounds / placement / containment math | Group A | `npm test` (pure) |
| named-part + where resolution | Group B | `npm test` (pure) |
| `selectRegion` returns correct R | Group C | `npm test` (pure) |
| lock permits in-R, **rejects out-of-R**, invariant holds, round-trip schema-valid | Group D | `npm test` (pure) |
| no GL in the pure graph (reuse boundary) | Group E (static scan) | `npm test` (pure) |
| **one live crop render** proves observe path | `render/test/observe-region.test.mjs` | `render/` `node --test` (GL-gated) |

## Risks & mitigations

- **R1 — `renderWorldToPng` framing API.** Confirmed in research: `opts.bounds` routes to
  `framedCamera`. If the full-world+crop framing misbehaves, fall back to rendering an R-only
  sub-artifact through `renderArtifact` (still `framedCamera`, just loses context) — observe path
  still proven. *Documented as the fallback, not the default.*
- **R2 — partial-overlap surprises.** Mitigated by the full-containment membership rule (Design D1);
  Group D's invariant test catches any leak across `subBounds`.
- **R3 — manifest/schema validity after edit.** Mitigated by rebuilding the manifest from placed
  blocks (compile.mjs idiom) and the empty-guard; Group D round-trips through `assertArtifact`.
- **R4 — Group E false sense of safety.** A static scan only checks **top-level** specifiers; the
  lazy `import()` inside `observeRegion` is intentionally a **dynamic** import the denylist regex
  ignores (matches `import ... from`/bare, not `import(...)`). We additionally assert the pure suite
  process completes — if a top-level GL import sneaked in, the pure tests would pull GL.
- **R5 — collision with parallel T-043-01.** None: distinct files under `src/revise/`; no shared
  edits. The DAG models them as independent roots.

## Definition of done (maps to AC)

- [x→] `selectRegion(artifact, spec)` for bbox / named part / `where` (Step 1, Group B/C).
- [x→] `applyRegionEdit` mutates only in-R, **rejects** out-of-R, result passes AJV (Step 2, Group D).
- [x→] `observeRegion` tight crop via `framedCamera(subBoundsOf(R))` (Step 4).
- [x→] unit tests (sub-bounds; lock reject+permit; round-trip valid) + **one live** koi crop render,
  GL-isolated (Steps 3, 5).
- [x→] `npm test` green (Steps 3, 6).
