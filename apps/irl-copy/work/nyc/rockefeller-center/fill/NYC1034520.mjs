// 666 Fifth Avenue, a 1958 commercial and office tower (lidar roof 133 blocks above its lowest ground). Its massing follows
// the lidar, median-smoothed over 3x3 and snapped to six tier tops: a 133-block tower near the middle of the lot, stepping
// down through 52 and 48 setbacks to 36 and 32 wings, with a 24-block podium at the north and south ends. The open ground on
// the west (lidar roof 1-3) stays plaza, paved at y 0. Storeys are 3 blocks: a stone spandrel row and two rows of blue-green
// glass, with light-grey mullions every third block. The ground floor is a granite plinth and shopfront glass, with two doors
// (east lobby, north) under black awnings. The tower top has a cornice, a parapet and a mechanical penthouse with louvres.
// Glass sits one block out from a solid core with air behind it, and the warm panes have glowstone behind them. Floor
// slabs are the spandrel rows, and there are no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034520.cells.json`, "utf8"));
const X = 86, Y = 145, Z = 55;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Tiers: the lidar roof median-smoothed over the 3x3 footprint neighbourhood, then snapped to the nearest tier top.
// Roofs of 4 or less are open ground (the plaza), which stays unbuilt above y 0.
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(lidar(x + dx, z + dz));
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const TIERS = [24, 32, 36, 48, 52, 133];
const tierOf = (r) => {
  if (r <= 4) return 0;
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - r) < Math.abs(best - r)) best = t;
  return best;
};
const topMap = new Map();
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); topMap.set(k, tierOf(median(x, z))); }
const top = (x, z) => (inFoot(x, z) ? topMap.get(`${x},${z}`) : 0);
// Every footprint cell is solid at y 0 (the ground), and built up to its tier top above that.
const solid = (x, y, z) => inFoot(x, z) && (y === 0 || y < top(x, z));

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 11 === 0;   // sparse, deterministic warm panes

// Doors on two faces: the east lobby at the middle of the 5th Avenue side, and a north door. Each has a canopy band on
// the ground-floor cornice row over its bay, and an air cavity behind it.
const DOORS = [
  { x: 85, z: 25, dx: 1, dz: 0, facing: "east", bay: (x, z) => x === 85 && z >= 23 && z <= 27 },
  { x: 38, z: 0, dx: 0, dz: -1, facing: "north", bay: (x, z) => z === 0 && x >= 36 && x <= 40 },
];
const doorAt = (x, y, z) => (y === 1 || y === 2 ? DOORS.find((d) => d.x === x && d.z === z) : undefined);

// Band of a height: plinth (1), shopfront (2-3), base cornice (4), then 3-block storeys from 5: spandrel, glass, glass.
const bandOf = (y) => (y === 1 ? "plinth" : y <= 3 ? "shop" : y === 4 ? "cornice" : (y - 5) % 3 === 0 ? "spandrel" : "glass");
// Mullions every third block along the face (u = x on a north or south face, z on an east or west face), and on corners.
const mullion = (x, z, [dx, dz]) => (dx ? z : x) % 3 === 0;
const isPane = (x, y, z, ex) => ex.length === 1 && (bandOf(y) === "shop" || bandOf(y) === "glass") && !mullion(x, z, ex[0]);

// Air behind each pane (one cell deep, between the slabs), with glowstone behind some of them.
const cavity = new Map();
for (const k of topMap.keys()) {
  const [x, z] = k.split(",").map(Number), T = top(x, z);
  for (let y = 1; y < T - 1; y++) {
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;
    const door = doorAt(x, y, z);
    if (!door && !isPane(x, y, z, ex)) continue;
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz;
    if (!solid(ix, y, iz) || y >= top(ix, iz) - 1) continue;
    cavity.set(`${ix},${y},${iz}`, !door && lit(x, y, z) ? "glowstone" : "air");
  }
}

const skin = (x, y, z, T, ex) => {
  if (y >= T - 1) return ex.length ? ["smooth_quartz"] : ["gray_concrete"];   // cornice and roof covering on the top row
  if (!ex.length) return ["stone"];                                          // solid core
  if (ex.length > 1) return ["light_gray_concrete"];                         // corner column
  const dir = ex[0];
  const band = bandOf(y);
  if (band === "plinth") return ["polished_granite"];
  if (band === "cornice") return [DOORS.some((d) => d.bay(x, z)) ? "black_concrete" : "smooth_quartz"];
  if (band === "spandrel") return ["smooth_quartz"];
  if (mullion(x, z, dir)) return ["light_gray_concrete"];
  if (band === "shop") return ["light_blue_stained_glass"];
  return ["light_blue_stained_glass_pane", dir[0] ? EW : NS];
};

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of cols) {
  const T = top(x, z);
  g.set(x, 0, z, T ? "stone_bricks" : "smooth_stone");                       // foundation; open ground is paved
  for (let y = 1; y < T; y++) {
    const key = `${x},${y},${z}`;
    if (cavity.has(key)) { if (cavity.get(key) === "glowstone") g.set(x, y, z, "glowstone"); continue; }
    const door = doorAt(x, y, z);
    if (door) {
      g.set(x, y, z, "dark_oak_door", { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const [name, state] = skin(x, y, z, T, exposed(x, y, z));
    g.set(x, y, z, name, state);
  }
}

// Parapet on the edge of every tier: one block above a roof that has a lower neighbour (or open ground) beside it.
for (const [x, z] of cols) {
  const T = top(x, z);
  if (T && DIRS.some(([dx, dz]) => top(x + dx, z + dz) < T)) g.set(x, T, z, "smooth_quartz");
}

// Mechanical penthouse on the tower top: louvred walls, a stone cap, set inside the parapet.
for (let x = 30; x <= 52; x++) for (let z = 20; z <= 36; z++) {
  if (top(x, z) !== 133) continue;
  const edge = x === 30 || x === 52 || z === 20 || z === 36;
  for (let y = 133; y <= 137; y++) {
    if (y === 137) g.set(x, y, z, "smooth_quartz");
    else if (edge && (y === 134 || y === 135)) g.set(x, y, z, "iron_bars");
    else g.set(x, y, z, edge ? "light_gray_concrete" : "stone");
  }
}

const { blocks, palette } = g.save(`${DIR}/NYC1034520.nbt`);
console.log(`NYC1034520.nbt: ${blocks} blocks, ${palette} palette entries`);
