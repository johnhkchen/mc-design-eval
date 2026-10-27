// Mt Eden, Auckland: a 1930s brick commercial block in the inter-war Stripped Classical manner. Two storeys over a
// stone base course, a three-storey corner wing where the lidar roof stands at 11-12, cream string courses, quoins,
// cornice and parapet, glass-pane shopfronts and upper windows with sills, a recessed dark-oak door, and a few lamps
// behind the glass. Walls are one brick thick around the footprint with an air gap behind the glass; the rest is
// floor slabs and a roof deck, not rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${SRC}/way_363687872.cells.json`, "utf8"));

// lidar roof height -> flat tier (wing 12, body 9, low strip 5); then a 3x3 majority inside the footprint so single
// noisy cells and one-cell edge strips take the tier around them
const tierOf = (r) => (r >= 11 ? 12 : r >= 8 ? 9 : 5);
const grid = new Map();
for (const [x, z, g, r] of cells) grid.set(`${x},${z}`, { x, z, g, t: tierOf(r) });
const at = (x, z) => grid.get(`${x},${z}`) ?? null;
{
  const next = [];
  for (const c of grid.values()) {
    const n = {};
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const o = at(c.x + dx, c.z + dz); if (o) n[o.t] = (n[o.t] || 0) + 1;
    }
    let best = c.t;
    for (const k of Object.keys(n)) if (n[k] > (n[best] || 0)) best = Number(k);
    next.push([c, best]);
  }
  for (const [c, t] of next) c.t = t;
}

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const covers = (c, y) => !!c && y >= c.g && y < c.t;
// the faces of cell c at height y that open to air: off the footprint, or past a neighbour that does not reach y
const openFaces = (c, y) => DIRS.filter(([dx, dz]) => !covers(at(c.x + dx, c.z + dz), y))
  .map(([dx, dz, name]) => ({ dx, dz, name, outside: !at(c.x + dx, c.z + dz) }));

// the entrance: the northmost ground-level body cell on the street edge, nearest the middle of the frontage
const exteriorBody = [...grid.values()].filter((c) => c.g === 0 && c.t === 9 && openFaces(c, 1).some((f) => f.outside));
const minZ = Math.min(...exteriorBody.map((c) => c.z));
const doorCell = exteriorBody.filter((c) => c.z === minZ).sort((a, b) => Math.abs(a.x - 16.5) - Math.abs(b.x - 16.5))[0];
const doorFace = openFaces(doorCell, 1).find((f) => f.outside);

// lamps: one window in four on the storey's lamp row, the air cell just behind it (lit, sitting on that storey's floor)
const lamps = new Set();
for (const c of grid.values()) {
  for (const b of [0, 4, 8]) {
    const row = b + 1; if (row >= c.t - 1 || row < c.g) continue;
    const face = openFaces(c, row).find((f) => f.outside); if (!face) continue;
    const along = face.dx ? c.z : c.x; if (along % 3 === 0) continue;             // a pier, not a window
    if ((c.x * 5 + c.z * 3 + b) % 4 !== 0) continue;
    const ix = c.x - face.dx, iz = c.z - face.dz, inner = at(ix, iz);
    if (inner && inner.g < row && openFaces(inner, row).length === 0) lamps.add(`${ix},${iz},${row}`);
  }
}

const GLASS = (north) => ["glass_pane", { north: String(north), south: String(north), east: String(!north), west: String(!north), waterlogged: "false" }];

// what stands at (c, y): foundation below the ground, the walls and their courses, the floors and roof deck inside
function block(c, y) {
  if (y < c.g) return ["stone_bricks"];                                   // foundation up to the lowest ground
  if (y >= c.t) return null;
  const open = openFaces(c, y);
  if (!open.length) {                                                     // interior: air, floor slabs, roof deck
    if (lamps.has(`${c.x},${c.z},${y}`)) return ["glowstone"];
    return y === c.g || y === 4 || y === 8 || y === c.t - 1 ? ["smooth_stone"] : null;
  }
  const outside = open.filter((f) => f.outside);
  if (y === c.g) return ["stone_bricks"];                                 // base course
  if (doorCell && c.x === doorCell.x && c.z === doorCell.z && y <= 3) {  // recessed entrance: door, cream lintel
    if (y === 3) return ["smooth_quartz"];
    return ["dark_oak_door", { facing: doorFace.name, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === c.t - 1) return ["smooth_quartz"];                            // cornice and parapet cap
  if (y === 4 || y === 8) return ["smooth_quartz"];                       // string courses
  const face = outside[0];
  if (!face) return ["bricks"];                                           // shared walls and steps between tiers
  if ((face.dx ? c.z : c.x) % 3 === 0) return ["bricks"];                 // piers
  if (y < 3) return GLASS(!face.dx);                                      // shopfront glass
  if (y === 3) return ["bricks"];                                         // ground-floor lintel
  if (y % 4 === 1) return ["smooth_quartz"];                              // upper window sills
  return GLASS(!face.dx);
}

const g = new Voxels([34, 25, 43]);
for (const c of grid.values()) {
  for (let y = 0; y < c.t; y++) {
    const b = block(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// roof: two HVAC boxes and a stair/lift overrun on the body roof (tier 9), each standing on the roof deck
const body2x2 = (x, z) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => at(x + dx, z + dz)?.t === 9);
const spots = [];
for (const c of [...grid.values()].sort((a, b) => a.z - b.z || a.x - b.x)) {
  if (!body2x2(c.x, c.z)) continue;
  if (spots.some((s) => Math.max(Math.abs(s.x - c.x), Math.abs(s.z - c.z)) < 4)) continue;
  spots.push({ x: c.x, z: c.z });
  if (spots.length === 3) break;
}
spots.forEach((s, i) => {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    if (i < 2) g.set(s.x + dx, 9, s.z + dz, "light_gray_concrete");
    else { g.set(s.x + dx, 9, s.z + dz, "bricks"); g.set(s.x + dx, 10, s.z + dz, "smooth_quartz"); }
  }
});

g.save(`${SRC}/way_363687872.nbt`);
