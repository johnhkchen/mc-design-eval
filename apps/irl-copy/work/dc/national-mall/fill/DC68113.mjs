// DC68113: a 1930s stripped-classical brick office block with stone trim on 4th St NW, DC 20001, as a 1.21.1 module.
// The footprint is 14 x 39 cells. Lidar roof heights are median-smoothed over the 3x3 around each cell and snapped to
// three tiers (8, 9, 10 blocks to the top of the solid), so the perimeter wings stand two storeys with a cornice, the
// ring is two storeys and a parapet, and the central core rises one more storey as an attic pavilion with its own parapet.
// Storey lines are absolute (plinth y 1, floors y 4 and y 7) so the tiers line up across the whole block. Every column
// is solid from y 0 up, so nothing floats; interiors are air behind the glass, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68113.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68113.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Palette: brick field, limestone trim, stone foundation, glass panes, interior floor slabs, warm light.
const FIELD = "bricks";
const TRIM = "calcite";
const FOUND = "stone_bricks";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";
const DOOR = "dark_oak_door";
const LANTERN = "lantern";
const LAMP = "glowstone";
const UNIT = "iron_block";

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Top of the solid (the cap course is the block at T - 1): 8 for the low wings, 9 for the ring, 10 for the core.
const tier = (m) => (m <= 8 ? 8 : m === 9 ? 9 : 10);

const g = new Voxels([14, 22, 39]);

// Outward faces of a shell cell: which neighbours are off the footprint.
const outside = (x, z) => ({ W: !inF(x - 1, z), E: !inF(x + 1, z), N: !inF(x, z - 1), S: !inF(x, z + 1) });
const isShell = (o) => o.W || o.E || o.N || o.S;

// Glass panes connect along their wall: x-facing walls run north-south, z-facing walls east-west.
const paneState = (o) => (o.W || o.E
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

// Entrances, on the outward face: the main door on the west (street) face at z 19 with a lantern-flanked bay and a
// canopy (the west face is x 1 for z 7-31, x 0 only at the ends); a side door on the east face at z 26.
const MAIN_Z = 19, SIDE_Z = 26;
const inMainBay = (x, z) => z >= 17 && z <= 21 && inF(x, z) && outside(x, z).W;

for (const c of F.values()) {
  const { x, z } = c;
  const T = tier(smooth.get(key(x, z)));
  const o = outside(x, z);
  const shell = isShell(o);
  const corner = (o.W || o.E) && (o.N || o.S);
  const xFace = o.W || o.E;                       // the wall runs along z here
  const along = xFace ? z : x;
  const pier = along % 3 === 0;                   // brick piers between the glass
  const inward = o.W ? [x + 1, z] : o.E ? [x - 1, z] : o.N ? [x, z + 1] : o.S ? [x, z - 1] : null;

  for (let y = 0; y < T; y++) {
    // Foundation: solid from y 0 under the whole block.
    if (y === 0) { g.set(x, y, z, FOUND); continue; }
    // Storey lines: the plinth (y 1), the floor and string courses (y 4), the cornice (y 7).
    if (y === 1 || y === 4 || y === 7) { g.set(x, y, z, shell ? TRIM : FLOOR); continue; }
    // The cap course: the parapet on the ring and core, the cornice on the low wings.
    if (y === T - 1) { g.set(x, y, z, shell ? TRIM : FLOOR); continue; }
    // A slab under the cap on the inside, so the roof stands on something.
    if (!shell && y === T - 2) { g.set(x, y, z, FLOOR); continue; }
    // Window bands: storey one (y 2-3), storey two (y 5-6), and the attic (y 8 on the core).
    const band = y === 2 || y === 3 || y === 5 || y === 6 || (y === 8 && T === 10);
    if (!band || !shell) continue;                // interiors stay air behind the glass
    if (corner) { g.set(x, y, z, TRIM); continue; }
    // The main entrance bay on the west face.
    if (o.W && z === MAIN_Z && (y === 2 || y === 3)) {
      g.set(x, y, z, DOOR, { facing: "west", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (o.E && z === SIDE_Z && (y === 2 || y === 3)) {
      g.set(x, y, z, DOOR, { facing: "east", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (inMainBay(x, z) && y === 2 && (z === 17 || z === 21)) { g.set(x, y, z, LANTERN, { hanging: "false", waterlogged: "false" }); continue; }
    if (inMainBay(x, z) && (z === 18 || z === 20)) { g.set(x, y, z, TRIM); continue; }   // pilasters beside the door
    if (pier) { g.set(x, y, z, FIELD); continue; }
    // Glass, with a warm lamp behind some panes on the ground and the first upper storey.
    g.set(x, y, z, GLASS, paneState(o));
    if (inward && ((y === 2 && along % 6 === 1) || (y === 5 && along % 6 === 4))) g.set(inward[0], y, inward[1], LAMP);
  }
}

// Canopy over the main door: a flat trim hood on the string course, two cells deep, on footprint cells only.
for (let z = 17; z <= 21; z++) for (let x = 1; x <= 2; x++) if (inF(x, z)) g.set(x, 5, z, TRIM);

// Roof units on the core's cap (y 10 sits on the parapet's inside slab at y 9).
for (const c of F.values()) {
  const { x, z } = c;
  if (tier(smooth.get(key(x, z))) !== 10 || isShell(outside(x, z))) continue;
  if ((x === 4 || x === 9) && (z === 8 || z === 15 || z === 22 || z === 29)) g.set(x, 10, z, UNIT);
}

// Checks: nothing outside the footprint, and every block either stands on a solid block or is an interior storey slab.
const [X, Y, Z] = g.size; let outside_fp = 0, hanging_shell = 0, hanging_interior = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = g.get(x, y, z); if (!b) continue;
  if (!inF(x, z)) { outside_fp++; continue; }
  if (y === 0 || g.get(x, y - 1, z)) continue;
  if (outside(x, z).W || outside(x, z).E || outside(x, z).N || outside(x, z).S) hanging_shell++; else hanging_interior++;
}
const report = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...report, outside_footprint: outside_fp, hanging_shell, hanging_interior }));
