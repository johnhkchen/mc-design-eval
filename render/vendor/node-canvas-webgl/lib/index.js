// Local shim for `node-canvas-webgl`.
//
// prismarine-viewer's headless code path does `safeRequire('node-canvas-webgl/lib')`
// and uses `loadImage` (to load the texture atlas from disk) and `createCanvas`. The
// published node-canvas-webgl@0.3.0 hard-pins `canvas@^2.6` + `gl@^6`, which do not
// build on Node 22 — so this project depends on modern `canvas@^3` + `gl@^8` directly
// and replicates the WebGL-canvas trick in `src/headless-canvas.mjs`.
//
// We construct our render canvas ourselves via that module, so the ONLY thing
// upstream needs from here is `loadImage` (and a harmless `createCanvas`). Modern
// `canvas` provides both, so re-exporting it verbatim is sufficient and keeps a
// single canvas instance across the process.
module.exports = require('canvas')
