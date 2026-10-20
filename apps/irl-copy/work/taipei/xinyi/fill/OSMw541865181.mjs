import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw541865181";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 14, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, y0] of cells) ground.set(`${x},${z}`, y0);
const has = (x, z) => ground.has(`${x},${z}`);
const miss = (x, z) => !has(x, z);
const perim = (x, z) => has(x, z) && (miss(x, z - 1) || miss(x, z + 1) || miss(x - 1, z) || miss(x + 1, z));
const corner = (x, z) => ((miss(x, z - 1) || miss(x, z + 1)) && (miss(x - 1, z) || miss(x + 1, z)));

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// outward facing for a non-corner perimeter cell
function outward(x, z) {
  if (corner(x, z)) return null;
  if (miss(x, z + 1)) return "south";
  if (miss(x, z - 1)) return "north";
  if (miss(x + 1, z)) return "east";
  if (miss(x - 1, z)) return "west";
  return null;
}

// pick one entrance on the facade nearest the middle of the footprint
let door = null;
{
  let best = Infinity;
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (!perim(x, z)) continue;
    const f = outward(x, z);
    if (!f) continue;
    const score = Math.abs(x - (W - 1) / 2) + Math.abs(z - (D - 1) / 2);
    if (score < best) { best = score; door = { x, z, facing: f }; }
  }
}

for (const [x, z, gy] of cells) {
  // foundation up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "gray_concrete");

  // floor slabs: ground floor, storey line, roof deck (every cell, so nothing hangs)
  put(x, gy, z, "light_gray_concrete");
  put(x, gy + 5, z, "light_gray_concrete");
  put(x, gy + 10, z, "light_gray_concrete");

  if (!perim(x, z)) {
    // roof plant on the deck, behind the parapet line
    if ((x * 3 + z * 5) % 7 === 0) put(x, gy + 11, z, "smooth_stone");
    continue;
  }

  const isCorner = corner(x, z);
  const runsX = miss(x, z - 1) || miss(x, z + 1); // wall runs east-west
  const k = runsX ? x : z;                        // position along the wall

  // cornice and parapet
  put(x, gy + 10, z, "smooth_stone");
  put(x, gy + 11, z, "white_concrete");

  const storeyY = [gy + 1, gy + 2, gy + 3, gy + 4, gy + 6, gy + 7, gy + 8, gy + 9];
  for (const y of storeyY) {
    let b, p;
    if (y === gy + 1) {
      b = "stone_bricks"; // base course
    } else if (y === gy + 9) {
      b = "light_gray_concrete"; // top spandrel
    } else if (isCorner || k % 2 === 0) {
      b = "white_concrete"; // piers and corners
    } else {
      b = "gray_stained_glass_pane"; // tinted glass with frames
      p = runsX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    }
    put(x, y, z, b, p);
  }

  // entrance
  if (door && door.x === x && door.z === z) {
    const dp = { facing: door.facing, hinge: "left", open: "false", powered: "false" };
    put(x, gy + 1, z, "iron_door", { ...dp, half: "lower" });
    put(x, gy + 2, z, "iron_door", { ...dp, half: "upper" });
  }

  // warm lights behind some glass (only where the inner cell is open floor)
  if (!isCorner && !(door && door.x === x && door.z === z)) {
    let ix = x, iz = z;
    if (miss(x, z - 1)) iz = z + 1;
    else if (miss(x, z + 1)) iz = z - 1;
    else if (miss(x - 1, z)) ix = x + 1;
    else if (miss(x + 1, z)) ix = x - 1;
    const inner = has(ix, iz) && !perim(ix, iz);
    if (inner && k % 4 === 1) put(ix, gy + 3, iz, "glowstone");
    if (inner && k % 4 === 3) put(ix, gy + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
