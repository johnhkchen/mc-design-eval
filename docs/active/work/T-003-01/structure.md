# Structure — T-003-01 render-environment-scaffold

The blueprint: every file this ticket creates, its responsibility, its public
interface, and the order they land. All files live under `render/` (Design
decision 1) so this ticket's footprint is disjoint from every concurrent ticket.

## File tree (all created, none modified, none deleted)

```
render/
├── package.json            # scoped Node+TS module: deps + render/typecheck/test scripts
├── tsconfig.json           # NodeNext ESM, strict, noEmit (tsx runs; tsc only checks)
├── .gitignore              # node_modules/, out/
├── README.md               # what the scaffold is; run instructions; the gl↔Playwright fallback
├── src/
│   ├── version.ts          # single-sourced MC pin (1.20.4) + minecraft-data/assets handles
│   ├── headless-canvas.ts  # createHeadlessCanvas(w,h) → WebGL-capable canvas (the swappable seam)
│   ├── world.ts            # createEmptyWorld / setBlock / buildSampleWorld (in-memory prismarine-world)
│   ├── render.ts           # renderWorldToPng(world, center, opts?) → PNG Buffer (+ optional file)
│   └── cli.ts              # `render:sample` entrypoint: sample world → out/sample.png
└── test/
    └── scaffold.test.mjs   # node:test — version pin + world API (no-GPU); render smoke (skips if no GL)
```

Nothing outside `render/` is touched. No edits to the root `package.json`, the
schema module, the palettes module, the spec, or any ticket. This is Design
decision 1 made concrete.

## `render/src/version.ts` — the single source of the pin (Decision 4)

The one place the Minecraft version is written down.

- `export const MINECRAFT_VERSION = "1.20.4"` — must equal the palette's pin.
- `export function mcData()` → `require('minecraft-data')(MINECRAFT_VERSION)`,
  memoised. Throws a clear error if the version is unknown to `minecraft-data`.
- `export function assetsFor()` → `require('minecraft-assets')(MINECRAFT_VERSION)`,
  the texture directory/atlas handle; throws if assets are missing for the pin.
- `export function blockStateId(name, props?)` — resolve a bare/`minecraft:`-prefixed
  block name (+ optional state props) to the numeric state id `prismarine-world`
  stores, using `mcData()`. The one place name→id lives, so `world.ts` stays small.

This file alone satisfies the "pinned `minecraft-data` + `minecraft-assets` loaded"
half of AC #1, and is verifiable with no GPU.

## `render/src/headless-canvas.ts` — the swappable render seam (Decision 3)

The only file that knows *how* a headless WebGL surface is obtained. Isolating it
here is what lets Option B (Playwright) replace Option A later without touching
anything else.

- `export function createHeadlessCanvas(width, height): HeadlessCanvas` — returns a
  canvas object exposing `getContext('webgl')` (a real GL context) and
  `createPNGStream()`/`toBuffer()`.
- Primary impl (Decision 3, Option A): wrap `node-canvas-webgl/lib`'s `createCanvas`
  if it loads; **else** the contingency — a local shim over modern `canvas@^3` +
  `gl@^8` that attaches a headless-gl context to a node-canvas `Canvas`. Which path
  is live is decided in Implement against the actual install, and recorded in
  `progress.md`.
- `export const GL_AVAILABLE: boolean` — set false (with the load error captured) if
  no GL backend can be constructed, so the render smoke test can **skip** rather than
  hard-fail in a GL-less environment. Keeps the no-GPU AC (#1, #2) green regardless.

## `render/src/world.ts` — the in-memory world (Decision 5, AC #2 + AC #4 sample)

Artifact-agnostic. Owns world creation and block writes; knows nothing about
placement ops or artifact shape (that's T-003-02).

- `export async function createEmptyWorld(): Promise<World>` — a `prismarine-world`
  World for `MINECRAFT_VERSION`, no generator (empty/air). This is AC #2.
- `export async function setBlock(world, [x,y,z], name, props?): Promise<void>` —
  resolve via `version.blockStateId`, `world.setBlockStateId(vec3, id)`.
- `export async function buildSampleWorld(): Promise<{ world, center }>` — a small
  floor pad plus a couple of distinct blocks (e.g. `stone` floor + one
  `glowstone`/`oak_planks` cube) at a known center, so the render is unambiguously
  "correct" by eye. Returns the world and the camera `center`. This is the AC #4
  sample subject.

Uses `vec3` (a `prismarine-world` transitive dep) for coordinates.

## `render/src/render.ts` — the headless render (Decision 6, AC #3 + AC #4)

Owns the fixed render contract and the `prismarine-viewer` wiring (per research's
verified recipe).

- `export interface RenderOptions { width; height; viewDistance; fov; cameraOffset;
  lookAt; outPath? }` with module-level **defaults**: `512×512`, `viewDistance 4`,
  `fov 75`, a fixed isometric-ish `cameraOffset`, `lookAt` = center.
- `export async function renderWorldToPng(world, center, opts?): Promise<Buffer>`:
  1. `global.THREE = require('three')`.
  2. `const canvas = createHeadlessCanvas(w,h)`; `new THREE.WebGLRenderer({canvas})`.
  3. `const viewer = new Viewer(renderer)`; `viewer.setVersion(MINECRAFT_VERSION)`.
  4. `const worldView = new WorldView(world, viewDistance, center)`;
     `viewer.listen(worldView)`; `await worldView.init(center)`.
  5. position `viewer.camera` from `cameraOffset`+`center`, `lookAt`, set fov.
  6. `await viewer.waitForChunksToRender()`; `renderer.render(scene, camera)`.
  7. encode canvas → PNG `Buffer`; if `opts.outPath`, write it.
- `{ Viewer, WorldView }` come from `require('prismarine-viewer').viewer`. A minimal
  local ambient `prismarine-viewer.d.ts` (or `// @ts-expect-error` at the import)
  covers the untyped boundary (research: thin upstream types).

This file is AC #3 ("renders a world to a PNG, no server, no bot") and, fed the
sample, AC #4.

## `render/src/cli.ts` — the demonstrable entrypoint (AC #4)

- `buildSampleWorld()` → `renderWorldToPng(world, center, { outPath: 'out/sample.png' })`
  → log the written path + byte size. Invoked by `npm run render:sample`.
- This is the artifact a human/reviewer runs to *see* AC #4 satisfied; the written
  PNG path is captured in `progress.md`/`review.md`.

## `render/test/scaffold.test.mjs` — verifiable increments

`node:test` (built in, no test-runner dep), three cases:

1. **version pin** — `MINECRAFT_VERSION === "1.20.4"`, `mcData()` returns blocks,
   `assetsFor()` resolves, `blockStateId("stone")` is a positive integer. No GPU.
2. **world API** — `createEmptyWorld()` then `setBlock` then read back the state id;
   `buildSampleWorld()` returns a world + center. No GPU.
3. **render smoke** — if `GL_AVAILABLE`, `renderWorldToPng` returns a PNG buffer with
   a valid PNG signature and non-trivial length; **else `t.skip`** with the captured
   GL load error. This keeps `npm test` green on no-GPU CI while still exercising the
   render path wherever GL exists.

## `render/package.json` — the scoped module

- `"name": "mc-design-eval-render"`, `"private": true`, `"type": "module"`.
- `"scripts"`:
  - `"render:sample": "tsx src/cli.ts"`
  - `"typecheck": "tsc --noEmit"`
  - `"test": "node --test"`
- `"dependencies"`: `prismarine-viewer`, `prismarine-world`, `minecraft-data`,
  `minecraft-assets`, `three`, `vec3`, and the GL backend (`node-canvas-webgl`, or
  modern `gl`+`canvas` per the Implement contingency).
- `"devDependencies"`: `typescript`, `tsx`, `@types/node`.

## `render/tsconfig.json`

`module`/`moduleResolution` = `NodeNext`, `target` `ES2022`, `strict: true`,
`noEmit: true`, `allowJs: false`, `types: ["node"]`, `include: ["src", "test"]`. No
`outDir` — `tsx` runs, `tsc` only checks.

## `render/.gitignore`

`node_modules/` and `out/` (rendered PNGs are reproducible artifacts, not committed).

## Ordering of changes (matters for verifiable increments)

1. `package.json` + `tsconfig.json` + `.gitignore` → `npm install` (resolve the GL
   backend; record which path built — Implement contingency). Unblocks everything.
2. `src/version.ts` → the pin exists; test case 1 passes (no GPU). Commit.
3. `src/world.ts` → empty world + sample (AC #2); test case 2 passes. Commit.
4. `src/headless-canvas.ts` + `src/render.ts` + `src/cli.ts` → the render path
   (AC #3); `npm run render:sample` writes `out/sample.png` (AC #4). Commit.
5. `test/scaffold.test.mjs` + `README.md` → green `npm test` (+typecheck) and the
   prose half of AC #1; fallback documented. Commit.

Each of 2–5 is independently committable; Plan sequences the commits and the
verification gate per step.

## Interfaces other S-003 tickets will rely on (informational)

- **T-003-02** imports `createEmptyWorld` + `setBlock` from `world.ts` and
  `MINECRAFT_VERSION`/`blockStateId` from `version.ts` to expand artifact placements
  — it never re-creates the world or re-decides the pin.
- **T-003-03** imports `renderWorldToPng` + `RenderOptions` from `render.ts` and
  refines the fixed camera/views; the `createHeadlessCanvas` seam is where it can
  swap GL backends if needed.
- **T-003-04** composes `world` + `render` into one Agent SDK tool; it depends only
  on the two public functions, not their internals.
