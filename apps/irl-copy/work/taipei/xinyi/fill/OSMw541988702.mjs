import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988702";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 11;
const g = new Voxels([W, H, D]);

// Storey plan (y is block height; 0 = lowest ground):
// 0 ground slab, 1-4 ground storey, 5 floor slab, 6-9 upper storey,
// 10 roof deck (top at 11), 11 parapet.
const FLOOR_Y = [0, 5];
const ROOF_Y = 10;
const PARAPET_Y = 11;

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which exterior side a perimeter cell sits on (front = low z, the shopfront side).
function side(x, z) {
  if (!has(x, z - 1)) return "front";
  if (!has(x, z + 1)) return "back";
  if (!has(x - 1, z)) return "left";
  if (!has(x + 1, z)) return "right";
  return null;
}

function inward(x, z, s) {
  if (s === "front") return [x, z + 1];
  if (s === "back") return [x, z - 1];
  if (s === "left") return [x + 1, z];
  return [x - 1, z];
}

// Pier test: along the facade, the end cells and every 4th cell are piers.
function isPier(x, z, s) {
  const along = s === "front" || s === "back";
  const k = along ? x : z;
  const prev = along ? has(x - 1, z) : has(x, z - 1);
  const next = along ? has(x + 1, z) : has(x, z + 1);
  return !prev || !next || k % 4 === 0;
}

// Front-face door cell: middle of the shopfront run.
const frontXs = cells
  .filter(([x, z]) => side(x, z) === "front")
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const doorZ = frontXs.length ? Math.min(...cells.map(([, z]) => z)) : -1;

const GLASS = "gray_stained_glass";
const WALL = "white_concrete";
const BASE = "polished_andesite";
const AWNING = "red_concrete";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const DECK = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  const s = side(x, z);
  const edge = s !== null;
  const pier = edge && isPier(x, z, s);
  const k = s === "front" || s === "back" ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < Math.min(gr, H); y++) put(x, y, z, FOUND);

  // Floor and roof slabs stand on whatever lies below them.
  for (const fy of FLOOR_Y) {
    if (fy < gr) continue;
    put(x, fy, z, FLOOR);
  }
  if (ROOF_Y >= gr) put(x, ROOF_Y, z, edge ? FLOOR : DECK);

  if (!edge) {
    // Roof equipment: a few AC units on the deck.
    if (ROOF_Y >= gr && (x * 7 + z * 3) % 9 === 4) put(x, PARAPET_Y, z, "iron_block");
    continue;
  }

  // Ground storey: base course, glazed bays, lintel / awning.
  if (1 >= gr) put(x, 1, z, pier ? WALL : BASE);
  if (2 >= gr) put(x, 2, z, pier ? WALL : GLASS);
  if (3 >= gr) put(x, 3, z, pier ? WALL : GLASS);
  if (4 >= gr) {
    if (s === "front" && !pier) put(x, 4, z, AWNING);
    else put(x, 4, z, WALL);
  }

  // Entrance: door on the middle of the front run.
  if (s === "front" && x === doorX && !pier) {
    put(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, GLASS);
    put(x, 4, z, AWNING);
  }

  // Warm lamp just inside some ground-floor bays, behind the glass.
  if (s === "front" && !pier && k % 6 === 3) {
    const [ix, iz] = inward(x, z, s);
    if (has(ix, iz) && !side(ix, iz)) put(ix, 1, iz, "glowstone");
  }

  // Storey line above the ground floor.
  if (5 >= gr) put(x, 5, z, FLOOR);

  // Upper storey: sills, glazing, head.
  if (6 >= gr) put(x, 6, z, WALL);
  if (7 >= gr) put(x, 7, z, pier ? WALL : GLASS);
  if (8 >= gr) put(x, 8, z, pier ? WALL : GLASS);
  if (9 >= gr) put(x, 9, z, WALL);

  // Warm lamps behind some upper windows.
  if (!pier && k % 8 === 2) {
    const [ix, iz] = inward(x, z, s);
    if (has(ix, iz) && !side(ix, iz)) put(ix, 7, iz, "glowstone");
  }

  // Cornice band and parapet.
  if (ROOF_Y >= gr) put(x, ROOF_Y, z, FLOOR);
  if (PARAPET_Y >= gr) put(x, PARAPET_Y, z, WALL);
}

g.save(`${DIR}/${ID}.nbt`);
