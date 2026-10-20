import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001680";
const W = 45, H = 44, D = 22;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.cells;

const key = (x, z) => `${x},${z}`;
const cellList = rows.map(([x, z, gr, ro]) => ({ x, z, G: gr, R: ro }));
const cellMap = new Map(cellList.map((c) => [key(c.x, c.z), c]));
const inFp = (x, z) => cellMap.has(key(x, z));

const minX = Math.min(...cellList.map((c) => c.x));
const maxX = Math.max(...cellList.map((c) => c.x));
const minZ = Math.min(...cellList.map((c) => c.z));
const maxZ = Math.max(...cellList.map((c) => c.z));
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

// Smooth lidar roof over the 3x3 in-footprint neighbourhood, then quantise to 2-block storeys.
for (const c of cellList) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const o = cellMap.get(key(c.x + dx, c.z + dz));
      if (o) { sum += o.R; n++; }
    }
  }
  const rs = sum / n;
  const storeys = Math.max(1, Math.round((rs - c.G) / 2));
  c.T = Math.min(c.G + 2 * storeys, H - 5);
}
const maxT = Math.max(...cellList.map((c) => c.T));

const g = new Voxels([W, H, D]);
function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward faces: a face is outward where the neighbour cell is not in the footprint.
function faces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("north");
  if (!inFp(x, z + 1)) f.push("south");
  if (!inFp(x - 1, z)) f.push("west");
  if (!inFp(x + 1, z)) f.push("east");
  return f;
}

function isPier(x, z, fs) {
  if (fs.length >= 2) return true;
  const f = fs[0];
  const ns = f === "north" || f === "south";
  const u = ns ? x : z;
  const lo = ns ? minX : minZ;
  const hi = ns ? maxX : maxZ;
  return (u - lo) % 3 === 0 || u === hi;
}

// Main entrance: on the north (low z) long face, nearest the centre; fall back to south.
let doorCell = null, doorFacing = "north";
let cand = cellList.filter((c) => !inFp(c.x, c.z - 1));
if (cand.length) {
  doorCell = cand.reduce((a, b) => (Math.abs(a.x - cx) <= Math.abs(b.x - cx) ? a : b));
} else {
  cand = cellList.filter((c) => !inFp(c.x, c.z + 1));
  if (cand.length) {
    doorCell = cand.reduce((a, b) => (Math.abs(a.x - cx) <= Math.abs(b.x - cx) ? a : b));
    doorFacing = "south";
  }
}

const inwardOf = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

for (const c of cellList) {
  const { x, z, G, T } = c;
  const fs = faces(x, z);
  const perim = fs.length > 0;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;
  const pier = perim && isPier(x, z, fs);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Inward cell for interior lighting behind glass (single-face cells only).
  let inward = null;
  if (perim && fs.length === 1) {
    const [dx, dz] = inwardOf[fs[0]];
    const ic = cellMap.get(key(x + dx, z + dz));
    if (ic && faces(ic.x, ic.z).length === 0) inward = { x: x + dx, z: z + dz };
  }
  const u = perim && fs.length === 1 && (fs[0] === "north" || fs[0] === "south") ? x : z;

  for (let y = G; y < T; y++) {
    const k = y - G;
    const s = k >> 1;
    const glassRow = k % 2 === 1;

    if (!perim) {
      // Interior: floor slab each storey and a ceiling slab under the roof deck, air gap elsewhere.
      if (!glassRow || y === T - 1) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (k === 0) {
      if (isDoor) {
        put(x, y, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "stone_bricks"); // base course / shopfront plinth
      }
      continue;
    }

    if (isDoor && k === 1) {
      put(x, y, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
      if (inward) put(inward.x, y, inward.z, "glowstone"); // lobby light seen through the door
      continue;
    }

    if (!glassRow) {
      put(x, y, z, "light_gray_concrete"); // light precast spandrel
      continue;
    }

    if (pier) {
      put(x, y, z, "white_concrete"); // precast mullion
      continue;
    }

    // Glazing: mostly blue tint, with occasional cyan panes for rhythm.
    put(x, y, z, (u + s) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
    if (inward && (u + s) % 5 === 0) put(inward.x, y, inward.z, "glowstone");
  }

  // Roof deck at T; perimeter gets a cornice line and a parapet.
  if (perim) {
    put(x, T, z, "smooth_stone");
    put(x, T + 1, z, "light_gray_concrete");
  } else {
    put(x, T, z, "gray_concrete");
  }
}

// Mechanical penthouse on the tallest interior tier, centred on the footprint.
// Two blocks tall: ring walls at T+1, solid cap at T+2 (every cell has a support below).
const pentSet = new Set(
  cellList
    .filter((c) => c.T === maxT && faces(c.x, c.z).length === 0 && Math.abs(c.x - cx) <= 8 && Math.abs(c.z - cz) <= 4)
    .map((c) => key(c.x, c.z))
);
const pentCells = cellList.filter((c) => pentSet.has(key(c.x, c.z)));
for (const p of pentCells) {
  const ring = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !pentSet.has(key(p.x + dx, p.z + dz)));
  if (ring) {
    if (p.x % 3 === 1) put(p.x, p.T + 1, p.z, "light_gray_concrete");
    else put(p.x, p.T + 1, p.z, "light_blue_stained_glass");
  } else {
    put(p.x, p.T + 1, p.z, "light_gray_concrete"); // interior floor slab
  }
  put(p.x, p.T + 2, p.z, "smooth_stone"); // roof cap
}
if (pentCells.length) {
  const mid = pentCells.reduce((a, b) =>
    Math.hypot(a.x - cx, a.z - cz) <= Math.hypot(b.x - cx, b.z - cz) ? a : b
  );
  put(mid.x, mid.T + 3, mid.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
