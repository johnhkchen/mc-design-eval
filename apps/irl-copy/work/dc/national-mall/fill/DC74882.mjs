// 1601 Massachusetts Ave NW: a 1970s Modernist chancery, pale precast-faced walls on a stone plinth, four storeys of
// ribbon windows between calcite piers, a stepped glazed penthouse core two blocks above the wings, and a low
// one-storey pavilion at the south end. Hollow shell: exposed faces are walls, interior air, storey floors and a roof
// membrane, so every window has air behind the glass (warm glowstone in some of them).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74882.cells.json", "utf8"));

const X = 16, Y = 26, Z = 31;
const WALL = "calcite", PLINTH = "stone_bricks", FLOOR = "smooth_stone", ROOF = "light_gray_concrete";
const CORNICE = "smooth_quartz", GLASS = "light_blue_stained_glass_pane", LAMP = "glowstone";
const DOOR = "dark_oak_door", LANTERN = "lantern", PLANT = "gray_concrete";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// per-cell lidar ground (g) and roof (r); null = outside the footprint
const cell = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, g, r] of cells) cell[x][z] = { g, r };
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && cell[x][z] !== null;
const isCore = (x, z) => x >= 3 && x <= 12 && z >= 3 && z <= 21;
const isPav = (x, z) => cell[x][z].r < 12;   // the low south pavilion (lidar 1 to 5)
// the tier top (a clean flat roof): the wings 12, the stepped core 14, the pavilion its lidar height (at least 1 above ground)
const top = (x, z) => (isPav(x, z) ? Math.max(cell[x][z].r, cell[x][z].g + 1) : isCore(x, z) ? 14 : 12);

// the storey lines: ground storey 0 to 3 (plinth, shopfront, lintel), then 3-block storeys with a spandrel, glass, lintel;
// the top storey's glass is capped by a cornice at 11, the penthouse glass at 12 under its cornice at 13
function rowKind(y, g) {
  if (y < 3) return y === g ? "base" : y === g + 1 ? "glass" : "lintel";
  if (y === 11 || y === 13) return "cornice";
  if (y === 12) return "glass";
  const r = (y - 3) % 3;
  return r === 0 ? "spandrel" : r === 1 ? "glass" : "lintel";
}

const B = Array.from({ length: X }, () => Array.from({ length: Y }, () => Array(Z).fill(null)));
const put = (x, y, z, block, state) => { B[x][y][z] = { block, state }; };
const paneState = (xFace) => (xFace
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inFoot(x, z)) continue;
  const { g } = cell[x][z], t = top(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, PLINTH);                 // foundation up to this cell's lidar ground
  if (isPav(x, z)) {
    for (let y = g; y < t; y++) put(x, y, z, y === t - 1 ? CORNICE : WALL);
    continue;
  }
  for (let y = g; y < t; y++) {
    // exposed faces: the footprint's edge, or a neighbour whose top is at or below this layer
    const E = DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || top(x + dx, z + dz) <= y);
    if (!E.length) {
      if ([0, 3, 6, 9].includes(y)) put(x, y, z, FLOOR);
      else if (y === 11 || y === 13) put(x, y, z, ROOF);
      continue;
    }
    const kind = rowKind(y, g);
    const xFace = E.some(([dx]) => dx !== 0), zFace = E.some(([, dz]) => dz !== 0);
    if (kind === "base") put(x, y, z, PLINTH);
    else if (kind === "spandrel" || kind === "lintel") put(x, y, z, WALL);
    else if (kind === "cornice") put(x, y, z, CORNICE);
    else if (xFace && zFace) put(x, y, z, WALL);                       // corner pier
    else if ((xFace ? z : x) % 3 === 0) put(x, y, z, WALL);            // pier between bays
    else put(x, y, z, GLASS, paneState(xFace));
  }
}

// the entrance: a recessed door on the west face, flanked by calcite piers, with a lantern just inside
for (const y of [1, 2]) {
  put(0, y, 14, WALL); put(0, y, 16, WALL);
  const door = { facing: "east", hinge: "left", open: "false", powered: "false" };
  put(0, y, 15, DOOR, { ...door, half: y === 1 ? "lower" : "upper" });
}
put(1, 1, 13, LANTERN, { hanging: "false", waterlogged: "false" });
put(1, 1, 17, LANTERN, { hanging: "false", waterlogged: "false" });

// warm light: some glass has a glowstone just inside it, on a floor (the interior air is the gap behind the glass)
for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) for (let z = 0; z < Z; z++) {
  const b = B[x][y][z];
  if (!b || b.block !== GLASS || (x * 3 + z * 5 + y) % 7 !== 0) continue;
  const E = DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || top(x + dx, z + dz) <= y);
  const [dx, dz] = E[0];
  const ix = x - dx, iz = z - dz;
  if (inFoot(ix, iz) && !B[ix][y][iz] && B[ix][y - 1][iz]) put(ix, y, iz, LAMP);
}

// roof plant on the wing roof, set on the roof membrane
for (const [x, z] of [[13, 6], [14, 6], [13, 7], [14, 7], [13, 17], [14, 17], [13, 18], [14, 18]]) put(x, 12, z, PLANT);

const vox = new Voxels([X, Y, Z]);
let floating = 0;
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
  const b = B[x][y][z];
  if (!b) continue;
  if (y > 0 && !B[x][y - 1][z]) floating++;
  vox.set(x, y, z, b.block, b.state);
}
console.log(`blocks ${vox.count()}, unsupported ${floating}`);
vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74882.nbt");
