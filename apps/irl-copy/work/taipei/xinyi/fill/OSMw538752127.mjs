import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial block, Xinyi-style: two storeys of white-tiled concrete
// piers and glazing, a shopfront ground floor, grey storey bands, a parapet
// and a small roof plant box. Roof sits 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752127";
const W = 17, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const OUT = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => OUT.filter(([dx, dz]) => !has(x + dx, z + dz));
const isRing = (x, z) => has(x, z) && exposed(x, z).length > 0;

const plan = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  plan.set(key(x, y, z), { id, props });
}

// 1. Foundations, base course, floor slabs, storey bands and roof deck
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");
  const ring = isRing(x, z);
  put(x, gy, z, ring ? "stone_bricks" : "smooth_stone");
  if (ring) {
    put(x, gy + 5, z, "light_gray_concrete");
    put(x, gy + 10, z, "light_gray_concrete");
  } else {
    put(x, gy + 5, z, "smooth_stone");
    put(x, gy + 10, z, "light_gray_concrete");
  }
}

// 2. Walls: white piers and glass panes in both storeys
const pier = (x, z) => (x + z) % 3 === 0 || exposed(x, z).length >= 2;
for (const [x, z, gy] of cells) {
  if (!isRing(x, z)) continue;
  for (const base of [gy + 1, gy + 6]) {
    for (let y = base; y < base + 4; y++) {
      if (pier(x, z)) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane");
    }
  }
  // parapet cap on the roof edge
  put(x, gy + 11, z, "white_concrete");
}

// 3. Entrance: middle ring cell on the north (min z) face
const north = cells
  .filter(([x, z]) => isRing(x, z) && !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (north.length) {
  const [dx, dz, dgy] = north[Math.floor(north.length / 2)];
  put(dx, dgy + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dgy + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dgy + 3, dz, "white_concrete");
  put(dx, dgy + 4, dz, "glass_pane");
}

// 4. Warm light behind some glazing (interior air cells just inside the facade)
for (const [x, z, gy] of cells) {
  if (!isRing(x, z)) continue;
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [odx, odz] = ex[0];
  const ix = x - odx, iz = z - odz;
  if (!has(ix, iz) || isRing(ix, iz)) continue;
  if (!pier(x, z)) {
    if ((x * 5 + z * 7) % 9 === 0) put(ix, gy + 7, iz, "shroomlight");
    else if ((x * 3 + z * 2) % 11 === 0) put(ix, gy + 2, iz, "glowstone");
  }
}

// 5. Roof plant box near the centre of the roof
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (const [x, z, gy] of cells) {
  if (isRing(x, z)) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2 && gy + 11 < H) {
    put(x, gy + 11, z, "gray_concrete");
  }
}

// 6. Emit with pane connection states derived from neighbouring walls
const WALLISH = (id) => id === "glass_pane" || id.includes("concrete") ||
  id.includes("stone") || id === "shroomlight";
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const g = new Voxels([W, H, D]);
for (const [k, { id, props }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (id === "glass_pane") {
    const p = { waterlogged: "false" };
    for (const [name, [dx, dz]] of Object.entries(DIRS)) {
      const n = plan.get(key(x + dx, y, z + dz));
      p[name] = n && WALLISH(n.id) ? "true" : "false";
    }
    g.set(x, y, z, id, p);
  } else if (props) {
    g.set(x, y, z, id, props);
  } else {
    g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
