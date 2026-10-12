// PART 1 house shell and ground (plan.md PARTS 1): the bedding, the floor slab with its room finishes, the perimeter
// walls with their OPENINGS left as air, the atrium ring, the interior partitions and doorways, and the y=5 ceiling.
// Writes go through g.set, into air only (this is the first part, so nothing else is there yet). Coordinates are plan.md's.
import { readFileSync } from "node:fs";
import { BEAM_XS, ATRIUM, CHIMNEY, PIT, POOL_CELLS, header_course } from "../vocab.mjs";

const WHITE = "white_concrete";
const SMOOTH = "smooth_stone";
const SPRUCE = "spruce_planks";
const QUARTZ = "smooth_quartz";
const TERRAZZO = "smooth_stone"; // with flecks of light_gray_concrete and white_concrete, see terrazzo()
const rooms = JSON.parse(readFileSync(new URL("../rooms.json", import.meta.url), "utf8")).rooms;

const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const inAtrium = (x, z) => inBox(ATRIUM, x, z);
const inChimney = (x, z) => inBox(CHIMNEY, x, z);
const inPit = (x, z) => inBox(PIT, x, z);
const inHouse = (x, z) => x >= 10 && x <= 31 && z >= 8 && z <= 25;
// the house walls on the perimeter (x=10, x=31, z=8, z=25)
const perimeter = (x, z) => inHouse(x, z) && (x === 10 || x === 31 || z === 8 || z === 25);
// the atrium ring: glass on x=16, x=22 and z=11, z=18, around the open courtyard
const ringCell = (x, z) => x >= 16 && x <= 22 && z >= 11 && z <= 18 && !inAtrium(x, z);
const inRingBox = (x, z) => x >= 16 && x <= 22 && z >= 11 && z <= 18;

// the room floor kinds (ROOMS table): bedrooms spruce, baths quartz, public rooms terrazzo
const FLOOR_KIND = { "bedroom 1": SPRUCE, "bedroom 2": SPRUCE, "master bedroom": SPRUCE, "bath 1": QUARTZ, "bath 2": QUARTZ };
const roomAt = (x, z) => rooms.find((r) => inBox({ x0: r.box[0], x1: r.box[3], z0: r.box[2], z1: r.box[5] }, x, z));
function floorBlock(x, z) {
  const room = roomAt(x, z);
  const kind = room ? FLOOR_KIND[room.name] : undefined;
  return kind ?? terrazzo(x, z);
}
// deterministic flecks: ~12% light_gray_concrete, ~6% white_concrete, the rest smooth_stone
function terrazzo(x, z) {
  const r = (Math.imul(x, 73856093) ^ Math.imul(z, 19349663)) >>> 0;
  const f = r % 100;
  return f < 6 ? WHITE : f < 18 ? "light_gray_concrete" : TERRAZZO;
}

// the perimeter body (y=2..4): stucco everywhere except the OPENINGS, the posts at the corners, and the whole south glass wall
function perimeterBody(x, y, z) {
  if ((x === 10 || x === 31) && (z === 8 || z === 25)) return null; // corner posts (part 4)
  if (z === 8) { // north, street face
    if (x >= 18 && x <= 20) return null; // entry recess
    if (x === 17) return SMOOTH; // recess reveal
    if (y === 4 && x >= 22 && x <= 30) return null; // clerestory strip (part 4)
    return WHITE;
  }
  if (z === 25) return null; // south wall of glass: part 4 glazes it and posts the beam lines
  if (x === 10) { // west
    if (z === 10 && y <= 3) return null; // utility door to the carport
    if (z >= 14 && z <= 16 && y >= 3) return null; // dining window
  }
  if (x === 31) { // east
    if (z >= 10 && z <= 12 && y >= 3) return null; // bedroom 1 window
    if (z >= 15 && z <= 16 && y === 4) return null; // bath clerestory
    if (z >= 21 && z <= 23) return null; // master glass
  }
  return WHITE;
}

// interior partitions (white_concrete, y=2..4) with their doorways left as air
function partitionAt(x, y, z) {
  if (z === 13 && x >= 25 && x <= 30) return WHITE;
  if (x === 25 && z >= 9 && z <= 21) return y <= 3 && (z === 10 || z === 15 || z === 19) ? null : WHITE;
  if (z === 17 && x >= 26 && x <= 30) return x === 29 && y <= 3 ? null : WHITE;
  if (x === 28 && z >= 14 && z <= 16) return WHITE;
  if (z === 21 && x >= 25 && x <= 30) return WHITE;
  if (x === 22 && z >= 19 && z <= 24) return z <= 20 ? null : WHITE;
  if (z === 9 && x >= 17 && x <= 21) return x >= 18 && x <= 20 ? null : WHITE; // front door wall (orange_entry)
  return null;
}

// the y=5 ceiling: spruce between the beams, over the public and bedroom rooms (not the atrium, the chimney or the ring)
function ceilingAt(x, z) {
  if (x < 11 || x > 30) return false;
  if (!((z >= 9 && z <= 13) || (z >= 20 && z <= 24))) return false;
  if (BEAM_XS.includes(x)) return false;
  if (inRingBox(x, z)) return false;
  if (inChimney(x, z)) return false;
  return true;
}

export function build(g) {
  // bedding y=-1 (not pool cells); build.mjs stores only y>=0, so these cells are dropped and counted there
  for (let x = 0; x < 34; x++) for (let z = 0; z < 34; z++) if (!POOL_CELLS.has(`${x},${z}`)) g.set(x, -1, z, "dirt");

  // the floor slab y=1 and the pit floor y=0 (build.mjs already lays dirt at y=0 over the lot)
  for (let x = 10; x <= 31; x++) for (let z = 8; z <= 25; z++) {
    if (inPit(x, z)) { g.set(x, 0, z, QUARTZ); continue; } // conversation pit floor; no slab at y=1
    if (inAtrium(x, z) || inChimney(x, z)) continue; // open courtyard and chimney: no slab
    if (perimeter(x, z) || ringCell(x, z)) { g.set(x, 1, z, z === 8 && x === 21 ? WHITE : SMOOTH); continue; }
    g.set(x, 1, z, floorBlock(x, z));
  }

  // the perimeter walls, the atrium ring body (air for part 4's glass) and the interior partitions, y=2..4
  for (let x = 10; x <= 31; x++) for (let z = 8; z <= 25; z++) for (let y = 2; y <= 4; y++) {
    const b = perimeter(x, z) ? perimeterBody(x, y, z) : partitionAt(x, y, z);
    if (b) g.set(x, y, z, b);
  }

  // the header course y=5 on the north and south walls and the ring's north and south sides, skipping the beam lines
  header_course(g, 10, 8, 31, 8);
  header_course(g, 10, 25, 31, 25);
  header_course(g, 16, 11, 22, 11);
  header_course(g, 16, 18, 22, 18);

  // the ceiling y=5 between the beams
  for (let x = 11; x <= 30; x++) for (let z = 9; z <= 24; z++) if (ceilingAt(x, z)) g.set(x, 5, z, SPRUCE);
}
