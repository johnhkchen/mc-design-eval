import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two shop/office storeys over a plinth,
// white precast-concrete piers, tinted glazing, red signboard band on the street face,
// stone cornice, flat roof with rooftop plant. Roof sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw455139050";
const W = 52, H = 23, D = 27;

const rows = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const r of rows) {
  const x = Math.round(r[0]), z = Math.round(r[1]), gr = Math.round(r[2]);
  ground.set(`${x},${z}`, gr);
}

const g = new Voxels([W, H, D]);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Which exterior face a footprint cell sits on (null = interior cell).
// Street frontage is the z-minimum side.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "front";
  if (!has(x, z + 1)) return "back";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Position along the facade, and inward offset from that face.
function along(f, x, z) {
  return f === "front" || f === "back" ? x : z;
}
function inward(f) {
  if (f === "front") return [0, 1];
  if (f === "back") return [0, -1];
  if (f === "west") return [1, 0];
  return [-1, 0];
}

// Pick the entrance: a front-face cell with along % 4 == 2, nearest the facade middle.
const frontAs = [];
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (faceOf(x, z) === "front") frontAs.push(x);
}
let doorA = -1;
if (frontAs.length) {
  const mid = frontAs.reduce((s, v) => s + v, 0) / frontAs.length;
  const cands = frontAs.filter((a) => a % 4 === 2);
  const pool = cands.length ? cands : frontAs;
  doorA = pool.reduce((best, a) => (Math.abs(a - mid) < Math.abs(best - mid) ? a : best), pool[0]);
}

const DOOR_PROPS = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faceOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (f) {
    // Exterior wall column, full storey-by-storey articulation.
    const a = along(f, x, z);
    const [dx, dz] = inward(f);
    for (let rel = 0; rel <= 11; rel++) {
      const y = gr + rel;
      let block = null;
      let props = null;

      if (rel === 0) {
        block = "polished_andesite";                      // plinth course
      } else if (rel <= 4) {                              // ground storey: shopfront
        if (rel === 4) {
          block = f === "front"
            ? (a % 2 === 0 ? "red_concrete" : "white_concrete")   // signboard band
            : "white_concrete";                                    // head course
        } else if (f === "front" && a === doorA && (rel === 1 || rel === 2)) {
          block = "dark_oak_door";
          props = DOOR_PROPS(rel === 1 ? "lower" : "upper");
        } else if (a % 4 === 0) {
          block = "white_concrete";                                 // pier
        } else {
          block = "light_blue_stained_glass";                       // shopfront glazing
        }
      } else if (rel === 5) {
        block = "smooth_stone";                                     // storey line
      } else if (rel <= 9) {                              // upper storey: window grid
        if (a % 4 === 0 || rel === 6 || rel === 9) block = "white_concrete";
        else block = "light_blue_stained_glass";
      } else if (rel === 10) {
        block = "stone_bricks";                                     // cornice
      } else {
        block = "white_concrete";                                   // parapet
      }

      put(x, y, z, block, props);

      // Warm light behind some windows (interior cell just inside the glass).
      const isWindow = block === "light_blue_stained_glass";
      if (isWindow && (a + rel) % 3 === 0) {
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && faceOf(ix, iz) === null && rel !== 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  } else {
    // Interior cell: floor slabs per storey and flat roof; air between.
    put(x, gr, z, "smooth_stone");           // ground floor slab
    put(x, gr + 5, z, "smooth_stone");       // first floor slab
    put(x, gr + 11, z, "light_gray_concrete"); // roof deck

    // Rooftop plant on a sparse grid.
    if (x % 8 === 3 && z % 6 === 2) {
      put(x, gr + 12, z, "smooth_stone");
      put(x, gr + 13, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
