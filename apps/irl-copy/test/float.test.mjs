import { test } from "node:test";
import assert from "node:assert/strict";
import { Voxels } from "../src/voxels.mjs";
import { floating, underpin } from "../src/float.mjs";

const ground = () => 0;
function scene() {
  const g = new Voxels([12, 12, 12]);
  for (let z = 0; z < 12; z++) for (let x = 0; x < 12; x++) g.set(x, 0, z, "stone");
  // a podium, and a tower one course clear of it
  for (let z = 2; z < 8; z++) for (let x = 2; x < 8; x++) { g.set(x, 1, z, "stone"); g.set(x, 2, z, "stone"); }
  for (let z = 3; z < 7; z++) for (let x = 3; x < 7; x++) for (let y = 4; y < 9; y++) g.set(x, y, z, "white_concrete");
  return g;
}

test("a tower one course over its podium is floating, and underpin closes the gap", () => {
  const g = scene(), f = floating(g, { ground });
  assert.equal(f.length, 1); assert.equal(f[0].gap, 1);
  assert.equal(underpin(g, f[0]), 16);
  assert.equal(floating(g, { ground }).length, 0);
  assert.equal(g.get(4, 3, 4).block, "minecraft:white_concrete");
});

test("diagonal steps hold together only when any touch counts", () => {
  const g = new Voxels([8, 8, 8]); for (let x = 0; x < 8; x++) g.set(x, 0, 0, "stone");
  for (let k = 1; k < 7; k++) for (let z = 1; z < 3; z++) g.set(k, k, z, "stone");   // a stair of blocks meeting corner to corner
  for (let z = 0; z < 8; z++) g.set(0, 0, z, "stone");
  assert.ok(floating(g, { ground, min: 1 }).length > 0);
  assert.equal(floating(g, { ground, min: 1, faces: false }).length, 0);
});

test("a gap taller than the reach is left alone", () => {
  const g = new Voxels([6, 20, 6]); for (let z = 0; z < 6; z++) for (let x = 0; x < 6; x++) g.set(x, 0, z, "stone");
  for (let z = 1; z < 4; z++) for (let x = 1; x < 4; x++) g.set(x, 12, z, "stone");
  const [h] = floating(g, { ground, min: 1 }); assert.equal(h.gap, 11); assert.equal(underpin(g, h), 0);
});
