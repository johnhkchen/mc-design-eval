import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001533";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 21, D = 6;
const g = new Voxels([W, H, D]);

// ---- footprint map -------------------------------------------------------
const map = new Map();
for (const [x, z, gr, rr] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), rr: Number(rr) });
}
const has = (x, z) => map.has(`${x},${z}`);

// Flat roof: median of lidar roof heights, lifted above the highest ground.
const rrs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medRoof = rrs[Math.floor(rrs.length / 2)];
const maxGr = Math.max(...cells.map((c) => Math.round(c[2])));
const T = Math.min(Math.max(Math.round(medRoof), maxGr + 5), H - 2);

// ---- occupancy bookkeeping so nothing is overwritten ---------------------
const occ = new Set();
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return false;
  const k = `${x},${y},${z}`;
  if (occ.has(k)) return false;
  occ.add(k);
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
  return true;
};

function outwardFace(x, z) {
  if (!has(x, z - 1)) return "N"; // street front (z=0)
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Window columns: odd index along the face, not at the corners.
const isWindowCol = (i, n) => i >= 1 && i <= n - 2 && i % 2 === 1;

const pendingGlow = [];

// ---- pass 1: foundations and interiors -----------------------------------
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!outwardFace(x, z)) {
    // interior: storey floor slabs and a roof deck, air otherwise
    for (let y = gr; y <= T - 2; y += 2) put(x, y, z, "spruce_planks");
    put(x, T - 1, z, "smooth_stone");
  }
}

// ---- pass 2: facade walls ------------------------------------------------
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const face = outwardFace(x, z);
  if (!face) continue;

  // Brownstone street front, brick sides and rear
  const wallMat = face === "N" ? "terracotta" : "bricks";
  const along = face === "N" || face === "S" ? x : z;
  const n = face === "N" || face === "S" ? W : D;
  const win = isWindowCol(along, n);

  for (let y = gr; y <= T - 3; y++) {
    const off = y - gr;

    // Street entrance: door in the centre bay, lintel above
    if (face === "N" && x === 2 && z === 0) {
      if (off <= 1) {
        put(x, y, z, "oak_door", {
          facing: "north",
          half: off === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (off === 2) { put(x, y, z, "stone_bricks"); continue; }
    }

    if (win && off % 2 === 1) {
      // glass pane in the upper row of each storey
      put(x, y, z, "glass_pane");
      if ((x * 5 + z * 3 + y) % 3 !== 1) {
        const [ix, iz] = inward[face];
        pendingGlow.push([x + ix, y, z + iz]);
      }
    } else if (win && off % 2 === 0) {
      // stone sill and lintel band framing each window
      put(x, y, z, "stone_bricks");
    } else {
      put(x, y, z, wallMat);
    }
  }

  // cornice course and parapet on the perimeter
  put(x, T - 2, z, "stone_bricks");
  put(x, T - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- pass 3: warm lights just inside the glass --------------------------
for (const [x, y, z] of pendingGlow) {
  if (has(x, z) && !outwardFace(x, z)) {
    put(x, y, z, "glowstone");
  }
}

// ---- pass 4: roof chimney stack on an interior cell ----------------------
if (has(1, 2) && !outwardFace(1, 2)) {
  put(1, T, 2, "bricks");
  put(1, T + 1, 2, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
