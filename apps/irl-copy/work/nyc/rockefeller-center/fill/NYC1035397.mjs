// 12 East 46 Street, 1915 commercial and office building: an eight-storey brick Midtown office block on a 13 x 24
// footprint. The street face (low z, 46th Street) has a granite shopfront, a recessed entrance under a canopy, a stone
// string course at each storey line, a stone cornice and a parapet. The lidar roof reads as a flat 27 (its 26s and
// 27s are noise), with 29-block penthouse tiers on the four clusters it shows at 29: the east block, the middle
// north-south wing, the south-west corner and the south-east corner. The lidar-0 cells inside the footprint are
// sunken paved light courts. Windows are 3-wide bays recessed one block, with air behind the glass and a floor slab
// per storey (no interiors); some lowest window rows hold lanterns. The side walls are blind brick.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035397.cells.json`, "utf8"));
const X = 13, Y = 41, Z = 24;

const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);

// Penthouse tiers at 29 (x0, x1, z0, z1), read from the lidar clusters; the rest of the footprint is 27.
const TIERS = [[6, 12, 7, 10], [6, 8, 12, 17], [3, 7, 21, 23], [11, 12, 22, 23]];
const roofAt = (x, z) => {
  if (!inFoot(x, z) || lidar.get(`${x},${z}`) === 0) return 0;                  // lidar 0 = open court
  return TIERS.some(([x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1) ? 29 : 27;
};

const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };                    // N = low z = the 46th Street face
const open = (x, y, z) => !inFoot(x, z) || y >= roofAt(x, z);
const facesAt = (x, y, z) => Object.keys(OUT).filter((d) => open(x + OUT[d][0], y, z + OUT[d][1]));

const bay = (u) => u % 4 !== 0;                                                  // 3-wide bays between 1-wide piers at u = 0, 4, 8, 12
const band = (y) => y === 4 || (y >= 5 && (y - 5) % 3 === 0);                    // lintel at 4, then a string course at each storey line
const bottomRow = (y) => y === 1 || (y >= 6 && (y - 6) % 3 === 0);               // lowest window row: a lantern stands on the slab below

const key = (x, y, z) => `${x},${y},${z}`;
const plan = new Map();                                                          // "x,y,z" -> { block, state } or null for air
const set = (x, y, z, block, state) => plan.set(key(x, y, z), block ? { block, state } : null);
const glass = [];                                                                // facade panes, with the face they look out of

const facadeBlock = (d, x, y, z) => {
  const u = d === "N" || d === "S" ? x : z;
  if (y === 0) return "polished_granite";
  if (band(y)) return "smooth_stone";
  if (y <= 3) return d !== "N" ? "bricks" : [1, 2, 3, 9, 10, 11].includes(u) ? "glass_pane" : "polished_granite";
  if (d === "N" || d === "S") {
    if (bay(u)) return "glass_pane";
    if (u === 0 || u === 12) return "stone_bricks";
  } else if (u % 4 === 0) return "stone_bricks";                                  // blind party walls: stone piers keep the rhythm
  return "bricks";
};

// 1. The solid building: foundation and core, facades on the open faces, roof covering, parapets.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const R = roofAt(x, z);
  if (!R) { set(x, 0, z, "smooth_stone"); continue; }                            // open court: paved, nothing above
  for (let y = 0; y < R; y++) {
    const faces = facesAt(x, y, z);
    if (y === R - 1) set(x, y, z, faces.length ? "smooth_stone" : "light_gray_concrete");   // cornice, else roof covering
    else if (faces.length) {
      const block = facadeBlock(faces[0], x, y, z);                              // N, then S, W, E: the street face wins a corner
      set(x, y, z, block);
      if (block === "glass_pane") glass.push({ x, y, z, d: faces[0] });
    } else set(x, y, z, y === 0 ? "polished_granite" : "bricks");
  }
  if (R === 27 && facesAt(x, 27, z).length) set(x, 27, z, "stone_bricks");        // parapet on the 27 roof's edge
}

// 2. Windows are recessed one block: the cell inward of each pane is air (no interior), or a lantern on a lit row.
for (const { x, y, z, d } of glass) {
  const lit = bottomRow(y) && (x * 2 + z + y) % 3 === 0;
  set(x - OUT[d][0], y, z - OUT[d][1], lit ? "lantern" : null, lit ? { hanging: "false", waterlogged: "false" } : undefined);
}

// 3. The street entrance: a recessed double-height door bay under a canopy, granite frame and posts, a glass transom.
set(6, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
set(6, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
set(6, 3, 0, "glass_pane");
for (const y of [1, 2, 3]) for (const [x, z] of [[5, 0], [7, 0], [5, 1], [7, 1]]) set(x, y, z, "polished_granite");
for (const y of [1, 2, 3]) set(6, y, 1, null);                                   // the porch is open air
for (const x of [5, 6, 7]) for (const z of [0, 1]) set(x, 4, z, "smooth_stone");  // canopy over the entrance

// 4. Write it. Each pane connects to the panes beside it in its row; a lantern is light inside a window.
const g = new Voxels([X, Y, Z]);
const pane = (x, y, z) => plan.get(key(x, y, z))?.block === "glass_pane";
let lanterns = 0;
for (const [k, v] of plan) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (v.block === "lantern") lanterns++;
  const state = v.block === "glass_pane"
    ? { east: String(pane(x + 1, y, z)), north: "false", south: "false", west: String(pane(x - 1, y, z)), waterlogged: "false" }
    : v.state;
  g.set(x, y, z, v.block, state);
}
const out = g.save(`${DIR}/NYC1035397.nbt`);
console.log(`NYC1035397: ${out.blocks} blocks, ${out.palette} palette entries, ${glass.length} facade panes, ${lanterns} lanterns`);
