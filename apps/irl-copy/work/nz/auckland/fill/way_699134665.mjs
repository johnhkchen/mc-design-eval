// Smith & Caughey's Building, Queen Street: a 1930s stripped-classical department store. Nine storeys of white render on a
// granite base, gray-framed steel-sash windows in light-blue glazing, a shopfront ground floor, a stepped setback ring at
// the eighth storey, a lift-tower on the east side that runs up over the rest, and roof plant on the flat top.
// Storeys are 4 blocks: a floor row (the band or a slab), then three rows of wall with the windows in the middle two.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_699134665.cells.json", "utf8"));
const g = new Voxels([47, 59, 47]);

const BASE_Y = 3;                                  // the ground storey's floor: above the lowest ground, so the downhill side gets the plinth
const PLINTH = "stone_bricks", BAND = "smooth_stone", WALL = "white_concrete", FRAME = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane", BASE = "polished_granite", SLAB = "stone";
const PARAPET = "smooth_stone", GLOW = "glowstone", PLANT = "light_gray_concrete";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// roof lidar heights -> three clean tiers: a low wing, the main body, and a lift tower
const tier = (r) => (r <= 32 ? 24 : r >= 44 ? 44 : 40);

const cell = new Map();                            // "x,z" -> { T, dist }
for (const [x, z, , r] of cells) cell.set(`${x},${z}`, { T: tier(r) });
const at = (x, z) => cell.get(`${x},${z}`);

// distance in cells from the outside edge (edge cells are 0)
const edge = (x, z) => DIRS.some(([dx, dz]) => !at(x + dx, z + dz));
const dist = new Map(); const queue = [];
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); if (edge(x, z)) { dist.set(k, 0); queue.push([x, z]); } }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(`${x},${z}`);
  for (const [dx, dz] of DIRS) { const k = `${x + dx},${z + dz}`; if (cell.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); } }
}
for (const [k, c] of cell) c.dist = dist.get(k);

// setbacks: the main body steps in by a storey at its outer two cells; the tower's core rises two blocks more
for (const c of cell.values()) {
  if (c.T === 40 && c.dist <= 2) c.T = 36;
  else if (c.T === 44 && c.dist >= 2) c.T = 46;
}

// the outward faces of a cell at height y: a neighbour outside the footprint, or one that stops below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T <= y; });

// the shell: solid from the plinth to the cell's own top; floors in the interior; walls, windows and rooftop in between
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < BASE_Y; y++) g.set(x, y, z, PLINTH);                  // foundation under the ground floor, on any slope
  for (let y = BASE_Y; y < c.T; y++) {
    const ex = exposed(x, z, y), storey = Math.floor((y - BASE_Y) / 4), off = (y - BASE_Y) % 4;
    if (y === c.T - 1) { g.set(x, y, z, ex.length ? BAND : SLAB); continue; }   // the roof's surface
    if (off === 0) { g.set(x, y, z, ex.length ? (storey === 0 ? BASE : BAND) : SLAB); continue; }
    if (!ex.length) continue;                                                  // interior: air behind the floor slab
    const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
    if (corner) { g.set(x, y, z, BASE); continue; }                            // quoins
    if (storey === 0 && off === 3) { g.set(x, y, z, BASE); continue; }         // shopfront fascia
    if (off === 3) { g.set(x, y, z, WALL); continue; }                         // lintel
    const [dx, dz] = ex[0];
    const along = dz ? x : z;                                                  // the coordinate running along the face
    if (along % 5 === 0) { g.set(x, y, z, FRAME); continue; }                  // a steel-sash mullion
    g.set(x, y, z, storey === 0 ? SHOP : GLASS);
  }
  if (c.dist === 0) g.set(x, c.T, z, PARAPET);                                 // parapet on the outer edge
}

// entrances: a double door on the north face of the ground floor, set in its glazing
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z, BASE_Y + 1);
  if (!(ex.some(([, dz]) => dz === -1) && !ex.some(([dx]) => dx)) || ![22, 23].includes(x)) continue;
  g.set(x, BASE_Y + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: x === 22 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, BASE_Y + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: x === 22 ? "left" : "right", open: "false", powered: "false" });
}

// warm lights behind some glass: the interior cell just inside each lit window
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = BASE_Y + 1; y < c.T - 1; y++) {
    const off = (y - BASE_Y) % 4;
    if (off === 0 || off === 3) continue;
    const ex = exposed(x, z, y);
    if (!ex.length || ex.length > 1 || (ex[0][0] === 0 && ex[0][1] === 0)) continue;
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz, inner = at(ix, iz);
    if (!inner || inner.T <= y || exposed(ix, iz, y).length) continue;
    if ((x * 73 + z * 151 + y * 31) % 5 === 0) g.set(ix, y, iz, GLOW);
  }
}

// roof plant: a few light boxes on the main roof, well in from the edges
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (c.T !== 40 || c.dist < 4 || x % 12 !== 6 || z % 12 !== 6) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => at(qx, qz)?.T === 40)) continue;
  for (const [qx, qz] of quad) for (const y of [40, 41]) g.set(qx, y, qz, PLANT);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_699134665.nbt");
