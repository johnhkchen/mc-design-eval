// 1200 5th St NW: a three-storey red-brick walk-up (c. 1910s) on a 6 x 7 footprint that falls off to the east.
// The lidar roof is 4 blocks over the wings and 5 over the core (x 2-4, z 1-6, plus the front bay at x 3), so the
// core is a single setback tier above the wings. Walls are one cell thick: each exterior cell is the wall, interior
// cells are air with a floor slab per storey, so the glass sits in the wall and any warm lamp sits just behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69294.cells.json`, "utf8"));
const OUT = `${DIR}/DC69294.nbt`;

const BRICK = "bricks", BASE = "stone_bricks", TRIM = "smooth_stone", FLOOR = "spruce_planks", ROOF = "stone";
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const at = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => at.has(`${x},${z}`);
const exposedOf = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
// one roof tier per footprint: the core (lidar 5) is smoothed to a clean rectangle, everything else is the wings (4)
const isCore = (x, z) => (x >= 2 && x <= 4 && z >= 1) || (x === 3 && z === 0);
const glass = (face) => (face === "north" || face === "south"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const g = new Voxels([6, 17, 7]);
const lampAt = new Set();   // interior cells behind a lit window

// first pass: the exterior face each window sits on, so lamps can go just inside it
for (const [x, z] of cells) {
  const ex = exposedOf(x, z);
  if (ex.length !== 1) continue;
  const face = ex[0], along = face === "north" || face === "south" ? x : z;
  if (along % 2 === 1 && !(x === 3 && z === 0) && (along === 1 || along === 5)) {
    const [dx, dz] = DIRS[face];
    lampAt.add(`${x - dx},${z - dz}`);   // the cell just inside the window, lit at storey 2
  }
}

for (const [x, z, ground] of cells) {
  const top = isCore(x, z) ? 5 : 4;       // roof top above y 0; the parapet is the row below it
  const ex = exposedOf(x, z);
  const corner = ex.length > 1;
  const face = ex.length === 1 ? ex[0] : null;
  const along = face === "north" || face === "south" ? x : z;

  // base course (foundation under the lowest ground, the basement storey on the downhill side)
  g.set(x, 0, z, BASE);
  if (face && ground === 0 && along % 2 === 1) g.set(x, 0, z, "glass_pane", glass(face));

  for (let y = 1; y < top; y++) {
    const parapet = y === top - 1;
    if (!ex.length) {
      // interior: floor slab per storey, roof deck on top, air between
      if (parapet) g.set(x, y, z, ROOF);
      else if (y % 2 === 1) g.set(x, y, z, FLOOR);
      if (y === 2 && lampAt.has(`${x},${z}`)) g.set(x, y, z, "glowstone");
      continue;
    }
    if (parapet) { g.set(x, y, z, TRIM); continue; }
    if (corner) { g.set(x, y, z, BRICK); continue; }
    // front door bay: door at grade, hanging lantern in the lintel row
    if (x === 3 && z === 0) {
      if (y <= 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    // windows alternate with brick piers along the face
    if (along % 2 === 1) g.set(x, y, z, "glass_pane", glass(face));
    else g.set(x, y, z, BRICK);
  }
}

// roof equipment: a stair bulkhead on the core's south edge, capped with a slab
for (const x of [2, 3]) {
  g.set(x, 5, 6, BRICK); g.set(x, 6, 6, BRICK);
  g.set(x, 7, 6, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const r = g.save(OUT);
console.log(`DC69294: ${r.blocks} blocks, ${r.palette} palette entries -> ${OUT}`);
