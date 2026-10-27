// Way 826872619, Mt Eden side of the CBD: a 1930s reinforced-concrete Moderne block, four storeys of cream plaster
// on a basalt base (the volcanic stone of the isthmus), with a flat roof at 19 blocks (lidar reads one flat tier, so no
// setbacks), a parapet, a glazed ground floor, a canopied entrance on the north end, and a roof plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_826872619.cells.json`, "utf8"));

const PLASTER = "white_concrete", BASE = "polished_andesite", GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone", CANOPY = "smooth_stone", LIGHT = "glowstone", ROOM = "white_concrete";
const STOREY = 4, STOREYS = 4;                       // four storeys of 4 blocks; the cornice sits on the fourth floor line

// what each cell says: its ground, its roof top (lidar, y 0 = lowest ground under the footprint)
const at = new Map();
for (const [x, z, g, roof] of cells) at.set(`${x},${z}`, { g, top: roof });
const inF = (x, z) => at.has(`${x},${z}`);
const outward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inF(x + dx, z + dz));

// our own record of the volume: "x,y,z" -> { block, state }, so panes can read their neighbours before writing
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { x, y, z, block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// the front: the entrance is the middle of the north end (the lowest z row), its canopy spans the three cells there
const front = cells.filter(([, z]) => z === Math.min(...cells.map(c => c[1])));
const doorX = front[Math.floor(front.length / 2)][0], doorZ = front[0][1];
const doorFacing = "north";

// plant room: a 3x3 patch of interior roof cells nearest the middle of the plan
const interior = cells.filter(([x, z]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inF(x + dx, z + dz)));
const isRoom = (cx, cz) => [-1, 0, 1].every(dx => [-1, 0, 1].every(dz => interior.some(([x, z]) => x === cx + dx && z === cz + dz)));
const cxAll = cells.reduce((s, c) => s + c[0], 0) / cells.length, czAll = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let room = null;
for (const [x, z] of interior) if (isRoom(x, z)) { const d = Math.hypot(x - cxAll, z - czAll); if (!room || d < room.d) room = { x, z, d }; }

for (const [x, z] of cells) {
  const { g, top } = at.get(`${x},${z}`);
  // foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y < g; y++) put(x, y, z, BASE);
  const out = outward(x, z), exterior = out.length > 0, corner = out.length >= 2;
  // along-the-facade coordinate: x on a north/south face, z on an east/west face; piers every third cell
  const along = out.length && out[0][1] !== 0 ? x : z;
  for (let y = g; y < top; y++) {
    const r = y - g;
    if (!exterior) {
      // no interiors: a floor slab on each storey line and the roof deck, air between
      if (r % STOREY === 0 && r <= STOREY * STOREYS) put(x, y, z, FLOOR);
      continue;
    }
    if (y === top - 1) { put(x, y, z, BASE); continue; }                       // coping
    if (r >= STOREY * STOREYS) { put(x, y, z, y === g + STOREY * STOREYS ? BASE : PLASTER); continue; } // cornice, parapet
    if (r === 0 || r % STOREY === 0) { put(x, y, z, BASE); continue; }          // plinth, storey string courses
    if (corner) { put(x, y, z, PLASTER); continue; }
    const row = r % STOREY;
    if (row === 1 || row === 2) {
      put(x, y, z, along % 3 === 0 ? PLASTER : GLASS);                           // bays: glass between plaster piers
    } else put(x, y, z, PLASTER);                                                 // spandrel under each window band
  }
}

// entrance: a glazed door in the north-end cell, a canopy over it and its neighbours on the same face
for (const [x, z] of cells) {
  if (z !== doorZ || Math.abs(x - doorX) > 1) continue;
  const { g } = at.get(`${x},${z}`);
  if (x === doorX) {
    put(x, g + 1, z, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, g + 2, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  put(x, g + 3, z, CANOPY);
}

// warm light: glowstone on the room side of some lower-window bays, so the glass reads lit at dusk
const inward = (x, z, out) => [x - out[0][0], z - out[0][1]];
for (const [x, z] of cells) {
  const out = outward(x, z); if (!out.length || out.length > 1) continue;
  const { g, top } = at.get(`${x},${z}`);
  for (let k = 0; k < STOREYS; k++) {
    const y = g + k * STOREY + 1;
    if (!has(x, y, z) || B.get(`${x},${y},${z}`).block !== GLASS) continue;
    if ((x * 7 + z * 3 + k * 5) % 4 !== 0) continue;
    const [ix, iz] = inward(x, z, out);
    if (!inF(ix, iz) || outward(ix, iz).length) continue;
    put(ix, y, iz, LIGHT);
  }
}

// roof plant room: a two-high plaster box with a base cap, standing on the roof deck
if (room) {
  const g = at.get(`${room.x},${room.z}`).g;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = room.x + dx, z = room.z + dz;
    if (dx === 0 && dz === 0) continue;
    put(x, g + STOREY * STOREYS + 1, z, ROOM);
    put(x, g + STOREY * STOREYS + 2, z, dx === 0 || dz === 0 ? BASE : ROOM);
  }
}

// glass panes connect to whatever stands beside them, so the windows read as framed glazing rather than posts
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const e of B.values()) {
  if (e.block !== GLASS) continue;
  e.state = Object.fromEntries(Object.entries(DIRS).map(([name, [dx, dz]]) => [name, has(e.x + dx, e.y, e.z + dz) ? "true" : "false"]));
}

const g = new Voxels([34, 32, 19]);
for (const e of B.values()) g.set(e.x, e.y, e.z, e.block, e.state);
const out = `${DIR}/way_826872619.nbt`;
const res = g.save(out);
console.log(`way_826872619: ${res.blocks} blocks, ${res.palette} palette entries -> ${out}`);
