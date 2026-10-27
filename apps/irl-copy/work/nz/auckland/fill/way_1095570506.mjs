// Way 1095570506: an 11 x 9 Edwardian brick shop block (three bays at the north corner, two storeys elsewhere),
// with a stone plinth, string courses, a stone cornice and parapet, sash-style glazing on a 3-block pier rhythm,
// one timber shop door on the street front, and warm glowstone just inside some windows. Shell only: no partitions,
// an air gap behind the glass, and a floor slab at each storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570506.cells.json", "utf8"));

// Lidar roof heights (above y 0) become three flat tiers: the north-corner bay (10) is a tower two blocks above the
// main roof; the main roof (8) and the lower wing (7) are the two tiers below. The lone 10 at (8,2) is a spike among
// 7s, so it joins the lower wing. A roof's top course is at roof - 1.
const TOWER = new Set(["2,0", "3,0", "2,1"]);
const top = new Map();                                    // "x,z" -> y of the cornice course (the roof)
for (const [x, z, , roof] of cells) {
  const k = `${x},${z}`;
  top.set(k, TOWER.has(k) ? 9 : roof >= 8 && roof < 10 ? 7 : 6);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inside = (x, z) => top.has(`${x},${z}`);
// the outward directions a wall cell at height y faces: off the footprint, or beside a neighbour that stops below y
const exposure = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || top.get(`${x + dx},${z + dz}`) < y);

const B = new Map();                                      // "x,y,z" -> [block, state]
const put = (x, y, z, name, state) => B.set(`${x},${y},${z}`, [name, state]);
const has = (x, y, z) => B.has(`${x},${y},${z}`);

const DOOR = [6, 7];                                      // street front (south), the cell with the shop door
const WINDOW_LIGHT = (x, z, y) => (x + z + y) % 3 === 0;  // about a third of the lit windows get a glowstone behind

for (const [k, T] of top) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => !inside(x + dx, z + dz));

  put(x, 0, z, "stone_bricks");                           // plinth and ground floor
  put(x, 4, z, "smooth_stone");                           // storey line / floor slab
  put(x, T, z, "smooth_stone");                           // cornice course, flat roof over every cell
  if (T > 8) put(x, 8, z, "smooth_stone");                // tower floor slab
  if (edge) put(x, T + 1, z, "stone_bricks");             // parapet on the perimeter

  for (let y = 1; y < T; y++) {
    if (y === 4 || (y === 8 && T > 8)) continue;          // slabs placed above
    const exp = exposure(x, z, y);
    if (!exp.length) continue;                            // interior air
    const corner = exp.length > 1;
    const [dx, dz] = exp[0];
    const u = dx !== 0 ? z : x;                           // position along the face
    const win = !corner && u % 3 === 1;                   // glazing on every third block; piers between
    const glassState = dz !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                                : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    if (x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2)) { put(x, y, z, "oak_door", y === 1 ? { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } : { half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (x === DOOR[0] && z === DOOR[1] && y === 3) { put(x, y, z, "oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" }); continue; }  // door hood
    if (y === 3 || (win && y === 6)) put(x, y, z, "stone_bricks");        // lintel band
    else if (win) put(x, y, z, "glass_pane", glassState);
    else put(x, y, z, "bricks");                          // piers and corners
  }
}

// warm light just inside some ground and first-floor windows, standing on the floor (y 1 and y 5), not floating
for (const [k, T] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 1; y < T; y++) {
    if (!B.has(`${x},${y},${z}`) || B.get(`${x},${y},${z}`)[0] !== "glass_pane" || !WINDOW_LIGHT(x, z, y)) continue;
    const exp = exposure(x, z, y);
    if (exp.length !== 1) continue;
    const [dx, dz] = exp[0];
    const ix = x - dx, iz = z - dz, iy = y <= 2 ? 1 : 5;
    if (!inside(ix, iz) || has(ix, iy, iz) || exposure(ix, iz, iy).length) continue;
    put(ix, iy, iz, "glowstone");
  }
}

// plant boxes on the flat roofs, away from the parapet
put(4, 8, 3, "iron_block");
put(7, 7, 5, "iron_block");

const g = new Voxels([11, 23, 9]);
for (const [key, [name, state]] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, name, state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570506.nbt");
console.log(JSON.stringify(out));
