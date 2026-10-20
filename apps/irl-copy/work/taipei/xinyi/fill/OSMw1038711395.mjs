import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711395";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 11 x 15 footprint, roof about 11 blocks above the lowest ground.
// Read as a two-storey, early-1990s-style mid-rise: white concrete shell, stone
// plinth, cyan shopfront glazing on the ground floor, blue glass bands above,
// and a stone cornice and parapet. Roughly 8 m tall at 1.4 blocks per metre.
const W = 11, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const L0 = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const TOP = 11;                                   // roof height above L0 (parapet top)

// Directions: [dx, dz, faceName]
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Entrance: middle of the south face (z+1 side).
const southU = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const entU = southU.length ? southU[Math.floor(southU.length / 2)] : -1;

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Interior floor slabs at ground, storey 2 and roof deck (interior cells only).
const isInterior = (x, z) => has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
for (const [x, z, gr] of cells) {
  if (!isInterior(x, z)) continue;
  for (const dy of [0, 5, 10]) {
    const y = L0 + dy;
    if (y >= gr) g.set(x, y, z, "smooth_stone");
  }
}

// 3. Facade pattern by height above L0 and position u along the face.
function facadeBlock(dy, u, isEntrance) {
  if (dy === 0) return { name: "stone_bricks" };
  if (dy === 4 || dy === 10) return { name: "smooth_stone" };
  if (dy === 5 || dy === 9) return { name: "white_concrete" };
  if (dy === 11) return { name: u % 3 === 0 ? "smooth_stone" : "white_concrete" };

  if (dy <= 3) {
    // Ground floor: shopfront with entrance.
    if (isEntrance && dy === 1) return { name: "oak_door", props: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (isEntrance && dy === 2) return { name: "oak_door", props: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (dy === 3) return { name: "white_concrete" };
    if (u % 3 === 0) return { name: "light_gray_concrete" };
    return { name: "cyan_stained_glass_pane" };
  }

  // Storey 2 (dy 6..8): blue glass bands between concrete piers.
  if (u % 3 === 0) return { name: "light_gray_concrete" };
  return { name: "light_blue_stained_glass_pane" };
}

// 4. Facades: each exposed face of each perimeter cell.
for (const [x, z, gr] of cells) {
  if (gr > L0 + TOP - 1) continue;
  for (const [dx, dz, face] of DIRS) {
    if (has(x + dx, z + dz)) continue;   // not an exterior face
    const along = dx !== 0 ? z : x;      // coordinate running along the face
    const isSouth = face === "south";
    const isEntrance = isSouth && along === entU;

    for (let dy = 0; dy <= TOP; dy++) {
      const y = L0 + dy;
      if (y < gr) continue;               // foundation already fills below ground
      const b = facadeBlock(dy, along, isEntrance);
      g.set(x, y, z, b.name, b.props);
    }

    // Warm light behind some ground and storey-2 windows (interior side is air).
    for (const dy of [2, 7]) {
      const y = L0 + dy;
      if (y < gr) continue;
      if (along % 6 !== 1) continue;
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// 5. Roof equipment on the deck: a few plant boxes on interior cells.
for (const [x, z, gr] of cells) {
  if (!isInterior(x, z)) continue;
  if (L0 + 10 < gr) continue;
  if (x % 4 === 2 && z % 5 === 2) {
    g.set(x, L0 + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
