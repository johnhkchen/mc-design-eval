import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no building name. Footprint 16 x 21, roof ~11 blocks above lowest ground.
// Read as a two-storey, late-20th-century Taipei commercial block: cream concrete
// walls, brown terracotta lintels and sills, glass shopfront bays at street level,
// a glass-and-concrete upper floor, a cornice and parapet, and rooftop AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414360";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), gr);
const has = (x, z) => ground.has(k(x, z));

// Outward facing for a perimeter cell (null if interior).
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const DELTA = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Entrance: perimeter cell on the north (min z) edge nearest the middle of the footprint.
let entranceKey = null;
{
  const xs = cells.map(c => c[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = Infinity;
  for (const [x, z] of cells) {
    if (outward(x, z) === "north") {
      const d = Math.abs(x - cx) + z * 0.01;
      if (d < best) { best = d; entranceKey = k(x, z); }
    }
  }
}

function setIf(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  const face = outward(x, z);
  const isPerim = face !== null;

  // Foundation below the cell's ground, then plinth on the ground surface.
  for (let y = 0; y < gr; y++) setIf(x, y, z, "stone_bricks");
  setIf(x, gr, z, "polished_andesite");

  if (!isPerim) {
    // Interior: floor slabs per storey, roof slab, air elsewhere.
    setIf(x, gr + 5, z, "smooth_stone");
    setIf(x, gr + 10, z, "gray_concrete");

    // Warm light just inside a window bay, only on some bays.
    if (face === null) {
      // find an adjacent perimeter cell whose bay is a window and which is lit
      for (const [dx, dz] of Object.values(DELTA)) {
        const px = x + dx, pz = z + dz;
        if (!has(px, pz)) continue;
        const pf = outward(px, pz);
        if (!pf) continue;
        const idx = (pf === "north" || pf === "south") ? px : pz;
        if (idx % 3 === 1 && idx % 2 === 0) {
          setIf(x, gr + 6, z, "lantern", { hanging: "false" });
          break;
        }
      }
    }

    // Rooftop AC units / plant boxes on the roof slab.
    if ((x * 5 + z * 7) % 11 === 0) {
      setIf(x, gr + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter wall, facing outward.
  const idx = (face === "north" || face === "south") ? x : z;
  const isBay = idx % 3 === 1;
  const isEntrance = k(x, z) === entranceKey;

  // Ground storey (shopfront): gr+1..gr+3
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isEntrance && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      setIf(x, y, z, "dark_oak_door", {
        facing: face, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (isEntrance && y === gr + 3) {
      setIf(x, y, z, "lantern", { hanging: "true" });
    } else if (isBay) {
      setIf(x, y, z, "glass");
    } else {
      setIf(x, y, z, "white_concrete");
    }
  }
  // Lintel band under the storey line.
  setIf(x, gr + 4, z, "brown_terracotta");
  // Storey line between floors.
  setIf(x, gr + 5, z, "smooth_stone");

  // Upper storey: gr+6..gr+9, sill / glass / glass / lintel in bays.
  if (isBay) {
    setIf(x, gr + 6, z, "brown_terracotta");
    setIf(x, gr + 7, z, "glass");
    setIf(x, gr + 8, z, "glass");
    setIf(x, gr + 9, z, "brown_terracotta");
  } else {
    for (let y = gr + 6; y <= gr + 9; y++) setIf(x, y, z, "white_concrete");
  }

  // Cornice and parapet.
  setIf(x, gr + 10, z, "smooth_stone");
  setIf(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
