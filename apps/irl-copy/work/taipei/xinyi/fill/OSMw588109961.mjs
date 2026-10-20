import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109961";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 33, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Common floor level: highest ground under the footprint. Foundation fills below it.
const B = Math.max(...cells.map((c) => c[2]));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Four storeys of 5 blocks from B: floor slabs at rel 0,5,10,15; roof deck at rel 20.
// Parapet at rel 21, cap at rel 22 (about 21-22 blocks above the lowest ground).
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const e = { W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1) };
  const per = e.W || e.E || e.N || e.S;

  // Foundation: solid from y 0 up to the common floor level.
  for (let y = 0; y < B; y++) put(x, y, z, "stone");

  if (!per) {
    // Interior: floor slabs and roof deck only, air between (no interiors).
    for (const r of [0, 5, 10, 15, 20]) put(x, B + r, z, "smooth_stone");
    continue;
  }

  const corner = (e.W || e.E) && (e.N || e.S);
  const along = (e.N || e.S) ? x : z;
  const isEntry = e.S && x === 10 && z === D - 1;
  const faceN = e.N || e.S;

  for (let rel = 0; rel <= 22; rel++) {
    const y = B + rel;

    if (rel === 22) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (rel === 21) { put(x, y, z, "white_concrete"); continue; }
    if (rel === 0) { put(x, y, z, "polished_andesite"); continue; }
    if (rel === 20) { put(x, y, z, "light_gray_concrete"); continue; }
    if (rel % 5 === 0 || rel % 5 === 4) { put(x, y, z, "light_gray_concrete"); continue; }

    // Window zone rel 1..3 of each storey.
    const storey = Math.floor(rel / 5);
    if (isEntry && rel === 1) {
      put(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntry && rel === 2) {
      put(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntry && rel === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    if (corner || along % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, storey === 0 ? "glass" : "light_blue_stained_glass");
    }

    // Warm light just inside some windows, on the middle row.
    if (rel === 2 && !corner && along % 3 !== 0) {
      if ((along * 5 + storey * 3 + (faceN ? 0 : 1)) % 4 === 0) {
        const ix = e.W ? x + 1 : e.E ? x - 1 : x;
        const iz = e.N ? z + 1 : e.S ? z - 1 : z;
        if (has(ix, iz) && !isPerim(ix, iz)) {
          put(ix, y, iz, storey % 2 === 0 ? "glowstone" : "shroomlight");
        }
      }
    }
  }
}

// Rooftop plant room on the roof deck, centred on the footprint.
for (let x = 6; x <= 14; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    for (let rel = 21; rel <= 23; rel++) put(x, B + rel, z, "light_gray_concrete");
    put(x, B + 24, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Lightning rod above the plant room (only if it fits the volume).
if (B + 25 < H && has(10, 8)) {
  put(10, B + 25, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
