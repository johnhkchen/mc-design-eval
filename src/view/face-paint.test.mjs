import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { projectSurface } from "./surface-grid.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";
import { paintFace, mergePaints, applyPaint } from "./face-paint.mjs";

const ALLOWED = new Set(["stone_bricks", "white_terracotta", "dark_oak_log"]);

/** A solid s×s×s cube of one block at coords 0..s-1, as a cell list + an artifact. */
function cube(s, block = "minecraft:stone_bricks") {
  const cells = [];
  for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) for (let z = 0; z < s; z++) {
    cells.push({ pos: [x, y, z], block });
  }
  return cells;
}
const artifactOf = (cells) => ({
  schema: "1.0.0",
  palette: { manifest: ["minecraft:stone_bricks"] },
  placements: cells.map((c) => ({ op: "voxel", pos: c.pos, block: c.block })),
});
/** A target grid sized to a surface grid, all filled cells → `block`. */
function fillTarget(grid, block) {
  return grid.cells.map((row) => row.map((c) => (c ? block : null)));
}
const posSet = (voxels) => new Set(voxels.map((v) => voxelKey(v.pos)));

test("paintFace recolors every filled cell whose target differs and is in palette", () => {
  const cells = cube(3);
  const occ = occupancyFromCells(cells);
  const grid = projectSurface(occ, "+x");
  const pass = paintFace(occ, "+x", fillTarget(grid, "white_terracotta"), { allowed: ALLOWED });
  assert.equal(pass.painted, grid.filled);
  assert.equal(pass.offPalette, 0);
  assert.ok(pass.placements.every((p) => p.block === "minecraft:white_terracotta"));
  // every painted pos is a real occupied surface voxel
  for (const p of pass.placements) assert.ok(occ.has(...p.pos));
});

test("paint is geometry-safe: expand positions are identical, only blocks change", () => {
  const cells = cube(3);
  const occ = occupancyFromCells(cells);
  const art = artifactOf(cells);
  const grid = projectSurface(occ, "+x");
  const pass = paintFace(occ, "+x", fillTarget(grid, "white_terracotta"), { allowed: ALLOWED });
  const painted = applyPaint(art, pass.placements);
  const before = expandArtifact(art);
  const after = expandArtifact(painted);
  assert.deepEqual(posSet(after), posSet(before)); // NO voxel added/removed/moved
  // the +x front voxels (x=2) are now white_terracotta; interior (x<2) unchanged
  const afterByKey = new Map(after.map((v) => [voxelKey(v.pos), v.block]));
  for (const v of after) {
    if (v.pos[0] === 2) assert.equal(afterByKey.get(voxelKey(v.pos)), "minecraft:white_terracotta");
    else assert.equal(afterByKey.get(voxelKey(v.pos)), "minecraft:stone_bricks");
  }
});

test("no-change cells and off-palette targets emit nothing", () => {
  const occ = occupancyFromCells(cube(3));
  const grid = projectSurface(occ, "+x");
  // target == current block → all skipped
  const same = paintFace(occ, "+x", fillTarget(grid, "stone_bricks"), { allowed: ALLOWED });
  assert.equal(same.painted, 0);
  assert.equal(same.skipped, grid.filled);
  // off-palette target → all dropped, none painted
  const off = paintFace(occ, "+x", fillTarget(grid, "lava"), { allowed: ALLOWED });
  assert.equal(off.painted, 0);
  assert.equal(off.offPalette, grid.filled);
});

test("occluded interior voxel is never painted (never a front-most cell)", () => {
  const occ = occupancyFromCells(cube(3));
  const grid = projectSurface(occ, "+x");
  const pass = paintFace(occ, "+x", fillTarget(grid, "white_terracotta"), { allowed: ALLOWED });
  const painted = posSet(pass.placements.map((p) => ({ pos: p.pos })));
  assert.ok(!painted.has(voxelKey([1, 1, 1]))); // center is occluded from +x
  assert.ok(painted.has(voxelKey([2, 1, 1]))); // its front-most neighbour is painted
});

test("zone gate: plaster painted only in the upper zone; base & roof reject it (AC #1)", () => {
  // A 4-cube. Split it by world y: lower half (y<2) = base, upper half = upper. Paint a plaster target
  // over the +x face; only the upper-half front voxels should be painted, the base-half rejected.
  const s = 4;
  const occ = occupancyFromCells(cube(s));
  const grid = projectSurface(occ, "+x");
  const zoneOf = ([, y]) => (y < 2 ? "base" : "upper");
  const allowedByZone = new Map([
    ["base", new Set(["stone_bricks"])],         // base keeps stone — plaster disallowed
    ["upper", new Set(["white_terracotta"])],    // upper allows plaster
  ]);
  const pass = paintFace(occ, "+x", fillTarget(grid, "white_terracotta"), { allowed: ALLOWED, zoneOf, allowedByZone });
  // every painted voxel is in the upper zone (y >= 2); none below
  assert.ok(pass.placements.length > 0);
  for (const p of pass.placements) assert.ok(p.pos[1] >= 2, `painted voxel ${p.pos} must be upper-zone`);
  // the base-half front cells were rejected by the zone gate, not painted
  assert.ok(pass.zoneRejected > 0);
  assert.equal(pass.painted + pass.zoneRejected, grid.filled); // every filled cell painted or zone-rejected (plaster differs from stone everywhere)

  // a roof-style zone with no plaster rejects it entirely
  const roofZone = () => "roof";
  const roofAllowed = new Map([["roof", new Set(["spruce_planks"])]]);
  const roofPass = paintFace(occ, "+x", fillTarget(grid, "white_terracotta"), { allowed: ALLOWED, zoneOf: roofZone, allowedByZone: roofAllowed });
  assert.equal(roofPass.painted, 0);
  assert.equal(roofPass.zoneRejected, grid.filled);
});

test("zone gate requires allowedByZone to be a Map", () => {
  const occ = occupancyFromCells(cube(3));
  const grid = projectSurface(occ, "+x");
  assert.throws(() => paintFace(occ, "+x", fillTarget(grid, "white_terracotta"), { allowed: ALLOWED, zoneOf: () => "base" }),
    /allowedByZone must be a Map/);
});

test("mergePaints resolves a shared corner voxel to the concept source over glb", () => {
  const conceptPass = { dir: "-z", source: "concept", placements: [{ op: "voxel", pos: [2, 2, 0], block: "minecraft:white_terracotta" }], painted: 1, skipped: 0, offPalette: 0 };
  const glbPass = { dir: "+x", source: "glb", placements: [{ op: "voxel", pos: [2, 2, 0], block: "minecraft:dark_oak_log" }], painted: 1, skipped: 0, offPalette: 0 };
  const merged = mergePaints([glbPass, conceptPass]); // glb listed first to prove priority, not order, decides
  assert.equal(merged.collisions, 1);
  assert.equal(merged.placements.length, 1);
  assert.equal(merged.placements[0].block, "minecraft:white_terracotta"); // concept wins the corner
});

test("mergePaints unions non-colliding paints and dedups by voxelKey", () => {
  const a = { dir: "-z", source: "concept", placements: [{ op: "voxel", pos: [0, 0, 0], block: "minecraft:white_terracotta" }] };
  const b = { dir: "+x", source: "glb", placements: [{ op: "voxel", pos: [1, 0, 0], block: "minecraft:dark_oak_log" }] };
  const merged = mergePaints([a, b]);
  assert.equal(merged.collisions, 0);
  assert.equal(merged.placements.length, 2);
});
