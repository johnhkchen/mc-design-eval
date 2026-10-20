import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280223";
const W = 23, H = 33, D = 21;
const STOREY = 5;
const SLABS = new Set([5, 10, 15, 20]); // floor slabs / storey lines, roof slab at 20
const ROOF_TOP = 21;                    // parapet top; roof sits about 21 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    G.set(`${x},${z}`, Math.max(0, Math.min(20, Math.round(gr))));
  }
}
const inFp = (x, z) => G.has(`${x},${z}`);
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade face of a perimeter cell: which side is open to the outside, and the
// index along that face used for the bay rhythm. Returns null for interior cells.
function facade(x, z) {
  if (!inFp(x, z - 1)) return { face: "N", s: x };
  if (!inFp(x, z + 1)) return { face: "S", s: x };
  if (!inFp(x - 1, z)) return { face: "W", s: z };
  if (!inFp(x + 1, z)) return { face: "E", s: z };
  return null;
}

// Window bands: ground floor shopfront above the base course, then three
// upper storeys with a spandrel course at the top of each storey.
function isWindowY(y, gr) {
  if (y < STOREY) return y > gr && y <= 3;
  const r = y % STOREY;
  return r >= 1 && r <= 3;
}

const DOOR_X = 11;
const DOOR_Z = D - 1; // south face centre

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const fc = facade(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Body from this cell's ground up to the parapet.
  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === gr) {
      // Base course on the perimeter, floor slab inside.
      put(x, y, z, fc ? "stone_bricks" : "gray_concrete");
      continue;
    }
    if (SLABS.has(y)) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y === ROOF_TOP) {
      if (fc) put(x, y, z, "light_gray_concrete"); // parapet cap
      continue;
    }
    if (!fc) continue; // interior air behind the facade

    // Facade cell between storey lines.
    const bay = fc.s % 3 !== 0; // piers every third bay
    const windowBand = isWindowY(y, gr);

    // Entrance on the south face.
    if (fc.face === "S" && x === DOOR_X && z === DOOR_Z && y <= gr + 2 && y >= gr + 1) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (bay && windowBand) {
      // Some windows are lit warm, most are blue glass.
      const lit = (x * 7 + y * 3 + z * 5) % 9 === 0;
      put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Roof plant: a water tank in the centre of the roof and two AC blocks.
for (let x = 9; x <= 13; x++) {
  for (let z = 8; z <= 12; z++) {
    if (!inFp(x, z)) continue;
    const edge = x === 9 || x === 13 || z === 8 || z === 12;
    for (let y = ROOF_TOP; y <= 24; y++) {
      if (edge) put(x, y, z, "smooth_stone");
    }
    put(x, 25, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}
for (const [x, z] of [[2, 15], [3, 15]]) {
  if (!inFp(x, z)) continue;
  for (let y = ROOF_TOP; y <= ROOF_TOP + 1; y++) put(x, y, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
