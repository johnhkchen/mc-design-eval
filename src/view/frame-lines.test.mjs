import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { roofRegion } from "./structural-read.mjs";
import { FRAME_KINDS, cornerColumns, wallCells, frameLines, fieldInstances } from "./frame-lines.mjs";

function box(cells, [x0, x1], [y0, y1], [z0, z1], block) {
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) cells.push({ pos: [x, y, z], block });
    }
  }
}

const roofKeysOf = (occ) => new Set(roofRegion(occ).cells.map((c) => `${c.x},${c.y},${c.z}`));

/** HUT A — 5×4 solid two-storey box (y0..2 stone, y3..6 plaster), stepped roof along x
 *  (y7 full, y8 x1..3, y9 x2), chimney column at (4,3) rising y8..10 through the roof plane.
 *  floorLines [0,3,7], upperTop 7 (roof zone = y>=7 ∪ roofKeys). Hand-counted expectations. */
function hutA() {
  const cells = [];
  box(cells, [0, 4], [0, 2], [0, 3], "stone_bricks");
  box(cells, [0, 4], [3, 6], [0, 3], "white_terracotta");
  box(cells, [0, 4], [7, 7], [0, 3], "spruce_planks");
  box(cells, [1, 3], [8, 8], [0, 3], "spruce_planks");
  box(cells, [2, 2], [9, 9], [0, 3], "spruce_planks");
  for (const y of [8, 9, 10]) cells.push({ pos: [4, y, 3], block: "cobblestone" });
  const occ = occupancyFromCells(cells);
  return { occ, geom: { floorLines: [0, 3, 7], upperTop: 7, roofKeys: roofKeysOf(occ) } };
}

/** HUT B — 5×4 solid box y0..4, hollow stepped roof SHELL ridge-along-z (eave courses x0/x4@y5,
 *  x1/x3@y6, ridge x2@y7) with gable WALL triangles at z0/z3 (y5 x1..3, y6 x2). upperTop 8 sits
 *  ABOVE the gable top, so the rake cells are wall — the rake-classification case. */
function hutB() {
  const cells = [];
  box(cells, [0, 4], [0, 4], [0, 3], "stone_bricks");
  for (const [xr, y] of [[[0, 0], 5], [[4, 4], 5], [[1, 1], 6], [[3, 3], 6], [[2, 2], 7]]) {
    box(cells, xr, [y, y], [0, 3], "spruce_planks");
  }
  for (const z of [0, 3]) {
    box(cells, [1, 3], [5, 5], [z, z], "white_terracotta");
    box(cells, [2, 2], [6, 6], [z, z], "white_terracotta");
  }
  const occ = occupancyFromCells(cells);
  return { occ, geom: { floorLines: [0], upperTop: 8, roofKeys: roofKeysOf(occ) } };
}

test("FRAME_KINDS: precedence order is cornerPost > roofline > floorLine", () => {
  assert.deepEqual([...FRAME_KINDS], ["cornerPost", "roofline", "floorLine"]);
});

test("hutA roofKeys sanity: stepped slope tops + the chimney cap, never covered courses", () => {
  const { geom } = hutA();
  assert.equal(geom.roofKeys.size, 20);
  assert.ok(geom.roofKeys.has("4,10,3"), "chimney cap is top-exposed");
  assert.ok(!geom.roofKeys.has("1,7,0"), "covered eave course cell is not top-exposed");
});

test("wallCells: perimeter cells only — roof zone and interior excluded", () => {
  const { occ, geom } = hutA();
  const walls = [...wallCells(occ, geom)];
  assert.equal(walls.length, 98); // 14-cell perimeter × 7 layers (y0..6)
  assert.ok(walls.every(({ voxel }) => voxel[1] < 7), "no wall cell at/above upperTop");
  assert.ok(!walls.some(({ key }) => key === "4,8,3"), "chimney shaft above the roof plane is roof zone");
});

test("cornerColumns: exactly the four convex outline corners of the WALL footprint", () => {
  const { occ, geom } = hutA();
  assert.deepEqual([...cornerColumns(occ, geom)].sort(), ["0,0", "0,3", "4,0", "4,3"]);
});

test("frameLines hutA: posts span both storeys, eave crowns the walls, beam at the storey line", () => {
  const { occ, geom } = hutA();
  const frame = frameLines(occ, geom);
  assert.equal(frame.counts.wall, 98);
  assert.equal(frame.counts.cornerPost, 28); // 4 columns × y0..6
  assert.equal(frame.counts.roofline, 10);   // 14 perimeter columns − 4 corners, crown row y6
  assert.equal(frame.counts.floorLine, 10);  // same 10 non-corner columns at y3
  // posts reach into BOTH storeys (the rhythm shows on every storey by construction)
  assert.equal(frame.cells.get("0,1,0"), "cornerPost");
  assert.equal(frame.cells.get("0,5,0"), "cornerPost");
  // crown + beam land on non-corner perimeter cells
  assert.ok(frame.byKind.roofline.every((k) => Number(k.split(",")[1]) === 6));
  assert.ok(frame.byKind.floorLine.every((k) => Number(k.split(",")[1]) === 3));
});

test("frameLines hutA: precedence — a corner cell at the crown is a cornerPost, not roofline", () => {
  const { occ, geom } = hutA();
  const frame = frameLines(occ, geom);
  assert.equal(frame.cells.get("0,6,0"), "cornerPost");
});

test("frameLines hutA: the ground slab line and the eave floor line are NOT beam rows", () => {
  const { occ, geom } = hutA();
  const frame = frameLines(occ, geom);
  assert.ok(![...frame.byKind.floorLine].some((k) => Number(k.split(",")[1]) === 0));
  // y7 cells are roof zone entirely — nothing to classify there
  assert.ok(![...frame.cells.keys()].some((k) => Number(k.split(",")[1]) >= 7));
});

test("frameLines hutA: chimney cells above the roof plane are never frame cells", () => {
  const { occ, geom } = hutA();
  const frame = frameLines(occ, geom);
  for (const key of ["4,8,3", "4,9,3", "4,10,3"]) assert.ok(!frame.cells.has(key), key);
  // but the chimney COLUMN's wall cells below the roof are a legitimate corner post
  assert.equal(frame.cells.get("4,2,3"), "cornerPost");
});

test("frameLines hutB: gable rakes trace the slope, eave beams crown the long sides", () => {
  const { occ, geom } = hutB();
  const frame = frameLines(occ, geom);
  assert.equal(frame.counts.wall, 78); // 14 × 5 box layers + 8 gable cells
  // rake cells: gable triangle crowns under the slope (below upperTop-1, caught by roof adjacency)
  for (const key of ["1,5,0", "3,5,0", "2,6,0", "1,5,3", "3,5,3", "2,6,3"]) {
    assert.equal(frame.cells.get(key), "roofline", key);
  }
  // the gable FIELD cell between the rakes stays unclassified (a panel field)
  assert.ok(!frame.cells.has("2,5,0"));
  // eave beams on the long (x0/x4) sides, non-corner columns
  for (const key of ["0,4,1", "0,4,2", "4,4,1", "4,4,2"]) {
    assert.equal(frame.cells.get(key), "roofline", key);
  }
  assert.equal(frame.counts.roofline, 10);
});

test("fieldInstances hutA front face: the floor-line beam splits the wall into two bounded fields", () => {
  const { occ, geom } = hutA();
  const frame = frameLines(occ, geom);
  const [front] = fieldInstances(occ, frame, { ...geom, dirs: ["-z"] });
  assert.equal(front.dir, "-z");
  assert.equal(front.instances.length, 2);
  const sizes = front.instances.map((i) => i.cells).sort((a, b) => a - b);
  assert.deepEqual(sizes, [6, 9]); // x1..3 × (y4..5) above the beam, x1..3 × (y0..2) below
  for (const inst of front.instances) {
    for (const v of inst.voxels) {
      const key = v.join(",");
      assert.ok(!frame.cells.has(key), `field voxel ${key} is not a frame cell`);
      assert.ok(v[1] < geom.upperTop && !geom.roofKeys.has(key), `field voxel ${key} is wall`);
    }
  }
});

test("fieldInstances: every instance voxel back-projects to an occupied solid cell", () => {
  const { occ, geom } = hutA();
  const frame = frameLines(occ, geom);
  for (const { instances } of fieldInstances(occ, frame, geom)) {
    for (const inst of instances) {
      for (const [x, y, z] of inst.voxels) assert.ok(occ.solid(x, y, z));
    }
  }
});

test("degenerate inputs: empty occupancy yields empty structures, no throw", () => {
  const empty = occupancyFromCells([]);
  const geom = { floorLines: [], upperTop: 0, roofKeys: new Set() };
  assert.deepEqual([...wallCells(empty, geom)], []);
  assert.equal(cornerColumns(empty, geom).size, 0);
  const frame = frameLines(empty, geom);
  assert.equal(frame.cells.size, 0);
  assert.deepEqual(frame.counts, { wall: 0, cornerPost: 0, roofline: 0, floorLine: 0 });
  for (const { instances } of fieldInstances(empty, frame, geom)) assert.deepEqual(instances, []);
});

test("fixture cells are invisible to the frame read (solid view at entry)", () => {
  const { occ: base, geom } = hutA();
  const cells = [];
  for (const [k, b] of base.cells) cells.push({ pos: k.split(",").map(Number), block: b });
  cells.push({ pos: [2, 3, -1], block: "spruce_trapdoor", form: "fixture" }); // dressed proud fixture
  const occ = occupancyFromCells(cells);
  const frame = frameLines(occ, { ...geom, roofKeys: geom.roofKeys });
  assert.ok(!frame.cells.has("2,3,-1"));
  assert.equal(frame.counts.wall, 98, "wall census unchanged by the fixture");
});
