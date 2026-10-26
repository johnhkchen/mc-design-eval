// DC54023: a two-storey Federal limestone office block (Federal Triangle era, stripped classical) on the National Mall.
// Main body roof 11 (tall ground storey, belt, second storey, chiseled cornice, parapet); the 13-high pavilion on the
// west side is an attic tier with its own cap; the 2-high annex at the SW corner is a low wing. Walls are calcite with
// piers every third bay, gray glass panes, a bronze door on the north face, a window seat and a few warm lights behind
// the glass. Interiors are air (with floor slabs and a roof deck per tier).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54023.cells.json", "utf8"));

const g = new Voxels([11, 25, 18]);
const roofAt = new Map();                                    // "x,z" -> roof height (lidar, blocks above y 0)
for (const [x, z, , roof] of cells) roofAt.set(`${x},${z}`, roof);
const inFp = (x, z) => roofAt.has(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const outwardOf = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
const perimeter = (x, z) => outwardOf(x, z).length > 0;

const paneState = (face) => (face === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// one tier of a cell: the perimeter and interior rules by height, for a column of roof height R
const pendingLights = [];

for (const [x, z, , roof] of cells) {
  const out = outwardOf(x, z);
  const per = out.length > 0;
  const corner = out.length >= 2;
  const face = out.length === 1 ? (out[0] === "N" || out[0] === "S" ? "x" : "z") : null;
  const a = face === "x" ? x : z;                           // bay index along the face
  const put = (y, block, state) => g.set(x, y, z, block, state);

  if (roof <= 2) {                                          // the annex wing: a low walled block with a smooth cap
    for (let y = 0; y < roof; y++) put(y, y === 0 ? "stone_bricks" : "smooth_stone");
    continue;
  }

  for (let y = 0; y < roof; y++) {
    if (per) {
      if (y === 0) put(y, "stone_bricks");                                         // base course
      else if (y === 1 || y === 4 || y === 5) put(y, "smooth_stone");              // sill, belt, floor band
      else if (y === 8 || y === 10 || (y === 12)) put(y, "calcite");               // lintel, parapet, cap
      else if (y === 9) put(y, "chiseled_stone_bricks");                           // cornice
      else if (y === 2 || y === 3 || y === 6 || y === 7 || y === 11) {             // window zones
        if (corner || a % 3 === 0) { put(y, "calcite"); continue; }
        if (x === 8 && z === 0 && y <= 3) {                                        // the north door
          if (y === 1) put(y, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === 2) put(y, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(y, "gray_stained_glass_pane", paneState(face));                 // transom
          continue;
        }
        put(y, "gray_stained_glass_pane", paneState(face));
        const zone = y <= 3 ? 1 : y <= 7 ? 2 : 3;
        const lit = zone === 1 ? a % 6 === 2 : zone === 2 ? a % 6 === 5 : a % 2 === 0;
        if (lit) pendingLights.push({ x, z, y, face, out, zone });
      } else put(y, "calcite");
    } else {
      if (y === 0 || y === 5) put(y, "smooth_stone");                              // floor slabs
      else if (y === 9) put(y, "gray_concrete");                                   // main roof deck
      else if (y === 12) put(y, "calcite");                                        // pavilion cap, as its parapet
      else if (y === 10 && roof >= 13) put(y, "smooth_stone");                     // pavilion floor
    }
  }
}

// roof plant: two boxes on the main roof (interior cells, standing on the deck)
for (const [x, z] of [[6, 6], [5, 8]]) g.set(x, 10, z, "smooth_stone");

// the warm lights: each sits in the room behind a lit pane, on a floor or a window seat
for (const { x, z, y, out, zone } of pendingLights) {
  const d = out.length === 1 ? OPP[out[0]] : null;          // inward is the opposite of the outward face
  if (!d) continue;
  const ix = x + DIRS[d][0], iz = z + DIRS[d][1];
  if (!inFp(ix, iz) || perimeter(ix, iz)) continue;
  if (zone === 1) { g.set(ix, 1, iz, "smooth_stone"); g.set(ix, 2, iz, "glowstone"); }
  else if (zone === 2) g.set(ix, 6, iz, "shroomlight");
  else g.set(ix, 11, iz, "glowstone");
}

// the annex: a lantern on the low wing's cap
g.set(0, 2, 16, "lantern", { hanging: "false", waterlogged: "false" });

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54023.nbt");
console.log(`DC54023: ${r.blocks} blocks, ${r.palette} palette entries`);
