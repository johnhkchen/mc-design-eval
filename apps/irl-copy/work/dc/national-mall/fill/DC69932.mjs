// DC69932: a 1930s Federal-style office block on the Mall: quartz-stone walls on a granite plinth, pilasters every 3
// blocks, a string course, two window rows, a double entrance in the street (south) face with a lintel, a parapet
// with roof plant. The footprint is the lidar cells; the roof top is y 6 on every cell (a flat massing).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69932.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 13, D = 8;

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const ring = (x, z) => [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];
const g = new Voxels([W, 18, D]);
const set = (x, y, z, b, s) => { if (inFp(x, z)) g.set(x, y, z, b, s); };

// a pane runs along the face it sits in: east-west on the north and south faces, north-south on the east and west
const PANE = (alongX) => (alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
const PILLAR = { axis: "y" };

for (const [x, z] of cells) {
  const exposed = ring(x, z).map(([a, b]) => !inFp(a, b));
  const faces = ["N", "S", "W", "E"].filter((_, i) => exposed[i]);
  const interior = faces.length === 0;
  if (interior) {
    set(x, 0, z, "stone_bricks");                                 // floor slab of the ground floor
    set(x, 3, z, "smooth_stone");                                 // floor slab of the upper floor
    set(x, 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // roof deck, a half course lower than the parapet
    continue;
  }
  // the face a perimeter cell's detail follows: N/S run along x, W/E along z
  const face = faces[0], along = face === "N" || face === "S" ? x : z;
  const alongX = face === "N" || face === "S";
  const corner = faces.length > 1;
  // on the north and south faces a corner is a pilaster; on the east and west faces (a ragged, mostly corner edge) it is
  // a window unless it falls on a pilaster line, so the side walls are not blank
  const pilaster = (alongX && corner) || along % 3 === 0;
  set(x, 0, z, "polished_granite");                               // plinth
  set(x, 3, z, "smooth_quartz");                                  // string course between the storeys
  set(x, 5, z, pilaster ? "chiseled_quartz_block" : "smooth_quartz");   // parapet, crowned at the pilasters
  for (const y of [1, 2, 4]) {
    if (pilaster) set(x, y, z, "quartz_pillar", PILLAR);
    else set(x, y, z, "glass_pane", PANE(alongX));
  }
}

// the entrance: a double door in the street face (south, z = D-1), with a lintel slab over it
const ex = 7, ez = D - 1;
g.set(ex, 1, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 2, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(ex, 3, ez, "smooth_quartz_slab", { type: "top", waterlogged: "false" });

// warm light: lanterns on the floors just inside some windows (an air gap is kept between them and the glass)
for (const [x, z] of cells) {
  if (ring(x, z).some(([a, b]) => !inFp(a, b))) continue;
  if ((x * 3 + z * 5) % 7 === 0) g.set(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  if ((x * 2 + z * 3) % 9 === 4) g.set(x, 4, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant: a few low boxes on the roof deck (still within the lidar's top at y 6)
for (const [x, z] of cells) {
  if (ring(x, z).some(([a, b]) => !inFp(a, b))) continue;
  if (x % 4 === 2 && z % 3 === 1) g.set(x, 5, z, "light_gray_concrete");
}

const out = `${DIR}/DC69932.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
