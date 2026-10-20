import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century concrete shophouse block (Taipei, 1970s-80s idiom):
// stone-faced base, smooth quartz piers, aluminium-framed glass bays,
// a glazed shopfront with a dark wood door on the street (north) face,
// a cornice line, and a parapet with coping and rooftop AC plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456411";
const W = 15, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Storey datum from the lowest ground under the footprint.
const S = minG;
const L1 = S + 5;        // first-floor line
const L2 = S + 10;       // cornice line
const ROOF = S + 11;     // roof slab, 11 blocks above lowest ground
const PAR = S + 12;      // parapet
const COPING = S + 13;   // coping slab

const outFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!edge(x, z)) {
    // Interior: floor slabs, roof slab, and a little roof plant.
    put(x, gr, z, "smooth_stone");
    put(x, L1, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    if (x % 4 === 1 && z % 4 === 1) put(x, PAR, z, "iron_block");
    continue;
  }

  const out = outFaces(x, z);
  const f = ["N", "S", "W", "E"].find((k) => out.includes(k));
  const a = f === "N" || f === "S" ? x : z; // along-facade coordinate

  for (let y = gr; y <= COPING; y++) {
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }                 // base course
    if (y === L1 || y === L2) { put(x, y, z, "light_gray_concrete"); continue; } // storey lines / cornice
    if (y === ROOF || y === PAR) { put(x, y, z, "smooth_quartz"); continue; }   // roof edge, parapet
    if (y === COPING) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }

    if (y > gr && y < L1) {
      // Ground floor: shopfront with door on the north (street) face.
      if (f === "N" && x === 7 && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (f === "N" && y === gr + 3 && x >= 5 && x <= 9) { put(x, y, z, "light_gray_concrete"); continue; } // canopy band
      if (a % 3 === 0) put(x, y, z, "smooth_quartz");                          // piers
      else put(x, y, z, "light_blue_stained_glass");                           // shopfront glazing
      continue;
    }

    if (y > L1 && y < L2) {
      // Upper storey: framed glass bays between quartz piers.
      if (y === L1 + 1 || y === L1 + 4) {
        put(x, y, z, a % 3 === 0 ? "smooth_quartz" : "light_gray_concrete");   // sill / head
        continue;
      }
      if (a % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "glass");
      // Warm light behind some bays, in the interior air gap.
      if (y === L1 + 2 && a % 6 === 1) {
        const [dx, dz] = inward[f];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !edge(ix, iz)) put(ix, y, iz, "glowstone");
      }
      continue;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
