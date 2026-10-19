// DC69401: 955 L'Enfant Plaza SW, Washington DC 20024, as a 1.21.1 module. Commercial-Office-Large, 49 x 16 blocks.
// Read as a late-1960s / 1970s concrete-framed office block: a light precast-look frame with a continuous ribbon of
// tinted glass between concrete spandrels, a stone plinth and cornice, and a lobby bay on the south face. The lidar
// roof sits at 15-18 blocks; the 3x3 median smooths it into two flat tiers (the 15 ring on the wings and ends, the
// 17 core in the middle; the odd 18 spots fold into the core). Every column is solid from y 0 to its tier, and the
// storey slabs run through the interior, so nothing floats. Each storey is 3 blocks: a slab row (spandrel outside,
// floor slab inside) and two window rows (glass in a frame of piers outside, air behind the glass inside).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69401.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69401.nbt";

const X1 = 48, Z1 = 15;                                   // footprint is x 0..48, z 0..15
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));  // touches the outside of the footprint
const onZ = (z) => z === 0 || z === Z1;                   // long north and south faces
const onX = (x) => x === 0 || x === X1;                   // short east and west ends

// Smoothed roof: median of the 3x3 around each cell, then two flat tiers.
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const tier = (h) => (h <= 15 ? 15 : 17);                  // wings and ends at 15, the core at 17
const T = new Map([...F.values()].map((c) => [key(c.x, c.z), tier(smooth.get(key(c.x, c.z)))]));

// Palette
const PLINTH = "stone_bricks";        // base course, lobby lintel
const CORE = "light_gray_concrete";   // frame piers and spandrels
const CAP = "polished_andesite";      // cornice and roof rim
const ROOF = "gray_concrete";         // roof membrane inside the rim
const FLOOR = "smooth_stone";         // floor slabs inside
const GLASS = "gray_stained_glass_pane";   // darker bronze-tinted glass, so the air behind it does not read as sky
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const PLANT = "gray_concrete";        // roof plant boxes

const g = new Voxels([49, 20, 16]);

// Ground-floor lobby on the south face: a glass shopfront across x 21..27, with doors at x 22 and x 26.
const LOBBY = (x) => x >= 21 && x <= 27;
const DOORS = new Set([22, 26]);

// Piers sit on every third column and row of the outside frame, and at the corners.
const pier = (x, z) => (onZ(z) && onX(x)) || (onZ(z) && x % 3 === 0) || (onX(x) && z % 3 === 0);

for (const c of F.values()) {
  const t = T.get(key(c.x, c.z)), b = shell(c.x, c.z), front = c.z === Z1;
  for (let y = 0; y < t; y++) {
    if (y === 0 || y < c.g) { g.set(c.x, y, c.z, PLINTH); continue; }   // base course and foundation under the cell's ground
    if (y === t - 1) { g.set(c.x, y, c.z, b ? CAP : ROOF); continue; }   // cornice on the rim, membrane inside
    if (y % 3 === 0) {                                                  // storey slab: spandrel outside, floor inside
      if (!b) g.set(c.x, y, c.z, FLOOR);
      else g.set(c.x, y, c.z, front && y === 3 && LOBBY(c.x) ? PLINTH : CORE);   // lobby lintel stone
      continue;
    }
    if (!b) continue;                                                   // window rows: air behind the glass inside
    if (front && y <= 2 && LOBBY(c.x)) { g.set(c.x, y, c.z, GLASS); continue; }
    if (pier(c.x, c.z)) g.set(c.x, y, c.z, CORE);
    else g.set(c.x, y, c.z, GLASS);
  }
}

// Lobby doors: a dark oak door (lower and upper halves) in the lobby glass, standing on the plinth.
for (const x of DOORS) {
  g.set(x, 1, Z1, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, Z1, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm light behind some glass: a glowstone on the floor slab, just inside the glass (never on the air row above).
for (const c of F.values()) {
  const t = T.get(key(c.x, c.z));
  if (!shell(c.x, c.z) || pier(c.x, c.z) || LOBBY(c.x) && c.z === Z1) continue;
  for (let y = 4; y < t - 1; y += 3) {                              // storeys 2 and up, first window row only
    if (!((c.x * 7 + c.z * 5 + y * 3) % 11 === 0)) continue;
    if (onZ(c.z) && !onX(c.x)) g.set(c.x, y, c.z === 0 ? 1 : Z1 - 1, LAMP);
    else if (onX(c.x) && !onZ(c.z)) g.set(c.x === 0 ? 1 : X1 - 1, y, c.z, LAMP);
  }
}

// Plant on the 17 core roof: two boxes (a louvred plant room and a smaller one) standing on the membrane.
for (const [x0, x1, z0, z1] of [[20, 28, 6, 9], [36, 39, 5, 7]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const t = T.get(key(x, z)); if (!t || shell(x, z)) continue;
    for (let y = t; y < t + 2; y++) g.set(x, y, z, y === t + 1 ? CAP : PLANT);
  }
}

// Window glass panes connect along their own wall plane only, so a pane never reaches into the lamps behind it.
for (const c of F.values()) {
  if (!shell(c.x, c.z) || pier(c.x, c.z)) continue;
  for (let y = 1; y < T.get(key(c.x, c.z)) - 1; y++) {
    const p = g.get(c.x, y, c.z);
    if (!p || p.block !== GLASS) continue;
    const st = { north: "false", south: "false", east: "false", west: "false" };
    if (onZ(c.z)) { if (g.get(c.x + 1, y, c.z)) st.east = "true"; if (g.get(c.x - 1, y, c.z)) st.west = "true"; }
    else if (onX(c.x)) { if (g.get(c.x, y, c.z + 1)) st.south = "true"; if (g.get(c.x, y, c.z - 1)) st.north = "true"; }
    g.set(c.x, y, c.z, GLASS, st);
  }
}

console.log(g.save(OUT));
