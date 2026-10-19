// 35 West 45th Street, 1920 commercial and office building: a 15-storey brick office block with stone trim, built to the
// 1916 zoning setbacks. Footprint 14 x 27 (x across, low z = north = the 45th Street frontage). The lidar roof is read as
// clean tiers, not followed cell by cell: a 3-storey low wing on the street (z 0-2), a 10-storey setback against the east
// flank (z 3-5), a 14-storey step (z 6), the 15-storey office roof at 45, a 48 parapet on the west and east edges and a
// 48 block at the south-east. The ground is flat at 0, so there is no foundation to fill. Lidar 0 holes inside the
// footprint take the tier around them. Each storey is 3 blocks: a stone storey line (y % 3 == 0) and two rows of glass.
// Glass sits in the outer skin with one air block behind it (no interiors); the floor slab is the storey line. A few
// windows have a lamp behind the pane. The entrance is a recessed double door under a stone canopy, with a hanging lantern.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034244.cells.json`, "utf8"));
const X = 14, Z = 27, Y = 48;

const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && cells.some(([cx, cz]) => cx === x && cz === z);

// Roof tier per cell (block heights above y 0), read off the lidar grid.
const R = (x, z) => {
  if (z <= 2) return 9;
  if (z <= 5) return x === X - 1 ? 48 : 30;
  if (z === 6) return x === 0 || x === X - 1 ? 48 : 42;
  if (x === 0 || x === X - 1 || (x >= 9 && z >= 15)) return 48;
  return 45;
};
const top = (x, z) => (inFoot(x, z) ? R(x, z) : 0);
const inside = (x, y, z) => inFoot(x, z) && y < top(x, z);

// Faces: N = low z (the street), S = the rear, W and E = the flanks. [dx, dz] points out of the building.
const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PANE = {
  N: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  S: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};
// Piers sit between window bays, and on the corners. The piers on the street and rear faces are every third column.
const pier = (x, z, face) =>
  face === "N" || face === "S" ? x % 3 === 0 || x === 0 || x === X - 1 : z % 3 === 0 || z === 0 || z === Z - 1;
const lamp = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const gaps = [];

// 1. Skin and core. A cell with a free face is the skin: a stone storey line or plinth (y % 3 == 0), a coping on the
// roof edge, a glass pane in the window rows (below the roof edge and the parapet), or brick for piers and spandrels.
// Cells with no free face are core: brick, with the roof cap on top. Each window's inner neighbour is the air gap.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    const out = Object.keys(FACES).filter((f) => { const [dx, dz] = FACES[f]; return !inside(x + dx, y, z + dz); });
    if (!out.length) { g.set(x, y, z, y === T - 1 ? "stone_bricks" : "bricks"); continue; }
    const face = out[0], [dx, dz] = FACES[face];
    const rin = top(x - dx, z - dz);                        // the tier one step inside this face
    if (y === T - 1) g.set(x, y, z, "smooth_stone");        // coping
    else if (y === 0 || y % 3 === 0) g.set(x, y, z, "calcite");   // plinth and storey lines
    else if (y <= Math.min(T, rin) - 2 && !pier(x, z, face)) {
      g.set(x, y, z, "light_gray_stained_glass_pane", PANE[face]);
      gaps.push([x - dx, y, z - dz]);
    } else g.set(x, y, z, "bricks");
  }
}

// 2. Air behind the glass: one block in, under the storey line. Some gaps hold a lamp (shroomlight on the ground floor).
for (const [x, y, z] of gaps) {
  if (!inside(x, y, z)) continue;
  if (!lamp(x, y, z)) g.set(x, y, z, "air");
  else g.set(x, y, z, y < 3 ? "shroomlight" : "glowstone");
}

// 3. Street entrance: a recessed double door (x 6-7) between stone pilasters (x 5 and 8), a stone canopy over the
// recess, a hanging lantern under it. The vestibule is air in front of the door.
for (const x of [6, 7]) {
  g.set(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: x === 6 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: x === 6 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 1, 1, "air"); g.set(x, 2, 1, "air");
}
for (const x of [5, 8]) for (const z of [0, 1]) for (const y of [1, 2]) g.set(x, y, z, "polished_andesite");
for (let x = 5; x <= 8; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, "polished_andesite");
for (const x of [6, 7]) g.set(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Roof plant: a 3-block brick plant room on the 45 roof, with a stone band and coping, standing on the roof cap.
for (let x = 4; x <= 7; x++) for (let z = 12; z <= 15; z++) for (let y = 45; y < 48; y++)
  g.set(x, y, z, y === 45 ? "calcite" : y === 47 ? "smooth_stone" : "bricks");

const out = g.save(`${DIR}/NYC1034244.nbt`);
console.log(`NYC1034244.nbt: ${out.blocks} blocks, ${out.palette} palette entries, size ${X} x ${Y} x ${Z}`);
