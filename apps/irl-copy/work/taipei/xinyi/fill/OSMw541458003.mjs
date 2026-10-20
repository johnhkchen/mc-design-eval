import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-era commercial block (c. 1980s-90s Taipei): two storeys of
// cream tile and glass on a stone plinth, an arcade-style shopfront on the south
// street face, a parapet with a cornice, and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458003";
const W = 17, H = 23, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const out = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) out.set(x, y, z, id, props);
  else out.set(x, y, z, id);
}

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward face of an edge cell, priority S (street) > N > E > W.
function faceOf(x, z) {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x + 1, z)) return "E";
  if (!has(x - 1, z)) return "W";
  return null;
}

const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] };

// Footprint centre for the roof tank.
let sx = 0, sz = 0;
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) { sx += x; sz += z; }
sx /= G.size; sz /= G.size;
const cx = Math.round(sx), cz = Math.round(sz);
const doorX = Math.floor(W / 2);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at storey lines and the roof deck; no air gap under any tier.
  const edge = isEdge(x, z);
  put(x, gr + 1, z, "smooth_stone");
  put(x, gr + 6, z, "smooth_stone");
  put(x, gr + 11, z, edge ? "white_concrete" : "gray_concrete");

  if (!edge) {
    // Rooftop water tank on the interior, 2x2 near the centre.
    if ((x === cx || x === cx - 1) && (z === cz || z === cz - 1)) {
      for (let r = 12; r <= 14; r++) put(x, gr + r, z, "stone_bricks");
      put(x, gr + 15, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
    continue;
  }

  const f = faceOf(x, z);
  const u = (f === "N" || f === "S") ? x : z;
  const pier = u % 3 === 0;
  const shop = f === "S";

  // Parapet ring and corner lanterns.
  put(x, gr + 12, z, "smooth_quartz");
  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  if (corner) put(x, gr + 13, z, "lantern", { hanging: "false" });

  // Storey 1 (rel 2..5) and storey 2 (rel 7..10) walls.
  const rows = [2, 3, 4, 5, 7, 8, 9, 10];
  for (const rel of rows) {
    let id = null, props = undefined;
    if (rel === 2) {
      id = shop ? "polished_andesite" : "stone_bricks";
    } else if (rel === 5) {
      id = shop ? "red_terracotta" : (pier ? "smooth_quartz" : "light_gray_concrete");
    } else if (rel === 7) {
      id = pier ? "smooth_quartz" : "light_gray_concrete";
    } else if (rel === 10) {
      id = "smooth_quartz";
    } else {
      // Glazing rows 3-4 and 8-9.
      if (shop) {
        id = pier ? "polished_andesite" : "light_blue_stained_glass";
      } else {
        id = pier ? "smooth_quartz" : "light_blue_stained_glass";
      }
    }
    // Entrance door on the street face.
    if (shop && x === doorX && (rel === 2 || rel === 3)) {
      put(x, gr + rel, z, "dark_oak_door", {
        facing: "south",
        half: rel === 2 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    put(x, gr + rel, z, id, props);
  }

  // Warm light behind some glazed bays: glowstone in the interior cell.
  const [dx, dz] = inward[f];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && !isEdge(ix, iz)) {
    const glassRow = (rel) => !pier && !(shop && x === doorX);
    if (glassRow(8) && u % 6 === 1) put(ix, gr + 8, iz, "glowstone");
    if (!shop && glassRow(3) && u % 6 === 4) put(ix, gr + 3, iz, "glowstone");
  }
}

out.save(`${DIR}/${ID}.nbt`);
