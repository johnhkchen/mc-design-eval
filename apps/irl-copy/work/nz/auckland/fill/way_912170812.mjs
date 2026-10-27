// way 912170812: a 1920s-30s Mt Eden commercial block, three storeys on a stone plinth, flat roof at 12
// (the lidar record). Plastered-brick walls with quartz quoins, string courses and a parapet coping; a timber
// shopfront on the ground floor; sash-style glass bays on the two upper floors with white sills; one timber
// door on the south front. Floors are slabs at each storey line; the rooms are air, lit by glowstone and lanterns
// standing behind some of the glass. Plant box on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170812.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170812.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, ground, roof] of cells) {
  if (roof !== 12) throw new Error(`roof ${roof} at ${x},${z}: this massing is cut for the 12-block lidar roof`);
  groundAt.set(K(x, z), ground);
}
const inF = (x, z) => groundAt.has(K(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces into the building
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Storey lines (absolute y). Each cell's base sits on its ground (0 or 1). Ground floor 1-3 (shopfront),
// string course at 4, first floor 5-7 (white sills at 5, glass 6-7), string at 8, second floor 9-10, coping at 11.
const STRING = [4, 8], FLOOR = { ground: 0, first: 4, second: 8 }, TOP = 11, PLANT_TOP = 12;
const DOOR = K(5, 5);                                              // the south front, ground floor
const tiers = [["ground", 1, 3], ["first", 5, 7], ["second", 9, 10]];

const [X, Y, Z] = [8, 25, 6];
const vox = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// The window bays: on each face, the cells at an odd index along it (x on north/south, z on east/west),
// corners and the door excluded. Each window bay has a glass cell behind which a light may stand.
const info = [];
for (const [x, z, ground] of cells) {
  const ex = exposed(x, z), wall = ex.length > 0, corner = ex.length > 1;
  const d = ex[0] ?? null;
  const along = d === "N" || d === "S" ? x : z;
  const bay = wall && !corner && along % 2 === 1 && K(x, z) !== DOOR;
  // quoins only on the outer corners of the plan's bounding box: the stepped outline has many inner corners
  const quoin = corner && (x === 0 || x === X - 1 || z === 0 || z === Z - 1);
  info.push({ x, z, ground, wall, corner, quoin, d, bay });
}

for (const c of info) {
  const { x, z, ground, wall, quoin, bay } = c;
  for (let y = 0; y <= TOP; y++) {
    if (y < ground) { put(x, y, z, "cobblestone"); continue; }              // foundation under the lower cells
    if (!wall) {                                                              // interior: slabs at each floor, air between
      if (y === ground || STRING.includes(y)) put(x, y, z, "smooth_stone");
      else if (y === TOP) put(x, y, z, "stone");                              // roof deck
      continue;
    }
    if (y === ground) { put(x, y, z, "stone_bricks"); continue; }            // plinth
    if (y === TOP) { put(x, y, z, "smooth_quartz"); continue; }              // parapet coping
    if (K(x, z) === DOOR && y === 4) { put(x, y, z, "dark_oak_planks"); continue; }  // timber hood over the door
    if (quoin || STRING.includes(y)) { put(x, y, z, "smooth_quartz"); continue; }     // quoins and string courses
    if (y <= 3) {                                                            // ground floor shopfront
      if (K(x, z) === DOOR) {
        const hinge = "left";
        put(x, y, z, "oak_door", { facing: FACING[c.d], half: y === ground + 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      } else put(x, y, z, bay ? "glass" : "dark_oak_planks");
    } else if (y <= 7) {                                                     // first floor: sills then glass bays
      if (y === 5) put(x, y, z, bay ? "white_concrete" : "bricks");
      else put(x, y, z, bay ? "glass_pane" : "bricks");
    } else put(x, y, z, bay ? "glass_pane" : "bricks");                       // second floor bays
  }
}

// Plant box on the roof, two cells across the middle of the deck.
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) if (inF(x, z)) put(x, PLANT_TOP, z, "light_gray_concrete");

// Warm light behind some glass: on the floor of each lit bay's room (floor slab + 1). Glowstone for most, a lantern on
// some; a third of the bays lit, chosen from the bay's place so the pattern is steady across the faces.
for (const c of info) {
  if (!c.bay) continue;
  const ix = c.x - DIRS[c.d][0], iz = c.z - DIRS[c.d][1];
  if (!inF(ix, iz) || exposed(ix, iz).length > 0) continue;               // the cell behind must be a room, not wall
  tiers.forEach(([name, lo, hi], t) => {
    const yFloor = name === "ground" ? c.ground : FLOOR[name];          // the room's slab under this bay
    const roomY = yFloor + 1;
    if (roomY < lo || roomY > hi) return;
    if ((c.x + 2 * c.z + t) % 3 !== 0) return;                          // about a third of the bays are lit
    if ((c.x + c.z + t) % 2 === 0) put(ix, roomY, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(ix, roomY, iz, "glowstone");
  });
}

const stats = vox.save(OUT);
console.log(`way 912170812: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
