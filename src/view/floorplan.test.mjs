// Tests for the floorplan pure core (T-081-01). Synthetic shells — no GL, no model. Pins the AC:
// partition into an N×M grid, floors at the storey lines, dividing walls on the grid, interior doorways by
// EXCLUSION (no air op), the plausibility gate (six constraints + a named residual), the exterior-held
// invariant (fill is invisible from outside), and the prompt/parser seam.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { occupancyFromCells, artifactOccupancy } from "./occupancy.mjs";
import { exteriorHeld } from "./hollow-carve.mjs";
import {
  FLOORPLAN_SCHEMA, DEFAULT_MATERIALS,
  storeysFromRead, gridPartition, interiorColumnsAtY, roomOfColumn,
  generateFloorplan, applyFloorplan, gateFloorplan, openingsAlignShell,
  buildFloorplanPrompt, parseFloorplanSpec,
} from "./floorplan.mjs";

const FLOOR = "minecraft:spruce_planks";
const WALL = "minecraft:cobblestone";
const MANIFEST = ["minecraft:spruce_planks", "minecraft:cobblestone", "minecraft:stone_bricks"];

/** A CLOSED hollow box SHELL: solid on all six faces (4 walls + floor + roof), interior air — so the
 *  interior is enclosed and invisible from every ortho view (the cottage's enclosed property). */
function boxShellCells(s = 10, h = 10, block = "minecraft:stone_bricks") {
  const cells = [];
  for (let y = 0; y < h; y++)
    for (let z = 0; z < s; z++)
      for (let x = 0; x < s; x++)
        if (x === 0 || x === s - 1 || z === 0 || z === s - 1 || y === 0 || y === h - 1)
          cells.push({ pos: [x, y, z], block });
  return cells;
}
function boxShellOcc(s = 10, h = 10) { return occupancyFromCells(boxShellCells(s, h)); }
function artifactOf(cells) {
  return {
    schema_version: "1.0.0",
    palette: { manifest: MANIFEST },
    placements: cells.map((c) => ({ op: "voxel", pos: c.pos, block: c.block })),
  };
}
/** A synthetic structural read: a real footprint bbox + injected floor lines (so floor placement is
 *  testable independent of storeyBands detection — generateFloorplan reads these as data). */
function fakeRead(s = 10, h = 10, floorLines = [0, 4]) {
  return {
    footprint: { bbox: { minX: 0, maxX: s - 1, minZ: 0, maxZ: s - 1 }, width: s, depth: s, area: s * s },
    storeyBands: { floorLines, bands: [{ yStart: 0, yEnd: h - 1, dominantBlock: "minecraft:stone_bricks", fill: 0.4 }] },
  };
}

// ----------------------------------------------------------------------------------------------------
// Generator geometry — storeys, grid partition, interior slice (the program's lattice arithmetic)
// ----------------------------------------------------------------------------------------------------

test("storeysFromRead: floorLines [0,14] → two storeys with the right floor/ceiling lines", () => {
  const read = { storeyBands: { floorLines: [0, 14], bands: [{ yStart: 0, yEnd: 26 }] } };
  const st = storeysFromRead(read);
  assert.equal(st.length, 2);
  assert.deepEqual(st[0], { index: 0, floorY: 0, ceilY: 13 });
  assert.deepEqual(st[1], { index: 1, floorY: 14, ceilY: 26 });
});

test("storeysFromRead: no floor lines → no storeys", () => {
  assert.deepEqual(storeysFromRead({ storeyBands: { floorLines: [], bands: [] } }), []);
});

test("gridPartition: 2×2 over a 10×10 footprint → one divider each axis, four disjoint rooms tiling the interior", () => {
  const g = gridPartition({ minX: 0, maxX: 9, minZ: 0, maxZ: 9 }, { rows: 2, cols: 2 });
  assert.deepEqual(g.interior, { x0: 1, x1: 8, z0: 1, z1: 8 });
  assert.equal(g.xWalls.length, 1);
  assert.equal(g.zWalls.length, 1);
  assert.equal(g.rooms.length, 4);
  // disjoint + within the interior
  for (let i = 0; i < g.rooms.length; i++) {
    const r = g.rooms[i];
    assert.ok(r.x0 <= r.x1 && r.z0 <= r.z1, "room has positive area");
    assert.ok(r.x0 >= 1 && r.x1 <= 8 && r.z0 >= 1 && r.z1 <= 8, "room within interior");
    for (let j = i + 1; j < g.rooms.length; j++) {
      const b = g.rooms[j];
      const overlap = r.x0 <= b.x1 && b.x0 <= r.x1 && r.z0 <= b.z1 && b.z0 <= r.z1;
      assert.ok(!overlap, "rooms disjoint");
    }
  }
});

test("gridPartition: 1×1 → no dividers, one room = the whole interior", () => {
  const g = gridPartition({ minX: 0, maxX: 9, minZ: 0, maxZ: 9 }, { rows: 1, cols: 1 });
  assert.deepEqual(g.xWalls, []);
  assert.deepEqual(g.zWalls, []);
  assert.equal(g.rooms.length, 1);
  assert.deepEqual(
    { x0: g.rooms[0].x0, x1: g.rooms[0].x1, z0: g.rooms[0].z0, z1: g.rooms[0].z1 },
    { x0: 1, x1: 8, z0: 1, z1: 8 },
  );
});

test("interiorColumnsAtY: a box-shell slice returns the enclosed interior, never a perimeter column", () => {
  const occ = boxShellOcc(10, 10);
  const cols = interiorColumnsAtY(occ, 3);
  assert.equal(cols.size, 64); // 8×8 interior
  assert.ok(cols.has("1,1") && cols.has("8,8"));
  for (const key of cols) {
    const [x, z] = key.split(",").map(Number);
    assert.ok(x >= 1 && x <= 8 && z >= 1 && z <= 8, `${key} must be interior`);
  }
});

test("interiorColumnsAtY: a fully-solid slice has no interior air", () => {
  const cells = [];
  for (let z = 0; z < 5; z++) for (let x = 0; x < 5; x++) cells.push({ pos: [x, 0, z], block: "minecraft:stone" });
  assert.equal(interiorColumnsAtY(occupancyFromCells(cells), 0).size, 0);
});

test("roomOfColumn: a column on a divider belongs to no room; an interior column maps to its room", () => {
  const g = gridPartition({ minX: 0, maxX: 9, minZ: 0, maxZ: 9 }, { rows: 2, cols: 2 });
  assert.equal(roomOfColumn(g.rooms, 5, 5), null); // on both dividers
  assert.ok(roomOfColumn(g.rooms, 2, 2));
});

// ----------------------------------------------------------------------------------------------------
// The plan + placements — floors@lines, walls@grid, doorways by exclusion (no air op), bulk = program
// ----------------------------------------------------------------------------------------------------

test("generateFloorplan: floors sit ONLY at the structural storey lines", () => {
  const occ = boxShellOcc(10, 10);
  const read = fakeRead(10, 10, [0, 4]);
  const { placements } = generateFloorplan(occ, read, { rows: 2, cols: 2, materials: { floor: FLOOR, wall: WALL } });
  const floors = placements.filter((p) => p.block === FLOOR);
  assert.ok(floors.length > 0, "floors were placed");
  for (const p of floors) assert.ok(p.pos[1] === 0 || p.pos[1] === 4, `floor at y=${p.pos[1]} must be a storey line`);
});

test("generateFloorplan: dividing walls lie only on grid columns, within the storey height, on interior columns", () => {
  const occ = boxShellOcc(10, 10);
  const read = fakeRead(10, 10, [0, 4]);
  const { plan, placements } = generateFloorplan(occ, read, { rows: 2, cols: 2, materials: { floor: FLOOR, wall: WALL } });
  const walls = placements.filter((p) => p.block === WALL);
  assert.ok(walls.length > 0);
  const xW = new Set(plan.grid.xWalls), zW = new Set(plan.grid.zWalls);
  for (const p of walls) {
    const [x, y, z] = p.pos;
    assert.ok(xW.has(x) || zW.has(z), `wall at ${p.pos} must be on a grid line`);
    assert.ok(x >= 1 && x <= 8 && z >= 1 && z <= 8, "wall on an interior column");
    assert.ok(y >= 1, "wall above a floor line");
  }
});

test("generateFloorplan: bulk placement is the program's job — a 5-field spec yields many placements", () => {
  const occ = boxShellOcc(10, 10);
  const { placements } = generateFloorplan(occ, fakeRead(10, 10, [0, 4]), { rows: 2, cols: 2 });
  assert.ok(placements.length > 50, `expected bulk fill, got ${placements.length}`);
});

test("generateFloorplan: interior doorways are made by EXCLUSION — a gap in the wall, never an air op", () => {
  const occ = boxShellOcc(10, 10);
  const { plan, placements } = generateFloorplan(occ, fakeRead(10, 10, [0, 4]), { rows: 2, cols: 2 });
  // no air block anywhere
  for (const p of placements) assert.notEqual(p.block, "minecraft:air");
  // every recorded door cell is ABSENT from the placements (the opening is the missing wall)
  const placed = new Set(placements.map((p) => `${p.pos[0]},${p.pos[1]},${p.pos[2]}`));
  let doorCount = 0;
  for (const s of plan.storeys) for (const d of s.doors) {
    doorCount++;
    assert.ok(!placed.has(`${d.cell[0]},${d.cell[1]},${d.cell[2]}`), `door cell ${d.cell} must not be a placed wall`);
  }
  assert.ok(doorCount > 0, "doorways were generated");
});

test("generateFloorplan + applyFloorplan: the fill is EXTERIOR-HELD (invisible from outside)", () => {
  const occ = boxShellOcc(10, 10);
  const art = artifactOf(boxShellCells(10, 10));
  const { placements } = generateFloorplan(occ, fakeRead(10, 10, [0, 4]), { rows: 2, cols: 2 });
  const filled = applyFloorplan(art, placements);
  const held = exteriorHeld(occ, artifactOccupancy(filled));
  assert.ok(held.held, "interior fill must not change the exterior surface");
});

test("exterior-held negative control: a placement on a skin column flips held to false (the proof discriminates)", () => {
  const occ = boxShellOcc(10, 10);
  const art = artifactOf(boxShellCells(10, 10));
  const filled = applyFloorplan(art, [{ op: "voxel", pos: [0, 5, 5], block: WALL }]); // x=0 is the -x skin
  assert.equal(exteriorHeld(occ, artifactOccupancy(filled)).held, false);
});

test("generateFloorplan: every placed block is from the supplied manifest materials", () => {
  const occ = boxShellOcc(10, 10);
  const { placements } = generateFloorplan(occ, fakeRead(10, 10, [0, 4]), { rows: 2, cols: 2, materials: { floor: FLOOR, wall: WALL } });
  for (const p of placements) assert.ok(p.block === FLOOR || p.block === WALL);
});

// ----------------------------------------------------------------------------------------------------
// The plausibility gate — six hard constraints, each flips, plus the named residual (Rule 7)
// ----------------------------------------------------------------------------------------------------

function cleanPlan() {
  const occ = boxShellOcc(10, 10);
  const read = fakeRead(10, 10, [0, 4]);
  const { plan } = generateFloorplan(occ, read, { rows: 2, cols: 2 });
  return { occ, read, plan };
}

test("gateFloorplan: a clean 2×2 two-storey plan passes all six hard constraints with a named residual", () => {
  const { occ, read, plan } = cleanPlan();
  const g = gateFloorplan(occ, read, plan);
  assert.ok(g.pass, `gate should pass: ${JSON.stringify(g.constraints)}`);
  const hard = ["roomsValid", "roomsNonOverlap", "reachable", "floorsAtStoreyLines", "storeyCountMatches", "gridFitsEnvelope"];
  for (const name of hard) assert.ok(g.constraints.find((c) => c.name === name).pass, `${name} should pass`);
  assert.ok(g.residual && g.residual.length > 0, "a residual must be named (Rule 7)");
});

test("gateFloorplan: roomsValid fails on a degenerate room", () => {
  const { occ, read, plan } = cleanPlan();
  plan.grid.rooms.push({ id: "bad", ci: 9, ri: 9, x0: 5, x1: 4, z0: 1, z1: 2 }); // x1<x0
  const g = gateFloorplan(occ, read, plan);
  assert.equal(g.constraints.find((c) => c.name === "roomsValid").pass, false);
  assert.equal(g.pass, false);
});

test("gateFloorplan: roomsNonOverlap fails on overlapping rooms", () => {
  const { occ, read, plan } = cleanPlan();
  const r = plan.grid.rooms[0];
  plan.grid.rooms.push({ ...r, id: "dup" });
  assert.equal(gateFloorplan(occ, read, plan).constraints.find((c) => c.name === "roomsNonOverlap").pass, false);
});

test("gateFloorplan: reachable fails when the doorways are stripped", () => {
  const { occ, read, plan } = cleanPlan();
  for (const s of plan.storeys) s.doors = [];
  assert.equal(gateFloorplan(occ, read, plan).constraints.find((c) => c.name === "reachable").pass, false);
});

test("gateFloorplan: floorsAtStoreyLines fails when a storey floor is off the structural lines", () => {
  const { occ, read, plan } = cleanPlan();
  plan.storeys[0].floorY = 99;
  assert.equal(gateFloorplan(occ, read, plan).constraints.find((c) => c.name === "floorsAtStoreyLines").pass, false);
});

test("gateFloorplan: storeyCountMatches fails when the plan has the wrong storey count", () => {
  const { occ, read, plan } = cleanPlan();
  plan.storeys.pop();
  assert.equal(gateFloorplan(occ, read, plan).constraints.find((c) => c.name === "storeyCountMatches").pass, false);
});

test("gateFloorplan: gridFitsEnvelope fails when a wall line falls outside the footprint", () => {
  const { occ, read, plan } = cleanPlan();
  plan.grid.xWalls = [-1];
  assert.equal(gateFloorplan(occ, read, plan).constraints.find((c) => c.name === "gridFitsEnvelope").pass, false);
});

test("openingsAlignShell: no exterior openings → vacuous pass + a NAMED residual (the cottage case)", () => {
  const r = openingsAlignShell([], { storeys: [{ doors: [{ rooms: ["a", "b"] }] }] });
  assert.equal(r.pass, true);
  assert.ok(r.residual && r.residual.length > 0);
});

test("openingsAlignShell: exterior openings present → pass iff there are interior doorways", () => {
  const opens = [{ dir: "+z", kind: "door" }];
  assert.equal(openingsAlignShell(opens, { storeys: [{ doors: [{ rooms: ["a", "b"] }] }] }).pass, true);
  const bad = openingsAlignShell(opens, { storeys: [{ doors: [] }] });
  assert.equal(bad.pass, false);
  assert.ok(bad.residual);
});

// ----------------------------------------------------------------------------------------------------
// The metered seam — prompt + parser
// ----------------------------------------------------------------------------------------------------

test("parseFloorplanSpec: a clean spec round-trips, materials kept, frontDoor kept", () => {
  const spec = parseFloorplanSpec(
    JSON.stringify({ rows: 3, cols: 2, materials: { floor: FLOOR, wall: WALL }, frontDoor: { face: "+z", u: 4 } }),
    { manifest: MANIFEST });
  assert.equal(spec.schema, FLOORPLAN_SCHEMA);
  assert.equal(spec.rows, 3);
  assert.equal(spec.cols, 2);
  assert.deepEqual(spec.materials, { floor: FLOOR, wall: WALL });
  assert.deepEqual(spec.frontDoor, { face: "+z", u: 4 });
});

test("parseFloorplanSpec: a fenced / fence-then-prose reply is tolerated", () => {
  const spec = parseFloorplanSpec("```json\n{\"rows\":2,\"cols\":3}\n```\nThat is the plan.", { manifest: MANIFEST });
  assert.equal(spec.rows, 2);
  assert.equal(spec.cols, 3);
});

test("parseFloorplanSpec: missing fields default sensibly", () => {
  const spec = parseFloorplanSpec("{}", { manifest: MANIFEST });
  assert.equal(spec.rows, 2);
  assert.equal(spec.cols, 2);
  assert.deepEqual(spec.materials, DEFAULT_MATERIALS);
  assert.equal(spec.doorPolicy, "spanning");
  assert.equal(spec.frontDoor, null);
});

test("parseFloorplanSpec: a material outside the manifest is clamped to the default", () => {
  const spec = parseFloorplanSpec(
    JSON.stringify({ materials: { floor: "minecraft:diamond_block", wall: WALL } }), { manifest: MANIFEST });
  assert.equal(spec.materials.floor, DEFAULT_MATERIALS.floor); // clamped
  assert.equal(spec.materials.wall, WALL);                     // kept
});

test("parseFloorplanSpec: non-JSON throws", () => {
  assert.throws(() => parseFloorplanSpec("not json at all", { manifest: MANIFEST }), /parseFloorplanSpec/);
});

test("buildFloorplanPrompt: states footprint, storey lines, manifest, and the front-door instruction", () => {
  const read = fakeRead(10, 10, [0, 4]);
  const storeys = storeysFromRead(read);
  const md = buildFloorplanPrompt(read, storeys, read.footprint, MANIFEST);
  assert.match(md, /10×10/);
  assert.match(md, /storey 0/);
  assert.match(md, /storey 1/);
  assert.match(md, /minecraft:cobblestone/);
  assert.match(md, /IDENTIFY the front door/);
  assert.match(md, /SINGLE JSON object/);
});

// ----------------------------------------------------------------------------------------------------
// Purity / source guard — mirrors hollow-carve.test.mjs
// ----------------------------------------------------------------------------------------------------

test("source guard: the floorplan module imports no model / GL / API key", () => {
  const src = readFileSync(fileURLToPath(new URL("./floorplan.mjs", import.meta.url)), "utf8");
  assert.ok(!/ANTHROPIC_API_KEY/.test(src), "no metered API key");
  assert.ok(!/render-tool|prismarine|playwright|headless-gl/i.test(src), "no GL / render import");
  assert.ok(!/sdk-binding|claude -p|requestText/i.test(src), "no model invoker import");
});
