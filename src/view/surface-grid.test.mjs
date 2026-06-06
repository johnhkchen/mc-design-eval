import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import {
  projectSurface, backProject, gridMaskOf, resolveDir, ORTHO_DIRS, DIAG_DIRS,
  orthoSpec, cellWorldPos,
} from "./surface-grid.mjs";

/** Build a solid cube [0..s-1]^3 of one block. */
function cube(s, block = "minecraft:stone") {
  const cells = [];
  for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) for (let z = 0; z < s; z++) {
    cells.push({ pos: [x, y, z], block });
  }
  return occupancyFromCells(cells);
}

/** Canonical sorted "x,y,z" set of a voxel list, for set comparison. */
function keySet(list) {
  return new Set(list.map((v) => `${v.pos[0]},${v.pos[1]},${v.pos[2]}`));
}

test("resolveDir classifies ortho/diag and rejects arbitrary-oblique", () => {
  assert.equal(resolveDir("-z").kind, "ortho");
  assert.equal(resolveDir("+x+z").kind, "diag");
  assert.throws(() => resolveDir("oblique"), /arbitrary-oblique/);
  assert.throws(() => resolveDir({ name: "30deg" }), /not an orthographic/);
});

test("ORTHO_DIRS has the 6 faces, DIAG_DIRS has the 4 ground diagonals", () => {
  assert.equal(ORTHO_DIRS.length, 6);
  assert.deepEqual(ORTHO_DIRS.map((d) => d.name).sort(), ["+x", "+y", "+z", "-x", "-y", "-z"]);
  assert.equal(DIAG_DIRS.length, 4);
});

test("ortho front-most pick: nearer voxel wins, depth + normal correct", () => {
  // Two voxels in the same -z column at z=0 (near) and z=3 (far). Camera on -z side.
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:near" },
    { pos: [0, 0, 3], block: "minecraft:far" },
  ]);
  const g = projectSurface(occ, "-z");
  // single column, single row
  const cell = g.cells.flat().find(Boolean);
  assert.equal(cell.block, "minecraft:near");
  assert.deepEqual(cell.voxel, [0, 0, 0]);
  assert.equal(cell.depth, 0); // sits on the near (min z) plane
  assert.deepEqual(cell.normal, [0, 0, -1]);
});

test("ortho +z views the far face: max-z voxel chosen", () => {
  const occ = occupancyFromCells([
    { pos: [0, 0, 0], block: "minecraft:near" },
    { pos: [0, 0, 3], block: "minecraft:far" },
  ]);
  const g = projectSurface(occ, "+z");
  const cell = g.cells.flat().find(Boolean);
  assert.equal(cell.block, "minecraft:far");
  assert.equal(cell.depth, 0);
  assert.deepEqual(cell.normal, [0, 0, 1]);
});

test("round-trip identity: backProject∘projectSurface = per-column front set (all 6 ortho dirs)", () => {
  const occ = cube(3);
  for (const d of ORTHO_DIRS) {
    const g = projectSurface(occ, d.name);
    const back = backProject(g);
    // a 3×3 cube face → 9 surface cells, all on the near plane
    assert.equal(back.length, 9, `${d.name}: expected 9 surface voxels`);
    // every returned voxel must be in the occupancy
    for (const v of back) assert.ok(occ.has(...v.pos), `${d.name}: ${v.pos} not occupied`);
    // and they must be exactly the near-plane layer (front-most along the view axis)
    const w = d.axisW;
    const plane = d.near === "max" ? occ.bounds.max[w] : occ.bounds.min[w];
    for (const v of back) assert.equal(v.pos[w], plane, `${d.name}: voxel not on near plane`);
  }
});

test("round-trip identity holds for all 4 diagonals (bijection via stored voxel)", () => {
  const occ = cube(3);
  for (const d of DIAG_DIRS) {
    const g = projectSurface(occ, d.name);
    const back = backProject(g);
    assert.ok(back.length > 0, `${d.name}: empty projection`);
    // exactness: every back-projected voxel is occupied and unique
    const set = keySet(back);
    assert.equal(set.size, back.length, `${d.name}: duplicate voxels`);
    for (const v of back) assert.ok(occ.has(...v.pos), `${d.name}: ${v.pos} not occupied`);
    // front-most invariant: no occupied voxel shares a (column,row) with a closer view score
    // (checked implicitly — the projector keeps max viewScore per cell; here assert each cell's
    // neighbour toward the camera along the diagonal is NOT occupied, i.e. it is a surface voxel)
    for (const v of back) {
      const [x, y, z] = v.pos;
      const ahead = occ.has(x + d.signX, y, z) && occ.has(x, y, z + d.signZ);
      assert.ok(!ahead, `${d.name}: voxel ${v.pos} is occluded on both camera-facing faces`);
    }
  }
});

test("gridMaskOf marks filled cells", () => {
  const occ = cube(2);
  const g = projectSurface(occ, "-z");
  const mask = gridMaskOf(g);
  assert.equal(mask.w, 2);
  assert.equal(mask.h, 2);
  assert.equal(mask.data.reduce((a, b) => a + b, 0), 4);
});

test("empty occupancy → empty grid, no throw", () => {
  const occ = occupancyFromCells([]);
  const g = projectSurface(occ, "-z");
  assert.equal(g.filled, 0);
  assert.deepEqual(backProject(g), []);
});

test("orthoSpec returns the ortho axis map and throws on a diagonal", () => {
  assert.equal(orthoSpec("+y").name, "+y");
  assert.equal(orthoSpec("-z").axisW, 2);
  assert.throws(() => orthoSpec("+x+z"), /only orthographic/);
});

test("cellWorldPos inverts projectOrtho: it reproduces every filled cell's stored voxel", () => {
  const occ = cube(3);
  for (const dir of ["+x", "-x", "+z", "-z", "+y", "-y"]) {
    const spec = orthoSpec(dir);
    const g = projectSurface(occ, dir);
    for (let v = 0; v < g.m; v++) {
      for (let u = 0; u < g.n; u++) {
        const c = g.cells[v][u];
        if (!c) continue;
        const pos = cellWorldPos(occ, spec, u, v, c.voxel[spec.axisW]);
        assert.deepEqual(pos, c.voxel, `${dir} cell (${u},${v})`);
      }
    }
  }
});
