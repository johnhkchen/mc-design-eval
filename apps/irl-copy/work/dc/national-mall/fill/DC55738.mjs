// DC55738: Commercial-Office-Large at 701 9th St NW, Washington DC 20001 (Penn Quarter), as a 1.21.1 module.
// Lidar roof heights are smoothed (3x3 median over the footprint) and snapped to three tiers: a 1-storey lower wing
// (4 blocks), a 4-storey podium (16), and the 5-storey office block with its attic and cornice (19). Walls are a stone
// base, a Beaux-Arts band in every storey (sill and lintel courses) with brick piers between 2-wide window bays, and a
// cornice on top. Interiors are air one block behind the glass with a floor slab per storey; the core is solid, so every
// tier stands on the one below. The main entrance is on the north (9th Street) face under a canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55738.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55738.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell.
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  c.h = vals[vals.length >> 1];
}
// Three flat tiers: lower wing, podium, office block (top at 19).
const tier = (h) => (h <= 6 ? 4 : h <= 16 ? 16 : 19);

// Depth into the footprint: 0 = the outer shell, 1 = the air gap behind the glass, 2+ = solid core.
const depth = new Map();
const queue = [];
for (const c of F.values()) {
  const k = key(c.x, c.z);
  if (DIRS.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) { depth.set(k, 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (!n) continue;
    const nk = key(n.x, n.z); if (!depth.has(nk)) { depth.set(nk, d + 1); queue.push(n); }
  }
}
const depthOf = (x, z) => depth.get(key(x, z)) ?? 0;

// Palette: pale Beaux-Arts limestone bands and a red-brick wall in the Penn Quarter's office-block manner.
const STONE = "smooth_quartz";        // bands, sills, lintels, cornice
const BRICK = "bricks";              // walls and piers
const BASE = "stone_bricks";         // plinth and ground-floor piers
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";        // floor slabs and roof membranes
const CORE = "stone";
const LAMP = "glowstone";
const DOOR = "dark_oak_door";
const CANOPY = "dark_oak_slab";
const LANTERN = "lantern";
const UNIT = "iron_block";

const g = new Voxels([26, 31, 32]);

// Main entrance on the north (z = 0) face, centred on the bay at x = 18.
const DOOR_X = 18;
const onNorth = (x, z) => z === 0 && inF(x, z - 1) === false;

// The pier sits on the brick bays: on the north and south faces x % 3 === 0, on the east and west faces z % 3 === 0,
// and brick at the corners.
const pierAt = (c) => {
  const ns = !inF(c.x, c.z - 1) || !inF(c.x, c.z + 1);
  const ew = !inF(c.x - 1, c.z) || !inF(c.x + 1, c.z);
  if (ns && ew) return true;
  if (ns) return c.x % 3 === 0;
  if (ew) return c.z % 3 === 0;
  return false;
};

for (const c of F.values()) {
  const T = tier(c.h), d = depthOf(c.x, c.z);
  // Core: solid from y 0 up to the roof. The foundation under the cell's ground is the same stone.
  if (d >= 2) {
    for (let y = 0; y < T - 1; y++) g.set(c.x, y, c.z, CORE);
    g.set(c.x, T - 1, c.z, FLOOR);                                      // roof membrane
    if (c.x % 6 === 3 && c.z % 6 === 3) g.set(c.x, T, c.z, UNIT);       // rooftop plant on the core
    continue;
  }
  // Air gap: floor slabs at each storey line and a roof membrane; nothing else.
  if (d === 1) {
    for (let y = 0; y < T; y++) if (y % 4 === 0 || y === T - 1) g.set(c.x, y, c.z, FLOOR);
    continue;
  }
  // Shell (d = 0).
  const pier = pierAt(c);
  for (let y = 0; y < T; y++) {
    if (y < c.g || y === 0) { g.set(c.x, y, c.z, BASE); continue; }   // plinth and foundation
    if (y === T - 1) { g.set(c.x, y, c.z, STONE); continue; }          // cornice
    if (y % 4 === 0 || y % 4 === 3) { g.set(c.x, y, c.z, STONE); continue; } // sill and lintel bands
    // Window band (y % 4 is 1 or 2). Ground storey is the shopfront.
    const ground = y < 4;
    if (onNorth(c.x, c.z) && c.x === DOOR_X) {
      g.set(c.x, y, c.z, DOOR, { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier) { g.set(c.x, y, c.z, ground ? BASE : BRICK); continue; }
    const lit = !ground && (c.x * 7 + c.z * 13 + Math.floor(y / 4)) % 9 === 0;
    if (lit) g.set(c.x, y, c.z, LAMP);
    else g.set(c.x, y, c.z, GLASS);
  }
}

// Canopy over the entrance bays, and lanterns hanging under it either side of the door.
for (let x = DOOR_X - 2; x <= DOOR_X + 2; x++) {
  if (!inF(x, 0)) continue;
  g.set(x, 3, 0, CANOPY, { type: "bottom", waterlogged: "false" });
}
for (const x of [DOOR_X - 2, DOOR_X + 2]) {
  if (inF(x, 0)) g.set(x, 2, 0, LANTERN, { hanging: "true", waterlogged: "false" });
}

// Glass panes connect to whatever is beside them in the wall plane.
for (const c of F.values()) {
  if (depthOf(c.x, c.z) !== 0) continue;
  for (let y = 1; y < tier(c.h); y++) {
    const p = g.get(c.x, y, c.z);
    if (!p || p.block !== GLASS) continue;
    const st = {};
    if (g.get(c.x, y, c.z - 1)) st.north = "true";
    if (g.get(c.x, y, c.z + 1)) st.south = "true";
    if (g.get(c.x + 1, y, c.z)) st.east = "true";
    if (g.get(c.x - 1, y, c.z)) st.west = "true";
    g.set(c.x, y, c.z, GLASS, st);
  }
}

console.log(g.save(OUT));
