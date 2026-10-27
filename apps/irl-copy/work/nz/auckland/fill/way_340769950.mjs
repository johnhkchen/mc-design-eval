// Way 340769950, Mt Eden / Eden Terrace: a 1970s concrete-framed office block, four storeys over a basalt plinth,
// flat roof, tinted glass in white-concrete piers, a shopfront and entrance on the north (street) face with a canopy,
// glowstone behind some windows, and a roof plant room set back on the deck. Massing follows the lidar roof: 18-19
// on nearly every cell, so one flat tier at y 18 (the noisy low reads are smoothed into it). Floors are one solid
// slab per storey line over the whole footprint, so every tier stands on the one below; the interior is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_340769950.cells.json`, "utf8"));

const X = 55, Y = 32, Z = 71;
const SLABS = [3, 7, 11, 15];       // storey floor lines (slab layers); storeys are 3-6, 7-10, 11-14, 15-17
const DECK = 18;                    // flat roof deck
const PARAPET = 19;                 // coping on the perimeter
const PLANT = { x0: 20, x1: 34, z0: 28, z1: 40, top: 22 };   // roof plant room, set back on the deck

const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const exposed = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });
const isPerim = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };

// blocks, by name
const PANE = "light_blue_stained_glass_pane", PIER = "white_concrete", CONCRETE = "light_gray_concrete";
const PLINTH = "polished_andesite", COPING = "gray_concrete", BARS = "iron_bars";

// depth in cells from the outer wall (0 = perimeter), so lights sit two cells in, behind the glass
const depth = new Map(); const queue = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) if (isPerim(x, z)) { depth.set(`${x},${z}`, 0); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = depth.get(`${x},${z}`);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = `${x + dx},${z + dz}`;
    if (has(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// the entrance: the middle of the north (street) face, among its cells that sit at or above the lowest floor line
const northCands = cells.filter(([x, z, g]) => !has(x, z - 1) && g <= 4).sort((a, b) => a[0] - b[0]);
const [xDoor, zDoor] = northCands[Math.floor(northCands.length / 2)];

const placed = new Map();
const put = (x, y, z, block, state) => placed.set(`${x},${y},${z}`, { x, y, z, block, state });

for (const [x, z, g] of cells) {
  const base = Math.max(g, 3);
  // foundation and plinth: solid under the ground line and up to the first floor slab
  for (let y = 0; y < base; y++) put(x, y, z, PLINTH);
  const e = exposed(x, z), perim = isPerim(x, z);
  const nsAxis = e.N || e.S, bay = nsAxis ? x : z;
  const pier = bay % 4 === 0;
  for (let y = base; y < DECK; y++) {
    if (SLABS.includes(y)) { put(x, y, z, CONCRETE); continue; }
    if (!perim) continue;
    const s = SLABS.filter((f) => f <= y).pop(), rel = y - s;
    const ground1 = s === 3;                                  // the ground-floor storey
    if (ground1 && e.N && g <= 4) {                           // shopfront on the street face
      if (rel === 1) { put(x, y, z, PLINTH); continue; }
      if (x === xDoor && z === zDoor) {                       // entrance: iron door, lower and upper half
        put(x, y, z, "iron_door", { facing: "north", half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 6 && Math.abs(x - xDoor) <= 1) { put(x, y, z, COPING); continue; }  // canopy over the door
      if (y === 5 && Math.abs(x - xDoor) === 1) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      put(x, y, z, PANE); continue;
    }
    if (rel === 1 && s !== 15) { put(x, y, z, CONCRETE); continue; }   // sill above a storey's floor
    if (pier) { put(x, y, z, PIER); continue; }
    put(x, y, z, PANE);
    // warm light two cells in, behind the centre bay of each window group (keeping the air gap at depth 1)
    if (bay % 4 === 2) {
      const [dx, dz] = e.N ? [0, 2] : e.S ? [0, -2] : e.W ? [2, 0] : [-2, 0];
      const lx = x + dx, lz = z + dz;
      if (has(lx, lz) && depth.get(`${lx},${lz}`) >= 2) put(lx, y, lz, "glowstone");
    }
  }
  // roof deck and coping
  put(x, DECK, z, CONCRETE);
  if (perim && !(x >= PLANT.x0 && x <= PLANT.x1 && z >= PLANT.z0 && z <= PLANT.z1)) put(x, PARAPET, z, COPING);
}

// roof plant room: a set-back box on the deck with louvred sides and a cap
for (let x = PLANT.x0; x <= PLANT.x1; x++) for (let z = PLANT.z0; z <= PLANT.z1; z++) {
  if (!has(x, z)) continue;
  const ring = x === PLANT.x0 || x === PLANT.x1 || z === PLANT.z0 || z === PLANT.z1;
  put(x, PLANT.top, z, COPING);
  if (!ring) continue;
  for (let y = PARAPET; y < PLANT.top; y++) {
    const louvre = y >= 20 && (x + z) % 3 === 0;
    put(x, y, z, louvre ? BARS : COPING);
  }
}

// panes and bars join their neighbours: solid blocks, other panes and bars count as connected
const joins = (k) => {
  const p = placed.get(k);
  return p && !["lantern", "iron_door"].includes(p.block.replace("minecraft:", ""));
};
for (const p of placed.values()) {
  if (p.block !== PANE && p.block !== BARS) continue;
  const side = (dx, dz) => (joins(`${p.x + dx},${p.y},${p.z + dz}`) ? "true" : "false");
  p.state = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
}

const g = new Voxels([X, Y, Z]);
const counts = {};
for (const p of placed.values()) {
  if (p.y < 0 || p.y >= Y) continue;
  g.set(p.x, p.y, p.z, p.block, p.state);
  counts[p.block] = (counts[p.block] ?? 0) + 1;
}
const saved = g.save(`${DIR}/way_340769950.nbt`);
console.log(JSON.stringify({ footprint: cells.length, door: [xDoor, zDoor], ...saved, counts }, null, 1));
