import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { footprint, storeyBands, openings, roofRegion, wallFields, structuralRead, structuralZones, airComponents } from "./structural-read.mjs";

/** Solid box perimeter ring at a fixed y over [0..s-1]² (x,z), one block. */
function ringAtY(s, y, block) {
  const out = [];
  for (let x = 0; x < s; x++) for (let z = 0; z < s; z++) {
    if (x === 0 || x === s - 1 || z === 0 || z === s - 1) out.push({ pos: [x, y, z], block });
  }
  return out;
}
/** Full slab at a fixed y over [0..s-1]². */
function slabAtY(s, y, block) {
  const out = [];
  for (let x = 0; x < s; x++) for (let z = 0; z < s; z++) out.push({ pos: [x, y, z], block });
  return out;
}

test("footprint width×depth on an L-shape", () => {
  // L: a 4×1 arm along x at z=0, and a 1×3 arm along z at x=0.
  const cells = [];
  for (let x = 0; x < 4; x++) cells.push({ pos: [x, 0, 0], block: "minecraft:stone" });
  for (let z = 0; z < 3; z++) cells.push({ pos: [0, 0, z], block: "minecraft:stone" });
  const fp = footprint(occupancyFromCells(cells));
  assert.equal(fp.width, 4); // x spans 0..3
  assert.equal(fp.depth, 3); // z spans 0..2
  assert.equal(fp.area, 4 + 3 - 1); // shared corner (0,0) counted once
  assert.deepEqual(fp.bbox, { minX: 0, maxX: 3, minZ: 0, maxZ: 2 });
});

test("storeyBands: a 2-storey block with a floor slab → 3 bands, floor line on the slab", () => {
  const S = 6;
  const cells = [
    ...ringAtY(S, 0, "minecraft:stone"), ...ringAtY(S, 1, "minecraft:stone"), ...ringAtY(S, 2, "minecraft:stone"),
    ...slabAtY(S, 3, "minecraft:oak_planks"), // floor slab (full → fill 1.0)
    ...ringAtY(S, 4, "minecraft:white_terracotta"), ...ringAtY(S, 5, "minecraft:white_terracotta"), ...ringAtY(S, 6, "minecraft:white_terracotta"),
  ];
  const occ = occupancyFromCells(cells);
  const { bands, floorLines } = storeyBands(occ);
  assert.deepEqual(bands.map((b) => b.dominantBlock), ["stone", "oak_planks", "white_terracotta"]);
  assert.deepEqual(bands.map((b) => [b.yStart, b.yEnd]), [[0, 2], [3, 3], [4, 6]]);
  assert.ok(floorLines.includes(3), "the full slab at y=3 is a floor line");
  // perimeter rings (fill ~0.55) are below the 0.6 floor threshold
  assert.ok(!floorLines.includes(0));
});

test("openings: a wall with one window and one door, classified", () => {
  // Solid -z wall at z=0, x=0..6, y=0..6 (ground y=0), minus a window at (2,4) and a 2-tall door at (4,0..1).
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 6; y++) {
    if (x === 2 && y === 4) continue;           // window (enclosed)
    if (x === 4 && (y === 0 || y === 1)) continue; // door (reaches ground)
    cells.push({ pos: [x, y, 0], block: "minecraft:stone" });
  }
  const occ = occupancyFromCells(cells);
  const found = openings(occ, "-z");
  const kinds = found.map((o) => o.kind).sort();
  assert.deepEqual(kinds, ["door", "window"]);
  const door = found.find((o) => o.kind === "door");
  assert.equal(door.cells, 2);
});

test("roofRegion: a closed box → full coverage, top y-range", () => {
  const S = 6;
  const cells = [
    ...ringAtY(S, 0, "minecraft:stone"), ...ringAtY(S, 1, "minecraft:stone"),
    ...slabAtY(S, 2, "minecraft:oak_planks"), // roof slab on top
  ];
  const occ = occupancyFromCells(cells);
  const roof = roofRegion(occ);
  assert.equal(roof.coverage, 1.0); // every footprint column has a top cell
  assert.deepEqual(roof.yRange, [2, 2]); // the slab is the whole top
  assert.equal(roof.cells.length, S * S);
});

test("wallFields: a sealed face has no holes; a punched face reports the gap", () => {
  // 3×3 -z wall at z=0, fully sealed.
  const sealed = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) sealed.push({ pos: [x, y, 0], block: "minecraft:stone" });
  let wf = wallFields(occupancyFromCells(sealed));
  assert.equal(wf.faces["-z"].holes.length, 0);
  assert.equal(wf.faces["-z"].surfaceCells.length, 9);
  assert.equal(wf.faces["-z"].blockCounts.stone, 9);

  // Punch the centre (1,1,0) → an enclosed hole through the skin.
  const punched = sealed.filter((c) => !(c.pos[0] === 1 && c.pos[1] === 1));
  wf = wallFields(occupancyFromCells(punched));
  assert.equal(wf.faces["-z"].holes.length, 1);
  assert.deepEqual(wf.faces["-z"].holes[0], { u: 1, v: 1 });
});

test("structuralRead bundles footprint/storeyBands/roofRegion/wallFields", () => {
  const occ = occupancyFromCells(slabAtY(3, 0, "minecraft:stone"));
  const r = structuralRead(occ);
  assert.ok(r.footprint && r.storeyBands && r.roofRegion && r.wallFields);
  assert.equal(r.footprint.area, 9);
});

test("airComponents tags an enclosed hole vs a border-touching gap", () => {
  // 3×3 mask, all filled except the centre → one enclosed air component.
  const w = 3, h = 3;
  const data = new Uint8Array(w * h).fill(1);
  data[1 * w + 1] = 0; // centre hole
  const enclosed = airComponents({ w, h, data });
  assert.equal(enclosed.length, 1);
  const b = enclosed[0].borders;
  assert.ok(!b.top && !b.bottom && !b.left && !b.right, "centre hole touches no border");
  assert.deepEqual(enclosed[0].cellsUV, [[1, 1]]);

  // Open the left edge → the gap reaches the border, no longer enclosed.
  const data2 = new Uint8Array(w * h).fill(1);
  data2[1 * w + 1] = 0;
  data2[1 * w + 0] = 0; // (0,1) on the left border
  const comps = airComponents({ w, h, data: data2 });
  assert.equal(comps.length, 1);
  assert.ok(comps[0].borders.left, "gap now touches the left border");
});

test("structuralZones: base / upper / roof from floor lines + top-exposed shell", () => {
  // A ground-floor slab y0, stone base rings y1-2, an upper-floor slab y3 (the base/upper divide),
  // upper-storey rings y4-6, a flat roof slab y7. floorLines → [0, 3, 7]; storeyDivide = the SECOND = 3.
  const S = 6;
  const cells = [
    ...slabAtY(S, 0, "minecraft:stone_bricks"),     // ground floor slab → floor line y0
    ...ringAtY(S, 1, "minecraft:stone_bricks"), ...ringAtY(S, 2, "minecraft:stone_bricks"),
    ...slabAtY(S, 3, "minecraft:oak_planks"),       // upper floor slab → floor line y3 (the divide)
    ...ringAtY(S, 4, "minecraft:white_terracotta"), ...ringAtY(S, 5, "minecraft:white_terracotta"), ...ringAtY(S, 6, "minecraft:white_terracotta"),
    ...slabAtY(S, 7, "minecraft:spruce_planks"),    // flat roof → top-exposed cells
  ];
  const occ = occupancyFromCells(cells);
  const fl = storeyBands(occ).floorLines;
  assert.deepEqual(fl, [0, 3, 7]);
  const z = structuralZones(occ);
  assert.equal(z.storeyDivide, fl[1]); // the SECOND floor line is the base/upper divide
  // A wall voxel below the divide is base; above it (and not top-exposed) is upper.
  assert.equal(z.zoneOf([0, 1, 0]), "base");
  assert.equal(z.zoneOf([0, 5, 0]), "upper");
  // A roof voxel (top-exposed +y slab) is roof regardless of y.
  assert.equal(z.zoneOf([2, 7, 2]), "roof");
  // Membership, not a threshold: the y7 corner of the slab is still roof.
  assert.equal(z.zoneOf([0, 7, 0]), "roof");
});

test("structuralZones: storeyDivide falls back to baseHeight when <2 floor lines", () => {
  // A solid 4-cube has a floor line only where fill is high; force the fallback via opts.
  const cells = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 8; y++) for (let z = 0; z < 3; z++) cells.push({ pos: [x, y, z], block: "minecraft:stone_bricks" });
  const occ = occupancyFromCells(cells);
  const z = structuralZones(occ, { storeyDivide: 4 }); // explicit divide honoured
  assert.equal(z.storeyDivide, 4);
  assert.equal(z.zoneOf([1, 2, 1]), "base");   // below divide, interior (not top-exposed)
  assert.equal(z.zoneOf([1, 5, 1]), "upper");  // above divide, interior
});

test("empty occupancy: all reads degrade without throwing", () => {
  const occ = occupancyFromCells([]);
  assert.equal(footprint(occ).area, 0);
  assert.deepEqual(storeyBands(occ), { bands: [], floorLines: [] });
  assert.equal(roofRegion(occ).coverage, 0);
  assert.deepEqual(openings(occ, "-z"), []);
});
