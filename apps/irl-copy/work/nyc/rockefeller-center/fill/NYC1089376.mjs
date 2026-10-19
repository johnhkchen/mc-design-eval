// 20 West 53 Street (2012, mixed residential and commercial). Lidar roof per cell, smoothed into flat tiers:
// a retail base and a limestone podium (48 blocks, about 16 storeys), a glass tower stepping back in three
// setbacks to a crown at 168. Shell only: one facade layer, an air gap behind it, a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1089376.cells.json`, "utf8"));   // [x, z, ground, roof]
const MAXY = 180, STOREY = 3, PODIUM = 48;
const key = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const foot = (x, z) => lidar.has(key(x, z));

// Tower core: the cells the lidar says rise past 120. Setbacks follow their distance to the core's edge.
const core = (x, z) => foot(x, z) && lidar.get(key(x, z)) >= 120;
const dist = new Map(); const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (!core(x, z)) { dist.set(key(x, z), 0); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {                 // multi-source BFS from the non-core edge
  const [x, z] = queue[i]; const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz, k = key(nx, nz);
    if (foot(nx, nz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([nx, nz]); }
  }
}
const tierOf = (x, z) => {                               // the flat tier each footprint cell stands to
  const r = lidar.get(key(x, z));
  if (core(x, z)) {
    const d = dist.get(key(x, z));
    return d <= 1 ? 48 : d === 2 ? 96 : d <= 4 ? 120 : 168;
  }
  if (r < 8) return 6;                                   // two-storey retail pavilions
  if (r < 16) return 12;                                 // four-storey lower wings
  if (r < 40) return 24;                                 // eight-storey mid wings
  return PODIUM;                                         // the podium ring
};
const H = new Map(cells.map(([x, z]) => [key(x, z), tierOf(x, z)]));
const height = (x, z) => H.get(key(x, z)) ?? 0;          // outside the footprint nothing stands

// Entrance on the street face (downtown side) under x 19-20.
const streetZ = (x) => { for (let z = 27; z >= 0; z--) if (foot(x, z)) return z; return -1; };
const doorX = [19, 20], doorZ = doorX.map(streetZ);

const v = new Voxels([47, MAXY, 28]);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Facade for a window/wall cell at height y. `along` is the coordinate that runs along the exposed face.
function facade(x, y, z, along) {
  if (y === 0) return "polished_granite";                                       // plinth
  const tower = y >= PODIUM;
  if (y < 3) {                                                                   // retail base: clear shopfront, dark piers
    return along % 3 === 0 ? "polished_granite" : "glass_pane";
  }
  if (y % STOREY === 0) return tower ? "white_concrete" : "smooth_stone";       // storey line / spandrel
  if (along % 3 === 0) return tower ? "light_gray_concrete" : "calcite";        // mullion or pier
  return tower ? "light_blue_stained_glass_pane" : "light_blue_stained_glass_pane";
}

for (const [k, h] of H) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < h; y++) {
    const inMask = (nx, nz) => height(nx, nz) > y;
    const exposed = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inMask(x + dx, z + dz));
    if (y === h - 1) {                                                           // top: cornice at the edge, roof inside
      v.set(x, y, z, exposed.length ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (exposed.length) {
      const exposedX = exposed.some(([dx]) => dx !== 0);
      const along = exposedX ? z : x;
      let block = facade(x, y, z, along);
      if (block === "light_blue_stained_glass_pane" && hash(x, y, z) % 6 === 0) {
        // a lit room: glowstone in the air just behind the pane, if that cell is interior
        for (const [dx, dz] of exposed.length ? [[-exposed[0][0], -exposed[0][1]]] : []) {
          const ix = x + dx, iz = z + dz;
          if (inMask(ix, iz) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ez]) => !inMask(ix + ex, iz + ez))) {
            v.set(ix, y, iz, "glowstone");
          }
        }
      }
      v.set(x, y, z, block);
    } else if (y % STOREY === 0) {
      v.set(x, y, z, "smooth_stone");                                            // floor slab per storey
    }
  }
}

// Roof equipment on the podium: a few plant boxes on the podium roof, clear of the setbacks.
for (const [k, h] of H) {
  if (h !== PODIUM) continue;
  const [x, z] = k.split(",").map(Number);
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => height(x + dx, z + dz) <= PODIUM - 1 || !foot(x + dx, z + dz));
  if (!edge && x % 7 === 3 && z % 5 === 2) { v.set(x, PODIUM, z, "iron_block"); v.set(x, PODIUM + 1, z, "iron_block"); }
}

// Street-face entrance: two-wide dark oak doors, a lintel canopy above them.
for (let i = 0; i < doorX.length; i++) {
  const x = doorX[i], z = doorZ[i];
  v.set(x, 0, z, "dark_oak_door", { facing: "south", half: "lower", hinge: i ? "right" : "left", open: "false", powered: "false" });
  v.set(x, 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: i ? "right" : "left", open: "false", powered: "false" });
  v.set(x, 2, z, "glass_pane");
}
for (let x = 18; x <= 21; x++) v.set(x, 3, doorZ[0], "dark_oak_slab", { type: "top", waterlogged: "false" });

v.save(`${DIR}/NYC1089376.nbt`);
