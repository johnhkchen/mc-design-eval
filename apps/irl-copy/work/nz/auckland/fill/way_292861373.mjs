// Grafton Oaks: a mid-century (c. 1960s-70s) reinforced-concrete apartment block, eight storeys on a
// 3-block stone plinth. White concrete frame with light-grey spandrels, bays of blue glass between
// concrete pilasters, a stone-brick parapet, a stepped lift-and-stair core rising 4 blocks above the wings,
// and a plant box on the roof. Solid foundation under the lidar ground; interior hollow behind the
// glass (an air gap, floor slabs per storey); a few lanterns stand behind windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861373.cells.json`, "utf8"));

const X = 19, Z = 17;
const g = new Voxels([X, 47, Z]);

// --- footprint and massing -------------------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inFp = (x, z) => byXZ.has(key(x, z));
// the lidar roof: 30 on the wings, 33-34 on the core; smoothed into two flat tiers. R is the cap row (the parapet).
// the lidar's 33-34 cells are scattered; the tower is their bounding box, cut from the footprint, so it stands as one clean block
const CORE_MIN = 32;
const hi = cells.filter(([, , , r]) => r >= CORE_MIN);
const box = { x0: Math.min(...hi.map((c) => c[0])), x1: Math.max(...hi.map((c) => c[0])), z0: Math.min(...hi.map((c) => c[1])), z1: Math.max(...hi.map((c) => c[1])) };
const isCore = (c) => c.x >= box.x0 && c.x <= box.x1 && c.z >= box.z0 && c.z <= box.z1;
const capRow = (c) => (isCore(c) ? 34 : 30);

// exposed faces: direction vectors, with the block name of the facade's outward face
const DIRS = [
  { dx: 0, dz: -1, facing: "north", axis: "z" },
  { dx: 0, dz: 1, facing: "south", axis: "z" },
  { dx: -1, dz: 0, facing: "west", axis: "x" },
  { dx: 1, dz: 0, facing: "east", axis: "x" },
];
const exposed = (c) => DIRS.filter((d) => !inFp(c.x + d.dx, c.z + d.dz));
const edgeCells = cells.map(([x, z]) => byXZ.get(key(x, z))).filter((c) => exposed(c).length > 0);

// the street front: the exposed direction with the most cells; the entrance sits mid-way along it
const front = DIRS.map((d) => ({ d, n: edgeCells.filter((c) => exposed(c).some((e) => e.facing === d.facing)).length }))
  .sort((a, b) => b.n - a.n)[0].d;
const frontCells = edgeCells.filter((c) => exposed(c).some((e) => e.facing === front.facing) && !isCore(c));
const along = (c, d) => (d.axis === "z" ? c.x : c.z);
frontCells.sort((a, b) => along(a, front) - along(b, front));
const door = frontCells[Math.floor(frontCells.length / 2)];

// storeys: 3-block plinth, then 4-block storeys starting at y = 3, 7, 11 ... Each: spandrel, two window rows, head.
const STOREY0 = 3;
const storeyRow = (y, R) => {
  if (y < STOREY0) return "base";
  if (y === R) return "cap";
  const s = STOREY0 + 4 * Math.floor((y - STOREY0) / 4);
  return ["spandrel", "window", "window", "head"][y - s];
};
const storeyStart = (y) => STOREY0 + 4 * Math.floor((y - STOREY0) / 4);

// --- pass 1: interior (air gap behind the glass, floor slab per storey, solid foundation and core) ----
for (const c of cells.map(([x, z]) => byXZ.get(key(x, z)))) {
  if (exposed(c).length) continue;
  const R = capRow(c);
  for (let y = 0; y < 3; y++) g.set(c.x, y, c.z, "stone_bricks");            // foundation / plinth
  if (isCore(c)) {
    for (let y = 3; y < R; y++) g.set(c.x, y, c.z, "light_gray_concrete");    // lift and stair core: solid
    continue;
  }
  for (let y = STOREY0; y < R; y += 4) g.set(c.x, y, c.z, "light_gray_concrete"); // floor slabs
  g.set(c.x, R - 1, c.z, "light_gray_concrete");                               // roof deck
}

// --- pass 2: the envelope on exposed cells -----------------------------------------------------
const lit = new Set();
for (const c of edgeCells) {
  const R = capRow(c);
  const faces = exposed(c);
  const corner = faces.length > 1;
  // a concrete pilaster every fourth block along each face (three glass bays between); corners are solid
  const pilasterOn = (d) => corner || along(c, d) % 4 === 0;
  const glassHere = !faces.some((d) => pilasterOn(d));
  for (let y = 0; y < R; y++) {
    const kind = storeyRow(y, R);
    if (kind === "base") { g.set(c.x, y, c.z, "stone_bricks"); continue; }
    if (kind === "spandrel") { g.set(c.x, y, c.z, "light_gray_concrete"); continue; }
    if (kind === "head") { g.set(c.x, y, c.z, "white_concrete"); continue; }
    if (kind === "window" && glassHere) {
      const tint = (c.x + c.z + storeyStart(y)) % 4 === 0 ? "gray_stained_glass" : "light_blue_stained_glass";
      g.set(c.x, y, c.z, tint);
      continue;
    }
    g.set(c.x, y, c.z, "white_concrete");
  }
  g.set(c.x, R, c.z, "stone_bricks");                                         // parapet course
  // lit windows: a lantern on the floor one block inside the glass, where the room is real
  for (const d of faces) {
    if (!glassHere) break;
    const ix = c.x - d.dx, iz = c.z - d.dz;
    if (!inFp(ix, iz)) continue;
    const inner = byXZ.get(key(ix, iz));
    if (exposed(inner).length || isCore(inner)) continue;
    // one lit room in five per storey: the lantern sits on the floor slab, its first window row above it
    for (let s = STOREY0; s + 1 < R; s += 4) {
      if ((along(c, d) + s) % 5 !== 0) continue;
      g.set(ix, s + 1, iz, "lantern", { hanging: "false", waterlogged: "false" }); lit.add(key(ix, iz));
    }
  }
}

// --- the entrance: a pair of oak doors in the mid front cell, stone surround -------------------
for (const y of [3, 4]) {
  g.set(door.x, y, door.z, "oak_door", {
    facing: front.facing, half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
  });
}
g.set(door.x, 5, door.z, "light_blue_stained_glass");                         // transom
g.set(door.x, 6, door.z, "stone_bricks");                                      // lintel

// --- roof plant: two iron-block boxes on the wing roof, away from the core -------------------
const wingRoof = cells.map(([x, z]) => byXZ.get(key(x, z)))
  .filter((c) => !exposed(c).length && !isCore(c));
const mid = wingRoof.reduce((a, c) => ({ x: a.x + c.x / wingRoof.length, z: a.z + c.z / wingRoof.length }), { x: 0, z: 0 });
const plant = [...wingRoof].sort((a, b) => Math.hypot(a.x - mid.x - 3, a.z - mid.z) - Math.hypot(b.x - mid.x - 3, b.z - mid.z)).slice(0, 2);
for (const c of plant) { g.set(c.x, 30, c.z, "iron_block"); g.set(c.x, 31, c.z, "iron_block"); }

const info = g.save(`${DIR}/way_292861373.nbt`);
console.log(`Grafton Oaks: ${cells.length} cells, ${edgeCells.length} facade, front ${front.facing}, door (${door.x},${door.z}), lanterns ${lit.size}, ${JSON.stringify(info)}`);
