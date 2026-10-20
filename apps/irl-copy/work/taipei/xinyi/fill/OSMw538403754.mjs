import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded 1980s-style mid-rise commercial block in Xinyi: white concrete body,
// light-gray pillars, tinted glazing bands, a glass shopfront with a red awning on
// the street (south) face, a centred entrance, and rooftop plant with a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403754";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 18;
const G = new Map();
let maxG = 0;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  maxG = Math.max(maxG, gr);
}
const has = (x, z) => G.has(`${x},${z}`);

// Roof deck level: about 11 blocks above lowest ground (parapet sits one above it).
const top = Math.min(21, Math.max(10, maxG + 8));

const g = new Voxels([W, H, D]);
const P = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Wall block for a perimeter cell at height y.
function wallAt(x, z, y, gr, mN, mS, mW, mE) {
  const corner = (mN || mS) && (mW || mE);
  if (y === gr) return ["polished_granite"];              // base course
  if (y === top - 1) return ["smooth_quartz"];            // cornice
  if (y === 5 && y > gr) return ["smooth_quartz"];        // storey line
  if (corner) return ["light_gray_concrete"];             // corner columns
  const isSouth = mS && !mN && !mW && !mE;
  const along = (mN || mS) ? x : z;
  const pillar = along % 3 === 0;
  if (isSouth && y > gr && y <= gr + 2) {                 // shopfront
    return pillar ? ["light_gray_concrete"] : ["glass"];
  }
  if (isSouth && y === gr + 3 && y < top - 1) return ["red_terracotta"]; // awning band
  if (pillar) return ["light_gray_concrete"];             // mullions
  if (y > gr + 1 && (along + y) % 9 === 4) return ["glowstone"]; // warm lit window
  return ["light_blue_stained_glass_pane", (mN || mS) ? paneX : paneZ];
}

for (const [x, z, gr] of cells) {
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const perim = mN || mS || mW || mE;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) P(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air elsewhere.
    P(x, gr, z, "polished_andesite");
    if (5 > gr && 5 < top) P(x, 5, z, "smooth_stone");
  } else {
    for (let y = gr; y < top; y++) {
      const [b, p] = wallAt(x, z, y, gr, mN, mS, mW, mE);
      P(x, y, z, b, p);
    }
    P(x, top + 1, z, "white_concrete"); // parapet
  }

  // Roof deck over the whole footprint.
  P(x, top, z, "light_gray_concrete");

  // Rooftop plant room block.
  if (!perim && x >= 4 && x <= 10 && z >= 5 && z <= 12) P(x, top + 1, z, "iron_block");
}

// Centred entrance on the street face (south).
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const [dx, dz, dg] = southCells[Math.floor(southCells.length / 2)];
  P(dx, dg, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  P(dx, dg + 1, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy above the door, one block out from the face inside the footprint.
  P(dx, dg + 3, dz, "red_terracotta");
}

g.save(`${DIR}/${ID}.nbt`);
