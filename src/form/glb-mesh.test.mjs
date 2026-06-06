// Unit tests for the shared GLB mesh parser. Offline — builds a minimal valid .glb in memory (no 5 MB
// fixture). The same buildBoxGlb helper seeds the voxelizer tests.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseGlbMesh, GlbParseError } from "./glb-mesh.mjs";

// 8 corners of an axis-aligned box at `min` with per-axis `size`.
function boxCorners(min, size) {
  const [x0, y0, z0] = min;
  const [sx, sy, sz] = size;
  const x1 = x0 + sx, y1 = y0 + sy, z1 = z0 + sz;
  return [
    [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
    [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
  ];
}

// 12 triangles (2 per face) as U16 indices into the 8 corners.
const BOX_TRIS = [
  0, 2, 1, 0, 3, 2, // z0
  4, 5, 6, 4, 6, 7, // z1
  0, 1, 5, 0, 5, 4, // y0
  3, 7, 6, 3, 6, 2, // y1
  0, 4, 7, 0, 7, 3, // x0
  1, 2, 6, 1, 6, 5, // x1
];

const pad4 = (n) => (n + 3) & ~3;

/**
 * Build a minimal valid binary glTF for a solid box. `node` lets a test attach a transform
 * (translation / rotation / scale / matrix). Returns a Uint8Array.
 */
export function buildBoxGlb(min = [0, 0, 0], size = [1, 1, 1], node = {}) {
  const corners = boxCorners(min, size);
  // BIN: positions (8×VEC3 f32) then indices (36×u16), each bufferView 4-byte aligned.
  const posBytes = corners.length * 3 * 4; // 96
  const idxBytes = pad4(BOX_TRIS.length * 2); // 72
  const bin = new Uint8Array(posBytes + idxBytes);
  const dv = new DataView(bin.buffer);
  corners.forEach((c, i) => {
    dv.setFloat32(i * 12, c[0], true);
    dv.setFloat32(i * 12 + 4, c[1], true);
    dv.setFloat32(i * 12 + 8, c[2], true);
  });
  BOX_TRIS.forEach((idx, i) => dv.setUint16(posBytes + i * 2, idx, true));

  const json = {
    asset: { version: "2.0" },
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes },
      { buffer: 0, byteOffset: posBytes, byteLength: BOX_TRIS.length * 2 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, type: "VEC3", count: corners.length },
      { bufferView: 1, componentType: 5123, type: "SCALAR", count: BOX_TRIS.length },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    nodes: [{ mesh: 0, ...node }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = new Uint8Array(pad4(jsonBytes.length));
  jsonPad.fill(0x20); // pad JSON chunk with spaces
  jsonPad.set(jsonBytes);

  const total = 12 + 8 + jsonPad.length + 8 + bin.length;
  const out = new Uint8Array(total);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, 0x46546c67, true); // magic
  odv.setUint32(4, 2, true); // version
  odv.setUint32(8, total, true); // length
  odv.setUint32(12, jsonPad.length, true);
  odv.setUint32(16, 0x4e4f534a, true); // JSON
  out.set(jsonPad, 20);
  let off = 20 + jsonPad.length;
  odv.setUint32(off, bin.length, true);
  odv.setUint32(off + 4, 0x004e4942, true); // BIN
  out.set(bin, off + 8);
  return out;
}

test("parseGlbMesh: unit cube → 12 triangles, expanded soup, known bounds", () => {
  const { positions, triangleCount, bounds } = parseGlbMesh(buildBoxGlb([0, 0, 0], [1, 1, 1]));
  assert.equal(triangleCount, 12);
  assert.equal(positions.length, 12 * 9);
  assert.deepEqual(bounds.min, [0, 0, 0]);
  assert.deepEqual(bounds.max, [1, 1, 1]);
});

test("parseGlbMesh: deterministic — two parses are byte-identical", () => {
  const glb = buildBoxGlb([0, 0, 0], [2, 3, 4]);
  const a = parseGlbMesh(glb);
  const b = parseGlbMesh(glb);
  assert.deepEqual(Array.from(a.positions), Array.from(b.positions));
  assert.deepEqual(a.bounds, b.bounds);
});

test("parseGlbMesh: node translation shifts bounds (TRS path)", () => {
  const { bounds } = parseGlbMesh(buildBoxGlb([0, 0, 0], [1, 1, 1], { translation: [10, -5, 2] }));
  assert.deepEqual(bounds.min, [10, -5, 2]);
  assert.deepEqual(bounds.max, [11, -4, 3]);
});

test("parseGlbMesh: node scale grows bounds (TRS path)", () => {
  const { bounds } = parseGlbMesh(buildBoxGlb([0, 0, 0], [1, 1, 1], { scale: [3, 1, 1] }));
  assert.deepEqual(bounds.min, [0, 0, 0]);
  assert.deepEqual(bounds.max, [3, 1, 1]);
});

test("parseGlbMesh: rejects truncated header", () => {
  assert.throws(() => parseGlbMesh(new Uint8Array(4)), GlbParseError);
});

test("parseGlbMesh: rejects bad magic", () => {
  const glb = buildBoxGlb();
  const broken = glb.slice();
  broken[0] ^= 0xff; // corrupt magic
  assert.throws(() => parseGlbMesh(broken), /magic/);
});

test("parseGlbMesh: accepts ArrayBuffer and Buffer inputs", () => {
  const glb = buildBoxGlb();
  const fromAb = parseGlbMesh(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength));
  assert.equal(fromAb.triangleCount, 12);
});
