// 126 West 53rd Street, a Midtown Transportation & Utility building, read as a 1930s brick-and-stone block: a polished-granite
// base course with a glazed entrance on the 53rd Street front (the z 0 face), brick walls on a 3-block storey grid (a
// polished-andesite string course at each storey line, andesite piers every third bay, steel-sash glass between), a stone
// parapet, and a stepped plan from the lidar roof: an 8-storey body, a 9-storey core where the roof reads higher, a 3-storey
// west wing and a 1 to 2 storey south podium. Lidar holes (roof under 3 among tall neighbours) take their neighbours' median
// first; each cell's tier is the median of the 7 x 7 around it, rounded to the storey line. The shell is one cell thick with
// air behind every pane, a floor slab per storey, a flat roof cap, and a few glowstone lamps behind windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023162.cells.json`, "utf8"));
const X = 28, Z = 33, H = 39;
const DOOR_X = 13;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north (53rd Street), south, west, east
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // a pane on a north or south face joins east and west
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const key = (x, z) => `${x},${z}`;
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
const G0 = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => G0.has(key(x, z));
const G = (x, z) => G0.get(key(x, z)).g;

// 1. Roof: lidar holes first, then a 5 x 5 median rounded to the storey line.
const roof = (x, z, R, src) => { const out = []; for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const v = src.get(key(x + dx, z + dz)); if (v !== undefined) out.push(v); } return out; };
const raw = new Map([...G0].map(([k, c]) => [k, c.r]));
const filled = new Map();
for (const [k, r] of raw) {
  const [x, z] = k.split(",").map(Number);
  const tall = roof(x, z, 1, raw).filter((v) => v >= 8);
  filled.set(k, r < 3 && tall.length >= 3 ? median(tall) : r);
}
const tier = new Map();
for (const [k, c] of G0) {
  const [x, z] = k.split(",").map(Number);
  const near = roof(x, z, 3, filled).filter((v) => v > 0);
  const m = near.length ? median(near) : 0;
  tier.set(k, Math.max(3 * Math.ceil((c.g + 3) / 3), 3 * Math.round(m / 3)));
}
const T = (x, z) => tier.get(key(x, z));
const solid = (x, z, y) => inside(x, z) && y >= 0 && y < T(x, z);
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));
const isWall = (x, z, y) => solid(x, z, y) && exposed(x, z, y).length > 0;

// The facade block of a shell cell. The run of bays follows x on a north or south face, z on an east or west face.
const facade = (x, z, y, ex) => {
  const t = T(x, z);
  const onNS = ex.some(([, dz]) => dz !== 0);
  const onNorth = ex.some(([, dz]) => dz === -1);
  const idx = onNS ? x : z;
  const pane = () => ["glass_pane", onNS ? PANE_NS : PANE_EW];
  if (y >= 3 && y === t - 1) return ["stone_bricks"];                  // parapet
  if (y < 3) {
    if (onNorth && y >= 1) {
      if (x === DOOR_X) return ["dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
      if (idx % 3 === 0) return ["polished_andesite"];
      return pane();                                                   // shopfront glass
    }
    return ["polished_granite"];                                       // base course
  }
  if (y % 3 === 0 || idx % 3 === 0) return ["polished_andesite"];      // string course and piers
  return pane();
};

const g = new Voxels([X, H, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const windows = [];

// 2. Shell: walls take the facade, the interior is air except a floor slab at each storey line and the roof cap.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) {
      const [block, state] = facade(x, z, y, ex);
      set(x, y, z, block, state);
      if (block === "glass_pane") windows.push([x, y, z]);
    } else if (y % 3 === 0 || y === t - 1) {
      set(x, y, z, y === t - 1 ? "stone" : "smooth_stone");
    }
  }
}

// 3. Warm lamps: glowstone on the interior side of some windows (the air behind the glass).
for (const [x, y, z] of windows) {
  if (y < 4 || y % 3 === 0 || (x * 5 + z * 3 + y) % 23 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (solid(nx, nz, y) && !isWall(nx, nz, y)) { set(nx, y, nz, "glowstone"); break; }
  }
}

// 4. Roof plant: 2 x 2 x 2 mechanical boxes on the 24-block body, where the four cells share a tier.
for (const [x, z] of [[6, 4], [16, 4], [22, 14], [6, 18], [17, 19]]) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([cx, cz]) => inside(cx, cz) && T(cx, cz) === 24)) continue;
  for (const [cx, cz] of cs) for (const y of [24, 25]) set(cx, y, cz, "light_gray_concrete");
}

const counts = {};
for (const t of tier.values()) counts[t] = (counts[t] || 0) + 1;
const stats = g.save(`${DIR}/NYC1023162.nbt`);
console.log(JSON.stringify({ tiers: counts, ...stats }));
