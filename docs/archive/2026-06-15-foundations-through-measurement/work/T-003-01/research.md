# Research — T-003-01 render-environment-scaffold

## Ticket in one line

Stand up the TypeScript render environment for the render harness (epic E-02, spec
§3): pin a Minecraft version via `minecraft-data`, load textures via
`minecraft-assets`, create an empty **in-memory** `prismarine-world`, and prove a
**headless** path that renders that world to a PNG — **no Minecraft server, no
Mineflayer bot**. This is the foundation every other S-003 ticket builds on.

## Where this sits in the system

From the story DAG (`docs/active/stories/S-003.md`), T-003-01 is the wave-0
foundation of the render harness; **everything in S-003 depends on it**:

```
T-003-01 (render scaffold) ──┬──> T-003-02 (build voxel world) ──┐
                             └──> T-003-03 (headless render) ────┴──> T-003-04 (render tool)
```

So the scaffold has two distinct downstream consumers that pull on different parts
of it:

1. **T-003-02 (voxel-world construction)** consumes the *world* half. It expands an
   artifact's placements (`fill`/`box`/`line`/`set`, see `schema/`) into block
   writes against an in-memory `prismarine-world`. It needs: a created, empty world
   it can `setBlock` into, the pinned version so block IDs resolve, and the
   block-name↔state-id mapping `minecraft-data` provides. It also gates on
   `S-001:T-001-02` (the expanded voxel set), so the scaffold must **not** bake in
   any artifact-shape assumptions — it owns the world, not the artifact reader.
2. **T-003-03 (headless render)** consumes the *render* half: given a populated
   world, produce a deterministic, comparable PNG headless. It needs the render
   primitive (canvas + WebGL context + `prismarine-viewer` Viewer) and a fixed
   camera contract.

T-003-04 wraps construct+render into one Agent SDK tool. The scaffold therefore
must leave a clean seam between "make/populate a world" and "render a world."

## What already exists in the repo

The repo is early but **no longer greenfield**. Confirmed by inspection:

- **Root module** (`package.json`, `"type": "module"`): a JS+JSON **schema
  validation** module — `scripts/validate-artifact.mjs` validates design artifacts
  against `schema/design-artifact.schema.json` with Ajv. Deps: `ajv`,
  `ajv-formats`. No TypeScript anywhere yet.
- **`palettes/`**: a self-contained sub-module with its **own** `package.json`,
  `.gitignore` (`node_modules/`), validator (`validate.mjs`), JSON Schema, the
  `industrial.json` palette, and a README. Deps: `ajv`, `minecraft-data@^3`.
- `docs/specification.md` is the authority; §3 (stack), §4 (orchestration), §6
  (render is render-only, never the deliverable) bind this ticket.
- `docs/active/work/` holds completed T-001-01 and T-001-04 artifacts — the RDSPI
  pattern this ticket follows.

**Two conventions are already established and load-bearing here:**

- **Per-ticket sub-module isolation.** `palettes/` keeps *all* its files (incl. its
  own `package.json` and lockfile) under one directory, explicitly to avoid
  colliding on the shared branch with concurrent tickets (T-001-04 research.md,
  "Concurrency hazard"). The scaffold must do the same: a `render/` sub-module, not
  files sprinkled at the root.
- **The pinned Minecraft version is `1.20.4`.** `palettes/industrial.json` declares
  `"minecraftVersion": "1.20.4"`, and observation S745/9429 confirmed 1.20.4 has
  1058 blocks in `minecraft-data@3.110.2` with all industrial candidates present.
  The ticket says pinning here "fixes the canonical block-ID vocabulary used by the
  schema (T-001-01) and palette (T-001-04)" — so the scaffold must pin the **same**
  1.20.4, single-sourced, or the render section and the palette would disagree on
  what a block ID means.

## The external toolchain: prismarine-viewer headless

The decided stack (CLAUDE.md, spec §3, E-02 "Resolved") is TypeScript +
`prismarine-viewer`, rendering an in-memory `prismarine-world` headless. Findings on
the actual API surface (confirmed against the upstream source, not memory):

- **Packages resolve from the registry in this environment:** `prismarine-viewer`
  1.33.0, `prismarine-world` 3.7.0, `prismarine-chunk` 1.40.0, `minecraft-assets`
  1.17.0, `minecraft-data` 3.110.2, `three` 0.184.0, `canvas` 3.2.3, `gl` 8.1.6,
  `playwright` 1.60.0, `node-canvas-webgl` 0.3.0.
- **`prismarine-viewer` exposes three modes:** `mineflayer(bot,…)` (bot viewer,
  irrelevant — no bot), `standalone(…)` (serves a world to a browser viewer over
  socket.io), and `headless(bot,…)` (records frames). The low-level building blocks
  live at `require('prismarine-viewer').viewer` → `{ Viewer, WorldView,
  getBufferFromStream }`.
- **The headless render recipe (no bot, no server)** is what `lib/headless.js`
  does, minus the bot/ffmpeg parts:
  - `global.THREE = require('three')` — the Viewer reads `global.THREE`.
  - `const { createCanvas } = require('node-canvas-webgl/lib')` — a node-canvas
    `Canvas` whose `getContext('webgl')` returns a **headless-gl** context, so
    `new THREE.WebGLRenderer({ canvas })` works with no browser/DOM.
  - `const viewer = new Viewer(renderer)` → `viewer.setVersion('1.20.4')` (loads the
    block models/atlas for that version).
  - `const worldView = new WorldView(world, viewDistance, center)`;
    `viewer.listen(worldView)`; `await worldView.init(center)` — this streams chunks
    from our in-memory world into the renderer.
  - position `viewer.camera`, `await viewer.waitForChunksToRender()`, then
    `renderer.render(viewer.scene, viewer.camera)`.
  - encode: `canvas.createPNGStream()` → buffer (`getBufferFromStream`) → write file.
- **`minecraft-assets`** (`require('minecraft-assets')('1.20.4')`) yields the texture
  atlas / directory for the version; `prismarine-viewer` consumes it internally via
  `setVersion`, but AC #1 wants assets explicitly loaded/verified for the pin.

## Constraints and risks surfaced

- **The headless WebGL strategy is the one genuinely-open decision.** Spec §12
  records it verbatim: "Still open: headless WebGL strategy (Playwright/headless
  Chromium vs headless-gl)." The scaffold ticket is exactly where it gets settled.
  The two families:
  - **headless-gl (`gl`, via `node-canvas-webgl`):** single Node process, no
    browser, pixel-deterministic — ideal for the "comparable renders" requirement
    (E-02 DoD). Risk: it's a **native node-gyp build**, and `node-canvas-webgl@0.3.0`
    pins ancient `canvas@^2.6` / `gl@^6`, which may not compile on **Node 22**.
  - **Playwright + headless Chromium:** drives `prismarine-viewer`'s `standalone`
    browser viewer and screenshots the canvas. No native compile (Playwright ships a
    prebuilt browser; Chromium has reliable SwiftShader/ANGLE WebGL). Risk: heavier
    (browser download + socket.io server orchestration), and screenshot
    determinism/comparability is softer than direct framebuffer reads.
- **Native-build feasibility on this host looks favorable for the gl route:** Node
  22.22.0, `python3` present (node-gyp), Homebrew `cairo` + `pango` present (so
  `canvas` can build/link), Xcode CLT implied, `ffmpeg` present (not needed for PNG).
  The open question is whether the *pinned-old* canvas/gl in `node-canvas-webgl`
  build on Node 22, or whether modern `gl@^8` + `canvas@^3` must be wired by hand.
- **No TypeScript toolchain exists yet.** AC #1 says "TypeScript project," and the
  stack is TS, but every module so far is plain `.mjs`. This ticket introduces TS for
  the repo. `tsx@4.22.4` and `typescript@6.0.3` resolve, so a build-stepless
  run-via-`tsx` + `tsc --noEmit` typecheck is viable and keeps the scaffold light.
- **prismarine-* TypeScript types are thin.** `prismarine-viewer`'s internal
  `viewer` lib is JS without good `.d.ts`; expect to declare a minimal local
  ambient module or use loose typing at that boundary.
- **Determinism for comparability.** E-02's DoD demands "deterministic, comparable"
  renders. Camera (position, target, fov), canvas size, lighting, and view distance
  must be fixed constants the scaffold owns — not incidental defaults — so two builds
  are photographed identically. This is a scaffold concern even though the fixed-view
  polish is T-003-03's job: the scaffold sets the contract.
- **Concurrency hazard (same as T-001-04).** Lisa runs ≤2 tickets on one branch
  (`.lisa.toml`). Keeping the entire scaffold under `render/` (own `package.json`,
  own lockfile, own `node_modules`) makes its file footprint disjoint from any
  concurrent ticket — the lock becomes a safety net, not a dependency.

## Open question deferred *to* this ticket by the spec

Spec §12: "headless WebGL strategy (Playwright/headless Chromium vs headless-gl) —
an implementation detail to settle in the render scaffold ticket." Design must pick
one as the committed primary path, justify it against the codebase reality above,
and (given the native-build risk) keep the chosen render boundary thin enough that
swapping strategies later doesn't ripple into world construction (T-003-02) or the
tool wrapper (T-003-04).

## Summary of what is fixed vs. open going into Design

Fixed by research:
- Module shape = a `render/` sub-module (own package.json/lockfile/node_modules),
  mirroring `palettes/`, to neutralize the shared-branch concurrency hazard.
- Pinned version = **1.20.4**, single-sourced, matching the palette — the scaffold
  must not invent a different pin.
- Render primitive = `prismarine-viewer`'s `viewer.{Viewer,WorldView}` over an
  in-memory `prismarine-world`, fed `global.THREE`, with `setVersion('1.20.4')`.
- A clean **make/populate-world** ↔ **render-world** seam, since T-003-02 and
  T-003-03 consume the two halves separately.
- Toolchain = TypeScript run via `tsx`, typechecked via `tsc --noEmit` (no heavy
  build step for a scaffold).

Open for Design:
- **The headless WebGL strategy** (headless-gl/node-canvas-webgl vs Playwright/
  Chromium) — the load-bearing decision, with a fallback if the primary won't build.
- Exactly which packages to depend on and at what versions (e.g. `node-canvas-webgl`
  as-is vs. modern `gl`+`canvas` + a tiny local canvas shim).
- The fixed camera/canvas/lighting contract values the scaffold should own.
- How the world-creation API is shaped so T-003-02 can populate it without re-deciding.
