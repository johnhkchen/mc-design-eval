// Tests for the surface-coherence ops pure core (T-084-01). Synthetic occupancy — no GL, no model.
// Pins the AC: "a holed shell seals; strays strip; a breached shell fails the check".

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { occupancyFromCells } from "./occupancy.mjs";
import {
  sealRoof, sealWallFace, sealWalls, watertightCheck, applyDeltas, overlay, roofOutlineCoverage,
  enclosedMassKeys,
} from "./surface-coherence.mjs";

/** Solid box [0..sx-1]×[0..sy-1]×[0..sz-1] of one block. */
function solidBox(sx, sy, sz, block = "minecraft:stone") {
  const cells = [];
  for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) {
    cells.push({ pos: [x, y, z], block });
  }
  return cells;
}

/** Hollow box: the shell of [0..s-1]^3 (all six faces), interior air. A real container with a cavity. */
function hollowBox(s, block = "minecraft:stone") {
  const cells = [];
  for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) for (let z = 0; z < s; z++) {
    if (x === 0 || x === s - 1 || y === 0 || y === s - 1 || z === 0 || z === s - 1) cells.push({ pos: [x, y, z], block });
  }
  return cells;
}

// ----------------------------------------------------------------------------------------------------
// sealRoof — strip strays + seal holes
// ----------------------------------------------------------------------------------------------------

test("sealRoof strips a lone stray and reports coverage 1.0, strayCount → 0", () => {
  // 3×3 roof slab at y=1 over a y=0 base, one stray cobblestone.
  const cells = [];
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) {
    cells.push({ pos: [x, 0, z], block: "minecraft:stone" });
    cells.push({ pos: [x, 1, z], block: (x === 1 && z === 1) ? "minecraft:cobblestone" : "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const r = sealRoof(occ);
  assert.equal(r.field, "stone");
  assert.equal(r.stripped, 1);
  assert.equal(r.filled, 0);
  assert.equal(r.before.strayCount, 1);
  assert.equal(r.after.strayCount, 0);
  assert.equal(r.after.coverage, 1.0);
  // the recolor lands at the stray's voxel, namespaced
  assert.deepEqual(r.placements[0], { op: "voxel", pos: [1, 1, 1], block: "minecraft:stone" });
});

test("sealRoof seals an enclosed roof hole and leaves bbox corners alone", () => {
  // L-shaped roof: a 3×3 with the centre column missing (enclosed hole) AND a missing corner (border-open).
  const cells = [];
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) {
    if (x === 1 && z === 1) continue;       // enclosed hole — must be sealed
    if (x === 2 && z === 2) continue;        // corner, touches the border — must NOT be sealed
    cells.push({ pos: [x, 1, z], block: "minecraft:stone" });
    cells.push({ pos: [x, 0, z], block: "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const r = sealRoof(occ);
  assert.equal(r.filled, 1, "only the enclosed centre hole is sealed");
  assert.deepEqual(r.placements.find((p) => p.op === "voxel").pos, [1, 1, 1]);
  assert.equal(r.after.coverage, 1.0);
});

test("sealRoof honours an explicit strip set (restricts which strays recolor)", () => {
  const cells = [];
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) {
    cells.push({ pos: [x, 0, z], block: "minecraft:stone" });
    cells.push({ pos: [x, 1, z], block: x === 0 ? "minecraft:dirt" : "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const all = sealRoof(occ);
  assert.equal(all.stripped, 3); // the whole x=0 row is dirt
  const restricted = sealRoof(occ, { strip: [{ x: 0, z: 0 }] });
  assert.equal(restricted.stripped, 1);
});

test("sealRoof is empty-safe", () => {
  const r = sealRoof(occupancyFromCells([]));
  assert.deepEqual(r.placements, []);
  assert.equal(r.field, null);
});

// ----------------------------------------------------------------------------------------------------
// sealWallFace / sealWalls — strip intrusions + seal skin holes
// ----------------------------------------------------------------------------------------------------

test("sealWallFace strips a wrong-material intrusion to the field block", () => {
  // A -z elevation: 3×3 wall in stone with one spruce_planks intrusion.
  const cells = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) {
    cells.push({ pos: [x, y, 0], block: (x === 1 && y === 1) ? "minecraft:spruce_planks" : "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const r = sealWallFace(occ, "-z");
  assert.equal(r.field, "stone");
  assert.equal(r.stripped, 1);
  assert.equal(r.before.intrusions, 1);
  assert.equal(r.after.intrusions, 0);
  assert.equal(r.placements[0].block, "minecraft:stone");
});

test("sealWallFace seals an enclosed skin hole but never an intended opening", () => {
  // 3-wide × 4-tall -z wall. Enclosed hole at (x1,y2); a doorway gap at (x1,y0) on the bottom border.
  // The filled (x1,y1) row between them keeps the two air regions from merging into one border-touching
  // component, so the hole reads enclosed and the doorway reads border-open.
  const cells = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 4; y++) {
    if (x === 1 && y === 2) continue; // enclosed hole → seal
    if (x === 1 && y === 0) continue; // bottom-border gap (a doorway) → leave
    cells.push({ pos: [x, y, 0], block: "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const r = sealWallFace(occ, "-z");
  assert.equal(r.sealed, 1, "only the enclosed hole is sealed; the doorway is left open");
  assert.equal(r.after.holes, 0);
  assert.deepEqual(r.placements[0].pos, [1, 2, 0]);
});

test("sealWalls dedups a corner voxel shared by two faces", () => {
  // A 2×2×2 box, all stone except the corner (0,0,0) is a different block → an intrusion visible on the
  // -x AND -z faces. sealWalls must emit ONE recolor for it, not two.
  const cells = solidBox(2, 2, 2);
  const occ0 = occupancyFromCells(
    cells.map((c) => (c.pos[0] === 0 && c.pos[1] === 0 && c.pos[2] === 0 ? { ...c, block: "minecraft:dirt" } : c)),
  );
  const r = sealWalls(occ0);
  const cornerDeltas = r.placements.filter((p) => p.pos[0] === 0 && p.pos[1] === 0 && p.pos[2] === 0);
  assert.equal(cornerDeltas.length, 1, "corner sealed once");
});

test("sealWallFace strips only embedded specks, preserving a coherent material band", () => {
  // A 5×3 -z wall: a 2-wide spruce_planks timber band (columns x0,x1) beside a stone field (x2..x4), plus
  // one lone spruce speck embedded in the stone at (3,1). The band is coherent and must be kept; only the
  // speck is a "random home".
  const cells = [];
  for (let x = 0; x < 5; x++) for (let y = 0; y < 3; y++) {
    const band = x <= 1; // the intentional timber columns
    const speck = x === 3 && y === 1;
    cells.push({ pos: [x, y, 0], block: (band || speck) ? "minecraft:spruce_planks" : "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const r = sealWallFace(occ, "-z"); // field = stone (the plurality: 9 stone vs 6 spruce band + 1 speck)
  assert.equal(r.field, "stone");
  assert.equal(r.stripped, 1, "only the embedded speck is stripped; the timber band survives");
  assert.deepEqual(r.placements[0].pos, [3, 1, 0]);
});

test("sealWallFace fieldMaterial override relabels the field", () => {
  const cells = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) {
    cells.push({ pos: [x, y, 0], block: (x === 1 && y === 1) ? "minecraft:cobblestone" : "minecraft:bricks" });
  }
  const occ = occupancyFromCells(cells);
  const r = sealWallFace(occ, "-z", { fieldMaterial: "minecraft:bricks" });
  assert.equal(r.field, "bricks");
  assert.equal(r.stripped, 1); // the lone cobblestone speck embedded in the bricks field
  assert.equal(r.placements[0].block, "minecraft:bricks");
});

// ----------------------------------------------------------------------------------------------------
// watertightCheck — flood-fill from outside the bbox
// ----------------------------------------------------------------------------------------------------

test("watertightCheck: an intact solid box is watertight (carved core stays sealed)", () => {
  const occ = occupancyFromCells(solidBox(5, 5, 5));
  const r = watertightCheck(occ);
  assert.equal(r.watertight, true);
  assert.ok(r.interiorCells > 0, "the inner 3×3×3 mass is the carve target → the void to enclose");
  assert.equal(r.reached, 0);
});

test("watertightCheck: a hollow box is watertight; a skin breach fails; resealing restores it", () => {
  const occ = occupancyFromCells(hollowBox(5));
  const intact = watertightCheck(occ);
  assert.equal(intact.watertight, true);
  assert.ok(intact.interiorCells > 0, "the 3×3×3 cavity is the enclosed void");

  // Remove a top-face voxel → the exterior flood leaks into the cavity.
  const breached = occupancyFromCells(hollowBox(5).filter((c) => !(c.pos[0] === 2 && c.pos[1] === 4 && c.pos[2] === 2)));
  const bad = watertightCheck(breached);
  assert.equal(bad.watertight, false);
  assert.ok(bad.reached > 0);
  assert.ok(bad.breaches.length > 0);

  // Reseal the breach → watertight again.
  const resealed = overlay(breached, [{ op: "voxel", pos: [2, 4, 2], block: "minecraft:stone" }]);
  assert.equal(watertightCheck(resealed).watertight, true);
});

test("watertightCheck: explicit interior set overrides the default enclosed mass", () => {
  const occ = occupancyFromCells(solidBox(5, 5, 5));
  // A single deep interior cell, given explicitly — buried, so unreachable → watertight.
  const r = watertightCheck(occ, { interior: ["2,2,2"] });
  assert.equal(r.interiorCells, 1);
  assert.equal(r.watertight, true);
});

test("watertightCheck is empty-safe", () => {
  assert.deepEqual(watertightCheck(occupancyFromCells([])), {
    watertight: true, interiorCells: 0, reached: 0, breaches: [],
  });
});

// ----------------------------------------------------------------------------------------------------
// Integration: seal → watertight on a synthetic cottage-like shell (the op-chain → invariant)
// ----------------------------------------------------------------------------------------------------

test("integration: strip ops compose on a watertight hollow box without breaching it", () => {
  // A watertight hollow box with surface defects: a stray cobblestone on the roof and a spruce_planks
  // intrusion on the -z wall. The strips are RECOLORS (no geometry change), so the box stays watertight.
  let cells = hollowBox(5);
  cells = cells.map((c) =>
    c.pos[1] === 4 && c.pos[0] === 1 && c.pos[2] === 1 ? { ...c, block: "minecraft:cobblestone" } : c); // roof stray
  cells = cells.map((c) =>
    c.pos[2] === 0 && c.pos[0] === 1 && c.pos[1] === 1 ? { ...c, block: "minecraft:spruce_planks" } : c); // -z intrusion
  const occ = occupancyFromCells(cells);
  assert.equal(watertightCheck(occ).watertight, true, "the box is watertight to begin with");

  const roof = sealRoof(occ);
  const walls = sealWalls(occ);
  assert.equal(roof.stripped, 1, "the roof stray is stripped");
  assert.ok(walls.stripped >= 1, "the wall intrusion is stripped");

  const sealedOcc = overlay(occ, [...roof.placements, ...walls.placements]);
  assert.equal(roofOutlineCoverage(sealedOcc), 1.0, "roof reads 100% in one material");
  assert.equal(roof.after.strayCount, 0, "no roof strays remain");
  assert.equal(watertightCheck(sealedOcc).watertight, true, "recolors preserve the watertight shell");
});

test("integration: watertightCheck detects a 3-D breach the projection seals do not reach", () => {
  // A floored hollow box with a single roof voxel removed: the floor backs the +y ray, so it is NOT a
  // projection hole the roof op would seal — but it IS a 3-D breach the watertight check must surface.
  const breached = occupancyFromCells(hollowBox(5).filter((c) => !(c.pos[0] === 2 && c.pos[1] === 4 && c.pos[2] === 2)));
  const region = sealRoof(breached);
  assert.equal(region.filled, 0, "the back-lit gap is not an enclosed +y silhouette hole");
  assert.equal(watertightCheck(breached).watertight, false, "the watertight check still catches the leak");
});

test("applyDeltas appends placements without mutating the source artifact", () => {
  const art = { placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:stone" }] };
  const out = applyDeltas(art, [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:bricks" }]);
  assert.equal(art.placements.length, 1, "source untouched");
  assert.equal(out.placements.length, 2);
});

// ----------------------------------------------------------------------------------------------------
// Purity / source guard — the pure invariant cannot regress (mirrors T-082-01)
// ----------------------------------------------------------------------------------------------------

test("enclosedMassKeys: the all-6-neighbours set (the shared carve definition)", () => {
  // 3×3×3 solid box: only the centre (1,1,1) has all six neighbours occupied.
  const box3 = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 3; z++) box3.push({ pos: [x, y, z], block: "minecraft:stone" });
  const keys3 = enclosedMassKeys(occupancyFromCells(box3));
  assert.equal(keys3.size, 1);
  assert.ok(keys3.has("1,1,1"));
  // 2×2×2 box: no cell has all six neighbours → empty.
  const box2 = [];
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) box2.push({ pos: [x, y, z], block: "minecraft:stone" });
  assert.equal(enclosedMassKeys(occupancyFromCells(box2)).size, 0);
});

test("source guard: the ops module imports no model / GL / API key", () => {
  const src = readFileSync(fileURLToPath(new URL("./surface-coherence.mjs", import.meta.url)), "utf8");
  assert.ok(!/ANTHROPIC_API_KEY/.test(src), "no metered API key");
  assert.ok(!/sdk-binding|model-tier|prismarine|playwright|render\//.test(src), "no model/GL import");
});
