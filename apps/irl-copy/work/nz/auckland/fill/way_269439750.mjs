// Way 269439750: Omron Robotics, a late-20th-century concrete-and-glass office block on a sloping site (lidar ground 0-4
// across the footprint, roof 10, lower wings on the west edge). Three storeys on the downhill side, two on the uphill
// side; glazed bays with concrete mullions and spandrels, a plinth and a string course at each floor line, a parapet
// that brings the top to about 11, roof plant, a double-door entrance on the lowest side under a canopy, and warm
// glow behind some of the glass. Floor slabs span between the walls and a column grid; nothing else is inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439750.cells.json", "utf8"));   // [x, z, ground, roof]

const FOUND = "stone", PLINTH = "stone_bricks", FLOOR = "smooth_stone", SPANDREL = "white_concrete", FRAME = "light_gray_concrete";
const PANE = "light_blue_stained_glass_pane", DECK = "gray_concrete", PARAPET = "white_concrete", PLANT = "iron_block";
const LIGHT = "glowstone", COLUMN = "light_gray_concrete", DOOR = "iron_door", CANOPY = "smooth_stone";
const FACES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const FLOORS = [4, 7];                                    // absolute storey lines; each cell also starts a storey at its own ground

// The plan: the lidar roof, median-smoothed over 3x3 and snapped to four flat tiers (10 main block, 8/6/4 wings).
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(`${x},${z}`, { x, z, g, r });
const rawAt = (x, z) => raw.get(`${x},${z}`);
const plan = new Map();
for (const c of raw.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = rawAt(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const med = near[near.length >> 1];
  const tier = med >= 9 ? 10 : med >= 7 ? 8 : med >= 5 ? 6 : 4;
  plan.set(`${c.x},${c.z}`, { x: c.x, z: c.z, g: c.g, r: Math.max(tier, c.g + 2) });   // a roof is at least two blocks above its ground
}
const cellAt = (x, z) => plan.get(`${x},${z}`);
for (const c of plan.values()) c.out = FACES.filter(([dx, dz]) => !cellAt(c.x + dx, c.z + dz));   // faces with nothing built beyond
const isPerim = (x, z) => { const c = cellAt(x, z); return !!c && c.out.length > 0; };

// The entrance goes on the lowest face: the outward face whose cells sit lowest on the lidar.
const score = Object.fromEntries(FACES.map(([, , n]) => [n, 0]));
for (const c of plan.values()) for (const [, , n] of c.out) score[n] += 4 - c.g;
const front = FACES.reduce((a, b) => (score[b[2]] > score[a[2]] ? b : a));
const frontCells = [...plan.values()].filter(c => c.out.some(([, , n]) => n === front[2]))
  .sort((a, b) => (front[0] ? a.z - b.z : a.x - b.x));
const mid = frontCells[Math.floor(frontCells.length / 2)];
const bay = [mid, front[0] ? cellAt(mid.x, mid.z + 1) : cellAt(mid.x + 1, mid.z)];

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);

// Floors per cell: its own ground, then the absolute storey lines below the roof deck.
const floorsOf = (c) => [...new Set([c.g, ...FLOORS])].filter(f => f >= c.g && f < c.r - 1).sort((a, b) => a - b);

for (const c of plan.values()) {
  const perim = c.out.length > 0, fl = floorsOf(c);
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, FOUND);                       // solid from y 0 up to the ground
  for (let y = c.g; y < c.r - 1; y++) {
    if (fl.includes(y)) {
      put(c.x, y, c.z, perim && y === c.g ? PLINTH : FLOOR);                   // plinth or floor slab (string course outside)
      continue;
    }
    if (!perim) continue;                                                      // interior air behind the glass
    const f = Math.max(...fl.filter(v => v <= y));
    const nf = fl.find(v => v > y) ?? c.r - 1;
    if (y === nf - 1 && nf - f >= 3 && f !== c.g) { put(c.x, y, c.z, SPANDREL); continue; }   // spandrel under each upper floor
    const idx = c.out[0][0] !== 0 ? c.z : c.x;
    put(c.x, y, c.z, idx % 3 === 0 ? FRAME : PANE);                            // concrete mullion every third cell
  }
  put(c.x, c.r - 1, c.z, DECK);                                                // roof deck, on the top storey
  if (perim) put(c.x, c.r, c.z, PARAPET);                                      // parapet: the top is about 11
}

// The column grid holds the floor slabs up away from the walls (interior cells two in from the envelope).
for (const c of plan.values()) {
  if (c.out.length || c.x % 6 !== 3 || c.z % 6 !== 3) continue;
  const ring = FACES.every(([dx, dz]) => cellAt(c.x + dx, c.z + dz) && !isPerim(c.x + dx, c.z + dz));
  if (!ring) continue;
  const fl = floorsOf(c);
  for (let y = c.g; y < c.r - 1; y++) if (!fl.includes(y)) put(c.x, y, c.z, COLUMN);
}

// Roof plant: 2x2 units on the main tier's deck, lifting the top to 11.
for (const c of plan.values()) {
  if (c.out.length || c.r !== 10) continue;
  if ((c.x % 9 === 4 || c.x % 9 === 5) && (c.z % 9 === 4 || c.z % 9 === 5)) put(c.x, c.r, c.z, PLANT);
}

// Warm light: some windows on each storey have a glowstone just inside, standing on that storey's floor slab.
for (const c of plan.values()) {
  if (!c.out.length) continue;
  const fl = floorsOf(c);
  for (let y = c.g; y < c.r - 1; y++) {
    const b = blocks.get(`${c.x},${y},${c.z}`);
    if (!b || b.block !== PANE) continue;
    const f = Math.max(...fl.filter(v => v <= y));
    const idx = c.out[0][0] !== 0 ? c.z : c.x;
    if (y !== f + 1 || idx % 6 !== 1) continue;
    const inward = FACES.map(([dx, dz]) => cellAt(c.x - dx, c.z - dz)).find(n => n && !isPerim(n.x, n.z) && floorsOf(n).includes(f) && !has(n.x, y, n.z));
    if (inward) put(inward.x, y, inward.z, LIGHT);
  }
}

// The entrance: a two-leaf iron door in the bay on the lowest face, under a canopy one block above the doors.
const doorState = (half, hinge) => ({ facing: front[2], half, hinge, open: "false", powered: "false" });
for (const [i, c] of bay.entries()) {
  const hinge = i === 0 ? "left" : "right";
  for (let y = c.g + 1; y <= c.g + 2; y++) put(c.x, y, c.z, DOOR, doorState(y === c.g + 1 ? "lower" : "upper", hinge));
  put(c.x, c.g + 3, c.z, CANOPY);
}

// Panes connect to the neighbouring wall faces (panes, frames, spandrels, doors) on their own storey row.
const g = new Voxels([30, 23, 48]);
for (const [key, { block, state }] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === PANE) {
    const side = (dx, dz) => (isPerim(x + dx, z + dz) && has(x + dx, y, z + dz) ? "true" : "false");
    g.set(x, y, z, block, { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
  } else g.set(x, y, z, block, state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439750.nbt");
