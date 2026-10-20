import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414181";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 18;
const STOREY = 5;   // storey line, metres-equivalent blocks above lowest ground
const ROOF = 10;    // roof deck layer
const PARAPET = 11; // parapet / roof plant starts here

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// outward delta, facing name
const DIRS = { N: [0, -1, "north"], S: [0, 1, "south"], W: [-1, 0, "west"], E: [1, 0, "east"] };

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const exteriorDirs = (x, z) =>
  Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));

// Pass 1: foundations, walls, floors, roofs
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const ext = exteriorDirs(x, z);

  if (ext.length === 0) {
    // interior cell: floor slabs per storey, air gap otherwise
    if (gr < ROOF) put(x, gr, z, "smooth_stone");
    if (gr < STOREY) put(x, STOREY, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");

    // roof plant: a couple of boxes on the roof deck
    if (x >= 4 && x <= 7 && z >= 4 && z <= 6) {
      put(x, PARAPET, z, "light_gray_concrete");
      put(x, PARAPET + 1, z, "light_gray_concrete");
    }
  } else {
    // exterior ring cell: solid white concrete wall from ground to roof deck
    for (let y = gr; y < ROOF; y++) put(x, y, z, "white_concrete");
    if (gr < ROOF) put(x, gr, z, "stone_bricks");          // base course
    if (gr < STOREY) put(x, STOREY, z, "smooth_stone");     // storey line
    put(x, ROOF, z, "smooth_stone");                        // cornice
    put(x, PARAPET, z, "white_concrete");                   // parapet
  }
}

// Pass 2: window grids, entrance, lights on exterior ring
const glassPaneProps = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: middle of the north-facing ring
const northCells = cells
  .filter(([x, z]) => exteriorDirs(x, z).includes("N"))
  .sort((a, b) => a[0] - b[0]);
const entranceCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;

for (const [x, z, gr] of cells) {
  const ext = exteriorDirs(x, z);
  if (ext.length === 0) continue;

  const face = ext[0];
  const idx = (face === "N" || face === "S") ? x : z;
  const corner = ext.length > 1;
  const pier = corner || idx % 3 === 0;
  if (pier) continue; // piers stay solid white concrete

  // Ground storey shopfront glazing (blocks) with transom at STOREY-1
  for (let y = gr + 1; y <= STOREY - 2; y++) {
    put(x, y, z, "cyan_stained_glass");
  }
  // Upper storey window panes between sill (STOREY) and head (ROOF-1)
  for (let y = STOREY + 1; y <= ROOF - 2; y++) {
    put(x, y, z, "light_blue_stained_glass_pane", glassPaneProps(face));
  }

  // Warm lights behind some glass, inside the air gap
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && exteriorDirs(ix, iz).length === 0) {
    if (idx % 6 === 1) put(ix, STOREY + 2, iz, "shroomlight");
    if (idx % 4 === 2 && gr + 1 <= STOREY - 2) put(ix, gr + 1, iz, "glowstone");
  }
}

// Entrance with door, canopy and lantern
if (entranceCell) {
  const [ex, ez, egr] = entranceCell;
  if (egr <= 1) {
    // door on the north face
    put(ex, egr + 1, ez, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    put(ex, egr + 2, ez, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
    });
    // canopy across the entrance bay
    for (let x = ex - 1; x <= ex + 1; x++) {
      if (has(x, ez)) put(x, STOREY - 1, ez, "smooth_stone");
    }
    // hanging lantern under the canopy
    put(ex, STOREY - 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
