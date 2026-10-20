import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121678";

// Footprint: 13 x 23 blocks. Roof about 11 blocks above lowest ground.
// Reading: a two-storey mid-century commercial block (concrete frame, shopfront
// ground floor, two upper storeys with window bands, parapet and rooftop plant).
const W = 13, H = 23, D = 23;
const ROOF_TOP = 11;   // roof cap y (absolute, lowest ground = 0)
const PARAPET = 10;    // last wall course before the cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(9, gr ?? 0)));
}
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Front door: middle of the northern (lowest-z) row of the footprint.
const minZ = Math.min(...cells.map(([, z]) => z));
const rowX = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = rowX[Math.floor(rowX.length / 2)];
const doorZ = minZ;

// Which outward face an edge cell presents, and its index along that face.
function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "N", i: x };
  if (!has(x, z + 1)) return { face: "S", i: x };
  if (!has(x - 1, z)) return { face: "W", i: z };
  return { face: "E", i: z };
}

// Facade block for an edge cell at height y.
function facadeBlock(y, gy, i, face, isDoor) {
  const pillar = i % 3 === 0;
  // Ground floor: shopfront under a lintel
  if (y === gy) return { b: "polished_andesite" };
  if (y <= gy + 3) {
    if (isDoor && face === "N" && (y === gy + 1 || y === gy + 2)) {
      return { b: "oak_door", p: {
        facing: "north", hinge: "left", open: "false", powered: "false",
        half: y === gy + 1 ? "lower" : "upper",
      } };
    }
    if (y === gy + 3) return { b: "light_gray_concrete" };
    return pillar ? { b: "white_concrete" } : { b: "glass" };
  }
  if (y === gy + 4 && gy + 4 < 5) return { b: "dark_oak_planks" }; // sign band
  // Upper storeys
  if (y === 5) return { b: "light_gray_concrete" };              // floor line
  if (y >= 6 && y <= 8) {
    if (pillar) return { b: "white_concrete" };
    if (y === 7 && i % 5 === 2) return { b: "glowstone" };       // warm lit window
    return { b: "light_blue_stained_glass" };
  }
  if (y === 9) return { b: "light_gray_concrete" };              // cornice
  if (y === PARAPET) return { b: "white_concrete" };             // parapet
  return { b: "light_gray_concrete" };
}

for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "gray_concrete");

  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  if (!edge) {
    // Interior cells: solid mass up to the parapet, no interiors
    for (let y = gy; y <= PARAPET; y++) put(x, y, z, "white_concrete");
  } else {
    const { face, i } = faceOf(x, z);
    const isDoor = face === "N" && x === doorX && z === doorZ;
    for (let y = gy; y <= PARAPET; y++) {
      const { b, p } = facadeBlock(y, gy, i, face, isDoor);
      put(x, y, z, b, p);
    }
  }

  // Flat roof cap on every footprint cell
  put(x, ROOF_TOP, z, "light_gray_concrete");

  // Rooftop plant: sparse AC units on interior cells
  if (!edge && (x * 2 + z * 3) % 11 === 0) put(x, ROOF_TOP + 1, z, "iron_block");
}

// Lightning rod on the first footprint cell
const [rx, rz] = [cells[0][0], cells[0][1]];
put(rx, ROOF_TOP + 1, rz, "lightning_rod", { facing: "up" });

g.save(`${DIR}/${ID}.nbt`);
