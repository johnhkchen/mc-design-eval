// NYC1022638: 121 West 45th Street, a 1920 commercial and office block, 10 x 22 blocks, four storeys
// of red brick on a polished-andesite base with stone string courses, a cornice and a brick parapet.
// Ground floor: shopfronts on both street faces (glass, polished-andesite piers) and the entrance on the
// south face (x 4, a dark-oak door under a dark marquee). Lidar roof 12-14 above y 0 smooths to one flat roof at 14.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022638.cells.json", "utf8"));
const g = new Voxels([10, 26, 22]);

const ROOF = 14;                                  // lidar 12-14 over the footprint: one flat roof, parapet top at 14
const LINES = [3, 6, 9];                           // stone string courses (the floor lines) on every face
const SHOP = [1, 2];                               // ground-floor glazing rows above the base course
const WINDOW_ROWS = [4, 5, 7, 8, 10, 11];          // upper-storey glazing rows

// Which face a perimeter cell is on and where it sits along it (piers every third bay, corners are piers).
const faceOf = (x, z) => {
  if (z === 21) return { face: "S", k: x, inward: [0, -1] };   // street, entrance
  if (z === 0) return { face: "N", k: x, inward: [0, 1] };
  if (x === 0) return { face: "W", k: z, inward: [1, 0] };
  if (x === 9) return { face: "E", k: z, inward: [-1, 0] };
  return null;
};
const isPier = (k) => k % 3 === 0;

// Glass pane connections: a pane on a z-facing wall joins east and west; on an x-facing wall, north and south.
const paneState = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Cells behind windows and doors: one block of air, so the glass reads as glazing (no interiors).
const airGap = new Set();
const lights = [];
const place = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z, ground] of cells) {
  const f = faceOf(x, z);
  // Interior: solid mass to the roof membrane (no rooms), foundation under any sloped cell.
  for (let y = 0; y <= ROOF - 2; y++) place(x, y, z, y === ROOF - 2 ? "gray_concrete" : "stone");
  if (!f) continue;
  const { face, k, inward } = f;
  for (let y = 0; y < ROOF; y++) {
    if (y < ground) { place(x, y, z, "stone_bricks"); continue; }      // foundation up to the lowest ground
    if (y === ground) { place(x, y, z, "polished_andesite"); continue; } // base course
    if (y === ROOF - 1) { place(x, y, z, "bricks"); continue; }         // parapet
    if (y === ROOF - 2) { place(x, y, z, "smooth_stone"); continue; }   // cornice
    if (LINES.includes(y)) { place(x, y, z, "smooth_stone"); continue; } // string courses
    const pier = isPier(k);
    if (SHOP.includes(y) && face === "S" && z === 21 && x === 4 && y <= 2) {
      // entrance: dark-oak door on the south face, lower then upper half; air behind it
      place(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      airGap.add([x + inward[0], y, z + inward[1]].join(","));
      continue;
    }
    if (SHOP.includes(y)) {
      if (pier) { place(x, y, z, "polished_andesite"); continue; }
      place(x, y, z, "glass");                                          // shopfront glass
      airGap.add([x + inward[0], y, z + inward[1]].join(","));
      continue;
    }
    if (WINDOW_ROWS.includes(y)) {
      if (pier) { place(x, y, z, "bricks"); continue; }
      place(x, y, z, "glass_pane", paneState(face));
      airGap.add([x + inward[0], y, z + inward[1]].join(","));
      continue;
    }
  }
}

// Air gaps behind the glass: empty, except that some hold a warm light (lanterns on the sill, glowstone or
// shroomlight higher up). Each light stands on the solid floor line below it.
for (const key of airGap) {
  const [x, y, z] = key.split(",").map(Number);
  const hash = (x * 7 + y * 3 + z * 5) % 11;
  if (y === 1 && hash < 4) place(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  else if (y === 4 && hash === 0) place(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  else if ([4, 7, 10].includes(y) && hash === 3) place(x, y, z, "glowstone");
  else if ([4, 7, 10].includes(y) && hash === 8) place(x, y, z, "shroomlight");
  else place(x, y, z, "air");
}

// Marquee over the entrance: dark-oak slab across the two entrance bays at the lintel line.
for (const x of [4, 5]) place(x, 3, 21, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Roof plant: two stone units on the roof membrane, inside the parapet.
for (const [x0, z0] of [[2, 14], [6, 6]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) place(x0 + dx, ROOF - 2 + 1, z0 + dz, "stone");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022638.nbt");
console.log(JSON.stringify(stats));
