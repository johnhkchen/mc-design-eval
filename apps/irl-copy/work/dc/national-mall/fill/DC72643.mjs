// DC72643: a Federal-era (c. 1930s) Neoclassical office block in pale limestone on the Mall's flank.
// A stone base, four storeys of calcite walls with smooth-quartz bands and pilasters, a central pavilion
// that rises two blocks above the wings, a parapet and a flat roof. Shell only: each exterior-facing wall is
// one block thick, the rooms behind it are air, and each storey has a floor slab resting on the shell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72643.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72643.cells.json", "utf8"));

const W = 9, D = 15, H = 29;
const fp = new Map();                                   // "x,z" -> ground height g (the lidar roof is smoothed below)
for (const [x, z, g] of cells) fp.set(x + "," + z, g);
const has = (x, z) => fp.has(x + "," + z);

// Smoothed roof tiers (lidar reads 15/16/17 with dips): a 17 pavilion over the core, a 16 setback on its east side, 15 wings.
const roofTop = (x, z) => (x >= 1 && x <= 6 && z >= 3 && z <= 13) ? 17 : (x === 7 && z >= 3 && z <= 13) ? 16 : 15;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));          // outside the footprint
const stepDown = (x, z) => Object.keys(DIRS).filter((d) => has(x + DIRS[d][0], z + DIRS[d][1]) && roofTop(x + DIRS[d][0], z + DIRS[d][1]) < roofTop(x, z));
const isShell = (x, z) => exposed(x, z).length > 0 || stepDown(x, z).length > 0;
const isCorner = (x, z) => { const e = exposed(x, z); return e.some((d) => d === "N" || d === "S") && e.some((d) => d === "W" || d === "E"); };
// The bay index along the outward face: x for the north and south walls, z for the east and west walls.
const outFace = (x, z) => exposed(x, z)[0];
const bayIndex = (x, z) => (outFace(x, z) === "N" || outFace(x, z) === "S") ? x : z;
const isWindow = (x, z) => { const f = outFace(x, z); return !!f && !isCorner(x, z) && bayIndex(x, z) % 2 === 1 && !(f === "S" && x >= 3 && x <= 5); };
const isEntrance = (x, z) => z === 14 && x >= 3 && x <= 5;
const cap = (x, z) => roofTop(x, z) - 1;

// Warm light: a window on storey 2, 3 or 4 whose inside cell is interior gets a glowstone on the floor slab behind it.
const lamps = new Set();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z) || !isWindow(x, z) || bayIndex(x, z) % 4 !== 1) continue;
  const f = outFace(x, z), [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;                       // inward: the opposite way from the outward face
  if (!has(ix, iz) || isShell(ix, iz)) continue;
  for (const y of [5, 9, 13]) if (y < cap(ix, iz)) lamps.add(`${ix},${iz},${y}`);
}

const pane = (x, z) => {
  const ns = outFace(x, z) === "W" || outFace(x, z) === "E";   // side walls connect north and south, front walls east and west
  return ["glass_pane", { north: String(ns), south: String(ns), east: String(!ns), west: String(!ns) }];
};

// What sits at (x, y, z): [name, state] or null for air.
function blockAt(x, z, y) {
  if (!has(x, z)) return null;
  const g = fp.get(x + "," + z), top = roofTop(x, z), cp = cap(x, z);
  if (y < g) return ["stone_bricks"];                                    // fill up to the ground: foundation under every cell
  if (y >= top) return null;
  if (!isShell(x, z)) {                                                 // interior: roof, a floor slab per storey, lamps; otherwise air
    if (y === cp) return ["smooth_stone"];
    if (y >= 4 && (y - 4) % 4 === 0 && y < cp) return ["smooth_stone"];
    if (lamps.has(`${x},${z},${y}`)) return ["glowstone"];
    return null;
  }
  if (y === cp) return ["smooth_quartz"];                               // parapet on the shell
  if (isEntrance(x, z) && y <= 3) {                                     // the Mall front: a door under a lintel and canopy course
    if (x === 4 && y <= 1) return ["dark_oak_door", { facing: "south", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    if (x === 4 && y === 2) return ["smooth_quartz"];
    if (y === 3) return ["smooth_quartz_slab", { type: "bottom" }];
    return ["smooth_quartz"];
  }
  if (y < 4) {                                                          // ground storey: a rusticated base, glass in the bays
    if (isWindow(x, z) && y >= g + 1 && y <= Math.min(g + 2, 3)) return pane(x, z);
    if (isCorner(x, z) || (outFace(x, z) && bayIndex(x, z) % 2 === 0)) return ["smooth_quartz"];
    return ["stone_bricks"];
  }
  const r = (y - 4) % 4;                                                // storeys every 4 blocks: band, window, window, spandrel
  if (r === 0) return ["smooth_quartz"];                                // storey line course
  if (isCorner(x, z) || (outFace(x, z) && !isWindow(x, z))) return ["smooth_quartz"];   // quoins and pilasters
  if (isWindow(x, z) && (r === 1 || r === 2)) return pane(x, z);
  return ["calcite"];
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
// Roof equipment: two stone plant boxes on the wings and a lightning rod on the pavilion's roof.
for (const [x, z] of [[2, 1], [6, 1]]) for (const y of [15, 16]) g.set(x, y, z, "stone_bricks");
g.set(4, 17, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const info = g.save(OUT);
console.log(JSON.stringify(info));
