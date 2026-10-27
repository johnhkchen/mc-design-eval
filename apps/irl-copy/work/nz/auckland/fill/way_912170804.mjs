// way 912170804: a two-storey brick commercial block on a stone base, Mt Eden / Newton Edwardian-interwar
// (1900-1930 Auckland main-street type): shopfront with a recessed door at the street (north) side, sash-style
// window grids above, Oamaru-stone storey lines and cornice, white quoins at the corners, flat roof behind a parapet.
// Footprint cells come from the lidar record; ground g: solid to y=g (foundation), walls from g+1 up to the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170804.cells.json", "utf8"));
const W = 8, D = 10, H = 24;
const ROOF = Math.max(...cells.map((c) => c[3]));                // 11: roof surface; solid up to ROOF-1, parapet at ROOF

const key = (x, z) => `${x},${z}`;
const inF = (x, z) => cellSet.has(key(x, z));
const cellSet = new Set(cells.map(([x, z]) => key(x, z)));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // N = street side (low z)
const exterior = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
// window bays: along a street or back face, every third cell is a brick pier and the rest glass
const isWindow = (x, z, ext) => (ext.includes("N") || ext.includes("S") ? x : z) % 3 !== 0;

// materials
const BRICK = "bricks", STONE = "smooth_stone", STONE_B = "stone_bricks", BASE = "polished_andesite";
const GLASS = "glass_pane", TRIM = "white_concrete", WOOD = "dark_oak_planks", ROOF_M = "stone";
const CAP = STONE;                                       // solid stone coping: a parapet, not battlements
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const v = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => v.set(x, y, z, b, s);

// 1. foundation to each cell's ground, then the storey slabs and roof deck across the whole footprint
for (const [x, z, g] of cells) {
  for (let y = 0; y <= g; y++) put(x, y, z, STONE_B);
  put(x, 1, z, STONE_B);                  // ground-floor slab
  put(x, 5, z, STONE);                    // first-floor slab
  put(x, 9, z, STONE_B);                  // second-floor ceiling
  put(x, ROOF - 1, z, ROOF_M);            // flat roof deck
}

// 2. the facade: boundary cells are the wall, interior cells stay air (no interiors; the glass sits on air)
const frontDoor = [4, 0];
for (const [x, z, g] of cells) {
  const ext = exterior(x, z);
  if (!ext.length) continue;
  const corner = ext.length >= 2;
  const front = ext.includes("N") && !corner;
  const win = !corner && !front && isWindow(x, z, ext);
  const isDoor = x === frontDoor[0] && z === frontDoor[1];
  for (let y = g + 1; y <= ROOF; y++) {
    let m = null, s;
    if (y === ROOF) m = CAP;
    else if (y === 1) m = null;                              // slab, already placed
    else if (corner) m = y === 9 ? STONE_B : TRIM;          // white quoins, stone cornice
    else if (y === 2) m = BASE;                             // base course
    else if (front) {                                        // shopfront
      if (y === 3) m = GLASS;
      else if (y === 4) m = WOOD;
      else if (y === 5) m = STONE;
      else if (y === 9) m = STONE_B;
      else if (y === 10) m = BRICK;
      else m = win ? GLASS : BRICK;                         // upper front: the window grid
    }
    else if (y === 3) m = win ? GLASS : BRICK;
    else if (y === 4 || y === 5 || y === 8) m = STONE;     // lintel, storey line, head band
    else if (y === 6 || y === 7) m = win ? GLASS : BRICK;
    else if (y === 9) m = STONE_B;
    else if (y === 10) m = BRICK;
    if (m) put(x, y, z, m);
  }
  if (isDoor) {
    put(x, 2, z, "dark_oak_door", { ...DOOR, half: "lower" });
    put(x, 3, z, "dark_oak_door", { ...DOOR, half: "upper" });
    put(x, 4, z, "lantern", { hanging: "true" });          // lantern under the stone lintel over the door
  }
}

// 3. warm light: glowstone on air just behind selected glass (shopfront and upper windows)
for (const [x, z, g] of cells) {
  const ext = exterior(x, z);
  if (ext.length !== 1) continue;                          // corners and interior cells carry no window
  const d = DIRS[ext[0]];
  const bx = x - d[0], bz = z - d[1];
  if (!inF(bx, bz) || exterior(bx, bz).length) continue;   // only where the cell behind is interior air
  if (ext[0] === "N" && z === 1 && (x === 5 || x === 6)) put(bx, 3, bz, "glowstone");
  else if (isWindow(x, z, ext) && (x * 7 + z * 3) % 5 === 0) put(bx, 6, bz, "glowstone");
}

// 4. roof plant: two air-conditioning units and a lantern on one, on interior roof cells
put(2, ROOF, 5, "iron_block");
put(3, ROOF, 4, "iron_block");
put(3, ROOF + 1, 4, "lantern");

const stats = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170804.nbt");
console.log(JSON.stringify(stats));
