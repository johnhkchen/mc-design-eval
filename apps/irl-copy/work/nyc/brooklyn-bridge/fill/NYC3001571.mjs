import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 48 Hicks Street, Brooklyn Heights Historic District, built 1829.
// Federal / early Greek Revival rowhouse-commercial block: Flemish-bond red brick
// walls, brownstone base course, stone string courses, a stone cornice, a
// storefront at street level, wood floors and sash windows, a few lit rooms.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001571";
const W = 10, H = 22, D = 6;

const WALL = "bricks";
const FOUND = "stone_bricks";
const BASE = "brown_terracotta";   // brownstone base course
const STRING = "smooth_stone";     // stone string courses and cornice
const ROOF = "stone_bricks";
const FLOOR = "oak_planks";
const GLASS = "glass";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  info.set(key(x, z), { g: Math.round(gr), r: Math.round(roof) });
}
const inF = (x, z) => info.has(key(x, z));

const median = (vals) => {
  const s = [...vals].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

// One flat roof tier for the whole block: the lidar noise is removed by
// taking the building's median roof height, kept at least 5 blocks above
// the highest ground so the storeys still fit.
const allRoof = [...info.values()].map((v) => v.r);
const allGround = [...info.values()].map((v) => v.g);
const roofTier = Math.max(Math.round(median(allRoof)), Math.max(...allGround) + 5);

// Ground is smoothed with a 3x3 median so the base course steps cleanly
// while still following the slope under the footprint.
const groundS = new Map();
for (const [k] of info) {
  const [x, z] = k.split(",").map(Number);
  const nb = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (inF(x + dx, z + dz)) nb.push(info.get(key(x + dx, z + dz)).g);
  groundS.set(k, Math.round(median(nb)));
}

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Storey floor lines: ground, then 3-block ground storey, then 2-block storeys.
const storeyBases = (gc, R) => {
  const b = [gc];
  let y = gc + 3;
  while (y + 2 <= R - 1) { b.push(y); y += 2; }
  return b;
};

// Pass 1: massing, foundation, facade articulation.
const cellInfo = [];
for (const [k] of info) {
  const [x, z] = k.split(",").map(Number);
  const gc = groundS.get(k);
  const R = roofTier;
  const nW = !inF(x - 1, z), nE = !inF(x + 1, z);
  const nN = !inF(x, z - 1), nS = !inF(x, z + 1);
  const perim = nW || nE || nN || nS;
  const corner = (nW || nE) && (nN || nS);
  const win = perim && !corner && ((x + z) & 1) === 0;
  // inward direction (toward the building interior) for interior glow
  let ix = 0, iz = 0;
  if (nW) ix = 1; else if (nE) ix = -1; else if (nN) iz = 1; else if (nS) iz = -1;
  const bases = storeyBases(gc, R);
  cellInfo.push({ x, z, gc, R, perim, win, ix, iz, bases, nN });

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, FOUND);

  for (let y = gc; y <= R - 1; y++) {
    if (y === R - 1) {
      put(x, y, z, perim ? STRING : ROOF); // cornice / roof deck
      continue;
    }
    if (bases.includes(y)) {
      if (!perim) put(x, y, z, FLOOR);
      else put(x, y, z, y === gc ? BASE : STRING);
      continue;
    }
    if (!perim) continue; // interior air
    if (win && y > gc) {
      put(x, y, z, GLASS);
    } else {
      put(x, y, z, WALL);
    }
  }
}

// Pass 2: warm light behind some upper-storey glass.
for (const c of cellInfo) {
  if (!c.win) continue;
  for (let y = c.gc + 1; y < c.R - 1; y++) {
    if (c.bases.includes(y)) continue;
    if (y <= c.gc + 2) continue; // keep the shopfront free of glow
    if ((c.x * 7 + y * 3 + c.z) % 5 !== 0) continue;
    const ix = c.x + c.ix, iz = c.z + c.iz;
    if (!inF(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Pass 3: entrance on the street face (z = 0 side), nearest to the middle.
let door = null;
for (const c of cellInfo) {
  if (!c.nN) continue;
  if (!door || Math.abs(c.x - 5) < Math.abs(door.x - 5)) door = c;
}
if (door) {
  const y0 = door.gc + 1;
  put(door.x, y0, door.z, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, y0 + 1, door.z, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lantern beside the door on the storefront pilaster.
  const lx = door.x + 1;
  if (inF(lx, door.z)) {
    put(lx, door.gc + 2, door.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: two brick chimney stacks on interior roof cells.
let chimneys = 0;
for (const c of cellInfo) {
  if (chimneys >= 2) break;
  if (c.perim) continue;
  if ((c.x * 3 + c.z * 5) % 11 !== 0) continue;
  for (let y = c.R; y <= c.R + 2; y++) put(c.x, y, c.z, WALL);
  put(c.x, c.R + 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  chimneys++;
}

g.save(`${DIR}/${ID}.nbt`);
