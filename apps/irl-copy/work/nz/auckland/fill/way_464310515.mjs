// Way 464310515: a 1970s-era concrete office and flats block, seven storeys on a ring plan around an open courtyard.
// Precast white concrete piers and spandrels, glass panes in dark mullioned bays, a basalt-look plinth and stone
// foundation down the slope, a dark-glazed crown storey, a cornice and parapet, one lobby entrance under a canopy,
// a shopfront ground floor, lanterns hung in the air-filled ring, and two plant rooms on the flat roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_464310515.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_464310515.cells.json", "utf8"));

const SIZE = [58, 42, 67];
const ROOF = 29;          // lidar roof: 28-29 on 511 of 524 cells, the rest is edge noise, so one flat tier
const CORNICE = ROOF - 1; // y 28: cornice on the facade, roof slab inside
const PARAPET = ROOF;     // y 29: parapet walls on the facade

// the footprint: ground under each cell, and a set keyed "x,z"
const G = new Map();
for (const [x, z, g] of cells) G.set(`${x},${z}`, g);
const inF = (x, z) => G.has(`${x},${z}`);
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];

// the outside of the footprint, reached from the grid's border; the courtyard is not outside
const hull = new Set();
{
  const q = [[-1, -1]]; hull.add("-1,-1");
  while (q.length) {
    const [x, z] = q.shift();
    for (const [, dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (nx < -1 || nz < -1 || nx > 58 || nz > 67) continue;
      const k = `${nx},${nz}`;
      if (hull.has(k) || inF(nx, nz)) continue;
      hull.add(k); q.push([nx, nz]);
    }
  }
}
const facade = (x, z) => DIRS.some(([, dx, dz]) => !inF(x + dx, z + dz));

// the storey logic: slabs on 4-block lines, a pier every fourth column (x+z), three glazed columns between
const B = new Map();
const put = (x, y, z, name, state) => B.set(`${x},${y},${z}`, { name, state });
const bayOf = (x, z) => (x + z) % 4;   // 0 pier, 1 and 3 glass, 2 mullion
const CROWN = 6;                       // the top storey, glazed darker

for (const [x, z, g] of cells) {
  const fac = facade(x, z), bay = bayOf(x, z);
  for (let y = 0; y <= CORNICE; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }     // stone foundation down to the slope
    if (y === CORNICE) { put(x, y, z, fac ? "smooth_quartz" : "gray_concrete"); continue; }
    const s = Math.floor(y / 4), row = y % 4;
    if (s === 0 && y === g) { put(x, y, z, fac ? "polished_andesite" : "smooth_stone"); continue; }  // plinth and floor
    if (s === 0 && y === 3) { if (fac) put(x, y, z, "light_gray_concrete"); continue; }               // fascia
    if (row === 0) { put(x, y, z, "white_concrete"); continue; }                                   // storey slab
    if (!fac) continue;                                                                             // air behind the glass
    if (bay === 0) { put(x, y, z, s === 0 ? "polished_andesite" : "white_concrete"); continue; }    // piers
    if (row === 1 && s !== 0) { put(x, y, z, "light_gray_concrete"); continue; }                  // spandrel and sill
    if (s === 0 && bay === 2) { put(x, y, z, "gray_stained_glass_pane"); continue; }             // shopfront mullion
    if (s === 0) { put(x, y, z, "glass_pane"); continue; }                                        // shopfront glazing
    if (bay === 2) { put(x, y, z, "gray_stained_glass_pane"); continue; }                          // mullion
    put(x, y, z, s === CROWN ? "tinted_glass" : "glass_pane");                                    // glazing
  }
  // parapet on the facade
  if (fac) put(x, PARAPET, z, "stone_brick_wall");
}

// the lobby: on the ground floor, a facade cell under the mullion column with the ground at 0, the outside reachable
const doorCands = [];
for (const [x, z, g] of cells) {
  if (g !== 0 || bayOf(x, z) !== 2 || !facade(x, z)) continue;
  for (const [dir, dx, dz] of DIRS) {
    if (!hull.has(`${x + dx},${z + dz}`) || inF(x + dx, z + dz)) continue;   // outward neighbour: outside the footprint
    const ix = x - dx, iz = z - dz;
    if (!inF(ix, iz)) continue;                                                // inward neighbour: in the building
    doorCands.push({ x, z, dir, dx, dz, ix, iz });
  }
}
doorCands.sort((a, b) => a.z - b.z || a.x - b.x);
const doors = [];
if (doorCands.length) {
  doors.push(doorCands[0]);
  const south = doorCands.filter((c) => c.z > doorCands[0].z + 10).pop();
  if (south) doors.push(south);
}
for (const d of doors) {
  put(d.x, 1, d.z, "iron_door", { facing: d.dir, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(d.x, 2, d.z, "iron_door", { facing: d.dir, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(d.x, 3, d.z, "smooth_stone");                       // canopy over the door
  put(d.ix, 3, d.iz, "smooth_stone");                     // ...and the lobby side of it
  put(d.ix, 2, d.iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// lanterns hung from each storey slab in the air-filled ring (interior cells only), warm light behind the glass
for (const [x, z, g] of cells) {
  if (facade(x, z)) continue;
  if ((x + z) % 10 !== 0) continue;
  for (let s = 1; s <= CROWN; s++) {
    put(x, 4 * s + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  if (g <= 2) put(x, g + 1, z, "lantern", { hanging: "false", waterlogged: "false" });   // a standing lamp on the lobby floor
}

// the roof: two plant rooms on interior roof cells, each 3 x 3, on the roof slab
// a 3 x 3 patch of footprint whose middle cell is inside the roof edge (the ring is only 3 or 4 cells wide)
const interior3x3 = (x0, z0) => {
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    if (!inF(x0 + dx, z0 + dz)) return false;
  }
  return !facade(x0 + 1, z0 + 1);
};
const plants = [];
for (let z0 = 0; z0 < 64 && plants.length < 2; z0 += 2) {
  for (let x0 = 0; x0 < 56 && plants.length < 2; x0 += 2) {
    if (!interior3x3(x0, z0)) continue;
    if (plants.some((p) => Math.abs(p.x0 - x0) < 8 && Math.abs(p.z0 - z0) < 8)) continue;
    plants.push({ x0, z0 });
  }
}
for (const { x0, z0 } of plants) {
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    const x = x0 + dx, z = z0 + dz, edge = dx !== 1 || dz !== 1;
    put(x, ROOF, z, "light_gray_concrete");
    if (edge) put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}

// connections: panes and bars join their neighbours, walls join low, as the blocks stand in the world
const PANE = new Set(["glass_pane", "gray_stained_glass_pane", "iron_bars"]);
const WALL = new Set(["stone_brick_wall"]);
const OPEN = new Set(["lantern", "iron_door"]);
const isSolid = (x, y, z) => {
  const b = B.get(`${x},${y},${z}`);
  return !!b && !PANE.has(b.name) && !WALL.has(b.name) && !OPEN.has(b.name);
};
for (const [key, b] of B) {
  if (!PANE.has(b.name) && !WALL.has(b.name)) continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (nx, ny, nz, set) => {
    const nb = B.get(`${nx},${ny},${nz}`);
    if (!nb) return false;
    return set.has(nb.name) || isSolid(nx, ny, nz);
  };
  const st = {};
  for (const [name, dx, dz] of DIRS) {
    const on = link(x + dx, y, z + dz, PANE.has(b.name) ? PANE : WALL);
    st[name] = PANE.has(b.name) ? String(on) : (on ? "low" : "none");
  }
  if (PANE.has(b.name)) st.waterlogged = "false";
  else { st.up = "true"; st.waterlogged = "false"; }
  b.state = st;
}

const g = new Voxels(SIZE);
for (const [key, b] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.name, b.state);
}
const res = g.save(OUT);
console.log(`way_464310515: ${res.blocks} blocks, ${res.palette} palette entries, ${doors.length} entrance(s), ${plants.length} plant room(s)`);
