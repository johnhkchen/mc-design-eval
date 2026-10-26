// DC80136: a 1910s-20s Federal-Triangle-style office block of white Georgian-marble (calcite) piers and bronze-framed
// glass on a stone base, three storeys of 3 blocks each, a flat cornice, and a one-block penthouse core where the
// lidar roof reads 10 (the 3-by-4 tower core). Massing from the cells file: the lidar roof is smoothed to two flat tiers
// (9 for the body, 10 for the cells whose roof reads 10). Every column is solid at y 0 (foundation / floor), the floor
// plates at y 3 and 6, the body's roof at y 8 and the tower's floor at y 8 and cap at y 9, so nothing floats. Room rows
// are air behind the glass (glowstone behind some sashes); the interior is never filled beyond those plates.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80136.cells.json`, "utf8"));

const MARBLE = "calcite", TRIM = "smooth_quartz", BASE = "stone_bricks", FLOOR = "smooth_stone", ROOF = "stone_bricks";
const STRINGS = [3, 6];                 // string courses at the storey lines (also the floor plates)
const BODY = 9, TOWER = 10;             // flat tiers: body top, and the tower core (lidar roof >= 10)

const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, top: r >= 10 ? TOWER : BODY });
const inF = (x, z) => foot.has(`${x},${z}`);
const topOf = (x, z) => foot.get(`${x},${z}`)?.top ?? 0;
// the outer faces of a cell (no footprint cell behind them)
const exposed = (x, z) => ({ w: !inF(x - 1, z), e: !inF(x + 1, z), n: !inF(x, z - 1), s: !inF(x, z + 1) });
const isBoundary = (x, z) => { const f = exposed(x, z); return f.w || f.e || f.n || f.s; };
const isCorner = (x, z) => { const f = exposed(x, z); return (f.w || f.e) && (f.n || f.s); };

// the main door: north face, centre-left of the front; a second door on the south face
const DOOR = { x: 4, z: 0, facing: "north" };
const DOOR2 = { x: 3, z: 15, facing: "south" };
const isDoor = (x, z) => (x === DOOR.x && z === DOOR.z) || (x === DOOR2.x && z === DOOR2.z);
const doorFacing = (x, z) => (x === DOOR.x && z === DOOR.z ? DOOR.facing : DOOR2.facing);

const g = new Voxels([8, 22, 16]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// the glass pane: connects along the face (north-south on the east and west faces, east-west on the north and south)
const pane = (f) => (f.w || f.e
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

// a boundary cell's wall at height y: base course, string courses, cornice, then piers and glass in the storey zones
const wallAt = (x, z, y, top) => {
  if (y === 0) return [BASE];
  if (y === top - 1) return [TRIM];                                    // cornice
  if (STRINGS.includes(y)) return [TRIM];
  if (isCorner(x, z)) return ["quartz_pillar", { axis: "y" }];
  const f = exposed(x, z);
  const along = f.w || f.e ? z : x;                                    // position along the face
  if (along % 3 === 0) return [MARBLE];                                // piers between bays of glass
  return ["glass_pane", pane(f)];
};

for (const [key, { top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  // y 0 is the lowest ground under the footprint, so every cell is solid there (foundation, and the ground floor's base)
  put(x, 0, z, isBoundary(x, z) ? BASE : FLOOR);
  for (let y = 1; y < top; y++) {
    if (isBoundary(x, z)) {
      if (isDoor(x, z) && (y === 1 || y === 2)) {                      // the doors in the front and back of the block
        put(x, y, z, "dark_oak_door", { facing: doorFacing(x, z), half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const [b, s] = wallAt(x, z, y, top);
      put(x, y, z, b, s);
    } else if (y === top - 1) {
      put(x, y, z, ROOF);                                             // roof of an interior cell
    } else if (STRINGS.includes(y) || y === 8) {
      put(x, y, z, FLOOR);                                            // floor plates (air between)
    }
  }
}

// a door recess: marble flanking the north entrance, and a short bronze-framed transom above it
for (const y of [1, 2]) { put(DOOR.x - 1, y, DOOR.z, MARBLE); put(DOOR.x + 1, y, DOOR.z, MARBLE); }

// roof: the body's roof is the top of each non-tower interior cell (y 8); HVAC boxes stand on it at y 9
const hvac = [[5, 2], [6, 2], [5, 3], [6, 3], [1, 11], [2, 11], [1, 12], [2, 12]];
for (const [x, z] of hvac) {
  if (inF(x, z) && !isBoundary(x, z) && topOf(x, z) === BODY) put(x, 9, z, "light_gray_concrete");
}
// the tower's cap: a cornice ring on its perimeter, roof inside
for (const [key, { top }] of foot) {
  if (top !== TOWER) continue;
  const [x, z] = key.split(",").map(Number);
  const edge = !inF(x - 1, z) || !inF(x + 1, z) || topOf(x - 1, z) !== TOWER || topOf(x + 1, z) !== TOWER || topOf(x, z - 1) !== TOWER || topOf(x, z + 1) !== TOWER;
  put(x, 9, z, edge ? TRIM : ROOF);
}

// warm light behind some sashes (inside the air gap, one cell in from the glass, on the storey's room row)
for (const [key, { top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (!isBoundary(x, z) || isCorner(x, z)) continue;
  const f = exposed(x, z);
  const along = f.w || f.e ? z : x;
  for (const y of [4, 7]) {
    if (y >= top - 1 || along % 3 === 0 || isDoor(x, z)) continue;
    const [ix, iz] = f.w ? [x + 1, z] : f.e ? [x - 1, z] : f.n ? [x, z + 1] : [x, z - 1];
    if (!inF(ix, iz) || isBoundary(ix, iz)) continue;
    if ((along + y) % 4 === 0) put(ix, y, iz, y === 4 ? "glowstone" : "shroomlight");
  }
}

g.save(`${DIR}/DC80136.nbt`);
console.log(`DC80136: ${g.count()} blocks, palette ${g.palette.length - 1}`);
