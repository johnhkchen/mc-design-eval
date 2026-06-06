// GLB silhouette rasterizer (T-048-01, story S-048, epic E-16) — the 3-D FORM TARGET's projector.
//
// THE PRIMITIVE E-16 NEEDS. E-15's surgical loop hill-climbs a silhouette IoU; its old target was a
// FLAT concept PNG — too blunt for a local edit to move (form-revision-needs-3d-target). A real TRELLIS
// GLB fixes that, but only once we can project the mesh to a TARGET SILHOUETTE the loop can compare a
// build render against. This module is that projector: parse a GLB's geometry, frame it with the SAME
// camera the build render uses (render/src/camera.mjs framedCamera @ SCULPTURE_VIEW_3Q), and fill its
// triangles into a binary mask — whole-object and per-3-D-region. NO GL: a silhouette is just the union
// of filled, projected triangles. NO server, no THREE, no network — pure, deterministic software raster.
//
// This ticket ships the PRIMITIVE only. Wiring it behind `glbFormTarget` (form-target.mjs) is T-049-01;
// the mask shape returned here deliberately MATCHES form-fidelity.mjs `extractSilhouette` so the GLB
// silhouette drops straight into the existing `normalizeSilhouette → iou/regionIoU` path with zero glue.
//
// HONESTY LEDGER (what this number can / cannot see):
//   1. SINGLE 3/4 VIEW. One side; the back is invisible — a view-bounded proxy, not a 3-D score.
//   2. CAMERA MATCH IS UP TO NORMALIZATION. The GLB and the voxel build live in different coordinate
//      spaces/scales; the GLB is framed by its OWN AABB. Absolute position/scale do not match the build,
//      but form-fidelity normalizes (bbox-crop + resample) translation + uniform scale away, so only the
//      viewing DIRECTION, perspective foreshortening, and PROPORTION survive into the IoU — which is the
//      part that is form. Faithful enough; the koi sanity PNG (AC #3) is the eyeball gate.
//   3. NO BACKFACE CULL — BY DESIGN. A silhouette is the union of ALL faces (front and back); the fill's
//      inside test is winding-agnostic so both paint. The mask is binary (coverage decided at the pixel
//      center, like extractSilhouette's hard threshold) — no anti-aliasing a hill-climb would jitter on.
//   4. SILHOUETTE ≠ FORM. Two shapes can share an outline; IoU is necessary, not sufficient.
//
// PURITY. The pure core (parse, project, rasterize) takes bytes / in-memory structures and never touches
// fs, GL, or the network, so `src/**/*.test.mjs` exercises every line offline on a SYNTHETIC cube + a tiny
// hand-built GLB (no 5 MB asset in the suite). The only I/O — read a .glb, write a PNG — lives in the
// `import.meta`-guarded CLI at the bottom (the trellis-glb.mjs pattern), lazy-importing node:fs + pngjs.

import { framedCamera } from "../../render/src/camera.mjs";
import { SCULPTURE_VIEW_3Q } from "../sculpture.mjs";

/** Schema tag stamped nowhere yet but version-checkable by T-049-01's GLB target. */
export const GLB_SILHOUETTE_SCHEMA = "glb-silhouette/v1";

/** Default raster size (matches DEFAULT_VIEW / the build render's 512²). */
export const SILHOUETTE_DEFAULTS = Object.freeze({ width: 512, height: 512 });

const GLTF_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; // "BIN\0"

// glTF accessor component sizes (bytes) and element-component counts.
const COMP_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const TYPE_NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

// --- small vec/mat4 math (column-major, glTF's convention) -----------------

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function normalize3(a) {
  const L = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
}

function mat4Identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** A column-major 16-float glTF node.matrix passes through verbatim. */
function mat4FromArray(a) {
  return a.slice(0, 16);
}

/** Compose M = T · R · S (column-major) from glTF translation / rotation(quat xyzw) / scale. */
function mat4FromTRS(t, q, s) {
  const [x, y, z, w] = q;
  const [sx, sy, sz] = s;
  // rotation 3×3 (row-major elements rIJ), then placed column-major with per-column scale.
  const r00 = 1 - 2 * (y * y + z * z), r01 = 2 * (x * y - w * z), r02 = 2 * (x * z + w * y);
  const r10 = 2 * (x * y + w * z), r11 = 1 - 2 * (x * x + z * z), r12 = 2 * (y * z - w * x);
  const r20 = 2 * (x * z - w * y), r21 = 2 * (y * z + w * x), r22 = 1 - 2 * (x * x + y * y);
  return [
    r00 * sx, r10 * sx, r20 * sx, 0,
    r01 * sy, r11 * sy, r21 * sy, 0,
    r02 * sz, r12 * sz, r22 * sz, 0,
    t[0], t[1], t[2], 1,
  ];
}

/** out = a · b, both column-major. */
function mat4Multiply(a, b) {
  const out = new Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b[col * 4] +
        a[4 + row] * b[col * 4 + 1] +
        a[8 + row] * b[col * 4 + 2] +
        a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

// --- GLB binary parse ------------------------------------------------------

/**
 * Split a binary glTF (.glb) into its JSON descriptor and BIN buffer. Pure; no I/O.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @returns {{ json: object, bin: Uint8Array }}
 */
export function parseGlb(bytes) {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (buf.length < 12) throw new Error("glb-silhouette: buffer shorter than a glTF header");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const magic = dv.getUint32(0, true);
  if (magic !== GLTF_MAGIC) throw new Error(`glb-silhouette: bad glTF magic 0x${magic.toString(16)} (not a .glb)`);
  const version = dv.getUint32(4, true);
  if (version !== 2) throw new Error(`glb-silhouette: only glTF v2 supported, got v${version}`);
  const total = dv.getUint32(8, true);

  let jsonText = null;
  let bin = null;
  let off = 12;
  while (off + 8 <= buf.length && off < total) {
    const len = dv.getUint32(off, true);
    const type = dv.getUint32(off + 4, true);
    const start = off + 8;
    const end = start + len;
    if (end > buf.length) throw new Error("glb-silhouette: chunk overruns buffer");
    if (type === CHUNK_JSON) jsonText = new TextDecoder().decode(buf.subarray(start, end));
    else if (type === CHUNK_BIN) bin = buf.subarray(start, end);
    off = end;
  }
  if (!jsonText) throw new Error("glb-silhouette: no JSON chunk in GLB");
  return { json: JSON.parse(jsonText), bin: bin || new Uint8Array(0) };
}

/** A per-component DataView getter (little-endian) for a glTF componentType. */
function getterFor(componentType, dv) {
  switch (componentType) {
    case 5120: return (o) => dv.getInt8(o);
    case 5121: return (o) => dv.getUint8(o);
    case 5122: return (o) => dv.getInt16(o, true);
    case 5123: return (o) => dv.getUint16(o, true);
    case 5125: return (o) => dv.getUint32(o, true);
    case 5126: return (o) => dv.getFloat32(o, true);
    default: throw new Error(`glb-silhouette: unsupported componentType ${componentType}`);
  }
}

/**
 * Read one accessor into a flat Float64Array (length count·ncomp), honoring bufferView byteOffset and
 * byteStride (interleaved buffers) and accessor byteOffset. Float64 holds both float positions and integer
 * indices exactly (indices ≤ 2^53). Throws on external/unsupported buffers — a partial mesh would corrupt
 * the very signal the loop reads.
 */
function readAccessor(gltf, bin, accessorIndex) {
  const acc = gltf.accessors[accessorIndex];
  if (!acc) throw new Error(`glb-silhouette: missing accessor ${accessorIndex}`);
  const ncomp = TYPE_NCOMP[acc.type];
  const csize = COMP_SIZE[acc.componentType];
  if (!ncomp) throw new Error(`glb-silhouette: unsupported accessor type ${acc.type}`);
  if (!csize) throw new Error(`glb-silhouette: unsupported componentType ${acc.componentType}`);
  const bv = gltf.bufferViews[acc.bufferView];
  if (!bv) throw new Error(`glb-silhouette: accessor ${accessorIndex} has no bufferView`);
  if (gltf.buffers && gltf.buffers[bv.buffer] && gltf.buffers[bv.buffer].uri) {
    throw new Error("glb-silhouette: external buffer URIs are unsupported (expected a single-binary .glb)");
  }
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const get = getterFor(acc.componentType, dv);
  const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const stride = bv.byteStride || csize * ncomp;
  const out = new Float64Array(acc.count * ncomp);
  for (let e = 0; e < acc.count; e++) {
    const elemOff = base + e * stride;
    for (let c = 0; c < ncomp; c++) out[e * ncomp + c] = get(elemOff + c * csize);
  }
  return out;
}

/** DFS the active scene; invoke cb(node, worldMatrix) for every node carrying a mesh. */
function eachMeshNode(gltf, cb) {
  if (!gltf.nodes) return;
  const sceneIndex = gltf.scene ?? 0;
  const scene = gltf.scenes && gltf.scenes[sceneIndex];
  const roots = scene && scene.nodes ? scene.nodes : gltf.nodes.map((_, i) => i);
  const visit = (nodeIndex, parentWorld) => {
    const node = gltf.nodes[nodeIndex];
    if (!node) return;
    const local = node.matrix
      ? mat4FromArray(node.matrix)
      : mat4FromTRS(node.translation || [0, 0, 0], node.rotation || [0, 0, 0, 1], node.scale || [1, 1, 1]);
    const world = mat4Multiply(parentWorld, local);
    if (node.mesh !== undefined) cb(node, world);
    if (node.children) for (const c of node.children) visit(c, world);
  };
  for (const r of roots) visit(r, mat4Identity());
}

/**
 * Load and merge all triangle geometry from a GLB into a single world-space mesh: positions (node
 * transforms baked), triangle indices, and the float AABB. Pure; no I/O.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @returns {{ positions: Float64Array, indices: Uint32Array, bounds:{min:number[],max:number[]}, triCount:number }}
 */
export function loadMeshFromGlb(bytes) {
  const { json: gltf, bin } = parseGlb(bytes);
  const positions = [];
  const indices = [];
  let vertexBase = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  eachMeshNode(gltf, (node, world) => {
    const mesh = gltf.meshes && gltf.meshes[node.mesh];
    if (!mesh) return;
    for (const prim of mesh.primitives || []) {
      if (prim.mode !== undefined && prim.mode !== 4) {
        throw new Error(`glb-silhouette: only triangle primitives (mode 4) supported, got mode ${prim.mode}`);
      }
      const posAcc = prim.attributes && prim.attributes.POSITION;
      if (posAcc === undefined) throw new Error("glb-silhouette: primitive missing a POSITION attribute");
      const pos = readAccessor(gltf, bin, posAcc);
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        const wx = world[0] * x + world[4] * y + world[8] * z + world[12];
        const wy = world[1] * x + world[5] * y + world[9] * z + world[13];
        const wz = world[2] * x + world[6] * y + world[10] * z + world[14];
        positions.push(wx, wy, wz);
        if (wx < min[0]) min[0] = wx;
        if (wy < min[1]) min[1] = wy;
        if (wz < min[2]) min[2] = wz;
        if (wx > max[0]) max[0] = wx;
        if (wy > max[1]) max[1] = wy;
        if (wz > max[2]) max[2] = wz;
      }
      if (prim.indices !== undefined) {
        const idx = readAccessor(gltf, bin, prim.indices);
        for (let i = 0; i < idx.length; i++) indices.push(vertexBase + idx[i]);
      } else {
        for (let i = 0; i < count; i++) indices.push(vertexBase + i);
      }
      vertexBase += count;
    }
  });

  if (positions.length === 0) throw new Error("glb-silhouette: no triangle geometry found in GLB");
  return {
    positions: Float64Array.from(positions),
    indices: Uint32Array.from(indices),
    bounds: { min, max },
    triCount: indices.length / 3,
  };
}

// --- camera (adapter over render/src/camera.mjs) ---------------------------

/**
 * Frame a CONTINUOUS mesh AABB with the build render's camera. framedCamera/boxOf model a voxel box as
 * `[min, max+1]`; to frame a continuous box `[min,max]` we pass `max-1` so boxOf's `+1` reconstructs the
 * true `hi = max`. One documented adapter keeps the camera math reused, not forked.
 * @param {{min:number[],max:number[]}} bounds the mesh's float AABB
 * @param {object} view a view partial (defaults applied by framedCamera)
 */
export function cameraForMeshBounds(bounds, view) {
  const voxelized = { min: bounds.min.slice(), max: bounds.max.map((v) => v - 1) };
  return framedCamera(voxelized, view);
}

/** Right-handed view basis (camera +Z toward the eye) from a framedCamera result. */
function viewBasis(cam) {
  const eye = [cam.eye.x, cam.eye.y, cam.eye.z];
  const target = [cam.target.x, cam.target.y, cam.target.z];
  const up = [cam.up.x, cam.up.y, cam.up.z];
  const z = normalize3(sub3(eye, target)); // toward the eye
  const x = normalize3(cross3(up, z));
  const y = cross3(z, x);
  return { eye, x, y, z };
}

/** Project a world point to screen pixels via the same gluLookAt + vertical-FOV perspective the render
 *  uses. `w = -z_camera` (depth in front of the eye); `w ≤ 0` means behind the camera (x/y are NaN). */
function projectVertex(basis, f, aspect, width, height, X, Y, Z) {
  const dx = X - basis.eye[0], dy = Y - basis.eye[1], dz = Z - basis.eye[2];
  const xc = dx * basis.x[0] + dy * basis.x[1] + dz * basis.x[2];
  const yc = dx * basis.y[0] + dy * basis.y[1] + dz * basis.y[2];
  const zc = dx * basis.z[0] + dy * basis.z[1] + dz * basis.z[2];
  const w = -zc;
  if (w <= 0) return { x: NaN, y: NaN, w };
  const sx = ((f / aspect) * (xc / w) * 0.5 + 0.5) * width;
  const sy = (0.5 - (f * (yc / w)) * 0.5) * height;
  return { x: sx, y: sy, w };
}

/**
 * Project a single point — exported for tests. `cam` is a framedCamera result.
 * @param {number[]|{x:number,y:number,z:number}} p
 * @returns {{x:number,y:number,w:number}}
 */
export function projectPoint(p, cam, width, height) {
  const basis = viewBasis(cam);
  const f = 1 / Math.tan((cam.fov * Math.PI / 180) / 2);
  const X = Array.isArray(p) ? p[0] : p.x;
  const Y = Array.isArray(p) ? p[1] : p.y;
  const Z = Array.isArray(p) ? p[2] : p.z;
  return projectVertex(basis, f, aspect(width, height), width, height, X, Y, Z);
}
const aspect = (w, h) => w / h;

// --- rasterization ---------------------------------------------------------

/** Tight half-open foreground bbox `{x0,y0,x1,y1}` of a binary mask, or null if empty (form-fidelity convention). */
function bboxOf(data, w, h) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (data[row + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** Projected screen rectangle (half-open, clamped to frame) of a region 3-D AABB's 8 corners, or null. */
function projectedRegionRect(region, basis, f, asp, width, height) {
  const { min, max } = region;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, any = false;
  for (let i = 0; i < 8; i++) {
    const X = i & 1 ? max[0] : min[0];
    const Y = i & 2 ? max[1] : min[1];
    const Z = i & 4 ? max[2] : min[2];
    const p = projectVertex(basis, f, asp, width, height, X, Y, Z);
    if (p.w <= 0) continue;
    any = true;
    if (p.x < x0) x0 = p.x;
    if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.y > y1) y1 = p.y;
  }
  if (!any) return null;
  const rx0 = Math.max(0, Math.floor(x0));
  const ry0 = Math.max(0, Math.floor(y0));
  const rx1 = Math.min(width, Math.ceil(x1));
  const ry1 = Math.min(height, Math.ceil(y1));
  if (rx1 <= rx0 || ry1 <= ry0) return null;
  return { x0: rx0, y0: ry0, x1: rx1, y1: ry1 };
}

/**
 * Rasterize a mesh's silhouette into a binary mask. Whole-object by default; if `opts.region` (a 3-D AABB
 * `{min,max}` in mesh world coords) is given, the mask is clipped to that region's projected screen rect.
 * Returns the SAME shape as form-fidelity's `extractSilhouette` so it feeds `normalizeSilhouette` directly.
 *
 * @param {{positions:Float64Array, indices:Uint32Array, bounds:object}} mesh from {@link loadMeshFromGlb}
 * @param {{view?:object, width?:number, height?:number, region?:{min:number[],max:number[]}}} [opts]
 * @returns {{w:number,h:number,data:Uint8Array,fgCount:number,bbox:object|null}}
 */
export function rasterizeSilhouette(mesh, opts = {}) {
  const merged = { ...SCULPTURE_VIEW_3Q, ...(opts.view || {}) };
  const width = opts.width ?? merged.width ?? SILHOUETTE_DEFAULTS.width;
  const height = opts.height ?? merged.height ?? SILHOUETTE_DEFAULTS.height;
  const view = { ...merged, width, height };
  const cam = cameraForMeshBounds(mesh.bounds, view);
  const basis = viewBasis(cam);
  const asp = aspect(width, height);
  const f = 1 / Math.tan((cam.fov * Math.PI / 180) / 2);

  // Project every unique vertex once.
  const N = mesh.positions.length / 3;
  const px = new Float64Array(N);
  const py = new Float64Array(N);
  const pw = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const p = projectVertex(basis, f, asp, width, height, mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2]);
    px[i] = p.x;
    py[i] = p.y;
    pw[i] = p.w;
  }

  const data = new Uint8Array(width * height);
  const idx = mesh.indices;
  const EPS = 1e-9;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    if (pw[a] <= 0 || pw[b] <= 0 || pw[c] <= 0) continue; // any vertex behind the eye → skip
    const ax = px[a], ay = py[a], bx = px[b], by = py[b], cx = px[c], cy = py[c];
    let minX = Math.floor(Math.min(ax, bx, cx));
    let maxX = Math.ceil(Math.max(ax, bx, cx));
    let minY = Math.floor(Math.min(ay, by, cy));
    let maxY = Math.ceil(Math.max(ay, by, cy));
    if (minX < 0) minX = 0;
    if (minY < 0) minY = 0;
    if (maxX > width) maxX = width;
    if (maxY > height) maxY = height;
    if (minX >= maxX || minY >= maxY) continue;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < EPS) continue; // degenerate
    const tol = Math.abs(area) * 1e-7 + EPS; // seam tolerance so shared edges do not gap
    for (let y = minY; y < maxY; y++) {
      const fy = y + 0.5;
      const row = y * width;
      for (let x = minX; x < maxX; x++) {
        const fx = x + 0.5;
        const w0 = (bx - ax) * (fy - ay) - (by - ay) * (fx - ax);
        const w1 = (cx - bx) * (fy - by) - (cy - by) * (fx - bx);
        const w2 = (ax - cx) * (fy - cy) - (ay - cy) * (fx - cx);
        // winding-agnostic (no backface cull): inside if all edges share a sign.
        if ((w0 >= -tol && w1 >= -tol && w2 >= -tol) || (w0 <= tol && w1 <= tol && w2 <= tol)) {
          data[row + x] = 1;
        }
      }
    }
  }

  if (opts.region) {
    const rect = projectedRegionRect(opts.region, basis, f, asp, width, height);
    if (!rect) {
      data.fill(0);
    } else {
      for (let y = 0; y < height; y++) {
        const row = y * width;
        const inY = y >= rect.y0 && y < rect.y1;
        for (let x = 0; x < width; x++) {
          if (!(inY && x >= rect.x0 && x < rect.x1)) data[row + x] = 0;
        }
      }
    }
  }

  let fgCount = 0;
  for (let i = 0; i < data.length; i++) if (data[i]) fgCount++;
  return { w: width, h: height, data, fgCount, bbox: bboxOf(data, width, height) };
}

// --- I/O shell: the only fs/pngjs in the module, run only as a CLI ---------

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync, mkdirSync, writeFileSync } = await import("node:fs");
  const { dirname, basename } = await import("node:path");
  const argv = process.argv.slice(2);
  const inPath = argv[0];
  if (!inPath) {
    console.error("usage: node src/form/glb-silhouette.mjs <input.glb> [output.png] [--region x0,y0,z0,x1,y1,z1]");
    process.exit(2);
  }
  let outPath = argv[1] && !argv[1].startsWith("--") ? argv[1] : null;
  let region;
  const ri = argv.indexOf("--region");
  if (ri >= 0 && argv[ri + 1]) {
    const n = argv[ri + 1].split(",").map(Number);
    region = { min: [n[0], n[1], n[2]], max: [n[3], n[4], n[5]] };
  }
  let bytes;
  try {
    bytes = readFileSync(inPath);
  } catch (e) {
    console.error(
      `glb-silhouette: cannot read ${inPath} (${e.code || e.message}). The TRELLIS GLBs are gitignored — ` +
        "regen via `node benchmarks/sculpture/trellis-glb.mjs <concept.png> <out.glb>`.",
    );
    process.exit(3);
  }
  const mesh = loadMeshFromGlb(bytes);
  const sil = rasterizeSilhouette(mesh, region ? { region } : {});
  if (!outPath) outPath = `benchmarks/sculpture/glb/silhouette/${basename(inPath).replace(/\.glb$/i, "")}-3q.png`;
  const { PNG } = await import("pngjs");
  const png = new PNG({ width: sil.w, height: sil.h });
  for (let i = 0; i < sil.data.length; i++) {
    const v = sil.data[i] ? 0 : 255; // foreground black on white
    png.data[i * 4] = v;
    png.data[i * 4 + 1] = v;
    png.data[i * 4 + 2] = v;
    png.data[i * 4 + 3] = 255;
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, PNG.sync.write(png));
  const cov = (sil.fgCount / (sil.w * sil.h)).toFixed(4);
  console.error(`✓ ${outPath} — ${mesh.triCount} tris, ${sil.fgCount} fg px, coverage ${cov}, bbox ${JSON.stringify(sil.bbox)}`);
}
