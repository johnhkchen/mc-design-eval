// Way 1095570523, Mt Eden / Eden Terrace side: a two-storey red-brick commercial block of the 1920s, the kind that
// lines the Mt Eden and Newton shopping streets. Footprint from the cells file (32 cells, an irregular wedge). The
// lidar reads ground 0 and roof 9 on every cell, so it is one flat roof: walls to y 8, a stone cap course to y 9.5.
// Ground storey: shopfront glazing in bays between stone piers under a brick lintel, a dark-oak door on the north
// side under a stone head. Upper storey: a window grid of panes between brick piers, a stone plinth at y 0 and a stone
// string course at y 4 (the trim), and a brick parapet. Interiors are an air gap with floor slabs at y 0 and y 4 and the roof deck at y 8;
// glowstone sits inside some upper windows. A two-by-two plant room stands on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095570523.cells.json`, "utf8"));
const OUT = `${DIR}/way_1095570523.nbt`;

const FLOOR = "smooth_stone", BRICK = "bricks", STONE = "stone_bricks", ROOF = "stone";
const CAP = "stone_brick_slab", GLASS = "glass_pane", DOOR = "dark_oak_door", GLOW = "glowstone";
const PLANT = "stone_bricks", PLANT_CAP = "stone_brick_slab";

const H = Math.max(...cells.map((c) => c[3]));           // roof top (9); cap course sits on top of it
const SIZE = [7, 22, 9];
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const key = (x, y, z) => `${x},${y},${z}`;
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));

const g = new Voxels(SIZE);
const placed = new Map();                                // "x,y,z" -> block, for pane connections
const panes = [];
const put = (x, y, z, block, state) => {
  g.set(x, y, z, block, state);
  placed.set(key(x, y, z), block);
  if (block === GLASS) panes.push([x, y, z]);
};

const DOOR_CELL = [1, 0], DOOR_FACE = "north";
const glowCells = [];

for (const [x, z, ground, roof] of cells) {
  const ex = exposed(x, z);
  const wall = ex.length > 0, corner = ex.length > 1;
  const top = Math.min(H, roof);
  // the along-face index picks the window bays: x on north/south faces, z on east/west
  const along = ex[0] === "north" || ex[0] === "south" ? x : z;
  const isDoor = x === DOOR_CELL[0] && z === DOOR_CELL[1] && ex.includes(DOOR_FACE);

  // foundation / ground floor slab
  for (let y = 0; y < ground; y++) put(x, y, z, STONE);
  if (!wall) put(x, 0, z, FLOOR);
  else put(x, 0, z, STONE);

  if (!wall) {
    // interior: air, with floor slabs at y 4 and the roof deck at the top
    put(x, 4, z, FLOOR);
    put(x, top - 1, z, ROOF);
    continue;
  }

  for (let y = 1; y < top; y++) {
    let b = null, s;
    if (y === 4) b = STONE;                                 // string course
    else if (y <= 2) {                                      // shopfront band
      if (isDoor) { b = DOOR; s = { facing: DOOR_FACE, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
      else b = along % 2 === 1 && !corner ? GLASS : STONE;   // glazed bays between stone piers
    } else if (y === 3) b = isDoor ? STONE : BRICK;          // lintel band; the door gets a stone head
    else if (y <= 6) {                                       // upper storey window grid
      b = along % 2 === 1 && !corner ? GLASS : BRICK;
    } else b = BRICK;                                        // y 7 spandrel, y 8 parapet
    if (b === GLASS) s = { north: "false", south: "false", east: "false", west: "false" };
    if (b) put(x, y, z, b, s);
  }
  // cap course on the parapet
  put(x, top, z, CAP, { type: "bottom", waterlogged: "false" });
}

// glowstone behind the upper windows that open onto interior air
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  // a window cell at y 5 with a room behind it
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const bay = ex[0] === "north" || ex[0] === "south" ? x : z;
  if (bay % 2 !== 1) continue;
  const [dx, dz] = DIRS[ex[0]];
  const ix = x - dx, iz = z - dz;                           // inward: opposite the exposed face
  if (!inFp(ix, iz) || exposed(ix, iz).length) continue;   // only where the room behind is interior
  glowCells.push([ix, 5, iz]);
}
for (const [x, y, z] of glowCells) put(x, y, z, GLOW);

// pane connections: a pane joins a neighbour that is built, so the glass runs into the piers and the next pane
const CONN = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [x, y, z] of panes) {
  const st = {};
  for (const [d, [dx, dz]] of Object.entries(CONN)) st[d] = placed.has(key(x + dx, y, z + dz)) ? "true" : "false";
  g.set(x, y, z, GLASS, st);
}

// roof plant room: a 2 x 2 block of stone on the roof deck, inside the parapet, with a cap slab
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) {
  put(x, H, z, PLANT);
  put(x, H + 1, z, PLANT_CAP, { type: "bottom", waterlogged: "false" });
}

const stats = g.save(OUT);
console.log(JSON.stringify({ out: OUT, footprint: cells.length, roof: H, glow: glowCells.length, panes: panes.length, ...stats }));
