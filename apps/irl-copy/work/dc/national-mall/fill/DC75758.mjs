import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 19th-century brick office block with limestone trim (Federal Triangle / Smithsonian-era commercial), 3 storeys
// over a plinth, the 7-block core on the east and south, 2-storey brick wings on the west. Walls are one cell thick;
// each window is a glass pane in the outer cell with an air gap behind it in the interior cell, and the belt course
// and roof cap are solid slabs over every column.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75758.cells.json`, "utf8"));

const X = 5, Y = 8, Z = 7;
const g = new Voxels([X, Y, Z]);

const BRICK = "bricks", TRIM = "smooth_quartz", FOUND = "stone_bricks", ROOF = "smooth_stone";
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];               // outward (dx, dz): n, e, s, w

const key = (x, y, z) => `${x},${y},${z}`;
const map = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { gr, roof }]));
const cell = (x, z) => map.get(`${x},${z}`);
const exterior = (x, z) => DIRS.filter(([dx, dz]) => !cell(x + dx, z + dz));
const interior = (x, z) => cell(x, z) && exterior(x, z).length === 0;

// Pass 1: the window cells. An exterior cell (not a corner) takes a pane on a face whose inward neighbour is an
// interior cell, on alternate bays; the ground band (y 2-3) always, the upper band (y 5) only on the 7-block core.
const panes = new Map();   // key -> { x, y, z, face }
const gaps = [];           // interior air cells behind the glass: { x, y, z, ground }
for (const [x, z, gr, roof] of cells) {
  const ext = exterior(x, z);
  if (!ext.length || ext.length > 1) continue;
  const [dx, dz] = ext[0];
  const ix = x - dx, iz = z - dz;
  if (!interior(ix, iz)) continue;
  const idx = dx !== 0 ? z : x;
  if (idx % 2 !== 1) continue;
  for (const y of [2, 3]) if (y >= gr) panes.set(key(x, y, z), { x, y, z, dx, dz, ix, iz, ground: true });
  if (roof === 7 && cell(ix, iz).roof === 7) panes.set(key(x, 5, z), { x, y: 5, z, dx, dz, ix, iz, ground: false });
}
// A pane whose gap is another pane is dropped, so no cell is both glass and air
for (const [k, p] of panes) {
  if (panes.has(key(p.ix, p.y, p.iz))) panes.delete(k);
}
for (const p of panes.values()) gaps.push({ x: p.ix, y: p.y, z: p.iz, ground: p.ground });
// The street entrance: south side, the cell at x 3 (its hall is the cell inside it)
const DOOR = { x: 3, z: 6 };

// Pass 3: the plan, cell by cell, bottom to top
const out = new Map();   // key -> [block, state]
const put = (x, y, z, b, s) => out.set(key(x, y, z), [b, s]);

for (const [x, z, gr, roof] of cells) {
  const ext = exterior(x, z);
  for (let y = 0; y < roof; y++) {
    if (y < gr) { put(x, y, z, FOUND); continue; }                       // foundation to the cell's own ground
    if (y === gr) { put(x, y, z, ext.length ? TRIM : BRICK); continue; }  // base course on the street
    if (y === roof - 1) { put(x, y, z, ext.length ? TRIM : ROOF); continue; }   // cornice or roof cap
    if (y === 4) { put(x, y, z, ext.length ? TRIM : BRICK); continue; }   // belt course: the storey slab
    if (!ext.length) { put(x, y, z, BRICK); continue; }                   // interior: solid, no rooms
    put(x, y, z, BRICK);                                                  // brick walls; the stone courses above are the articulation
  }
}

// Glass, with the framing and the air gaps behind
for (const p of panes.values()) {
  const pane = p.dz !== 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(p.x, p.y, p.z, "glass_pane", pane);
}
// Warm lights: glowstone on the floor behind every third window, a hanging lantern behind the next (ground band only)
let w = 0;
for (const gp of gaps) out.delete(key(gp.x, gp.y, gp.z));
for (const gp of gaps) {
  if (gp.ground && gp.y === 2 && w % 3 === 0) put(gp.x, 2, gp.z, "glowstone");
  else if (gp.ground && gp.y === 3 && w % 3 === 1) put(gp.x, 3, gp.z, "lantern", { hanging: "true", waterlogged: "false" });
  if (gp.ground && gp.y === 2) w++;
}

// The street entrance: a door in the south wall, a stone lintel over it, a lantern in the transom
{
  const { x, z } = DOOR;
  out.set(key(x, 0, z), ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }]);
  out.set(key(x, 1, z), ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }]);
  put(x, 2, z, TRIM);
  put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  // the hall behind the door is air
  out.delete(key(x, 0, z - 1)); out.delete(key(x, 1, z - 1));
}

// Roof plant: a brick chimney stack on the core's interior roof
put(3, 7, 4, BRICK);

for (const [k, [b, s]] of out) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}

g.save(`${DIR}/DC75758.nbt`);
const tally = {};
for (const [b] of out.values()) tally[b] = (tally[b] || 0) + 1;
console.log("cells", out.size, "panes", panes.size, "gaps", gaps.length, tally);
