# Design — T-003-01 render-environment-scaffold

Six decisions, each grounded in the research. The load-bearing one is **Decision 3**
(the headless WebGL strategy), the open question spec §12 deferred to this ticket.

## Decision 1 — A self-contained `render/` sub-module

**Decided:** all scaffold files live under `render/` with their own `package.json`,
lockfile, and `node_modules` — exactly the pattern `palettes/` established.

**Why:** Lisa runs ≤2 tickets on the same branch (`.lisa.toml`); the RDSPI doc says
shared-file edits are a missing DAG edge, not something the commit lock should paper
over. A root `package.json` would collide with the existing root schema module and
any concurrent ticket. A disjoint `render/` footprint makes the lock a safety net,
not a coordination point. **Rejected:** adding render deps to the root
`package.json` (couples two unrelated modules, invites lockfile churn on the shared
branch).

## Decision 2 — TypeScript run via `tsx`, typechecked via `tsc --noEmit`

**Decided:** author in TypeScript (`src/*.ts`, ESM), run with `tsx` (no build
artifact), gate correctness with `tsc --noEmit`. `package.json` scripts:
`render:sample`, `typecheck`, `test`.

**Why:** AC #1 says "TypeScript project," and the stack is TS — but every module so
far is plain `.mjs`, so this ticket *introduces* TS. A scaffold should not also drag
in a bundler or an emit/`dist` step. `tsx@4.22.4` runs `.ts` directly under Node 22;
`tsc --noEmit` (typescript@6) gives the typecheck without an output dir to manage.
**Rejected:** (a) plain `.mjs` like the other modules — violates AC #1 and the stack
decision; (b) `tsc` build to `dist/` — needless ceremony for a scaffold, and the
emitted JS is just noise in review.

## Decision 3 — Headless WebGL strategy: **headless-gl (in-process), Playwright as documented fallback**

This is spec §12's open question. Three options were weighed against the research.

**Option A — headless-gl in-process (`gl` + node-canvas + `three`).** A single Node
process: a node-canvas `Canvas` whose `getContext('webgl')` is a headless-gl
context, handed to `THREE.WebGLRenderer`, driving `prismarine-viewer`'s `Viewer` +
`WorldView` over our in-memory world; framebuffer encoded to PNG via the canvas.
This is precisely what `prismarine-viewer/lib/headless.js` does (minus bot+ffmpeg),
and the approach mc-bench donates (spec §3).
- **Pro:** one process, no browser, no socket server; **pixel-deterministic**
  framebuffer reads — the strongest footing for E-02's "deterministic, comparable
  renders" DoD; thinnest possible render boundary for T-003-03/04 to build on.
- **Con:** native node-gyp build (`gl`). The convenience wrapper
  `node-canvas-webgl@0.3.0` pins ancient `canvas@^2.6`/`gl@^6` that likely won't
  compile on **Node 22** — so we may need modern `gl@^8` + `canvas@^3` wired by a
  tiny local shim instead of the wrapper as-published.

**Option B — Playwright + headless Chromium.** Run `prismarine-viewer`'s
`standalone` browser viewer, screenshot the `<canvas>`.
- **Pro:** no native compile; Chromium's SwiftShader/ANGLE WebGL is robust and
  portable across CI.
- **Con:** heaviest moving part — a browser download + a socket.io server + page
  lifecycle, which is exactly the kind of "heaviest moving part" E-02 says dropping
  the live server was meant to remove; screenshot determinism is softer than
  framebuffer reads (AA, device-pixel-ratio, font/GPU drift); more surface for a
  *scaffold* to get flaky.

**Option C — `prismarine-viewer`'s built-in `headless(bot,…)`.** Rejected outright:
it's bot-coupled and ffmpeg/video-oriented; we have no bot and want a still PNG.

**Decision:** **Option A is the committed primary path.** It is the prismarine-native,
single-process, deterministic route, and determinism is a first-class E-02 goal.
This host is favorable for the native build (Node 22 + python3 + Homebrew
cairo/pango + Xcode CLT), which de-risks the one real downside. The render boundary
is kept behind a single `createHeadlessCanvas()` + `renderWorldToPng()` seam so that
if a target environment can't build `gl`, **Option B can be dropped in behind the
same two functions** without touching world construction (T-003-02) or the tool
wrapper (T-003-04). Option B is documented in the README as the fallback, not built
now (YAGNI until an environment forces it).

**Build-risk contingency (resolved in Plan/Implement, recorded here):** if
`node-canvas-webgl@0.3.0` fails to build on Node 22, fall back to depending on
modern `gl@^8` + `canvas@^3` directly and replicate node-canvas-webgl's ~40-line
trick locally (`render/src/headless-canvas.ts`): take a node-canvas `Canvas`, attach
a headless-gl context as its `webgl` context. This keeps the deterministic
in-process path while sidestepping the wrapper's stale pins.

## Decision 4 — Pin the Minecraft version once, at `1.20.4`, single-sourced

**Decided:** a single `render/src/version.ts` exports `MINECRAFT_VERSION = "1.20.4"`
and the resolved `minecraft-data` + `minecraft-assets` handles for it. Everything
(world, render, CLI) imports the version from there.

**Why:** the ticket states pinning here "fixes the canonical block-ID vocabulary
used by the schema and palette." `palettes/industrial.json` already pins `1.20.4`;
the render section pinning anything else would silently desync the two halves of the
instrument. Single-sourcing also satisfies spec §4's "pin the model by a current ID
in config, single-sourced" *ethos* for the version axis, and makes a future bump one
edit. **Rejected:** reading the version from an artifact at render time (the scaffold
has no artifact yet, and the version is a *project* pin, not per-trial data) or
hardcoding `"1.20.4"` at each call site (drift waiting to happen).

## Decision 5 — A thin, artifact-agnostic world API with a built-in sample

**Decided:** `render/src/world.ts` exposes `createEmptyWorld()` →
`prismarine-world` World for the pinned version, a small `setBlock(world, pos, name,
state?)` helper (name → state-id via `minecraft-data`), and `buildSampleWorld()`
that places a single labelled block on a small floor — the AC #4 sample.

**Why:** T-003-02 owns artifact→world expansion and gates on T-001-02; the scaffold
must give it an empty world and a `setBlock` primitive **without** assuming anything
about placement ops or artifact shape. The sample world lives here (not in the
render module) because it exercises the world half and gives the render half
something real to photograph. **Rejected:** baking artifact parsing into the
scaffold (steps on T-003-02, and would gate this foundation ticket on T-001-02,
which it explicitly does not depend on).

## Decision 6 — Own the fixed render contract (camera/size/lighting) as constants

**Decided:** `render/src/render.ts` owns named constants for canvas size
(`512×512`), camera (position offset, look-at target, fov), view distance, and
ambient/directional lighting, exposed via a `RenderOptions` type with these as
defaults. `renderWorldToPng(world, center, opts?)` returns a PNG `Buffer` and
optionally writes a file.

**Why:** E-02's DoD is "deterministic, **comparable** render images." Comparability
is a property of *fixed* framing, so the framing must be explicit, named, and
defaulted — not left to incidental library defaults. T-003-03 will refine the actual
view angles; the scaffold's job is to establish that the contract is a small set of
owned constants, and prove it round-trips to a correct PNG. **Rejected:** leaving
camera/size to caller-supplied values with no defaults (every consumer would
re-decide framing, and renders across trials wouldn't be comparable — defeating the
instrument).

## What this design deliberately does **not** do

- No artifact reader / placement expansion (T-003-02).
- No fixed multi-angle "comparable views" polish or thumbnailing (T-003-03).
- No Agent SDK tool wrapper (T-003-04).
- No schematic export, no validators, no Minecraft server, no bot (out of scope,
  spec §3/§6, E-02 "Out").

The scaffold proves the **pipeline exists end to end** — version pin → in-memory
world → headless WebGL → correct PNG of a sample — and leaves clean seams for the
three tickets that extend each segment.
