import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000080";
const W = 53, H = 22, D = 48;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const key = (x, z) => `${x},${z}`;

// Raw lookup
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { x, z, gr, roof });

// Smooth lidar roof heights over a 5x5 neighbourhood so the massing reads as
// flat tiers rather than noise, then quantise to 3-block storeys.
const info = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const o = raw.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.roof; n++; }
  }
  const roofAvg = sum / n;
  const ground = clamp(Math.round(c.gr), 0, H - 4);
  let k = clamp(Math.round((roofAvg - ground) / 3), 1, 3);
  k = Math.min(k, Math.floor((H - 2 - ground) / 3));
  k = Math.max(1, k);
  info.set(key(c.x, c.z), { x: c.x, z: c.z, ground, topY: ground + 3 * k });
}

// Exterior face of an edge cell (N = -z, S = +z, W = -x, E = +x)
function faceOf(x, z) {
  if (!info.has(key(x, z - 1))) return "N";
  if (!info.has(key(x, z + 1))) return "S";
  if (!info.has(key(x - 1, z))) return "W";
  if (!info.has(key(x + 1, z))) return "E";
  return null;
}

// Front entrance: north-facing edge cell nearest the middle of the north side
let zmin = Infinity, xmin = Infinity, xmax = -Infinity;
for (const c of info.values()) {
  zmin = Math.min(zmin, c.z);
  xmin = Math.min(xmin, c.x);
  xmax = Math.max(xmax, c.x);
}
const xmid = (xmin + xmax) / 2;
let doorCell = null, bestD = Infinity;
for (const c of info.values()) {
  if (c.z === zmin && Math.abs(c.x - xmid) < bestD) {
    bestD = Math.abs(c.x - xmid);
    doorCell = c;
  }
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of info.values()) {
  const { x, z, ground, topY } = c;
  const face = faceOf(x, z);

  // Foundation under the cell up to its ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= topY; y++) {
    const rel = y - ground;

    // Floor slabs, storey bands and the roof layer
    if (rel % 3 === 0) {
      if (face && rel === 0) g.set(x, y, z, "stone_bricks");   // plinth
      else if (face) g.set(x, y, z, "stone_bricks");           // exterior string course
      else g.set(x, y, z, "smooth_stone");                     // floor / roof
      continue;
    }

    if (!face) continue; // interior air gap

    const alongX = face === "N" || face === "S";
    const u = alongX ? x : z;
    const pos = u % 4;

    // Brick piers, two blocks wide, with a stone capital at the top of each storey
    if (pos === 0 || pos === 3) {
      g.set(x, y, z, rel % 3 === 2 ? "stone_bricks" : "bricks");
      continue;
    }

    // Entrance: door on the north face with a stone surround in the ground storey
    const isDoorCol = doorCell && x === doorCell.x && z === doorCell.z;
    const isDoorFrame = doorCell && face === "N" && z === doorCell.z &&
      Math.abs(x - doorCell.x) <= 1 && (rel === 1 || rel === 2);
    if (isDoorCol && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorFrame) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Window sill (bottom row of each window band) in stone
    if (rel % 3 === 1) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Glazing in the bays, with a warm light behind some panes
    g.set(x, y, z, "glass_pane", alongX ? PANE_NS : PANE_EW);

    if ((x + z + rel) % 7 === 0) {
      const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];
      const ix = x + inward[0], iz = z + inward[1];
      if (info.has(key(ix, iz)) && !faceOf(ix, iz)) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Parapet on the exterior edge, one block above the roof layer
  if (face && topY + 1 < H) g.set(x, topY + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Rooftop flues on interior roof cells
  if (!face && topY + 2 < H && x % 11 === 5 && z % 13 === 6) {
    g.set(x, topY + 1, z, "bricks");
    g.set(x, topY + 2, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
