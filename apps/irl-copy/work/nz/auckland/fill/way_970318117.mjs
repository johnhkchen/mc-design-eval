// Mt Eden / Newton office-flats block, c. 1970s: a precast-concrete slab on a stone base, a five-storey spine on the
// lowest ground (west) stepping down to a two-storey body and a one-storey podium on the hill (north-east).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_970318117.cells.json`, "utf8"));

// materials
const BODY = "white_concrete", FRAME = "light_gray_concrete", GLASS = "light_blue_stained_glass", DOOR = "tinted_glass";
const BASE = "stone_bricks", FILL = "gray_concrete", CORNICE = "smooth_stone", ROOF = "light_gray_concrete", LAMP = "glowstone";

const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
// storey lines on one shared grid (4-block storeys from y 2): every tier lands on the same course, so the facade's
// bands run level round the building and the lidar's roof heights snap onto them
const LINES = [2, 6, 10, 14, 18, 22];
const ENTRANCE = { x: [22, 23], z: 46 };   // south face, lowest ground on that side

const key = (x, z) => `${x},${z}`;
const cellOf = new Map();
for (const [x, z, ground, roof] of cells) cellOf.set(key(x, z), { x, z, g: ground, r: roof });
const at = (x, z) => cellOf.get(key(x, z));

const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// the storey line nearest the smoothed roof that is at least one block above this cell's ground
function snapTop(c) {
  const ok = LINES.filter((b) => b >= c.g + 1);
  return ok.reduce((best, b) => (Math.abs(b - c.s) < Math.abs(best - c.s) ? b : best), ok[0]);
}

for (const c of cellOf.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  c.s = median(near);                                                    // the lidar roof, de-noised
  c.top = snapTop(c);                                                    // top of the wall course (parapet sits on it)
  c.dir = Object.keys(DIRS).find((d) => !at(c.x + DIRS[d][0], c.z + DIRS[d][1]));   // an exposed face, if any
}

const g = new Voxels([34, 35, 49]);
const glass = [];                                                        // { x, y, z, dir } of every pane (and the door)
const bandOf = (y) => LINES.filter((b) => b <= y).pop();                 // the storey line at or below y (y >= 2)
const isDoor = (c, y) => c.z === ENTRANCE.z && ENTRANCE.x.includes(c.x) && (y === 3 || y === 4);

for (const c of cellOf.values()) {
  for (let y = 0; y < c.top; y++) {
    let block = BODY;
    if (y < c.g) block = FILL;                                           // foundation fill below grade
    else if (y < 2 || y === c.g) block = BASE;                           // base course at grade and the plinth
    else if (y === c.top - 1) block = c.dir ? CORNICE : ROOF;            // cornice on the face, roof membrane inside
    else if (c.dir) {
      const row = y - bandOf(y);                                         // 0 storey line, 1-2 glazing, 3 spandrel
      const u = c.dir === "N" || c.dir === "S" ? c.x : c.z;              // position along the face
      if (isDoor(c, y)) { block = DOOR; glass.push({ x: c.x, y, z: c.z, dir: c.dir }); }
      else if (row === 0) block = FRAME;
      else if (row === 3) block = BODY;
      else if (bandOf(y) === 2 || u % 3 !== 0) { block = GLASS; glass.push({ x: c.x, y, z: c.z, dir: c.dir }); }
      else block = FRAME;                                                // mullion between window bays
    }
    if (c.dir && c.z === ENTRANCE.z && ENTRANCE.x.includes(c.x) && y === 5) block = FRAME;   // lintel over the door
    g.set(c.x, y, c.z, block);
  }
}

// panes stand off the wall: the cell behind each pane is air (a room's depth), or a lamp in one window in six
for (const p of glass) {
  const [dx, dz] = DIRS[p.dir];
  const ix = p.x - dx, iz = p.z - dz;
  if (!at(ix, iz)) continue;
  const lit = p.y > 3 && ((p.x * 5 + p.y * 7 + p.z * 3) % 6 === 0);
  g.set(ix, p.y, iz, lit ? LAMP : "air");
}

// roof plant: a 2x2 box on the tallest interior roof, standing on the tower's top course
const tallest = (x, z) => { const c = at(x, z); return c && c.top === 22 && !c.dir; };
const interiorTop = [...cellOf.values()].filter((c) => tallest(c.x, c.z));
const plantCells = interiorTop.filter((c) => tallest(c.x + 1, c.z) && tallest(c.x, c.z + 1) && tallest(c.x + 1, c.z + 1));
const plant = plantCells[0] ?? interiorTop[Math.floor(interiorTop.length / 2)];
if (plant) for (const [x, z] of plantCells[0] ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]]) {
  g.set(plant.x + x, 22, plant.z + z, FRAME);
  g.set(plant.x + x, 23, plant.z + z, CORNICE);
}

const out = `${HERE}/way_970318117.nbt`;
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ out, blocks, palette, cells: cellOf.size, panes: glass.length, plant: !!plant }));
