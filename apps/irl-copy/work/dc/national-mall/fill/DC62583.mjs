import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 13 x 18 footprint, a stripped Classical office block of pale limestone (Federal Triangle / Mall-edge, c. 1930s):
// a 4-storey body whose lidar roof reads 13, and a central 2-storey penthouse core over the roof of 15 (snapped to
// the 13 and 15 tiers: the 12 and 14 readings are noise). Floors are absolute bands: a ground storey (windows, a
// portico bay on the z = 0 street face), then 3-block storeys of window rows between quartz string courses, a
// parapet on the 13 tier, and the core's own window row at 13 under a cornice at 14. Shell only: the walls are one
// block thick, interiors are air between solid floor slabs, glowstone sits behind some panes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62583.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 13, D = 18, Y = 27;
const g = new Voxels([W, Y, D]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // east, west, south, north (north is z = 0, the street face)
const CORE_ROOF = 15;
const PANE = "light_blue_stained_glass_pane";
const WALL = new Set(["calcite", "smooth_quartz"]); // what a pane joins along its wall
const FLOORS = new Set([4, 7, 10, 12, 14]); // slabs and string courses: 4, 7, 10 storey lines; 12 the roof; 14 the core roof

const cellMap = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { g: gr, roof }]));
const at = (x, z) => cellMap.get(`${x},${z}`) ?? null;
const inFp = (x, z) => at(x, z) !== null;
const isCore = (x, z) => (at(x, z)?.roof ?? 0) >= CORE_ROOF;
const exposed = (x, z, inSet) => DIRS.filter(([dx, dz]) => !inSet(x + dx, z + dz));

// the block at x, y, z as { b, s } (block id, state) or null for air; a pure function of the footprint, so pane joins
// can look at their neighbours before anything is placed
function spec(x, y, z) {
  const c = at(x, z); if (!c) return null;
  const core = isCore(x, z), top = core ? 14 : 12, gr = c.g;
  if (y < gr) return { b: "stone_bricks" };                                          // foundation under the whole cell
  if (y === gr) return exposed(x, z, inFp).length ? { b: "polished_granite" } : { b: "smooth_stone" }; // plinth / ground slab
  if (!core && y === 13) return exposed(x, z, inFp).length ? { b: "smooth_quartz_slab", s: { type: "bottom" } } : null; // parapet
  if (y > top) return null;
  const ex = y > 12 ? exposed(x, z, isCore) : exposed(x, z, inFp);                    // the shell this row closes
  if (FLOORS.has(y)) return ex.length ? { b: "smooth_quartz" } : { b: "smooth_stone" };
  if (!ex.length) return null;                                                       // interior air between floor slabs
  // entrance: a dark oak door on the street face, flanked by piers
  if (z === 0 && x >= 3 && x <= 5 && y > gr && y <= 3) {
    if (x === 4 && y <= gr + 2) return { b: "dark_oak_door", s: { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    if (x !== 4) return { b: "calcite" };
  }
  // bays: corners and every third cell along a face are piers; the rest are panes in the window rows
  const pier = ex.length >= 2 || (ex[0][0] !== 0 ? z : x) % 3 === 0;
  if (pier) return { b: "calcite" };
  return { b: PANE };
}

// a pane joins the neighbouring panes and wall stone along its face, as the game does
function paneJoins(x, y, z) {
  const join = (dx, dz) => { const n = spec(x + dx, y, z + dz); return !!n && (n.b === PANE || WALL.has(n.b)); };
  const v = (on) => (on ? "true" : "false");
  return { east: v(join(1, 0)), west: v(join(-1, 0)), south: v(join(0, 1)), north: v(join(0, -1)) };
}

// the blocks, every cell placed once
const placed = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < Y; y++) {
  const sp = spec(x, y, z); if (!sp) continue;
  const state = sp.b === PANE ? paneJoins(x, y, z) : sp.s;
  g.set(x, y, z, sp.b, state);
  placed.push([x, y, z]);
}

// warm light behind some panes: glowstone at the ground storey and the first upper row, shroomlight higher, on the
// interior cell just inside the glass, only where that cell is air (the floor slab below holds it up)
for (const [x, y, z] of placed) {
  const sp = spec(x, y, z); if (sp?.b !== PANE) continue;
  const ex = exposed(x, z, inFp); if (ex.length !== 1) continue;
  const along = ex[0][0] !== 0 ? z : x;
  if (along % 4 !== 1) continue;
  const [dx, dz] = ex[0];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || spec(ix, y, iz) !== null) continue;
  if (y <= 3 || y === 5) g.set(ix, y, iz, "glowstone");
  else if (y === 8 || y === 9) g.set(ix, y, iz, "shroomlight");
}

// roof plant on the 13 tier, inside the parapet: two air-cooled boxes over the east half of the body
for (let z = 6; z <= 7; z++) for (let x = 8; x <= 9; x++) {
  if (isCore(x, z) || exposed(x, z, inFp).length) continue;
  g.set(x, 13, z, "smooth_stone"); g.set(x, 14, z, "smooth_stone");
}

g.save(`${DIR}/DC62583.nbt`);
