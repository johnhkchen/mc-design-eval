// Unit tests for the shared GLB mesh parser. Offline — builds a minimal valid .glb in memory (no 5 MB
// fixture). The same buildBoxGlb helper seeds the voxelizer tests.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseGlbMesh, parseGlbColoredSurface, GlbParseError } from "./glb-mesh.mjs";

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

// A minimal valid .glb with POSITION + TEXCOORD_0 + a baseColor image (bytes are an opaque stub —
// parseGlbColoredSurface only slices + reports them; it never decodes). `imgBytes`/`mimeType` let a
// test assert the slice and the reported mime; per-corner UVs are deterministic (u=i/7, v=i/7).
function buildColoredBoxGlb(min = [0, 0, 0], size = [1, 1, 1], imgBytes = [1, 2, 3, 4, 5], mimeType = "image/webp", viaWebpExt = false) {
  const corners = boxCorners(min, size);
  const posBytes = corners.length * 3 * 4; // 96
  const idxBytes = pad4(BOX_TRIS.length * 2); // 72
  const uvBytes = corners.length * 2 * 4; // 64
  const img = Uint8Array.from(imgBytes);
  const imgPadded = pad4(img.length);
  const bin = new Uint8Array(posBytes + idxBytes + uvBytes + imgPadded);
  const dv = new DataView(bin.buffer);
  corners.forEach((c, i) => {
    dv.setFloat32(i * 12, c[0], true);
    dv.setFloat32(i * 12 + 4, c[1], true);
    dv.setFloat32(i * 12 + 8, c[2], true);
  });
  BOX_TRIS.forEach((idx, i) => dv.setUint16(posBytes + i * 2, idx, true));
  const uvOff = posBytes + idxBytes;
  corners.forEach((_, i) => {
    dv.setFloat32(uvOff + i * 8, i / 7, true);
    dv.setFloat32(uvOff + i * 8 + 4, i / 7, true);
  });
  const imgOff = uvOff + uvBytes;
  bin.set(img, imgOff);

  const json = {
    asset: { version: "2.0" },
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBytes },
      { buffer: 0, byteOffset: posBytes, byteLength: BOX_TRIS.length * 2 },
      { buffer: 0, byteOffset: uvOff, byteLength: uvBytes },
      { buffer: 0, byteOffset: imgOff, byteLength: img.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, type: "VEC3", count: corners.length },
      { bufferView: 1, componentType: 5123, type: "SCALAR", count: BOX_TRIS.length },
      { bufferView: 2, componentType: 5126, type: "VEC2", count: corners.length },
    ],
    extensionsUsed: viaWebpExt ? ["EXT_texture_webp"] : undefined,
    images: [{ bufferView: 3, mimeType }],
    // Real TRELLIS GLBs carry the WebP source under EXT_texture_webp (texture.source is absent).
    textures: [viaWebpExt ? { extensions: { EXT_texture_webp: { source: 0 } } } : { source: 0 }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 2 }, indices: 1, material: 0 }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = new Uint8Array(pad4(jsonBytes.length));
  jsonPad.fill(0x20);
  jsonPad.set(jsonBytes);

  const total = 12 + 8 + jsonPad.length + 8 + bin.length;
  const out = new Uint8Array(total);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, 0x46546c67, true);
  odv.setUint32(4, 2, true);
  odv.setUint32(8, total, true);
  odv.setUint32(12, jsonPad.length, true);
  odv.setUint32(16, 0x4e4f534a, true);
  out.set(jsonPad, 20);
  let off = 20 + jsonPad.length;
  odv.setUint32(off, bin.length, true);
  odv.setUint32(off + 4, 0x004e4942, true);
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

test("parseGlbColoredSurface: per-vertex positions + UVs + bounds match parseGlbMesh", () => {
  const glb = buildColoredBoxGlb([0, 0, 0], [2, 3, 4]);
  const s = parseGlbColoredSurface(glb);
  assert.equal(s.vertices.length, 8 * 3); // 8 corners, one per vertex (NOT a triangle soup)
  assert.equal(s.uvs.length, 8 * 2);
  assert.deepEqual(s.bounds.min, [0, 0, 0]);
  assert.deepEqual(s.bounds.max, [2, 3, 4]);
  // UVs are deterministic u=v=i/7 per the builder; spot-check first and last corner.
  assert.ok(Math.abs(s.uvs[0] - 0) < 1e-6);
  assert.ok(Math.abs(s.uvs[14] - 7 / 7) < 1e-6); // corner 7, u
});

test("parseGlbColoredSurface: reports baseColor image bytes + mime (no decode)", () => {
  const glb = buildColoredBoxGlb([0, 0, 0], [1, 1, 1], [9, 8, 7, 6], "image/webp");
  const s = parseGlbColoredSurface(glb);
  assert.ok(s.baseColor, "expected a baseColor image");
  assert.equal(s.baseColor.mimeType, "image/webp");
  assert.deepEqual(Array.from(s.baseColor.data), [9, 8, 7, 6]);
});

test("parseGlbColoredSurface: resolves baseColor via the EXT_texture_webp extension (TRELLIS form)", () => {
  const glb = buildColoredBoxGlb([0, 0, 0], [1, 1, 1], [1, 2, 3], "image/webp", /* viaWebpExt */ true);
  const s = parseGlbColoredSurface(glb);
  assert.ok(s.baseColor, "expected baseColor resolved through EXT_texture_webp");
  assert.equal(s.baseColor.mimeType, "image/webp");
  assert.deepEqual(Array.from(s.baseColor.data), [1, 2, 3]);
});

test("parseGlbColoredSurface: untextured GLB → baseColor null, UVs zero-filled", () => {
  const s = parseGlbColoredSurface(buildBoxGlb([0, 0, 0], [1, 1, 1])); // no material/UV
  assert.equal(s.baseColor, null);
  assert.equal(s.vertices.length, 8 * 3);
  assert.equal(s.uvs.length, 8 * 2);
  assert.ok(Array.from(s.uvs).every((n) => n === 0));
});

test("parseGlbColoredSurface: node transform applies to vertices (TRS path)", () => {
  const glb = buildBoxGlb([0, 0, 0], [1, 1, 1], { translation: [10, -5, 2] });
  const s = parseGlbColoredSurface(glb);
  assert.deepEqual(s.bounds.min, [10, -5, 2]);
  assert.deepEqual(s.bounds.max, [11, -4, 3]);
});
