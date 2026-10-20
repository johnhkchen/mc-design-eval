import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951871";
const W = 17, H = 23, D = 14;

// Record: no era given. Read as a 1980s-90s Xinyi mid-rise: two storeys of
// shopfront-and-office, white tiled concrete shell, blue-glass bands, stone base,
// quartz cornice, parapet roof. Roof ~11 blocks above lowest ground = 2 storeys + parapet.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const minG = Math.min(...ground.values());
const R = minG + 11;          // parapet top block
const F1 = minG + 5;          // first floor line
const F2 = minG + 10;         // second floor line (top slab / cornice)

const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const zMax = Math.max(...[...ground.keys()].map((k) => +k.split(",")[1]));
const midX = Math.round((Math.min(...cells.map((c) => c[0])) + Math.max(...cells.map((c) => c[0]))) / 2);
const frontRow = cells.filter(([x, z]) => z === zMax && isEdge(x, z));
const doorX = frontRow.reduce((best, [x]) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), frontRow[0][0]);

const WALL = "white_concrete";
const BASE = "stone_bricks";
const FOUND = "stone";
const GLASS = "light_blue_stained_glass";
const PANE = "light_blue_stained_glass_pane";
const BAND = "smooth_quartz";
const FLOOR = "smooth_stone";
const EQUIP = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  // foundation under every footprint cell
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (isEdge(x, z)) {
    // shell wall up to the roof level
    for (let y = gr; y <= R - 1; y++) put(x, y, z, WALL);
    // base course
    if (gr < F1) put(x, gr, z, BASE);
    // ground storey shopfront glass, mullions every third cell
    if (gr < F1) {
      for (let y = gr + 1; y <= F1 - 1; y++) {
        if ((x + z) % 3 !== 0) put(x, y, z, GLASS);
      }
    }
    // storey floor lines (quartz band)
    for (const f of [F1, F2]) if (f >= gr) put(x, f, z, BAND);
    // upper storey window band
    for (let y = Math.max(F1 + 1, gr); y <= F2 - 1; y++) {
      if ((x + z) % 3 !== 0) put(x, y, z, PANE);
    }
    // parapet with cornice line
    put(x, R, z, WALL);
  } else {
    // interior: floor slabs only (air gap behind the glass)
    for (const y of [gr, F1, F2]) {
      if (y >= gr && y <= R - 1) put(x, y, z, FLOOR);
    }
    // roof equipment on the flat roof, supported by the top slab
    if (F2 >= gr && (x * 5 + z * 3) % 13 === 0) put(x, R, z, EQUIP);
  }
}

// entrance: door on the street-facing row, lintel above
const doorG = gOf(doorX, zMax);
put(doorX, doorG, zMax, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, doorG + 1, zMax, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
if (doorG + 3 < F1) {
  for (let dx = -2; dx <= 2; dx++) {
    const x = doorX + dx;
    if (has(x, zMax) && isEdge(x, zMax)) {
      put(x, doorG + 3, zMax, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// warm lights behind upper-storey glass, on the floor slab
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || isEdge(nx, nz)) continue;
    const ng = gOf(nx, nz);
    if (ng > F1 || ng >= R) continue;
    if ((x * 3 + z * 7) % 4 !== 0) continue;
    if (F1 + 1 <= gr) continue;
    put(nx, F1 + 1, nz, (x + z) % 2 ? "glowstone" : "shroomlight");
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
