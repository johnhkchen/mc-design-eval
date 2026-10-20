import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1504680854";
const W = 23, H = 16, D = 19;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gr0 = Math.min(...ground.values());
// Lidar record: roof about 4 blocks above lowest ground. One storey, flat parapeted roof.
const TOP = gr0 + 4;

// Outward facing direction of a perimeter cell (null if interior)
function outward(x, z) {
  const o = [];
  if (!has(x, z - 1)) o.push({ name: "north", ox: 0, oz: -1 });
  if (!has(x, z + 1)) o.push({ name: "south", ox: 0, oz: 1 });
  if (!has(x - 1, z)) o.push({ name: "west", ox: -1, oz: 0 });
  if (!has(x + 1, z)) o.push({ name: "east", ox: 1, oz: 0 });
  return o[0] || null;
}

// Pick the main entrance: median cell of the largest facade group
const groups = {};
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const o = outward(x, z);
  if (!o) continue;
  const a = o.ox !== 0 ? z : x;
  (groups[o.name] ??= []).push({ x, z, a });
}
let doorKey = null;
{
  const names = Object.keys(groups).sort((p, q) => groups[q].length - groups[p].length);
  if (names.length) {
    const list = groups[names[0]].sort((p, q) => p.a - q.a);
    const m = list[Math.floor(list.length / 2)];
    doorKey = `${m.x},${m.z}`;
  }
}

const g = new Voxels([W, H, D]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const roofY = Math.max(TOP, gr + 1);
  const o = outward(x, z);

  // Foundation under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Ground-level floor slab
  g.set(x, gr, z, "smooth_stone");

  // Facade walls
  if (o) {
    const a = o.ox !== 0 ? z : x;
    const isDoor = key === doorKey;
    for (let y = gr + 1; y < roofY; y++) {
      if (y === gr + 1) {
        // Shopfront row
        if (isDoor) {
          g.set(x, y, z, "oak_door", { facing: o.name, half: "lower", hinge: "left", open: "false", powered: "false" });
          if (gr + 2 < roofY) {
            g.set(x, gr + 2, z, "oak_door", { facing: o.name, half: "upper", hinge: "left", open: "false", powered: "false" });
          }
        } else if (a % 4 === 0) {
          g.set(x, y, z, "polished_andesite");
        } else {
          const alongX = o.ox === 0; // north/south facade runs east-west
          g.set(x, y, z, "light_blue_stained_glass_pane", {
            east: alongX ? "true" : "false",
            west: alongX ? "true" : "false",
            north: alongX ? "false" : "true",
            south: alongX ? "false" : "true",
            waterlogged: "false",
          });
          // Warm light behind some windows (interior air cell inward)
          if (a % 8 === 2) {
            const ix = x - o.ox, iz = z - o.oz;
            if (has(ix, iz) && !outward(ix, iz)) g.set(ix, y, iz, "glowstone");
          }
        }
      } else if (y === roofY - 1) {
        // Cornice course
        g.set(x, y, z, "smooth_quartz");
      } else {
        // Sign band
        if (isDoor && y === gr + 2) continue;
        g.set(x, y, z, a % 6 === 3 ? "cyan_terracotta" : "white_concrete");
      }
    }
  }

  // Roof slab
  g.set(x, roofY, z, "stone_bricks");
  // Parapet on the perimeter
  if (o) g.set(x, roofY + 1, z, "light_gray_concrete");
  // Roof plant boxes on interior cells
  else if ((x * 3 + z * 5) % 11 === 0) g.set(x, roofY + 1, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
