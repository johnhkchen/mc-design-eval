// DC81915: a 1910s-1920s brick-and-limestone commercial office at 310 1st St SE, read from the lidar record. Thirteen
// blocks wide, twenty-one deep, on a grade that falls about one block to the south and west. The lidar roof steps from
// a 4-block low wing on the east side, through a 6-block wing and a 7-block ring, up to an 8-block core at the centre:
// three setbacks, each a flat tier, the core carrying two small roof boxes.
//
// Red brick walls with calcite piers every third cell, a stone-brick plinth, a limestone cornice and a grey tar roof.
// Storey rhythm is absolute (glass on odd rows, brick on even rows) so the storeys line up across the grade: a shopfront
// row at y 1, then a window row at each odd row below the cornice. The north face is the entrance front, with a
// dark-oak door in the middle bay under a limestone hood. Interior cells one step behind a glass bay are air at the
// glass rows, with a solid floor slab on every even row and lamps or glowstone standing in some of the rooms. Other
// interior cells are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC81915.cells.json`, "utf8"));
const W = 13, D = 21, H_MAX = 9;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise), then four flat tiers.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 4 ? 4 : s <= 6 ? 6 : s <= 7 ? 7 : 8;
};

// Per-cell facts: the lidar tier top H, the ground g, the faces to outside, and the faces where a taller neighbour
// steps down from it (the setbacks, which are walls too but get no windows).
const info = new Map();
for (const [x, z, g] of cells) {
  const H = tierOf(x, z);
  const outer = DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f, dx, dz]) => ({ f, dx, dz }));
  const step = DIRS.filter(([, dx, dz]) => inside(x + dx, z + dz) && tierOf(x + dx, z + dz) < H).map(([f, dx, dz]) => ({ f, dx, dz }));
  info.set(key(x, z), { x, z, g, H, outer, step });
}
const at = (x, z) => info.get(key(x, z));

// Piers: every third cell along the north and south faces (by x) and along the east and west faces (by z).
const isPier = (c) => c.outer.some((o) => (o.dz !== 0 && c.x % 3 === 0) || (o.dx !== 0 && c.z % 3 === 0));

// Entrance: the north face, centre bay; a pier at x 3 frames the door at x 4, with a glass bay at x 5.
const DOOR = { x: 4, z: 0 };
const HOOD = (c, y) => c.z === 0 && (c.x === 4 || c.x === 5) && y === 3;

// Windows: glass on the outer faces of odd rows, below the cornice. A window is a glass pane in a non-pier outer cell.
const isWindowCell = (c, y) => c.outer.length > 0 && !isPier(c) && !(c.x === DOOR.x && c.z === DOOR.z) && y % 2 === 1 && y <= c.H - 2;
// A room is an interior cell directly behind a window bay on the outward side. Its air rows are the window rows, but
// only where every neighbour inside the footprint is solid at that row (no hole through a setback), and no neighbour is outside.
const roomBehindWindow = (x, z, y) => {
  const r = at(x, z);
  if (!r || r.outer.length > 0 || r.step.length > 0) return false;
  if (y % 2 !== 1 || y > r.H - 2 || y < r.g) return false;
  const behind = DIRS.some(([, dx, dz]) => {
    const w = at(x + dx, z + dz);
    return w && w.outer.some((o) => o.dx === dx && o.dz === dz) && isWindowCell(w, y);
  });
  if (!behind) return false;
  return DIRS.every(([, dx, dz]) => { const n = at(x + dx, z + dz); return n && n.H > y; });
};

const cell = (x, y, z, id, state) => v.set(x, y, z, id, state);
const v = new Voxels([W, H_MAX, D]);

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

for (const c of info.values()) {
  const { x, z, g, H } = c;
  const facade = c.outer.length > 0 || c.step.length > 0;
  for (let y = 0; y < H; y++) {
    // Below the lidar ground: the foundation (stone) or, on the walls, the plinth course at y 0.
    if (y < g) { cell(x, y, z, facade && y === 0 ? "stone_bricks" : "stone"); continue; }
    if (y === 0 && facade) { cell(x, y, z, "stone_bricks"); continue; }                     // plinth course
    if (y === H - 1) { cell(x, y, z, facade ? "smooth_stone" : "stone"); continue; }         // cornice / tar roof
    if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
      cell(x, y, z, "dark_oak_door", y === 1 ? DOOR_LOWER : DOOR_UPPER); continue;
    }
    if (HOOD(c, y)) { cell(x, y, z, "smooth_stone"); continue; }                              // limestone hood over the entrance
    if (c.outer.length > 0) {
      if (isPier(c)) { cell(x, y, z, "calcite"); continue; }
      if (isWindowCell(c, y)) { cell(x, y, z, "glass_pane"); continue; }
      cell(x, y, z, "bricks"); continue;
    }
    if (c.step.length > 0) { cell(x, y, z, "bricks"); continue; }                             // setback wall above the step-down
    // Interior: the entrance lobby is open through its two rows; window rooms are air at the glass rows and lit in some.
    if (x === DOOR.x && z === 1 && (y === 1 || y === 2)) continue;
    if (roomBehindWindow(x, z, y)) {
      const h = hash(x, y, z) % 7;
      if (h === 0) cell(x, y, z, "glowstone");
      else if (h === 3) cell(x, y, z, "lantern", LANTERN);
      continue;
    }
    cell(x, y, z, "stone");
  }
}

// Roof plant: two small boxes on the 8-block core, standing on its roof deck.
for (const [x0, z0, w, d] of [[6, 6, 2, 2], [9, 10, 1, 2]]) {
  for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < d; dz++) cell(x0 + dx, 8, z0 + dz, "light_gray_concrete");
}

const counts = v.save(`${DIR}/DC81915.nbt`);
console.log("DC81915.nbt", counts);
