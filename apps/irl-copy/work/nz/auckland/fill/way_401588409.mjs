// Block 6, Mt Eden Road side of the CBD: a 1980s concrete-and-tinted-glass office block, eight storeys on the downhill
// side and six on the uphill side, with a shopfront ground floor. The roof is flat in the lidar (29 to 32 blocks), so
// two tiers: the tower (lidar 31 to 32) to 32 with a two-block setback on the top storey, the wing (lidar 29 to 30) to 30.
// Each footprint cell is solid from y 0 to its floor line (its ground rounded up to an even block), so nothing floats.
// Above that the walls are a one-block facade on the outer ring, with an air gap behind each window and solid body inside.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588409.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..34, z 0..24

const W = 35, D = 25, H = 45;
const STOREY = 4, TOWER_MIN_ROOF = 31, TOWER_TOP = 32, WING_TOP = 30, SETBACK_Y = 28;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the footprint: per cell its ground, roof, and the ring (4-neighbour steps in from the outside edge)
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const inFP = (x, z) => fp.has(`${x},${z}`);
const ring = new Map();
let frontier = [];
for (const k of fp.keys()) { const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !inFP(x + dx, z + dz))) { ring.set(k, 0); frontier.push([x, z]); } }
for (let d = 0; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of NB) { const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (inFP(nx, nz) && !ring.has(k)) { ring.set(k, d + 1); next.push([nx, nz]); } }
  frontier = next;
}
const ringOf = (x, z) => ring.get(`${x},${z}`);
const isTower = (x, z) => fp.get(`${x},${z}`).r >= TOWER_MIN_ROOF;
const topOf = (x, z) => (isTower(x, z) ? TOWER_TOP : WING_TOP);
// the floor line: the ground rounded up to a storey (4 blocks), so every storey line lands on the same row across the site
const floorOf = (x, z) => Math.ceil(fp.get(`${x},${z}`).g / STOREY) * STOREY;
// the effective ring: the tower's top storey steps in two blocks, so its facade is the old ring 2
const eOf = (x, y, z) => (isTower(x, z) && y >= SETBACK_Y ? ringOf(x, z) - 2 : ringOf(x, z));
const key3 = (x, y, z) => `${x},${y},${z}`;
const cellsList = [...fp.keys()].map((k) => k.split(",").map(Number));

const role = new Map();
const set = (x, y, z, r) => role.set(key3(x, y, z), r);
const roleAt = (x, y, z) => role.get(key3(x, y, z));

// 1. the envelope, column by column
for (const [x, z] of cellsList) {
  const F = floorOf(x, z), T = topOf(x, z);
  for (let y = 0; y <= T + 1; y++) {
    const e = eOf(x, y, z);
    if (y < F) { set(x, y, z, ringOf(x, z) === 0 ? "plinth" : "foundation"); continue; }
    if (y >= T) { if (e === 0 && y === T) set(x, y, z, "parapet"); else if (e === 0 && y === T + 1) set(x, y, z, "cap"); continue; }
    if (e < 0) continue;                                  // the setback: air
    if (e > 0) { set(x, y, z, "body"); continue; }
    if (y === T - 1) { set(x, y, z, "cornice"); continue; }
    const o = (y - F) % STOREY, k = Math.floor((y - F) / STOREY);
    if (o === 0) set(x, y, z, "band");
    else if (o === 3) set(x, y, z, "wall");
    else set(x, y, z, (x + z) % 3 === 0 ? (k === 0 ? "shoppier" : "pier") : "glass");
  }
}

// 2. an air gap behind each window: the inward neighbour of a glass pane is air, sometimes lit
for (const [x, z] of cellsList) {
  const F = floorOf(x, z), T = topOf(x, z);
  for (let y = F; y < T - 1; y++) {
    if (roleAt(x, y, z) !== "glass" && roleAt(x, y, z) !== "shoppier") continue;
    const q = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([qx, qz]) => inFP(qx, qz) && eOf(qx, y, qz) === 1);
    if (!q) continue;
    const ground = y < F + STOREY, h = (x * 5 + z * 11 + y * 3) % 31;
    set(q[0], y, q[1], ground && h % 3 === 0 ? "glow" : h % 7 === 0 ? "glow" : h === 0 ? "lamp" : "gap");
  }
}

// 3. the entrance: on the lowest-ground exterior wall, a flat wall run of three cells, the door in the middle, a
//    hanging lantern above it, quartz pillars either side, and a one-cell vestibule behind the door
const doorCands = [];
for (const [x, z] of cellsList) {
  if (ringOf(x, z) !== 0) continue;
  const outs = NB.filter(([dx, dz]) => !inFP(x + dx, z + dz));
  if (outs.length !== 1) continue;
  const [nx, nz] = outs[0];
  const tan = [[nz, nx], [-nz, -nx]];
  if (!tan.every(([tx, tz]) => inFP(x + tx, z + tz) && ringOf(x + tx, z + tz) === 0 && !inFP(x + tx + nx, z + tz + nz))) continue;
  doorCands.push({ x, z, nx, nz, tan, F: floorOf(x, z) });
}
doorCands.sort((a, b) => a.F - b.F || b.z - a.z || a.x - b.x);
const door = doorCands[0];
if (door) {
  const { x, z, nx, nz, tan, F } = door;
  set(x, F, z, "doorLower"); set(x, F + 1, z, "doorUpper"); set(x, F + 2, z, "lantern");
  for (const [tx, tz] of tan) for (let y = F; y <= F + 2; y++) set(x + tx, y, z + tz, "pillar");
  const facing = DIR[`${-nx},${-nz}`];
  door.facing = facing;
  set(x - nx, F, z - nz, "vestibule"); set(x - nx, F + 1, z - nz, "vestibule");
}

// 4. roof: a plant box on the tower roof (4 by 3, two high, slab cap), a lean-to plant box on the wing, and a mast
const tiles = (w, h, pred) => {
  const out = [];
  for (const [x0, z0] of cellsList) {
    const ok = [...Array(w * h).keys()].every((i) => { const x = x0 + (i % w), z = z0 + Math.floor(i / w);
      return inFP(x, z) && pred(x, z); });
    if (ok) out.push([x0, z0]);
  }
  return out;
};
const cx = cellsList.reduce((s, [x]) => s + x, 0) / cellsList.length, cz = cellsList.reduce((s, [, z]) => s + z, 0) / cellsList.length;
const byCentre = (list) => list.slice().sort((a, b) => (a[0] - cx) ** 2 + (a[1] - cz) ** 2 - ((b[0] - cx) ** 2 + (b[1] - cz) ** 2));
const towerRect = byCentre(tiles(4, 3, (x, z) => isTower(x, z) && ringOf(x, z) >= 4))[0];
const plantCells = [];
if (towerRect) for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 3; dz++) plantCells.push([towerRect[0] + dx, towerRect[1] + dz]);
for (const [x, z] of plantCells) { set(x, TOWER_TOP, z, "plant"); set(x, TOWER_TOP + 1, z, "plant"); set(x, TOWER_TOP + 2, z, "plantCap"); }
const wingRect = byCentre(tiles(2, 2, (x, z) => !isTower(x, z) && ringOf(x, z) >= 3))[0];
if (wingRect) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  const x = wingRect[0] + dx, z = wingRect[1] + dz; set(x, WING_TOP, z, "wingBox"); set(x, WING_TOP + 1, z, "wingBox");
}
const mast = towerRect ? cellsList.filter(([x, z]) => isTower(x, z) && ringOf(x, z) >= 4 && !plantCells.some(([px, pz]) => px === x && pz === z))
  .sort((a, b) => (a[0] - cx) ** 2 + (a[1] - cz) ** 2 - ((b[0] - cx) ** 2 + (b[1] - cz) ** 2))[0] : null;
if (mast) for (let y = TOWER_TOP; y <= TOWER_TOP + 2; y++) set(mast[0], y, mast[1], "rod");

// 5. the blocks
const GLASS = (x, y, z) => ((x * 7 + y * 3 + z * 5) % 5 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
const BLOCKS = {
  body: ["light_gray_concrete"], foundation: ["stone"], plinth: ["polished_andesite"],
  band: ["white_concrete"], cornice: ["white_concrete"], wall: ["light_gray_concrete"],
  pier: ["gray_concrete"], shoppier: ["dark_oak_planks"],
  parapet: ["white_concrete"], cap: ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }],
  glow: ["glowstone"], lamp: ["shroomlight"], gap: null, vestibule: null,
  lantern: ["lantern", { hanging: "true", waterlogged: "false" }],
  pillar: ["quartz_pillar", { axis: "y" }],
  plant: ["gray_concrete"], plantCap: ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }],
  wingBox: ["light_gray_concrete"],
  rod: ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }],
};
const doorState = (half) => ({ facing: door.facing, half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([W, H, D]);
for (const [k, r] of role) {                       // air roles (gap, vestibule) have no spec and stay out of the file
  const [x, y, z] = k.split(",").map(Number);
  if (r === "glass") g.set(x, y, z, GLASS(x, y, z));
  else if (r === "doorLower") g.set(x, y, z, "dark_oak_door", doorState("lower"));
  else if (r === "doorUpper") g.set(x, y, z, "dark_oak_door", doorState("upper"));
  else if (BLOCKS[r]) g.set(x, y, z, BLOCKS[r][0], BLOCKS[r][1]);
}

const counts = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588409.nbt");
console.log(JSON.stringify({ footprint: cellsList.length, tower: cellsList.filter(([x, z]) => isTower(x, z)).length,
  door: door ? { x: door.x, z: door.z, floor: door.F, facing: door.facing } : null, plant: plantCells.length, wingBox: wingRect ? 4 : 0, mast: !!mast, ...counts }));
