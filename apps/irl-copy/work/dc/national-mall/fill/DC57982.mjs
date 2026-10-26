import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1738 Connecticut Ave NW (Dupont/Kalorama): a 1920s brick store-restaurant block. Three storeys (shopfront, two
// upper floors) on a stone plinth, stone quoins and string courses, a stone parapet, setbacks from the lidar tiers
// (8-block pavilions and a rear core, 7, 6 wings, 5 edges). Solid masonry with recessed glass: each pane has an air
// pocket (or a warm light) behind it, and there are no room interiors. The street is the z = 6 face.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57982.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC57982.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const STREET = "S", DOOR_X = 4;
const k2 = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, ground, roof]) => [k2(x, z), { ground, roof }]));
const inFp = (x, z) => fp.has(k2(x, z));

// roof heights in blocks above y 0; three lidar-noise cells take the tier of their neighbours
const NOISE = { "8,1": 6, "4,5": 6, "9,6": 6 };
const H = (x, z) => NOISE[k2(x, z)] ?? fp.get(k2(x, z)).roof;
const exposed = (x, z) => Object.keys(DIRS).filter(d => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

// storey rows: 1-2 shopfront, 3 string course (awning on the street), 4 second floor, 5 string, 6 third floor
// (8-block cells only); the top row is the parapet
const glassRows = h => [2, ...(h >= 6 ? [4] : []), ...(h >= 8 ? [6] : [])];
const stringRows = h => [3, ...(h >= 7 ? [5] : [])];
// piers sit at 1 mod 3 along each face, so bays read as pairs of windows between brick piers
const bay = (d, x, z) => ((d === "N" || d === "S") ? x : z) % 3 !== 1;

const blocks = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const windows = [];         // [x, y, z, outward face] for each glass candidate

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const h = H(x, z), ex = exposed(x, z), wallCell = ex.length > 0, corner = ex.length > 1;
  for (let y = 0; y < h; y++) {
    let b = "bricks", s = null;
    if (y === 0) b = "stone_bricks";                                   // base course: foundation / plinth
    else if (y === h - 1) b = wallCell ? "smooth_stone" : "gravel";    // parapet, or the flat roof
    else if (wallCell && corner) b = "smooth_stone";                   // stone quoins
    else if (wallCell && ex.length === 1) {
      const d = ex[0], onStreet = d === STREET;
      if (onStreet && y === 3 && x >= 2 && x <= 9) b = x % 2 ? "white_concrete" : "green_concrete";   // striped awning
      else if (onStreet && x === DOOR_X && (y === 1 || y === 2)) {
        b = "dark_oak_door";
        s = { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      }
      else if (stringRows(h).includes(y) && (onStreet || y === 3)) b = "smooth_stone";   // storey lines on the street; the side walls keep brick above the first
      else if (glassRows(h).includes(y) && bay(d, x, z)) { b = "glass_pane"; windows.push([x, y, z, d]); }
      else if (y === 1 && onStreet && bay(d, x, z)) b = "polished_andesite";   // shopfront bulkhead
    }
    put(x, y, z, b, s);
  }
}

// each glass pane needs a pocket of air (or a light) directly behind it; no pocket, no window
let n = 0;
for (const [x, y, z, d] of windows) {
  const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;
  const ok = inFp(ix, iz) && exposed(ix, iz).length === 0 && H(ix, iz) >= y + 2 &&
    Object.keys(DIRS).every(v => v === d || (inFp(ix + DIRS[v][0], iz + DIRS[v][1]) && H(ix + DIRS[v][0], iz + DIRS[v][1]) > y));
  if (!ok) { put(x, y, z, "bricks"); continue; }
  const i = n++, key = `${ix},${y},${iz}`;
  blocks.delete(key);
  if (y === 2 && i % 2 === 0) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });   // shopfront lamps
  else if (y !== 2 && i % 3 === 0) put(ix, y, iz, "glowstone");                                          // warm upper rooms
  // otherwise the pocket stays air behind the glass
}

// panes join the neighbours they touch in their own wall: panes, masonry, glowstone; not doors or lanterns
const joins = (x, y, z) => { const b = blocks.get(`${x},${y},${z}`); return !!b && b.block !== "dark_oak_door" && b.block !== "lantern"; };
for (const [key, v] of blocks) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = { north: joins(x, y, z - 1), south: joins(x, y, z + 1), east: joins(x + 1, y, z), west: joins(x - 1, y, z), waterlogged: "false" };
}

// rooftop plant: two HVAC units on the 8-block core and a short brick flue with a stone cap
put(4, 8, 2, "iron_block");
put(8, 8, 2, "iron_block");
put(9, 8, 2, "bricks");
put(9, 9, 2, "smooth_stone");

const g = new Voxels([12, 20, 7]);
for (const [key, v] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
console.log(g.save(OUT), `${n} window pockets`);
