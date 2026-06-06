// Tests for the hollow-carve pure core (T-080-01). Synthetic occupancy — no GL, no model. Pins the AC:
// "skin cells survive; enclosed cells removed; structure retained", flatten-by-exclusion (no air op), and
// the exterior-held proof.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { occupancyFromCells, artifactOccupancy } from "./occupancy.mjs";
import {
  markHollowable, carveArtifact, carveOccupancy, cavityReport,
  cornerPostKeys, tallColumnKeys, exteriorSurfaceDigest, exteriorHeld,
} from "./hollow-carve.mjs";

/** Solid box [0..s-1]^3 of one block, as a cell list. */
function solidBoxCells(s, block = "minecraft:stone") {
  const cells = [];
  for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) for (let z = 0; z < s; z++) cells.push({ pos: [x, y, z], block });
  return cells;
}
/** An artifact whose placements are explicit voxels for a cell list. */
function artifactOf(cells) {
  return { schema_version: "1.0.0", placements: cells.map((c) => ({ op: "voxel", pos: c.pos, block: c.block })) };
}
const isSkin = (s, x, y, z) => x === 0 || x === s - 1 || y === 0 || y === s - 1 || z === 0 || z === s - 1;

// ----------------------------------------------------------------------------------------------------
// markHollowable — the removable set (AC #1)
// ----------------------------------------------------------------------------------------------------

test("markHollowable: a 5×5×5 solid box marks exactly the inner 3×3×3 (27 enclosed, none on the skin)", () => {
  const occ = occupancyFromCells(solidBoxCells(5));
  const m = markHollowable(occ);
  assert.equal(m.enclosed, 27);
  assert.equal(m.removeCount, 27);
  for (const key of m.remove) {
    const [x, y, z] = key.split(",").map(Number);
    assert.ok(!isSkin(5, x, y, z), `removed key ${key} must not be a skin cell`);
  }
});

test("markHollowable: inset:2 erodes once → only the centre survives", () => {
  const occ = occupancyFromCells(solidBoxCells(5));
  const m = markHollowable(occ, { inset: 2 });
  assert.equal(m.removeCount, 1);
  assert.ok(m.remove.has("2,2,2"));
});

test("markHollowable: regions restrict removal to the named y-band", () => {
  const occ = occupancyFromCells(solidBoxCells(5));
  const m = markHollowable(occ, { regions: [{ yStart: 1, yEnd: 2 }] });
  for (const key of m.remove) {
    const y = Number(key.split(",")[1]);
    assert.ok(y >= 1 && y <= 2);
  }
  // inner cells live at y∈{1,2,3}; restricting to y∈{1,2} drops the y=3 layer (9 cells).
  assert.equal(m.removeCount, 18);
  assert.equal(m.perBand[0].removed, 18);
});

test("markHollowable: a keep set protects enclosed cells (reported as protectedCount)", () => {
  const occ = occupancyFromCells(solidBoxCells(5));
  const keep = new Set(["2,2,2"]);
  const m = markHollowable(occ, { keep });
  assert.ok(!m.remove.has("2,2,2"));
  assert.equal(m.removeCount, 26);
  assert.equal(m.protectedCount, 1);
});

// ----------------------------------------------------------------------------------------------------
// carve — skin survives, enclosed removed, structure retained (AC #2)
// ----------------------------------------------------------------------------------------------------

test("carveArtifact: skin cells survive, enclosed cells are removed, count is exact", () => {
  const cells = solidBoxCells(5);
  const art = artifactOf(cells);
  const occ = artifactOccupancy(art);
  const m = markHollowable(occ);
  const carved = artifactOccupancy(carveArtifact(art, m.remove));
  // every skin cell present, every enclosed cell gone
  for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) for (let z = 0; z < 5; z++) {
    if (isSkin(5, x, y, z)) assert.ok(carved.has(x, y, z), `skin ${x},${y},${z} must survive`);
    else assert.ok(!carved.has(x, y, z), `enclosed ${x},${y},${z} must be removed`);
  }
  assert.equal(carved.size, occ.size - m.removeCount);
});

test("carveArtifact: explicit structure keep is retained even though enclosed", () => {
  const art = artifactOf(solidBoxCells(5));
  const occ = artifactOccupancy(art);
  const keep = new Set(["2,1,2", "2,2,2", "2,3,2"]); // an interior column
  const m = markHollowable(occ, { keep });
  const carved = artifactOccupancy(carveArtifact(art, m.remove));
  for (const k of keep) {
    const [x, y, z] = k.split(",").map(Number);
    assert.ok(carved.has(x, y, z), `kept structure ${k} must survive`);
  }
});

test("cornerPostKeys: the 4 corner columns of a solid box, all kept by a carve", () => {
  const art = artifactOf(solidBoxCells(5));
  const occ = artifactOccupancy(art);
  const keep = cornerPostKeys(occ);
  assert.equal(keep.size, 4 * 5); // 4 corners × height 5
  for (const k of keep) {
    const [x, , z] = k.split(",").map(Number);
    assert.ok((x === 0 || x === 4) && (z === 0 || z === 4));
  }
});

test("tallColumnKeys: a full-height post is kept; a short interior blob is not", () => {
  const cells = [];
  // a 5×5 floor at y=0
  for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) cells.push({ pos: [x, 0, z], block: "minecraft:stone" });
  // a full-height post at (2,2): y=0..4
  for (let y = 1; y < 5; y++) cells.push({ pos: [2, y, 2], block: "minecraft:cobblestone" });
  // a short blob at (4,4): y=1..2
  for (let y = 1; y <= 2; y++) cells.push({ pos: [4, y, 4], block: "minecraft:dirt" });
  const occ = occupancyFromCells(cells);
  const keep = tallColumnKeys(occ, { minSpanFrac: 0.9 }); // height 5 → threshold 4.5
  assert.ok(keep.has("2,4,2") && keep.has("2,0,2"), "full-height post column kept");
  assert.ok(!keep.has("4,1,4") && !keep.has("4,2,4"), "short blob not kept");
});

// ----------------------------------------------------------------------------------------------------
// flatten-by-exclusion — no air op, blocks/state copied exactly
// ----------------------------------------------------------------------------------------------------

test("carveArtifact: output is all voxel ops, no air, kept blocks/state copied exactly", () => {
  const art = {
    schema_version: "1.0.0",
    placements: [
      { op: "fill", from: [0, 0, 0], to: [4, 4, 4], block: "minecraft:stone" },
      { op: "voxel", pos: [0, 1, 0], block: "minecraft:oak_log", state: { axis: "y" } }, // a stateful skin voxel
    ],
  };
  const occ = artifactOccupancy(art);
  const m = markHollowable(occ);
  const carvedArt = carveArtifact(art, m.remove);
  assert.ok(carvedArt.placements.every((p) => p.op === "voxel"), "all voxel ops");
  assert.ok(carvedArt.placements.every((p) => p.block !== "minecraft:air"), "no air op");
  const stateful = carvedArt.placements.find((p) => p.pos[0] === 0 && p.pos[1] === 1 && p.pos[2] === 0);
  assert.deepEqual(stateful.state, { axis: "y" }, "state copied exactly");
  assert.equal(stateful.block, "minecraft:oak_log");
});

test("carveOccupancy matches re-expanding the carved artifact", () => {
  const art = artifactOf(solidBoxCells(5));
  const occ = artifactOccupancy(art);
  const m = markHollowable(occ);
  const viaOcc = carveOccupancy(occ, m.remove);
  const viaArt = artifactOccupancy(carveArtifact(art, m.remove));
  assert.equal(viaOcc.size, viaArt.size);
  for (const k of viaOcc.cells.keys()) assert.ok(viaArt.cells.has(k));
});

// ----------------------------------------------------------------------------------------------------
// exterior-held proof + cavity record (AC #3, #4)
// ----------------------------------------------------------------------------------------------------

test("exteriorHeld: a real interior carve leaves the 6-ortho exterior digest identical", () => {
  const art = artifactOf(solidBoxCells(6));
  const occ = artifactOccupancy(art);
  const m = markHollowable(occ);
  assert.ok(m.removeCount > 0);
  const carved = carveOccupancy(occ, m.remove);
  const v = exteriorHeld(occ, carved);
  assert.equal(v.held, true);
  assert.equal(v.digestBefore, v.digestAfter);
});

test("exteriorHeld: removing a SKIN cell flips held to false (the digest discriminates)", () => {
  const occ = artifactOccupancy(artifactOf(solidBoxCells(6)));
  const carved = carveOccupancy(occ, new Set(["0,3,3"])); // a -x skin cell
  assert.equal(exteriorHeld(occ, carved).held, false);
});

test("cavityReport: before/removed/after arithmetic is consistent", () => {
  const occ = artifactOccupancy(artifactOf(solidBoxCells(5)));
  const m = markHollowable(occ);
  const r = cavityReport(occ, m.remove);
  assert.equal(r.before, occ.size);
  assert.equal(r.removed, m.removeCount);
  assert.equal(r.after, occ.size - m.removeCount);
});

test("empty / edge cases are safe", () => {
  const empty = occupancyFromCells([]);
  assert.equal(markHollowable(empty).removeCount, 0);
  assert.equal(cornerPostKeys(empty).size, 0);
  assert.equal(tallColumnKeys(empty).size, 0);
  assert.equal(exteriorSurfaceDigest(empty), "");
  assert.equal(exteriorHeld(empty, empty).held, true);
});

// ----------------------------------------------------------------------------------------------------
// Purity / source guard — mirrors surface-coherence.test.mjs
// ----------------------------------------------------------------------------------------------------

test("source guard: the carve module imports no model / GL / API key", () => {
  const src = readFileSync(fileURLToPath(new URL("./hollow-carve.mjs", import.meta.url)), "utf8");
  assert.ok(!/ANTHROPIC_API_KEY/.test(src), "no metered API key");
  assert.ok(!/sdk-binding|model-tier|prismarine|playwright|render\//.test(src), "no model/GL import");
});
