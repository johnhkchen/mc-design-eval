// A 7 x 5 block limestone-faced Beaux-Arts office block on the Mall's flank: two storeys of tall windows over a granite
// plinth, a stone-brick string course at the first floor, a chiseled cornice on the top row, and a rooflight. The
// lidar roof sits at 6-7 blocks, so the top tier is flat at 7 (the 6s are noise on the edge cells). The front (z 0) faces
// north with the entrance centred. Every column is solid from y 0 to the cornice, so nothing floats; the only air is
// the pocket behind each window, one cell in from the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61257.cells.json`, "utf8"));

const W = 7, H = 8, D = 5;              // y 0..6 the building, y 7 the rooflight
const TOP = 7;                          // flat tier from the lidar (6-7 on the footprint)
const g = new Voxels([W, H, D]);

const CALCITE = "calcite", BAND = "stone_bricks", BASE = "polished_granite", CORNICE = "chiseled_stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const WINDOW_ROWS = new Set([1, 2, 4, 5]);

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);

// Exterior faces of a cell: which sides look onto open air (the footprint is a plain rectangle, so the edges are the walls).
const sidesOf = (x, z) => ({ N: z === 0, S: z === D - 1, W: x === 0, E: x === W - 1 });

// The window map: which exterior cells are glass, and the door. Facade rules are on the outside face of each wall.
const isGlass = (x, y, z) => {
  if (!WINDOW_ROWS.has(y)) return false;
  const s = sidesOf(x, z);
  if (s.N) return x !== 0 && x !== W - 1 && x !== 3;           // front: four ground and upper bays, centre handled below
  if (s.S) return x !== 0 && x !== W - 1 && x !== 3;           // back: same bays, centre is a pier
  if (s.W || s.E) return z === 1 || z === 3;                    // flanks: bays either side of a pier at z 2
  return false;
};
const isDoor = (x, y, z) => z === 0 && x === 3 && (y === 1 || y === 2);
const isLightCentre = (x, y, z) => z === 0 && x === 3 && (y === 4 || y === 5);  // upper centre window

// The air pocket behind each window (and behind the door): one cell in from the glass, toward the middle of the building.
const inward = (x, z) => {
  const s = sidesOf(x, z);
  return s.N ? [x, z + 1] : s.S ? [x, z - 1] : s.W ? [x + 1, z] : [x - 1, z];
};
const pocket = new Set();
const warm = new Set();
for (const [x, z] of cells) for (const y of WINDOW_ROWS) {
  const s = sidesOf(x, z);
  if (!(s.N || s.S || s.W || s.E)) continue;
  if (isGlass(x, y, z) || isDoor(x, y, z) || isLightCentre(x, y, z)) {
    const [ix, iz] = inward(x, z);
    const key = `${ix},${y},${iz}`;
    pocket.add(key);
    if (isLightCentre(x, y, z)) warm.add(key);
  }
}

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of cells) {
  const s = sidesOf(x, z);
  const exterior = s.N || s.S || s.W || s.E;
  const corner = (s.N || s.S) && (s.W || s.E);
  for (let y = 0; y < TOP; y++) {
    if (pocket.has(`${x},${y},${z}`)) continue;                 // air behind the glass and the door
    if (warm.has(`${x},${y},${z}`)) continue;                   // filled below with glowstone
    if (!exterior) { g.set(x, y, z, "stone"); continue; }
    if (isDoor(x, y, z)) continue;                              // the door is set below
    if (y === 0) { g.set(x, y, z, BASE); continue; }             // granite plinth on the ground
    if (y === TOP - 1) { g.set(x, y, z, CORNICE); continue; }    // cornice course on the top row
    if (y === 3) { g.set(x, y, z, BAND); continue; }             // first-floor string course
    if (corner) { g.set(x, y, z, y % 2 ? BAND : CALCITE); continue; }   // rusticated quoins at the corners
    if (isGlass(x, y, z) || isLightCentre(x, y, z)) {
      const pane = s.N || s.S ? PANE_EW : PANE_NS;
      g.set(x, y, z, GLASS, pane);
      continue;
    }
    g.set(x, y, z, CALCITE);                                    // limestone walls and piers
  }
}

// Warm light: glowstone behind the upper centre window.
for (const key of warm) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, "glowstone"); }

// Entrance: a dark oak door centred on the front, lower and upper halves.
g.set(3, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Rooftop: a small rooflight with a slab curb, sitting on the cornice.
const SLAB = { type: "bottom", waterlogged: "false" };
for (let x = 2; x <= 4; x++) for (let z = 1; z <= 3; z++) g.set(x, TOP, z, "stone_brick_slab", SLAB);
g.set(3, TOP, 2, "light_blue_stained_glass");

g.save(`${DIR}/DC61257.nbt`);
