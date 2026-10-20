import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643640295";
const W = 22, D = 20, H = 38;

// Record: no name. Roof ~26 blocks above lowest ground, footprint 22 x 20.
// Read as a 1990s-2000s Xinyi office block: solid core, blue-tinted curtain
// glazing between light-grey spandrel bands, white parapet, setback top tier,
// mechanical penthouse, glowing offices behind some windows, glass lobby entrance.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inF = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (!inF(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Distance from the outer edge of the footprint (1 = perimeter cell).
const dist = new Map();
const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const edge = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
  if (edge) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || dist.has(key(nx, nz))) continue;
    dist.set(key(nx, nz), d + 1);
    queue.push([nx, nz]);
  }
}

// Entrance: middle of the perimeter row on the smallest-z side.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const doorRow = cells.filter(([x, z]) => z === minZ && dist.get(key(x, z)) === 1).map(([x]) => x).sort((a, b) => a - b);
const doorX = doorRow.length ? doorRow[Math.floor(doorRow.length / 2)] : null;

let maxD = 0, rodCell = null;
for (const [x, z] of cells) {
  const d = dist.get(key(x, z));
  if (d > maxD) { maxD = d; rodCell = [x, z]; }
}

// Main massing, column by column.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const d = dist.get(key(x, z));

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys are 5 blocks: o0 floor band, o1-o3 window zone, o4 spandrel.
  // Setback: outer two rings go to roof level 25 (parapet to 26), inner core stops at 20.
  if (d >= 3) {
    for (let k = 0; k <= 20; k++) {
      put(x, gr + k, z, k === 20 ? "smooth_stone" : "light_gray_concrete");
    }
    continue;
  }

  if (d === 2) {
    for (let k = 0; k <= 25; k++) {
      const y = gr + k, o = k % 5, s = Math.floor(k / 5);
      if (k === 25 || o === 0 || o === 4) {
        put(x, y, z, "light_gray_concrete");
      } else {
        // Air gap behind the glass; some offices lit with glowstone.
        const lit = o === 2 && ((x * 3 + z * 5 + s) % 4 === 0);
        if (lit) put(x, y, z, "glowstone");
      }
    }
    continue;
  }

  // d === 1: facade ring.
  // Along-wall coordinate decides mullion rhythm.
  const xFacing = !inF(x - 1, z) || !inF(x + 1, z);
  const along = xFacing ? z : x;
  const isDoor = doorX !== null && z === minZ && x === doorX;

  for (let k = 0; k <= 26; k++) {
    const y = gr + k, o = k % 5, s = Math.floor(k / 5);
    if (k >= 25) { put(x, y, z, "white_concrete"); continue; } // parapet
    if (o === 0) {
      put(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (o === 4) { put(x, y, z, "white_concrete"); continue; }

    // o1..o3 window zone
    if (isDoor && (k === 1 || k === 2)) {
      put(x, y, z, "iron_door", {
        facing: "north",
        half: k === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (along % 3 === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (s === 0) put(x, y, z, "glass");               // lobby and shopfront
    else put(x, y, z, "light_blue_stained_glass");    // office curtain wall
  }
}

// Mechanical penthouse on the deepest core cells.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const d = dist.get(key(x, z));
  if (d < 7) continue;
  for (let k = 21; k <= 23; k++) put(x, gr + k, z, "smooth_stone");
}

// Lightning rod on the deepest cell, on top of whatever sits there.
if (rodCell) {
  const [x, z] = rodCell;
  const gr = ground.get(key(x, z));
  const d = dist.get(key(x, z));
  const topK = d >= 7 ? 23 : 20;
  put(x, gr + topK + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
