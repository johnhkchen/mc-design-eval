// Mt Eden–side Auckland commercial block, way 382846312: a two-storey Edwardian-style cream stucco
// shopfront-and-office block (Eden Terrace / Newton fabric) on a diagonal plot that falls from NW to SE.
// Foundations fill from y 0 to each cell's ground; storey rhythm is set from each cell's own ground,
// so the downhill end shows an extra storey. Roof heights are median-smoothed into three flat tiers
// (7 low wing, 8 main body, 10 tall NW bay). Shell only: floor slabs and a deck per cell, no interior.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_382846312.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byKey.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" }; // a door faces back toward the street side it opens onto

// lidar roof: 3x3 median, then three flat tiers
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tierOf = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) near.push(byKey.get(key(x + dx, z + dz)).r);
  const m = median(near);
  tierOf.set(key(x, z), m >= 9.5 ? 10 : m >= 7.5 ? 8 : 7);
}

const facade = (x, z) => DIRS.some(([dx, dz]) => !inside(x + dx, z + dz));
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

const WALL = "white_terracotta", STONE = "stone_bricks", TRIM = "dark_oak_planks", GLASS = "glass_pane";
const FLOOR = "spruce_planks", DECK = "smooth_stone";

const g3 = new Voxels([30, 23, 25]);
const put = (x, y, z, b, s) => g3.set(x, y, z, b, s);

// shell and foundations
for (const [x, z, g] of cells) {
  const T = tierOf.get(key(x, z));
  const fac = facade(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, STONE);                    // foundation to the cell's ground
  for (let y = g; y < T; y++) {
    const d = y - g;
    if (!fac) {
      if (y === T - 1) put(x, y, z, DECK);                             // roof deck over the interior
      else if (d % 4 === 0) put(x, y, z, FLOOR);                       // a floor slab per storey
      continue;
    }
    if (y === T - 1) put(x, y, z, "stone_brick_wall");                 // parapet
    else if (d === 0) put(x, y, z, STONE);                             // base course
    else if (d % 4 === 0) put(x, y, z, STONE);                         // string course at each storey line
    else if (d % 4 === 3) put(x, y, z, d === 3 ? TRIM : WALL);         // fascia / lintel
    else if (d <= 2) put(x, y, z, (x + z) % 3 === 0 ? TRIM : GLASS);   // shopfront: pier and glazing
    else put(x, y, z, (x + z) % 3 === 1 ? GLASS : WALL);               // upper windows: one pane in three, so the stucco reads
  }
}

// entrance: street-side (outward +z) facade cell on the lowest ground, the middle of that run
const doorCands = cells.filter(([x, z]) => facade(x, z) && outward(x, z).some(([dx, dz]) => dx === 0 && dz === 1));
const minG = Math.min(...doorCands.map((c) => c[2]));
const lowCands = doorCands.filter((c) => c[2] === minG).sort((a, b) => a[0] - b[0]);
const [dX, dZ, dG] = lowCands[Math.floor(lowCands.length / 2)];
const doorFacing = FACING["0,1"];  // outward is +z, so the door faces north
put(dX, dG + 1, dZ, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(dX, dG + 2, dZ, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
if (inside(dX, dZ - 1)) put(dX, dG + 1, dZ - 1, "lantern", { hanging: "false" });  // warm light just inside the door

// warm lights behind some windows: glowstone or shroomlight on the interior cell beside the glass
let n = 0;
for (const [x, z, g] of cells) {
  if (!facade(x, z)) continue;
  const T = tierOf.get(key(x, z));
  for (let y = g + 1; y < T - 1; y++) {
    const d = y - g;
    if (d % 4 === 0 || d % 4 === 3) continue;
    if (d > 2 ? (x + z) % 3 !== 1 : (x + z) % 3 === 0) continue;        // only where there is glass
    if ((x * 7 + z * 3 + d) % 2 !== 0) continue;                        // about half the windows lit
    const inn = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inside(a, b) && !facade(a, b));
    if (!inn) continue;
    if ((y - byKey.get(key(...inn)).g) % 4 === 0) continue;             // not on a floor slab
    put(inn[0], y, inn[1], n % 2 ? "shroomlight" : "glowstone");
    n++;
  }
}

// roof plant: iron units and brick chimneys on the interior deck of the taller tiers
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (facade(x, z)) continue;
  const T = tierOf.get(key(x, z));
  if ((x * 5 + z * 3) % 13 === 0 && T >= 8) put(x, T, z, "iron_block");
  else if ((x * 3 + z * 7) % 17 === 0 && T >= 8) { put(x, T, z, "bricks"); put(x, T + 1, z, "bricks"); }
}

const res = g3.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_382846312.nbt");
console.log(JSON.stringify({ ...res, door: [dX, dG, dZ], lights: n }));
