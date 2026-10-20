import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001476";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 24, D = 12;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(key(x, z));

const grounds = [...map.values()].map((c) => c.gr);
const g0 = Math.min(...grounds);            // global storey datum

// Per-cell top from lidar, quantised to 2-block storeys so setbacks step cleanly
for (const [k, c] of map) {
  const raw = c.rf - 1;
  let t = g0 + 2 * Math.round((raw - g0) / 2);
  t = Math.min(H - 4, Math.max(c.gr + 4, t));
  c.top = t;
}
const maxTop = Math.max(...[...map.values()].map((c) => c.top));

// Front door: north-facing cell nearest the facade middle
const doorCandidates = cells.filter(([x, z]) => !has(x, z - 1));
let doorX = Math.floor(W / 2), doorZ = 0;
if (doorCandidates.length) {
  const best = doorCandidates.reduce((a, b) =>
    Math.abs(b[0] - W / 2) < Math.abs(a[0] - W / 2) ? b : a
  );
  doorX = best[0];
  doorZ = best[1];
}

function facadeBlock(x, z, y, top) {
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const alongX = N || S;
  const u = alongX ? x : z;
  const paneP = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  const rel = y - g0;
  if (rel < 0) return ["bricks"];
  if (y === top) return ["stone_bricks"];

  const k = Math.floor(rel / 2);
  const r = rel % 2;

  // Entrance: dark oak door on the front with a flush canopy above
  const isDoorCell = N && x === doorX && z === doorZ;
  if (isDoorCell && k === 0) {
    return r === 0
      ? ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]
      : ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (N && z === doorZ && k === 1 && r === 0 && Math.abs(x - doorX) <= 1) {
    return ["stone_brick_slab", { type: "top", waterlogged: "false" }];
  }

  // Spandrel / lintel band
  if (r === 0) return ["stone_bricks"];

  if (k === 0) {
    // Ground-floor shopfronts: glass bays, brick piers
    if (u % 3 !== 0) return ["glass_pane", paneP];
    return ["bricks"];
  }
  if (u % 3 === 1) {
    if ((u + k) % 4 === 0 && k % 2 === 1) return ["glowstone"];
    return ["glass_pane", paneP];
  }
  return ["bricks"];
}

for (const [x, z] of cells) {
  const c = map.get(key(x, z));
  const gnd = c.gr;
  const top = c.top;
  const facade = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  // Foundation up to ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let y = gnd; y <= top; y++) {
    if (!facade) {
      // Interior: floor slab per storey, air gap behind the glass
      const rel = y - g0;
      if (y === top || y === gnd || rel < 0 || rel % 2 === 0) {
        put(x, y, z, "smooth_stone");
      } else {
        put(x, y, z, "air");
      }
    } else {
      const [id, p] = facadeBlock(x, z, y, top);
      put(x, y, z, id, p);
    }
  }

  // Continuous stone parapet on facade cells
  if (facade) put(x, top + 1, z, "stone_bricks");
}

// Rooftop penthouse on the tallest interior cells, grounded on the roof
for (const [x, z] of cells) {
  const c = map.get(key(x, z));
  if (c.top !== maxTop) continue;
  if (x < 8 || x > 13 || z < 3 || z > 8) continue;
  const facade = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (facade) continue;
  put(x, c.top + 1, z, "light_gray_concrete");
  put(x, c.top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
