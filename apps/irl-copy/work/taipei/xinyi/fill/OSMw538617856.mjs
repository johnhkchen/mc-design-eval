import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey concrete shophouse-style commercial block, 1970s-80s Taipei.
// Smooth quartz walls, light-grey bands, glass shopfront and upper glazing,
// flat roof with parapet, rooftop AC units and a water tank.
const W = 11, H = 23, D = 18;
const ROOF = 11;      // roof level (absolute), about 11 above lowest ground
const LINTEL = 4;     // top of ground-floor glazing
const FLOOR1 = 5;     // first floor slab line
const FLOOR2 = 10;    // second floor slab / cornice line

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538617856.cells.json", "utf8")
);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward direction of an edge cell (0 if interior side unknown)
const outward = (x, z) => ({
  ox: !has(x - 1, z) ? -1 : !has(x + 1, z) ? 1 : 0,
  oz: !has(x, z - 1) ? -1 : !has(x, z + 1) ? 1 : 0,
});

const DOOR_X = 5; // front door column on the z=0 face

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (!edge) {
    // Interior: floor slabs per storey and roof, air between
    for (const y of [FLOOR1, FLOOR2, ROOF]) {
      if (y >= gr) set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Edge cell: walls, bands, windows, parapet
  const { ox, oz } = outward(x, z);
  const sideWall = ox !== 0 && oz === 0;   // wall runs along z
  const frontWall = oz !== 0 && ox === 0;  // wall runs along x
  const t = sideWall ? z : x;               // position along the wall
  const cornerCell = ox !== 0 && oz !== 0;
  const pier = cornerCell || t % 3 === 0;
  const front = oz === -1 && frontWall;     // street face at z = 0

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      set(x, y, z, "smooth_quartz");                       // parapet
    } else if (y === ROOF + 1) {
      set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // coping
    } else if (y === LINTEL || y === FLOOR2) {
      set(x, y, z, "light_gray_concrete");                 // bands
    } else if (y === FLOOR1) {
      set(x, y, z, "smooth_quartz");
    } else if (pier) {
      set(x, y, z, "smooth_quartz");
    } else if (y < LINTEL) {
      // Ground-floor shopfront
      set(x, y, z, front ? "glass" : "light_blue_stained_glass_pane");
    } else if (y >= FLOOR1 + 1 && y <= FLOOR2 - 1) {
      // Upper windows
      set(x, y, z, "light_blue_stained_glass_pane");
    } else {
      set(x, y, z, "smooth_quartz");
    }
  }
}

// Warm lights behind some upper-floor windows
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const { ox, oz } = outward(x, z);
  if (ox !== 0 && oz !== 0) continue;
  const t = ox !== 0 ? z : x;
  if (t % 3 === 0 || t % 6 !== 1) continue;
  const ix = x - ox, iz = z - oz;
  if (has(ix, iz) && !isEdge(ix, iz) && 7 >= gr) set(ix, 7, iz, "glowstone");
}

// Front entrance: doors in the street face where the ground is low enough
if (has(DOOR_X, 0)) {
  const gr = ground.get(DOOR_X + ",0");
  if (gr <= 3) {
    set(DOOR_X, gr, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(DOOR_X, gr + 1, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Rooftop equipment on interior roof cells
const roofCell = (x, z) => has(x, z) && !isEdge(x, z);
for (let x = 2; x <= 3; x++) for (let z = 3; z <= 4; z++) {
  if (roofCell(x, z)) set(x, ROOF + 1, z, "iron_block");
}
for (let x = 7; x <= 8; x++) for (let z = 12; z <= 13; z++) {
  if (roofCell(x, z)) { set(x, ROOF + 1, z, "smooth_stone"); set(x, ROOF + 2, z, "smooth_stone"); }
}
if (roofCell(5, 8)) for (let y = ROOF + 1; y <= ROOF + 3; y++) set(5, y, 8, "iron_bars");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538617856.nbt");
