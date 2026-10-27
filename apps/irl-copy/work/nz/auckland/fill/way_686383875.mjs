// Grafton Hall C (OSM way 686383875), Grafton, Auckland. Read as a 1960s-70s institutional block: a four-storey
// pale concrete frame with window bays, a basalt plinth, three-storey wings, a three-block setback on the top storey
// of the tall mass, a flat grey roof with a parapet, and a plant room. Solid concrete with a one-block air gap behind
// each window, so every column stands on the one below and nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(`${DIR}way_686383875.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [40, 34, 73];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => `${x},${z}`;

// ---- plan: one record per footprint cell, massing tier from the lidar roof ----
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(k2(x, z), { x, z, ground, roof, h: 0 });
const cellAt = (x, z) => plan.get(k2(x, z));
const nbr = (c, [dx, dz]) => cellAt(c.x + dx, c.z + dz);
const hOf = (c) => (c ? c.h : 0);
// the sides of a cell with no storey k beyond them (outside the footprint, or the neighbour stops below k)
const exposed = (c, k) => NB.filter((d) => hOf(nbr(c, d)) <= k);
const isShell = (c, k) => !!c && c.h > k && exposed(c, k).length > 0;

const cs = [...plan.values()];
// four storeys where the lidar roof is 19 to 21, three from 13 to 18, two below (lidar noise on the edge slivers)
for (const c of cs) c.h = c.roof >= 19 ? 4 : c.roof >= 13 ? 3 : 2;
// the tall mass's top storey sets back three blocks from its edge: a terrace on the storey-3 slab
const ringSet = new Set();
let front = cs.filter((c) => c.h === 4 && NB.some((d) => hOf(nbr(c, d)) < 4));
for (const c of front) ringSet.add(k2(c.x, c.z));
for (let d = 1; d < 3; d++) {
  const next = [];
  for (const c of front) for (const dd of NB) {
    const n = nbr(c, dd);
    if (n && n.h === 4 && !ringSet.has(k2(n.x, n.z))) { ringSet.add(k2(n.x, n.z)); next.push(n); }
  }
  front = next;
}
for (const key of ringSet) plan.get(key).h = 3;

// ---- blocks: a map of "x,y,z" to block, so later passes can carve and overwrite ----
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const drop = (x, y, z) => B.delete(`${x},${y},${z}`);
const R = (c) => 4 + 4 * c.h;   // the roof layer's row: storey k has its slab at 4+4k and walls at 5+4k..7+4k
const glazed = [];              // [x, y, z] of each window pane, connected at the end

for (const c of cs) {
  for (let y = 0; y < 4; y++) put(c.x, y, c.z, "deepslate_bricks");          // basalt plinth
  for (let y = 4; y <= R(c); y++) put(c.x, y, c.z, "white_concrete");       // solid pale concrete core
}

// ---- the shell: storey lines, window bays, piers, and an air gap behind each window ----
for (const c of cs) for (let k = 0; k < c.h; k++) {
  if (!isShell(c, k)) continue;
  const ex = exposed(c, k);
  const d = ex[0];                                   // the face this cell looks out on (a corner has two)
  const corner = ex.length > 1;
  const along = d[0] !== 0 ? c.z : c.x;              // position along the face
  const a1 = cellAt(c.x + (d[0] !== 0 ? 0 : 1), c.z + (d[0] !== 0 ? 1 : 0));
  const a2 = cellAt(c.x - (d[0] !== 0 ? 0 : 1), c.z - (d[0] !== 0 ? 1 : 0));
  const pier = corner || !isShell(a1, k) || !isShell(a2, k) || along % 4 === 0;
  const s = 4 + 4 * k;
  put(c.x, s, c.z, "smooth_stone");                 // storey string course
  if (pier) {
    for (let y = s + 1; y <= s + 3; y++) put(c.x, y, c.z, "light_gray_concrete");
    continue;
  }
  put(c.x, s + 1, c.z, "white_concrete");           // spandrel under the glass
  // the glass sits one block back in a reveal (the shell cell is open), with an air gap behind it
  const recess = cellAt(c.x - d[0], c.z - d[1]), back = cellAt(c.x - 2 * d[0], c.z - 2 * d[1]);
  const deep = recess && recess.h > k && !isShell(recess, k) && back && back.h > k && !isShell(back, k);
  if (deep) {
    for (const y of [s + 2, s + 3]) {
      drop(c.x, y, c.z); drop(back.x, y, back.z);
      put(recess.x, y, recess.z, "light_blue_stained_glass_pane"); glazed.push([recess.x, y, recess.z]);
    }
    if (k >= 1 && (along + k) % 3 === 0) put(back.x, s + 2, back.z, "glowstone");   // a lit window
  } else {
    for (const y of [s + 2, s + 3]) { put(c.x, y, c.z, "light_blue_stained_glass_pane"); glazed.push([c.x, y, c.z]); }
    if (recess && recess.h > k && !isShell(recess, k)) { drop(recess.x, s + 2, recess.z); drop(recess.x, s + 3, recess.z); }
  }
}

// ---- roofs and parapets ----
for (const c of cs) {
  put(c.x, R(c), c.z, "gray_concrete");
  if (exposed(c, c.h - 1).length) put(c.x, R(c) + 1, c.z, "smooth_stone");
}

// ---- entrance: a recess on the east face, one block into the shell, with the storey-1 slab as its soffit ----
let door = null;
for (const c of cs) {
  const ex = exposed(c, 0);
  if (ex.length !== 1 || ex[0][0] !== 1 || ex[0][1] !== 0) continue;
  const hall = cellAt(c.x - 2, c.z), inner = cellAt(c.x - 1, c.z);
  if (!hall || !inner || !isShell(cellAt(c.x, c.z - 1), 0) || !isShell(cellAt(c.x, c.z + 1), 0)) continue;
  if (!door || Math.abs(c.z - 46) < Math.abs(door.z - 46)) door = c;
}
if (door) {
  const { x, z } = door;
  for (const dz of [-1, 1]) for (let y = 5; y <= 7; y++) put(x, y, z + dz, "light_gray_concrete");   // jambs
  for (let y = 5; y <= 7; y++) drop(x, y, z);                                                     // porch
  for (let y = 5; y <= 7; y++) drop(x - 2, y, z);                                                 // hall behind the door
  put(x - 1, 5, z, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x - 1, 6, z, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, 7, z, "lantern", { hanging: "true", waterlogged: "false" });                              // porch lantern
}

// ---- plant room: an 8 x 5 block on the tall roof, clear of the setback ----
const tall = cs.filter((c) => c.h === 4);
const cx = tall.reduce((a, c) => a + c.x, 0) / tall.length, cz = tall.reduce((a, c) => a + c.z, 0) / tall.length;
let plant = null;
for (const c of tall) {
  let ok = true;
  for (let dx = 0; dx < 8 && ok; dx++) for (let dz = 0; dz < 5 && ok; dz++) { const n = cellAt(c.x + dx, c.z + dz); if (!n || n.h !== 4) ok = false; }
  if (!ok) continue;
  const d2 = (c.x + 3.5 - cx) ** 2 + (c.z + 2 - cz) ** 2;
  if (!plant || d2 < plant.d2) plant = { x: c.x, z: c.z, d2 };
}
if (plant) {
  for (let dx = 0; dx < 8; dx++) for (let dz = 0; dz < 5; dz++) {
    const x = plant.x + dx, z = plant.z + dz;
    put(x, 21, z, "light_gray_concrete"); put(x, 22, z, "light_gray_concrete");
    put(x, 23, z, "smooth_stone");
  }
}

// ---- glass panes connect to any neighbouring block across the face ----
const PANE_DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [x, y, z] of glazed) {
  const b = B.get(`${x},${y},${z}`);
  if (!b || b.block !== "light_blue_stained_glass_pane") continue;
  const state = { waterlogged: "false" };
  for (const [name, [dx, dz]] of Object.entries(PANE_DIRS)) state[name] = B.has(`${x + dx},${y},${z + dz}`) ? "true" : "false";
  b.state = state;
}

// ---- write the volume ----
const g = new Voxels(SIZE);
for (const [key, { block, state }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const info = g.save(`${DIR}way_686383875.nbt`);
const h4 = tall.length, h3 = cs.filter((c) => c.h === 3).length, h2 = cs.filter((c) => c.h === 2).length;
console.log(`cells ${cs.length} (4 storeys ${h4}, 3 storeys ${h3}, 2 storeys ${h2}); blocks ${info.blocks}; palette ${info.palette}; door ${door ? `${door.x},${door.z}` : "none"}; plant room ${plant ? `${plant.x},${plant.z}` : "none"}`);
