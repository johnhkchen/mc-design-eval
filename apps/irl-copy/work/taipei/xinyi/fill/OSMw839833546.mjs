import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833546";
const W = 18, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gr = new Map();
let minG = Infinity, maxG = -Infinity;
for (const [x, z, gc] of cells) {
  gr.set(`${x},${z}`, gc);
  minG = Math.min(minG, gc);
  maxG = Math.max(maxG, gc);
}
const has = (x, z) => gr.has(`${x},${z}`);
const ground = (x, z) => gr.get(`${x},${z}`);

// Roof about 11 blocks above lowest ground; keep clear of the highest ground.
const T = Math.max(minG + 11, maxG + 3);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const isRing = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

// Front = northern edge (smallest z). Door sits at the middle of that row.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontRow = cells.filter(([x, z]) => z === minZ && isRing(x, z)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontRow.length ? frontRow[Math.floor(frontRow.length / 2)] : -1;
const doorZ = minZ;

const minX = Math.min(...cells.map(([x]) => x));
const maxX = Math.max(...cells.map(([x]) => x));
const maxZ = Math.max(...cells.map(([, z]) => z));

for (const [x, z, gc] of cells) {
  // Foundation below the cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  // Floor at the cell's ground level.
  put(x, gc, z, "smooth_stone");

  const ring = isRing(x, z);
  const corner =
    (x === minX || x === maxX) && (z === minZ || z === maxZ);
  const pillar = corner || (x + z) % 3 === 0;

  // Outward facing for doors and windows.
  let facing = "north";
  if (!has(x, z - 1)) facing = "north";
  else if (!has(x, z + 1)) facing = "south";
  else if (!has(x - 1, z)) facing = "west";
  else if (!has(x + 1, z)) facing = "east";

  for (let y = gc + 1; y <= T - 1; y++) {
    const rel = y - gc;

    if (ring) {
      if (x === doorX && z === doorZ && (rel === 1 || rel === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing,
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === T - 1) put(x, y, z, "white_concrete");           // parapet
      else if (y === T - 2) put(x, y, z, "quartz_block");       // cornice
      else if (rel === 5) put(x, y, z, "quartz_block");         // storey line
      else if (rel === 4) put(x, y, z, "white_concrete");       // lintel band
      else if (rel <= 3) put(x, y, z, pillar ? "white_concrete" : "glass"); // shopfront
      else put(x, y, z, pillar ? "white_concrete" : "light_blue_stained_glass"); // upper windows
    } else {
      if (y === T - 1) put(x, y, z, "gray_concrete");           // roof deck
      else if (rel === 5) put(x, y, z, "smooth_stone");         // floor slab
      // interior otherwise left as air
      if (y <= T - 3 && (rel === 2 || rel === 7)) {
        // warm lights behind the glass
        if (rel === 2 && (x + z) % 4 === 0) put(x, y, z, "glowstone");
        if (rel === 7 && (x + z) % 5 === 0) put(x, y, z, "shroomlight");
      }
    }
  }

  // Base course on the ring at ground level.
  if (ring) put(x, gc, z, "polished_andesite");

  // Roof equipment on the deck.
  if (!ring && x % 5 === 2 && z % 6 === 3) {
    put(x, T, z, "light_gray_concrete");
    put(x, T + 1, z, "light_gray_concrete");
  }
}

// Door lintel glass above the entrance keeps the shopfront readable.
if (doorX >= 0) {
  for (let y = 3; y <= 3; y++) put(doorX, ground(doorX, doorZ) + y, doorZ, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
