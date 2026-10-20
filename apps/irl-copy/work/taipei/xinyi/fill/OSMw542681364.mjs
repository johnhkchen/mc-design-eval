import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, footprint 20 x 19, roof ~11 blocks above lowest ground (lidar).
// Read as a two-storey Xinyi-era commercial block: stone plinth, shopfront ground
// floor with a dark-oak entrance, white concrete frame with blue-glass windows on
// the upper storey, smooth-stone storey lines and cornice, a parapet, and a
// rooftop plant box with a few warm lights.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681364";
const W = 20, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), gr);
}
const inFP = (x, z) => ground.has(key(x, z));

// Lowest ground under the footprint anchors every storey line.
const L = Math.min(...ground.values());
const ROOF_R = 10;       // roof deck (top of the 11-block body)
const PARAPET_R = 11;    // parapet course on the edges

const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward normals of a footprint cell (faces with no neighbour in the footprint).
function normals(x, z) {
  const o = [];
  if (!inFP(x, z - 1)) o.push([0, -1]);
  if (!inFP(x, z + 1)) o.push([0, 1]);
  if (!inFP(x + 1, z)) o.push([1, 0]);
  if (!inFP(x - 1, z)) o.push([-1, 0]);
  return o;
}

// Pick the entrance: a north-facing edge cell nearest the footprint centre.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

let doorKey = null, doorN = null, best = Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const n of normals(x, z)) {
    if (n[0] === 0 && n[1] === -1) {
      const s = Math.abs(x - cx);
      if (s < best) { best = s; doorKey = k; doorN = n; }
    }
  }
}
if (!doorKey) {
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const n = normals(x, z);
    if (n.length) { doorKey = k; doorN = n[0]; break; }
  }
}

// Facade blocks for the upper body (r = y - L).
function facadeBlock(r, pillar, door) {
  if (r === 0) return ["stone_bricks"];
  if (r >= 1 && r <= 3) {
    if (door && r <= 2) return null; // handled separately
    if (pillar) return ["white_concrete"];
    return ["glass"];
  }
  if (r === 4 || r === 5) return ["smooth_stone"];
  if (r === 6 || r === 9) return ["white_concrete"];
  if (r === 7 || r === 8) return pillar ? ["white_concrete"] : ["light_blue_stained_glass"];
  if (r === ROOF_R) return ["smooth_stone"];
  if (r === PARAPET_R) return ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }];
  return null;
}

// Interior (non-facade) slabs: ground floor, storey line, roof deck.
function interiorBlock(r) {
  if (r === 0) return ["gray_concrete"];
  if (r === 5) return ["white_concrete"];
  if (r === ROOF_R) return ["gray_concrete"];
  return null;
}

const warmLights = [];

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const n = normals(x, z);
  const facade = n.length > 0;
  const nrm = facade ? n[0] : null;
  const isDoor = k === doorKey;
  const t = nrm && nrm[1] !== 0 ? x : z;     // position along the face
  const pillar = facade && t % 3 === 0;

  for (let y = gr; y <= L + PARAPET_R; y++) {
    const r = y - L;

    // Solid base course at the bottom of the body (also covers sloped cells).
    if (y === gr) {
      if (facade) put(x, y, z, "stone_bricks");
      else put(x, y, z, "gray_concrete");
      continue;
    }

    if (facade) {
      // Entrance: dark oak door, lower at r1, upper at r2.
      if (isDoor && (r === 1 || r === 2)) {
        const props = {
          facing: FACING[`${nrm[0]},${nrm[1]}`],
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
        put(x, y, z, "dark_oak_door", props);
        continue;
      }
      const b = facadeBlock(r, pillar, isDoor);
      if (!b) continue;
      if (b[0] === "smooth_stone_slab") put(x, y, z, b[0], b[1]);
      else put(x, y, z, b[0]);

      // Warm light behind some upper-storey windows, inside the footprint.
      if (r === 7 && !pillar && t % 6 === 1) {
        const ix = x - nrm[0], iz = z - nrm[1];
        if (inFP(ix, iz) && normals(ix, iz).length === 0) warmLights.push([ix, y, iz]);
      }
    } else {
      const b = interiorBlock(r);
      if (b) put(x, y, z, b[0]);
    }
  }
}

// Warm glowstone behind windows.
for (const [x, y, z] of warmLights) put(x, y, z, "glowstone");

// Rooftop plant box on the roof deck, kept off the parapet.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (normals(x, z).length) continue;
  const dx = Math.abs(x - cx), dz = Math.abs(z - cz);
  if (dx <= 3 && dz <= 2) {
    put(x, L + 11, z, "light_gray_concrete");
    put(x, L + 12, z, "light_gray_concrete");
    if (dx === 3 && dz === 2) put(x, L + 13, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
