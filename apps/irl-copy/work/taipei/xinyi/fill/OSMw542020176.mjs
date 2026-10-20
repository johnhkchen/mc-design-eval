import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020176";
const W = 21, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gs = [...ground.values()];
const minG = Math.min(...gs);
const maxG = Math.max(...gs);

// Flat roof 11 blocks above lowest ground; downhill cells gain storeys.
let T = Math.max(minG + 10, maxG + 3);
T = Math.min(T, 21);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// N, S, W, E outward normals
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

// Entrance: middle of the south-facing exposed run
const southU = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1)) southU.push(x);
}
southU.sort((a, b) => a - b);
const doorU = southU.length ? southU[Math.floor(southU.length / 2)] : -99;

for (const [key, b] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

  // Foundation up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: anchored to the roof, every 5 blocks down to this cell's ground
  const slabs = new Set([b]);
  for (let y = T; y >= b; y -= 5) slabs.add(y);
  const sl = [...slabs].sort((a, c) => a - c);

  for (let y = b; y <= T; y++) {
    if (slabs.has(y)) {
      const cornice = y === T && faces.length > 0;
      put(x, y, z, cornice ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (faces.length === 0) continue; // interior air

    const s = sl.filter((v) => v < y).pop();
    const nxt = sl.find((v) => v > y);
    const h = nxt - s;
    const rel = y - s;
    const isG = s === b;

    if (faces.length >= 2) { // corner column
      put(x, y, z, "white_concrete");
      continue;
    }

    const [dx, dz, dn] = faces[0];
    const u = dz !== 0 ? x : z;
    const isDoorFace = dn === "S" && isG && Math.abs(u - doorU) <= 1;

    if (rel === 1) {
      put(x, y, z, isG ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (u % 3 === 0 && !isDoorFace) {
      put(x, y, z, "white_concrete"); // bay pilaster
      continue;
    }
    if (rel === h - 1) {
      put(x, y, z, "white_concrete"); // lintel / spandrel band
      continue;
    }
    if (isDoorFace) {
      put(x, y, z, "glass");
      continue;
    }

    // Window glass in a frame
    const props = dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", props);

    // Warm light behind some windows (air gap inside)
    if (rel === 2 && (u + s) % 4 === 1) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Parapet on the perimeter, one course above the roof slab
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const perim = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
  if (perim) put(x, T + 1, z, "white_concrete");
}

// Roof plant: a couple of cooling units and a small tank on the interior
for (let x = 4; x <= 7; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!has(x, z)) continue;
    put(x, T + 1, z, "light_gray_concrete");
  }
}
for (let x = 5; x <= 6; x++) {
  if (has(x, 5)) put(x, T + 2, 5, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
