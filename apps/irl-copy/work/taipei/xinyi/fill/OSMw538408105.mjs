import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408105";
const W = 20, H = 23, D = 17;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const grounds = [...G.values()];
const L = Math.min(...grounds);   // lowest ground
const F = Math.max(...grounds);   // highest ground: ground-floor datum
const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

// Two storeys of ~5 blocks; roof deck about 11 above lowest ground
const NS = 2;
const SH = Math.max(3, Math.floor((Math.max(L + 11, F + 7) - F - 1) / NS));
const BASE = F + 1;            // ground-floor slab level
const ROOF = BASE + NS * SH;   // roof deck level

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));

const g = new Voxels([W, H, D]);
const inB = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z) || !has(x, z)) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Wall block for a non-corner boundary cell on a given face at height y
function faceBlock(face, x, z, y) {
  const s = Math.floor((y - BASE) / SH);
  const j = (y - BASE) % SH;
  const horiz = face === "N" || face === "S";
  const along = horiz ? x - minX : z - minZ;
  const n = horiz ? maxX - minX + 1 : maxZ - minZ + 1;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz; // inward cell

  // Ground-floor street front (north face): shopfront with central entrance
  if (s === 0 && face === "N") {
    if (j === 0) return "polished_andesite";
    if (j <= SH - 3) {
      const mid = Math.floor(n / 2) - 1;
      const entr = along >= mid && along < mid + 2;
      if (entr) {
        if (j === 1 && along === mid && has(ix, iz)) put(ix, y, iz, "lantern", { hanging: "false" });
        return null; // entrance opening
      }
      return along % 4 === 0 ? "stone_bricks" : "light_blue_stained_glass";
    }
    if (j === SH - 2) return "red_concrete"; // awning fascia
    return "white_concrete";
  }

  if (j === 0) return s === 0 ? "polished_andesite" : "smooth_quartz"; // base course / storey line
  if (j >= 1 && j <= SH - 2) {
    if (along % 3 === 0) return "white_concrete"; // pier
    const lit = (along + s) % 4 === 1;
    if (lit) {
      if (j === 1 && has(ix, iz)) put(ix, y, iz, "glowstone"); // lamp behind glass
      return "yellow_stained_glass";
    }
    return "light_blue_stained_glass";
  }
  return "white_concrete"; // spandrel
}

// 1. Foundation: solid from y 0 up to each cell's ground, then plinth up to the datum
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= F; y++) put(x, y, z, y <= gr ? "stone" : "stone_bricks");
}

// 2. Interior floor slabs and roof deck over the open plan
for (const [x, z] of cells) {
  if (faces(x, z).length) continue;
  for (let k = 0; k < NS; k++) put(x, BASE + k * SH, z, "smooth_stone");
  put(x, ROOF, z, "gray_concrete");
}

// 3. Facade shell, cornice, parapet
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (!fs.length) continue;
  const corner = fs.length >= 2;
  for (let y = BASE; y < ROOF; y++) {
    let id = corner ? "white_concrete" : faceBlock(fs[0], x, z, y);
    if (y === ROOF - 1) id = "smooth_quartz"; // cornice course
    if (id) put(x, y, z, id);
  }
  put(x, ROOF, z, "smooth_quartz");        // roof edge
  put(x, ROOF + 1, z, "white_concrete");   // parapet
}

// 4. Roof equipment: water tank and AC units on the open roof
for (const [x, z] of cells) {
  if (faces(x, z).length) continue;
  const u = x - minX, v = z - minZ;
  if (u % 7 === 3 && v % 6 === 2) {
    put(x, ROOF + 1, z, "iron_block");
    put(x, ROOF + 2, z, "iron_block");
  } else if (u % 5 === 1 && v % 7 === 5) {
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
