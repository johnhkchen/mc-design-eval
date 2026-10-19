// DC61774: 325 7th St NW, a Penn Quarter commercial office block (1920s-30s brick over a stone base, stone bands and cornice).
// Footprint from the lidar cells; roofs quantised to clean tiers (20 core, 18 podium, 9 south wing, 4 SW annex).
// Hollow shell: exterior walls (brick piers, glass bays, stone spandrels), air behind the glass, a floor slab per storey,
// interior columns on a 4-cell grid so every slab is held, and a stone base on every cell so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61774.cells.json`, "utf8"));

// Lidar roof height -> clean tier. Noise (a single 5 in the notch) folds into the podium it sits in.
const tier = (r) => (r <= 2 ? r : r === 4 ? 4 : r === 5 ? 18 : r <= 10 ? 9 : r <= 19 ? 18 : 20);

const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, tier(r));
const top = (x, z) => roof.get(`${x},${z}`) ?? -1;          // -1 outside the footprint

const NEIGH = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// Faces where open air touches this voxel: outside the footprint, or the neighbour's tier stops below it (a setback).
const exposed = (x, y, z) => Object.keys(NEIGH).filter((f) => { const [dx, dz] = NEIGH[f]; return top(x + dx, z + dz) <= y; });

const g = new Voxels([20, 32, 26]);
const ENTRANCE = { x: 9, z: 0 };                             // north wall, on the 18 podium
const STRUCT = (x, z) => x % 4 === 2 && z % 4 === 2;         // interior columns on a 4-cell grid

function place(x, y, z, R) {
  const faces = exposed(x, y, z);
  const out = faces.length > 0;
  if (y === 0) return g.set(x, y, z, "stone_bricks");        // base course on every cell (the downhill side shows it)
  if (y === R - 1) return g.set(x, y, z, out ? "smooth_quartz" : "smooth_stone");   // cornice / roof cover
  if (!out && STRUCT(x, z)) return g.set(x, y, z, "stone_bricks");
  if (y >= 3 && y % 2 === 1) return g.set(x, y, z, out ? "smooth_quartz" : "smooth_stone");   // storey slab / spandrel band
  if (!out) {                                                 // air behind the glass; a warm light in some bays
    const behind = Object.values(NEIGH).some(([dx, dz]) => top(x + dx, z + dz) > y && exposed(x + dx, y, z + dz).length > 0);
    if (behind && (x * 5 + y * 3 + z * 7) % 11 === 0) g.set(x, y, z, "glowstone");
    return;
  }
  const along = faces[0] === "N" || faces[0] === "S" ? x : z;
  const pier = faces.length > 1 || along % 3 === 0;           // corners and every third column are brick piers
  if (pier) return g.set(x, y, z, "bricks");
  return g.set(x, y, z, y <= 2 ? "glass" : "light_blue_stained_glass");   // shopfront below, office bays above
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const R = top(x, z);
  for (let y = 0; y < R; y++) {
    if (x === ENTRANCE.x && z === ENTRANCE.z && (y === 1 || y === 2)) continue;   // door set below
    place(x, y, z, R);
  }
}

// Entrance: a dark-oak door in the north wall, a dark hood over it, and a lantern inside under the slab.
g.set(ENTRANCE.x, 1, ENTRANCE.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ENTRANCE.x, 2, ENTRANCE.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let x = 8; x <= 10; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(9, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a two-storey stair and plant penthouse on the 20 core, capped in weathered copper.
for (let x = 7; x <= 8; x++) for (let z = 3; z <= 4; z++) {
  g.set(x, 20, z, "stone_bricks");
  g.set(x, 21, z, "oxidized_copper");
}

g.save(`${DIR}/DC61774.nbt`);
