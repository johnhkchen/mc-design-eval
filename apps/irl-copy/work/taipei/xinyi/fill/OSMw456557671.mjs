import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record-driven choice: a late-1990s/2000s Xinyi commercial street block, four storeys over a
// shopfront base, white/cream tiled facade with a quartz cornice, bronze-tinted glazing,
// a granite fascia band and a rooftop plant penthouse. Roof lies 21 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557671";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 113, H = 33, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const STOREYS = 4;
const STOREY_H = 5;
const WIN = "light_blue_stained_glass_pane";
const SHOP = "cyan_stained_glass_pane";

function pane(block, longFace) {
  return longFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const missingZ = !has(x, z - 1) || !has(x, z + 1);
  const missingX = !has(x - 1, z) || !has(x + 1, z);
  const corner = missingX && missingZ;
  const longFace = missingZ && !missingX ? true : (missingZ && !corner ? true : false);
  const endFace = missingX && !missingZ;
  const i = endFace ? z : x;
  const mullion = corner || i % 4 === 0;
  const frontZ = !has(x, z - 1); // street-side face at z = 0

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor lines (storey slabs) at each storey base, roof slab at top.
  for (let k = 0; k < STOREYS; k++) {
    const b = gr + k * STOREY_H;
    if (edge) {
      put(x, b, z, k === 0 ? "polished_granite" : "smooth_quartz");
    } else {
      put(x, b, z, "smooth_stone");
    }
  }
  const roofY = gr + STOREYS * STOREY_H;
  if (edge) put(x, roofY, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  else put(x, roofY, z, "gray_concrete");

  if (!edge) continue;

  // Facade storeys.
  for (let k = 0; k < STOREYS; k++) {
    const b = gr + k * STOREY_H;
    for (let r = 1; r <= 4; r++) {
      const y = b + r;
      if (r === 4) {
        put(x, y, z, k === 0 ? "polished_granite" : "smooth_quartz");
        continue;
      }
      if (corner || mullion) {
        put(x, y, z, "white_concrete");
        continue;
      }
      if (k === 0) {
        if (r === 1) {
          put(x, y, z, "polished_granite");
          continue;
        }
        if (frontZ && longFace && i === 56) {
          // Entrance door, two blocks tall, opening onto the street (north).
          const half = r === 2 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        put(x, y, z, SHOP, pane(SHOP, longFace));
        continue;
      }
      put(x, y, z, WIN, pane(WIN, longFace));
    }

    // Warm light behind some upper/ground windows, one block inside the facade.
    if (!mullion && (i + k) % 8 === 2) {
      const dz = longFace ? (frontZ ? 1 : -1) : 0;
      const dx = endFace ? (!has(x - 1, z) ? 1 : -1) : 0;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz)) put(ix, b + 2, iz, (k % 2 === 0) ? "glowstone" : "shroomlight");
    }
  }

  // Parapet and coping.
  put(x, roofY + 1, z, "smooth_quartz");
  put(x, roofY + 2, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop plant penthouse, two blocks tall, sitting on the roof slab.
for (const [x, z, gr] of cells) {
  if (x < 40 || x > 62 || z < 4 || z > 11) continue;
  const roofY = gr + STOREYS * STOREY_H;
  put(x, roofY + 1, z, "light_gray_concrete");
  put(x, roofY + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
