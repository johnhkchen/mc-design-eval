// DC80683: a Beaux-Arts stone office block on the Mall's north-west flank, 10 x 6 on an L-shaped footprint.
// Limestone (smooth quartz) walls on a stone plinth, a string course at y3, two upper floors of glass panes between
// quartz pilasters, a quartz cornice, and a parapet on the 8-block tower. The north face has a dark-wood shopfront and a
// recessed entrance bay with a door and canopy. Every column stands on the one below: walls rise from their own ground,
// interior cells are air with a floor slab per storey and a roof cover, and roof plant sits on the cover.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80683.cells.json", "utf8"));
const X = 10, Z = 6, H = 20;

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));

// lidar noise into flat tiers: a 1-high pit at the south-west corner, dips at the south edge, a 6 inside the 7s
const SMOOTH = { "3,5": 6, "4,5": 6, "7,5": 6, "6,1": 7, "7,4": 8 };
for (const [k, r] of Object.entries(SMOOTH)) foot.get(k).r = r;
const PORCH = "6,0";                       // lidar roof 3 in the north wall: the entrance bay, not a lost storey

const inFoot = (x, z) => foot.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const outside = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFoot(x + dx, z + dz)).map(([d]) => d);
const perimeter = (x, z) => outside(x, z).length > 0;

const g = new Voxels([X, H, Z]);
const panes = [];
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

const FOUND = "stone_bricks", PLINTH = "stone_bricks", WALL = "smooth_quartz", PILASTER = "quartz_pillar";
const BAND = "quartz_bricks", CORNICE = "quartz_block", FLOOR = "smooth_stone", PARAPET = "stone_brick_wall";

// a window cell has an exposed face and an interior cell behind it, so the glass has air behind it (no interior)
function windowFace(x, z) {
  for (const d of outside(x, z)) {
    const [dx, dz] = DIRS[d];
    const behind = [x - dx, z - dz];
    if (inFoot(...behind) && !perimeter(...behind)) return d;
  }
  return null;
}

for (const [k, { g: gr, r }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const per = perimeter(x, z), T = r - 1, C = r >= 7 ? 6 : r - 1;
  const win = per ? windowFace(x, z) : null;
  const bay = win && (win === "N" || win === "S") ? x : z;   // the bay rhythm runs along the face
  const isWin = win && bay % 2 === 1;

  for (let y = 0; y < gr; y++) set(x, y, z, FOUND);                  // foundation up to the lowest-ground's level

  if (!per) {                                                       // interior: floor per storey, ceiling, roof cover
    for (const y of [gr, 3, T]) set(x, y, z, FLOOR);
    continue;
  }

  if (k === PORCH) {                                               // north entrance: door, canopy over it, open above
    set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    set(x, 3, z, BAND);
    continue;
  }

  set(x, gr, z, PLINTH);                                           // base course
  for (let y = gr + 1; y < 3; y++) {                               // ground storey: shopfront glass between stone piers
    if (isWin) set(x, y, z, "glass");
    else set(x, y, z, PILASTER);
  }
  set(x, 3, z, BAND);                                              // string course
  for (let y = 4; y < C; y++) {                                    // upper storey: glass panes between pilasters
    if (isWin) { set(x, y, z, "glass_pane", {}); panes.push([x, y, z]); }
    else set(x, y, z, PILASTER);
  }
  set(x, C, z, CORNICE);
  if (r === 8) set(x, 7, z, PARAPET);
  // one wall cell per storey: a lamp stands on the floor behind some windows
  if (isWin && (x + z) % 2 === 0) {
    const [dx, dz] = DIRS[win];
    set(x - dx, gr + 1, z - dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  if (isWin && r >= 7 && (x + z) % 3 === 0) {
    const [dx, dz] = DIRS[win];
    set(x - dx, 5, z - dz, "glowstone");
  }
}

// roof cover (interior), plant on top of it
for (const [x, z] of [[5, 3], [8, 4]]) set(x, 8, z, "iron_block");

// glass panes connect to whatever stands beside them along the wall
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  set(x, y, z, "glass_pane", {
    north: String(solid(x, y, z - 1)),
    south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)),
    west: String(solid(x - 1, y, z)),
    waterlogged: "false",
  });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80683.nbt");
