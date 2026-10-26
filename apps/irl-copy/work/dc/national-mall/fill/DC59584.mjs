// 465 New York Ave NW: a late-1980s business hotel, cream precast-clad masonry on a stone base, with a 2-wide
// shoulder-and-tower on its east flank (lidar roof 16 blocks) over a podium (roof 5-6) and lobby wings (roof 1-2).
// Tiers come from the lidar roof, smoothed: wings 4, podium 7, shoulder 11, tower 16. Each storey is a 3-block
// band (stone spandrel on the floor line, two rows of glass). Interior is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59584.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59584.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// ---- massing: smoothed lidar roof -> clean tiers (T = the roof's top cap is at y = T-1)
const TIER = { wing: 4, podium: 7, shoulder: 11, tower: 16 };
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) {
  let T = TIER.wing;
  if (x >= 10 && x <= 11 && z >= 5 && z <= 10) T = TIER.tower;               // the tower core (lidar 16 on its edge)
  else if (r >= 12 || (x === 9 && z >= 5 && z <= 10)) T = TIER.shoulder;     // setback ring around the core
  else if (r >= 4) T = TIER.podium;                                          // the 5-6 roof podium
  fp.set(key(x, z), { g, T });
}
const topOf = (x, z) => (fp.has(key(x, z)) ? fp.get(key(x, z)).T : -1);      // -1: outside the footprint = open
// a glass-row cell is a wall face when a neighbour is open at that height (outside, or lower than this row)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const openDirs = (x, z, y) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) <= y);

const g = new Voxels([13, 28, 16]);
const WALL = "smooth_quartz", BAND = "stone_bricks", ROOF = "smooth_stone", PARAPET = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";

const windowState = (open) => {
  const alongZ = open.some(([dx]) => dx !== 0);   // exposed in x: the face runs along z, so panes join north/south
  return alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
};

// ---- shell: foundation, storey bands, glazing, roof cap
const lamps = [];
for (const [key0, { g: ground, T }] of fp) {
  const [x, z] = key0.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, BAND); continue; }                        // stone plinth from y 0 to the ground
    if (y === T - 1) { g.set(x, y, z, openDirs(x, z, y).length ? PARAPET : ROOF); continue; }   // cornice / roof deck
    if (y % 3 === 0) { g.set(x, y, z, BAND); continue; }                        // storey line; also the floor slab
    const open = openDirs(x, z, y);
    if (!open.length) continue;                                                 // interior: air behind the glass
    const exposedX = open.some(([dx]) => dx !== 0);
    const bay = exposedX ? z : x;                                               // the glazing bay along that face
    if (bay % 2 === 1) g.set(x, y, z, GLASS, windowState(open));
    else g.set(x, y, z, WALL);
  }
}

// ---- main entrance on the south face: door on the ground storey, a dark hood over it
g.set(3, 1, 15, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 2, 15, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(3, 4, 15, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// ---- warm light in some windows: a lamp on the room side of the glass
for (const [key0, { T }] of fp) {
  const [x, z] = key0.split(",").map(Number);
  for (let y = 1; y < T - 1; y++) {
    if (y % 3 === 0) continue;
    const open = openDirs(x, z, y);
    if (!open.length) continue;
    const bay = open.some(([dx]) => dx !== 0) ? z : x;
    if ((bay + y) % 4 !== 0) continue;
    const [ox, oz] = open[0];
    const ix = x - ox, iz = z - oz;                                             // one step inward
    if (!fp.has(key(ix, iz)) || openDirs(ix, iz, y).length) continue;
    g.set(ix, y, iz, (x + y) % 2 ? "shroomlight" : "glowstone");
  }
}

// ---- roof equipment: AC plant on the tower roof and two units on the podium
for (const [x, z] of [[10, 6], [11, 9]]) g.set(x, fp.get(key(x, z)).T, z, "light_gray_concrete");
for (const [x, z] of [[7, 5], [8, 6]]) g.set(x, fp.get(key(x, z)).T, z, "light_gray_concrete");
g.set(11, fp.get(key(11, 7)).T, 7, "lightning_rod");

g.save(OUT);
console.log(`saved ${OUT}: ${g.count()} blocks`);
