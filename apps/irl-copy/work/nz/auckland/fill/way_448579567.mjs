import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record (lidar, per cell): a one-storey Edwardian brick shop-block with a raised plastered front (Mt Eden village /
// Eden Terrace commercial frontage, c.1905-1925): red brick walls on a stone base, plaster quoins and cornice, dark
// timber shopfront frames with glass, one timber-canopied entrance, a raised parapet where the lidar reads 6.
// Smoothing: the lone 6 at (1,3) and the 5 at (12,2) read as the 4 tier; the 6 cluster on the north front stays.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448579567.cells.json`, "utf8"));

const W = 13, D = 8, H = 19;
const TALL = new Set(["9,0", "10,0", "11,0", "6,1", "7,1", "4,2", "5,2", "6,2", "7,2", "6,3", "6,4"]);
const fp = new Map();
for (const [x, z, ground] of cells) fp.set(`${x},${z}`, { ground, top: TALL.has(`${x},${z}`) ? 6 : 4 });
const inFp = (x, z) => fp.has(`${x},${z}`);
const dirs = [{ dx: 0, dz: -1, n: "north" }, { dx: 0, dz: 1, n: "south" }, { dx: -1, dz: 0, n: "west" }, { dx: 1, dz: 0, n: "east" }];
const faces = (x, z) => dirs.filter((d) => !inFp(x + d.dx, z + d.dz));
const edge = (x, z) => faces(x, z).length > 0;

const BRICK = "bricks", PLASTER = "smooth_quartz", TIMBER = "dark_oak_planks", STONE = "stone_bricks", FLOOR = "smooth_stone";
const DOOR_CELL = [8, 1];                 // north front, ground storey
const g = new Voxels([W, H, D]);

for (const [key, { ground, top }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z), isEdge = f.length > 0, isCorner = f.length > 1;
  const roofY = top - 1;

  // foundation to the lowest ground, then the floor slab at this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, STONE);
  g.set(x, ground, z, isEdge ? STONE : FLOOR);

  // cornice / roof deck on top: a plaster parapet course on the edge, smooth stone inside
  g.set(x, roofY, z, isEdge ? PLASTER : FLOOR);

  // raised front: a storey line course at y 3 on the edge, a floor slab inside
  if (top === 6) g.set(x, 3, z, isEdge ? STONE : FLOOR);

  // walls: ground storey (y 1..2) windows with timber frames, plaster quoins at the corners, brick between
  if (isEdge) {
    for (let y = ground + 1; y < roofY; y++) {
      if (y === 3 && top === 6) continue;
      if (isCorner && y === 1) { g.set(x, y, z, STONE); continue; }   // thin footprint: most edge cells are corners, so brick above a stone course
      const face = f[0];
      const along = face.dx === 0 ? x : z;                 // position along the face
      // air behind the glass: the cell inside is open (interior) or outside the footprint (nothing behind it)
      const back = !inFp(x - face.dx, z - face.dz) || !edge(x - face.dx, z - face.dz);
      const windowCol = along % 3 === 1 && back && y <= 2;
      if (x === DOOR_CELL[0] && z === DOOR_CELL[1] && y <= 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (windowCol) {
        g.set(x, y, z, "glass_pane");                       // glass with an air cell behind it
      } else if (!back && y <= 2) {
        // a one-cell-thick face has no room behind glass: plaster pilasters and brick panels, not blank wall
        g.set(x, y, z, y === 1 ? STONE : BRICK);
      } else if (y <= 2 && (along % 3 === 0 || along % 3 === 2) && back) {
        g.set(x, y, z, y === 1 ? TIMBER : PLASTER);         // plaster pilasters framing each window, dark timber sill
      } else {
        g.set(x, y, z, BRICK);
      }
    }
    if (x === DOOR_CELL[0] && z === DOOR_CELL[1]) g.set(x, 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); // timber canopy over the door
  }

  // warm lanterns hanging from the deck in some interior bays
  if (!isEdge && top - 2 > ground && (x * 7 + z * 3) % 5 === 0) g.set(x, top - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant: two cooling units standing on the deck of the lower roof
g.set(3, 4, 4, "iron_block");
g.set(9, 4, 3, "iron_block");

const out = `${DIR}/way_448579567.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
