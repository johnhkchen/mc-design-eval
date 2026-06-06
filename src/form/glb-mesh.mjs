// Shared binary-glTF (.glb) mesh parser — E-16 (T-050-01 root; T-048-01 reuses this).
//
// `inspectGlb` in benchmarks/sculpture/trellis-glb.mjs only validates the 12-byte header. Both the
// GLB voxelizer (this story, S-050) and the GLB silhouette rasterizer (S-048) need the actual mesh
// geometry — vertices + triangle indices in world space. This is the single, shared parser for that:
// raw .glb bytes → a flat triangle soup + an axis-aligned bounding box. Pure, deterministic, GL-free,
// no external dependency (manual DataView reads over the binary chunk).
//
// Contract (the seam S-048 consumes): parseGlbMesh(glb) → { positions, triangleCount, bounds }
//   positions:     Float64Array, 9 numbers per triangle (3 vertices × xyz), indices already expanded,
//                  node transforms already applied — so consumers need no index/transform indirection.
//   triangleCount: positions.length / 9.
//   bounds:        { min:[x,y,z], max:[x,y,z] } over all emitted vertices (world space).

const GLTF_MAGIC = 0x46546c67; // "glTF" little-endian u32 @ byte 0
const CHUNK_JSON = 0x4e4f534a; // "JSON"
const CHUNK_BIN = 0x004e4942; //  "BIN\0"

// glTF componentType → byte size and DataView reader.
const COMPONENT = {
  5120: { bytes: 1, read: (dv, o) => dv.getInt8(o) },
  5121: { bytes: 1, read: (dv, o) => dv.getUint8(o) },
  5122: { bytes: 2, read: (dv, o) => dv.getInt16(o, true) },
  5123: { bytes: 2, read: (dv, o) => dv.getUint16(o, true) },
  5125: { bytes: 4, read: (dv, o) => dv.getUint32(o, true) },
  5126: { bytes: 4, read: (dv, o) => dv.getFloat32(o, true) },
};
const TYPE_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

/** Thrown for any malformed / unsupported GLB. Messages name the offense; never dump raw bytes. */
export class GlbParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "GlbParseError";
  }
}

function toU8(glb) {
  if (glb instanceof Uint8Array) return glb;
  if (glb instanceof ArrayBuffer) return new Uint8Array(glb);
  if (ArrayBuffer.isView(glb)) return new Uint8Array(glb.buffer, glb.byteOffset, glb.byteLength);
  throw new GlbParseError("parseGlbMesh: expected Uint8Array / ArrayBuffer / Buffer");
}

/** Split a .glb into its JSON object and BIN bytes (the first BIN chunk). */
function splitChunks(buf) {
  if (buf.length < 12) throw new GlbParseError("GLB shorter than a 12-byte header");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, true) !== GLTF_MAGIC) throw new GlbParseError("bad GLB magic (not 'glTF')");
  const version = dv.getUint32(4, true);
  if (version !== 2) throw new GlbParseError(`unsupported glTF version ${version} (need 2)`);
  const total = dv.getUint32(8, true);

  let json = null;
  let bin = null;
  let off = 12;
  while (off + 8 <= Math.min(total, buf.length)) {
    const len = dv.getUint32(off, true);
    const type = dv.getUint32(off + 4, true);
    const start = off + 8;
    const end = start + len;
    if (end > buf.length) throw new GlbParseError("GLB chunk overruns the buffer");
    if (type === CHUNK_JSON && json === null) {
      json = JSON.parse(new TextDecoder().decode(buf.subarray(start, end)));
    } else if (type === CHUNK_BIN && bin === null) {
      bin = buf.subarray(start, end);
    }
    off = end;
  }
  if (json === null) throw new GlbParseError("GLB has no JSON chunk");
  return { json, bin };
}

/** Read one accessor into a flat number[] (count × numComponents), honoring byteOffset + byteStride. */
function readAccessor(json, bin, index) {
  const acc = json.accessors?.[index];
  if (!acc) throw new GlbParseError(`missing accessor ${index}`);
  const comp = COMPONENT[acc.componentType];
  if (!comp) throw new GlbParseError(`unsupported componentType ${acc.componentType}`);
  const numComponents = TYPE_COMPONENTS[acc.type];
  if (!numComponents) throw new GlbParseError(`unsupported accessor type ${acc.type}`);
  const bv = json.bufferViews?.[acc.bufferView];
  if (!bv) throw new GlbParseError(`accessor ${index} has no bufferView`);
  if (!bin) throw new GlbParseError("accessor references binary data but GLB has no BIN chunk");

  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = bv.byteStride ?? numComponents * comp.bytes;
  const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const out = new Array(acc.count * numComponents);
  for (let e = 0; e < acc.count; e++) {
    const elem = base + e * stride;
    for (let c = 0; c < numComponents; c++) out[e * numComponents + c] = comp.read(dv, elem + c * comp.bytes);
  }
  return { array: out, count: acc.count, numComponents };
}

// --- minimal column-major 4×4 matrix math (glTF convention) -------------------------------------

const mat4Identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function mat4Multiply(a, b) {
  const m = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      m[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return m;
}

function mat4FromNode(node) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) return node.matrix.slice();
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  // rotation (column-major) from unit quaternion
  const xx = qx * qx, yy = qy * qy, zz = qz * qz;
  const xy = qx * qy, xz = qx * qz, yz = qy * qz;
  const wx = qw * qx, wy = qw * qy, wz = qw * qz;
  const r = [
    1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy), 0,
    2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx), 0,
    2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy), 0,
    0, 0, 0, 1,
  ];
  // M = T · R · S : scale the rotation columns, then drop translation into the last column.
  return [
    r[0] * sx, r[1] * sx, r[2] * sx, 0,
    r[4] * sy, r[5] * sy, r[6] * sy, 0,
    r[8] * sz, r[9] * sz, r[10] * sz, 0,
    tx, ty, tz, 1,
  ];
}

function transformPoint(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

/**
 * Parse a binary glTF (.glb) into a world-space triangle soup + AABB.
 * @param {Uint8Array|ArrayBuffer|Buffer} glb
 * @returns {{ positions: Float64Array, triangleCount: number, bounds: {min:number[], max:number[]} }}
 */
export function parseGlbMesh(glb) {
  const buf = toU8(glb);
  const { json, bin } = splitChunks(buf);

  const tris = []; // flat: 9 numbers per triangle
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  const emitVertex = (x, y, z) => {
    tris.push(x, y, z);
    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (z < min[2]) min[2] = z;
    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
    if (z > max[2]) max[2] = z;
  };

  const emitMesh = (mesh, world) => {
    for (const prim of mesh.primitives ?? []) {
      const posIdx = prim.attributes?.POSITION;
      if (posIdx == null) throw new GlbParseError("mesh primitive has no POSITION attribute");
      const pos = readAccessor(json, bin, posIdx);
      const verts = []; // world-space xyz triples
      for (let v = 0; v < pos.count; v++) {
        const [wx, wy, wz] = transformPoint(world, pos.array[v * 3], pos.array[v * 3 + 1], pos.array[v * 3 + 2]);
        verts.push(wx, wy, wz);
      }
      let indices;
      if (prim.indices != null) {
        indices = readAccessor(json, bin, prim.indices).array;
      } else {
        indices = Array.from({ length: pos.count }, (_, i) => i); // non-indexed: sequential
      }
      for (let t = 0; t + 2 < indices.length; t += 3) {
        for (const vi of [indices[t], indices[t + 1], indices[t + 2]]) {
          emitVertex(verts[vi * 3], verts[vi * 3 + 1], verts[vi * 3 + 2]);
        }
      }
    }
  };

  const walkNode = (idx, parent) => {
    const node = json.nodes?.[idx];
    if (!node) return;
    const world = mat4Multiply(parent, mat4FromNode(node));
    if (node.mesh != null) emitMesh(json.meshes[node.mesh], world);
    for (const child of node.children ?? []) walkNode(child, world);
  };

  const scene = json.scenes?.[json.scene ?? 0];
  if (scene?.nodes?.length) {
    for (const root of scene.nodes) walkNode(root, mat4Identity());
  } else if (json.nodes?.length) {
    json.nodes.forEach((_, i) => walkNode(i, mat4Identity()));
  } else {
    // No scene graph: emit every mesh at identity.
    for (const mesh of json.meshes ?? []) emitMesh(mesh, mat4Identity());
  }

  if (tris.length === 0) throw new GlbParseError("GLB contained no triangles");
  return { positions: Float64Array.from(tris), triangleCount: tris.length / 9, bounds: { min, max } };
}
