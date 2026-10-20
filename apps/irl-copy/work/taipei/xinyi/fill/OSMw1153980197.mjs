import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office block, c. 1995-2005: white-tiled piers, tinted glass
// curtain bays, quartz bands, a stone podium with a set-back tower and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980197";
const W = 21, D = 23, H = 43;
const ROOF_ABOVE_LOWEST = 31;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmap = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  gmap.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const k = (x, z) => `${x},${z}`;
const foot = new Set(gmap.keys());
const cellsXY = [...gmap.keys()].map((s) => s.split(",").map(Number));

const lowest = Math.min(...gmap.values());
const floorBase = Math.max(...gmap.values());          // common ground-floor datum
const bx0 = Math.min(...cellsXY.map((c) => c[0])), bx1 = Math.max(...cellsXY.map((c) => c[0]));
const bz0 = Math.min(...cellsXY.map((c) => c[1])), bz1 = Math.max(...cellsXY.map((c) => c[1]));

// Storeys of ~5 blocks so the roof lands near lowest + 31, clamped to the grid height.
let N = Math.round((lowest + ROOF_ABOVE_LOWEST - floorBase) / 5);
N = Math.max(4, Math.min(N, Math.floor((H - 4 - floorBase) / 5)));
const P = 2;                                            // podium storeys
const top = floorBase + 5 * N;

// Tower footprint: inset 2 blocks from the bounding box, clipped to the real footprint.
const tower = new Set();
for (const s of foot) {
  const [x, z] = s.split(",").map(Number);
  if (x >= bx0 + 2 && x <= bx1 - 2 && z >= bz0 + 2 && z <= bz1 - 2) tower.add(s);
}
const podium = foot;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const bbox = (set) => {
  const xs = [], zs = [];
  for (const s of set) { const [x, z] = s.split(",").map(Number); xs.push(x); zs.push(z); }
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
};

// Perimeter test and pier/glass pattern for a tier.
function facade(set, x, z) {
  const zFace = !set.has(k(x, z - 1)) || !set.has(k(x, z + 1));
  const xFace = !set.has(k(x - 1, z)) || !set.has(k(x + 1, z));
  return { zFace, xFace, perim: zFace || xFace };
}
function isPier(set, bb, x, z) {
  const { zFace, xFace } = facade(set, x, z);
  if (zFace && xFace) return true;
  if (zFace) return ((x - bb.x0) % 3 === 0) || x === bb.x1;
  if (xFace) return ((z - bb.z0) % 3 === 0) || z === bb.z1;
  return false;
}

// Entrance on the front (min-z) face, centred on its cells.
const frontXs = cellsXY.filter((c) => c[1] === bz0).map((c) => c[0]).sort((a, b) => a - b);
const exX = frontXs[Math.floor(frontXs.length / 2)];
const b0 = floorBase;

// 1. Foundation / plinth: solid from y 0 up to the common ground-floor datum under every cell.
for (const s of foot) {
  const [x, z] = s.split(",").map(Number);
  for (let y = 0; y < floorBase; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys.
const podBB = bbox(podium), towBB = tower.size ? bbox(tower) : podBB;
for (let s = 0; s < N; s++) {
  const isPod = s < P;
  const set = isPod ? podium : tower;
  const bb = isPod ? podBB : towBB;
  const b = floorBase + 5 * s;
  for (const key of set) {
    const [x, z] = key.split(",").map(Number);
    const { perim } = facade(set, x, z);
    // floor line / base course
    if (perim) put(x, b, z, s === 0 ? "polished_andesite" : "smooth_quartz");
    else put(x, b, z, "light_gray_concrete");
    if (!perim) continue;
    const pier = isPier(set, bb, x, z);
    for (let dy = 1; dy <= 3; dy++) {
      if (pier) put(x, b + dy, z, "white_concrete");
      else if (dy === 2 && ((x * 5 + z * 3 + s * 7) % 13 === 0)) put(x, b + dy, z, "shroomlight");
      else put(x, b + dy, z, "light_blue_stained_glass");
    }
    // spandrel band under the next floor line
    put(x, b + 4, z, "smooth_quartz");
  }
}

// 3. Podium roof terrace and parapet (podium cells outside the tower).
const pTop = floorBase + 5 * P;
for (const key of podium) {
  const [x, z] = key.split(",").map(Number);
  if (tower.has(key)) continue;
  put(x, pTop, z, "smooth_stone");
  if (facade(podium, x, z).perim) put(x, pTop + 1, z, "white_concrete");
}

// 4. Tower roof: cornice, parapet, rooftop plant room.
for (const key of tower) {
  const [x, z] = key.split(",").map(Number);
  const { perim } = facade(tower, x, z);
  if (perim) {
    put(x, top, z, "smooth_quartz");
    put(x, top + 1, z, "white_concrete");
  } else {
    put(x, top, z, "light_gray_concrete");
  }
}
const tcx = Math.round((towBB.x0 + towBB.x1) / 2), tcz = Math.round((towBB.z0 + towBB.z1) / 2);
for (const key of tower) {
  const [x, z] = key.split(",").map(Number);
  if (Math.abs(x - tcx) <= 2 && Math.abs(z - tcz) <= 2) {
    const edge = Math.abs(x - tcx) === 2 || Math.abs(z - tcz) === 2;
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, edge ? "light_gray_concrete" : "iron_bars");
    put(x, top + 3, z, "smooth_quartz");
  }
}

// 5. Ground-floor entrance: double-height glass portal with door, lanterns and a lintel canopy.
const fz = bz0;
put(exX, b0 + 1, fz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(exX, b0 + 2, fz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(exX, b0 + 3, fz, "light_blue_stained_glass");
put(exX, b0 + 4, fz, "polished_andesite_slab", { type: "top", waterlogged: "false" });
for (const dx of [-1, 1]) {
  if (foot.has(k(exX + dx, fz))) {
    put(exX + dx, b0 + 3, fz, "lantern", { hanging: "true", waterlogged: "false" });
    put(exX + dx, b0 + 4, fz, "polished_andesite_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
