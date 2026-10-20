import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343641";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 18;

// Footprint map: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const minG = Math.min(...G.values());

// Two storeys of 5 blocks, flat roof, parapet: roof about 11 above lowest ground
const fA = minG;          // ground floor line
const fB = minG + 5;      // upper floor line
const roofY = minG + 10;  // roof deck / cornice
const parapetY = minG + 11;
if (parapetY + 2 > H - 1) throw new Error("building exceeds voxel height");

const g = new Voxels([W, H, D]);
function put(x, y, z, id, st) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

const DIRS = {
  north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Outward side of an exterior cell (first missing neighbour), or null for interior cells
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const inwardCell = (x, z, out) => {
  const [dx, dz] = DIRS[OPP[out]];
  return [x + dx, z + dz];
};

// Pre-pass: pick the entrance on the south-facing street wall (middle cell)
const southCells = [];
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z) === "south") southCells.push([x, z]);
}
southCells.sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const ext = out !== null;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Upper floor slab over the whole footprint
  if (fB > gr) put(x, fB, z, "smooth_stone");

  // Roof deck (interior) / cornice band (exterior)
  if (roofY > gr) {
    if (ext) put(x, roofY, z, "polished_granite");
    else put(x, roofY, z, "light_gray_concrete");
  }

  if (!ext) continue;

  // Parapet on the exterior edge
  put(x, parapetY, z, "smooth_quartz");

  const alongX = out === "north" || out === "south";
  const p = alongX ? x : z;
  const paneState = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = gr + 1; y < roofY; y++) {
    const relG = y - fA;
    const relU = y - fB;

    if (y < fB) {
      // Ground storey (shopfront)
      if (relG === 4) { put(x, y, z, "smooth_stone"); continue; }
      if (relG >= 1 && relG <= 3) {
        if (key === doorKey) {
          // Door at gr+1..gr+2 and lantern above it
          if (y === gr + 1) {
            put(x, y, z, "oak_door", { facing: out, half: "lower", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (y === gr + 2) {
            put(x, y, z, "oak_door", { facing: out, half: "upper", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (y === fA + 3) {
            put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
            continue;
          }
        }
        if (p % 3 === 0) { put(x, y, z, "polished_granite"); continue; }
        put(x, y, z, "light_blue_stained_glass_pane", paneState);
        // warm light behind some shopfront windows
        if (relG === 2 && p % 6 === 4) {
          const [ix, iz] = inwardCell(x, z, out);
          if (has(ix, iz) && y > gnd(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    } else {
      // Upper storey office floor
      if (relU === 1) { put(x, y, z, "light_gray_concrete"); continue; }
      if (relU === 4) { put(x, y, z, "light_gray_concrete"); continue; }
      if (relU >= 2 && relU <= 3) {
        if (p % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
        put(x, y, z, "light_blue_stained_glass_pane", paneState);
        if (relU === 2 && p % 6 === 1) {
          const [ix, iz] = inwardCell(x, z, out);
          if (has(ix, iz) && y > gnd(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Roof plant: 3x3 water tank on the deck, centred, only on interior cells
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
let tankOk = true;
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
  const x = cx + dx, z = cz + dz;
  if (!has(x, z) || outward(x, z) !== null || roofY <= gnd(x, z)) tankOk = false;
}
if (tankOk) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(cx + dx, parapetY, cz + dz, "iron_block");
    put(cx + dx, parapetY + 1, cz + dz, "iron_block");
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(cx + dx, parapetY + 2, cz + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
