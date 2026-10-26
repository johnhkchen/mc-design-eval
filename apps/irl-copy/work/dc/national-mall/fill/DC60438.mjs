// 1600 New Hampshire Ave NW: a 1920s-30s Georgian-revival brick chancery with limestone trim (typical of the Dupont Circle
// and Embassy Row stock). Footprint 16 x 13; lidar roof 4..8 above ground, flat ground, so the massing is built from y 0.
// Roof heights are smoothed (3x3 mean) and snapped to three clean tiers: wings 5, middle ring 7, core 8.
// Storeys are 2 blocks (window row over a string course). Walls are the cells on the outside or at a tier step; the
// rest of the footprint is air with floor slabs at y 0, 2, 4, 6 and a roof deck on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60438.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([16, 20, 13]);
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const tier = (m) => (m < 5.5 ? 5 : m < 7.5 ? 7 : 8);

// smoothed, tiered roof per cell
const R = new Map();
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = `${x + dx},${z + dz}`;
    if (foot.has(k)) { sum += foot.get(k).roof; n++; }
  }
  R.set(key, tier(sum / n));
}

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const ENTRY = { x: [6, 7], z: 12, face: "S" };              // double entrance on the street (south) face

const glassState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true" }     // pane runs east-west
  : { north: "true", south: "true", east: "false", west: "false" });   // pane runs north-south

for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const Rc = R.get(key);
  const ext = DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz)).map(([f]) => f);
  const step = DIRS.filter(([, dx, dz]) => inF(x + dx, z + dz) && R.get(`${x + dx},${z + dz}`) !== Rc).map(([f]) => f);
  const isWall = ext.length > 0 || step.length > 0;

  if (!isWall) {
    // interior: floor slabs per storey, a roof deck, and air between
    g.set(x, 0, z, "smooth_stone");
    for (const f of [2, 4, 6]) if (f < Rc - 1) g.set(x, f, z, "smooth_stone");
    g.set(x, Rc - 1, z, "stone");
    if (Rc === 8 && (3 * x + 5 * z) % 11 === 0) g.set(x, Rc, z, "copper_block");   // roof plant
    continue;
  }

  // walls: plinth, then window rows (odd y) over string courses (even y), a cornice at the top
  g.set(x, 0, z, "stone_bricks");
  const axisExt = ext.find((f) => f === "N" || f === "S") ?? ext.find((f) => f === "W" || f === "E");
  const u = axisExt === "N" || axisExt === "S" ? x : z;   // position along the face

  for (let y = 1; y <= Rc - 2; y++) {
    if (ext.length === 0) { g.set(x, y, z, "bricks"); continue; }   // a tier step: solid, no glazing
    let block = null, state;
    const bay = y % 2 === 1;
    if (ext.includes(ENTRY.face) && z === ENTRY.z && Math.abs(x - 6.5) <= 2.5) {
      // entrance: a door in the ground bay, pilasters at 5 and 8, a lintel over the door
      if (ENTRY.x.includes(x) && y <= 2) {
        block = "dark_oak_door";
        state = { facing: "south", hinge: x === 6 ? "left" : "right", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" };
      } else if (x === 5 || x === 8) block = "smooth_quartz";
      else if (y === 3) block = "smooth_quartz";
    }
    if (block === null) {
      const winBay = u % 2 === 1;
      if (!bay) block = winBay ? "smooth_quartz" : "bricks";   // lintel and sill over each window
      else if (winBay) { block = "glass_pane"; state = glassState(axisExt); }
      else block = "bricks";                                   // piers between the windows
    }
    g.set(x, y, z, block, state);
  }
  // cornice on the outside, roof deck inside
  g.set(x, Rc - 1, z, ext.length ? "smooth_quartz_slab" : "stone", ext.length ? { type: "bottom", waterlogged: "false" } : undefined);
}

// warm light: glowstone in the air behind some ground-floor windows (the inward cell is an interior cell)
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const Rc = R.get(key);
  const ext = DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz)).map(([f]) => f);
  if (ext.length !== 1 || ext[0] === ENTRY.face) continue;   // one exterior face only (no corners, no entrance)
  const [ix, iz] = [x + IN[ext[0]][0], z + IN[ext[0]][1]];
  if (!inF(ix, iz) || R.get(`${ix},${iz}`) !== Rc) continue;
  if (!((x + z) % 3 === 0)) continue;
  g.set(ix, 1, iz, "glowstone");
}

const info = g.save(`${DIR}/DC60438.nbt`);
const perBlock = {};
g.forEachCell((i, v) => { const b = g.palette[v].block; perBlock[b] = (perBlock[b] || 0) + 1; });
console.log(JSON.stringify(info), JSON.stringify(perBlock));
