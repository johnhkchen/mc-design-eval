// 201006.0005534, Presidio Tunnel Tops, Main Post frame. Miscellaneous/Mixed-Use, 3550 West Pacific Avenue. Footprint 17 x 16
// (143 cells, 113 on the higher ground and 30 on the lowest). Read from the record: a 1920s Presidio Heights stucco block with
// a shop front on the street and three residential storeys above it. Storeys are 2 blocks (4 m); roof deck and parapet top
// sit at y 8 and y 9, about 8 blocks above the lowest ground. Materials: stone-brick plinth, cream smooth-quartz stucco with
// polished-andesite string courses, dark-oak shop bulkhead and two dark-oak entrance doors under dark-oak canopies, glass panes in
// piered window bands, a stone-brick parapet and a small stair penthouse. Warm lights sit in the gaps behind some glass.
// Blocks: every footprint cell has a solid base course at y 0-1 (fill to the ground, then a plinth on the lower cells), and
// the walls rise from there. No interiors: each storey has a floor slab, an air gap sits behind every window, and only lights
// stand in the gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0005534.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [17, 14, 16];
const ROOF = 8;                 // interior roof deck at y 8; parapet on the outer walls at y 8, top face 9
const g = new Voxels(SIZE);
const plan = new Map();         // "x,y,z" -> { block, state }, so panes can read their neighbours before they are placed
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });

const ground = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const inside = (x, z) => ground.has(`${x},${z}`);
// Outward normals: north is -z, the street front, then south (+z), west (-x), east (+x).
const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const boundary = (x, z) => inside(x, z) && faces(x, z).length > 0;
const interior = (x, z) => inside(x, z) && !boundary(x, z);

// Street front: north-facing cells with no side exposure. Doors sit at roughly a third and two thirds along it.
const streetXs = cells.filter(([x, z]) => faces(x, z).length === 1 && faces(x, z)[0][1] === -1).map(([x]) => x).sort((a, b) => a - b);
const doorXs = new Set([streetXs[Math.floor(streetXs.length * 0.3)], streetXs[Math.floor(streetXs.length * 0.68)]]);
const isStreet = (x, z, fs) => fs.length === 1 && fs[0][1] === -1;

// The pane states come after every block is placed: a pane joins a neighbour that is any block in the same plane.
const hasBlock = (x, y, z) => plan.has(`${x},${y},${z}`);

for (const [x, z, ground0] of cells) {
  // Base course: solid from y 0 up to the cell's ground, plus a stone plinth to y 1 on every cell, so the lower cells show a plinth.
  for (let y = 0; y <= Math.max(1, ground0); y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  if (!fs.length) {
    // Interior: floor slabs at y 2, 4, 6 and the roof deck at y 8, air gaps between them.
    for (const y of [2, 4, 6, ROOF]) put(x, y, z, y === ROOF ? "stone" : "smooth_quartz");
    continue;
  }

  const corner = fs.length > 1;
  const street = isStreet(x, z, fs);
  // The window pattern runs along the facade: three glazed bays, then a pier, repeating.
  const along = fs[0][0] !== 0 ? z : x;
  const windowCol = !corner && along % 4 !== 0;
  const door = street && doorXs.has(x);
  const awning = street && [-1, 0, 1].some((d) => doorXs.has(x + d));

  for (let y = 2; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "stone_bricks"); continue; }                  // parapet on the outer walls
    if (door && (y === 2 || y === 3)) {
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 2 ? "lower" : "upper", hinge: x === Math.min(...streetXs) ? "right" : "left", open: "false", powered: "false" });
      continue;
    }
    if (y % 2 === 0) {                                                              // storey lines: y 2, 4, 6
      if (y === 2) put(x, y, z, street ? "dark_oak_planks" : "stone_bricks");        // shop bulkhead or plinth course
      else if (y === 4 && awning) put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "polished_andesite");
      continue;
    }
    // y 3, 5, 7: the glazed row (shop glass on the street, panes above) or a pier of smooth quartz.
    if (!windowCol) put(x, y, z, "smooth_quartz");
    else if (y === 3 && street) put(x, y, z, "glass");
    else put(x, y, z, "glass_pane");
  }
}

// Warm lights: a lantern on the shop floor behind every second shop window, and glowstone or shroomlight behind a few
// residential windows. The lit cell is the interior cell just inside the wall.
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (!fs.length || fs.length > 1) continue;
  const [dx, dz] = fs[0];
  const ix = x - dx, iz = z - dz;                                                   // one cell inward
  if (!interior(ix, iz)) continue;
  const street = isStreet(x, z, fs);
  if (street && !doorXs.has(x) && x % 2 === 0) put(ix, 3, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (!street && !corner(x, z) && x % 6 === 1) put(ix, 5, iz, "glowstone");
  else if (!street && !corner(x, z) && x % 6 === 4) put(ix, 7, iz, "shroomlight");
}
function corner(x, z) { return faces(x, z).length > 1; }

// Stair penthouse: a 3 x 3 interior square nearest the footprint centre, walls to y 10, a roof at y 11, glass on each side.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let best = null;
for (const [x, z] of cells) {
  const sq = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) sq.push([x + dx, z + dz]);
  if (!sq.every(([a, b]) => interior(a, b))) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = best.x + dx, z = best.z + dz, ring = !(dx === 0 && dz === 0);
    for (const y of [9, 10]) {
      if (!ring) continue;
      const side = (dx === 0) !== (dz === 0);                                       // edge-middle cells carry glass
      put(x, y, z, side && y === 10 ? "glass_pane" : "smooth_quartz");
    }
    put(x, 11, z, "stone_bricks");
  }
}

// Two lanterns on the parapet at the street corners.
const streetCorners = cells.filter(([x, z]) => corner(x, z) && faces(x, z).some(([, dz]) => dz === -1)).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
if (streetCorners.length >= 2) {
  for (const [x, z] of [streetCorners[0], streetCorners[streetCorners.length - 1]]) put(x, ROOF + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pane connections: a pane joins any block beside it in its plane, so bands of glass run into their piers.
const dirs = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
for (const [key, entry] of plan) {
  if (entry.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const st = {};
  for (const [name, dx, dz] of dirs) {
    const n = plan.get(`${x + dx},${y},${z + dz}`);
    st[name] = n && !["lantern", "dark_oak_door", "dark_oak_slab"].includes(n.block) ? "true" : "false";
  }
  st.waterlogged = "false";
  entry.state = st;
}

for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}

const out = g.save(`${DIR}/201006.0005534.nbt`);
console.log("saved", out);
