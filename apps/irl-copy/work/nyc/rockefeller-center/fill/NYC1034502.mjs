// 1212 Avenue of the Americas (Sixth Avenue, Midtown), 1964: a corporate International Style office block, the
// bronze-and-grey glass slab of its decade on a granite base. Footprint 27 x 34 (x runs across the streets, low z =
// north, low x = the Sixth Avenue front). The lidar roof is read as six flat setbacks, 43 / 49 on the west and north
// wings, 60 and 69 stepping up to the east, 75 and 79 for the tower core. Each storey is 3 blocks: a spandrel row
// (light grey concrete, granite at the corners) and two rows of glass between iron mullions every third cell. The
// facade is one block of skin with a one-block air gap behind it and a floor slab per storey, a solid core inside
// (no interiors). Sixth Avenue and the north side carry a clear-glass shopfront on the ground floor with granite
// piers; the entrances have dark oak double doors under a granite canopy. Some panes have glowstone behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034502.cells.json`, "utf8"));
const X = 27, Z = 34, Y = 90;

const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const pts = cells.map(([x, z]) => [x, z]);
const inFoot = (x, z) => cell.has(key(x, z));

// Lidar roof to a flat tier: clusters to the nearest setback level, then a 3x3 majority (the cell itself counts 1.5)
// so a single noisy cell joins its neighbours. Cells the lidar reads as ground (roof under 10) take their neighbours' tier.
const tierOf = (r) => (r < 40 ? null : r <= 46 ? 43 : r <= 55 ? 49 : r <= 64 ? 60 : r <= 72 ? 69 : r <= 76 ? 75 : 79);
const raw = new Map(cells.map(([x, z, , roof]) => [key(x, z), tierOf(roof)]));
const tierMap = new Map();
for (const [x, z] of pts) {
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const t = raw.get(key(x + dx, z + dz));
    if (t == null) continue;
    votes.set(t, (votes.get(t) ?? 0) + (dx === 0 && dz === 0 ? 1.5 : 1));
  }
  const best = [...votes].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  tierMap.set(key(x, z), best ? best[0] : 43);
}
const T = (x, z) => tierMap.get(key(x, z));
const G = (x, z) => cell.get(key(x, z)).ground;

// A facade cell has a neighbour outside the footprint, or a lower tier beside it (a setback wall).
const outsideDirs = (x, z) => NB.filter(([dx, dz]) => !inFoot(x + dx, z + dz));
const exteriorDirs = (x, z) => NB.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z));
const isFacade = (x, z) => exteriorDirs(x, z).length > 0;
const faceDir = (x, z) => outsideDirs(x, z)[0] ?? exteriorDirs(x, z)[0];

// Distance inward from the skin, in cells: 0 = skin, 1 = the air gap behind the glass, 2+ = solid core.
const dist = new Map();
const queue = [];
for (const [x, z] of pts) if (isFacade(x, z)) { dist.set(key(x, z), 0); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const a = x + dx, b = z + dz;
    if (!inFoot(a, b) || dist.has(key(a, b))) continue;
    dist.set(key(a, b), d + 1); queue.push([a, b]);
  }
}
const D = (x, z) => dist.get(key(x, z)) ?? 99;
const inward = (x, z) => NB.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inFoot(a, b) && D(a, b) === 1);

// Entrances on the Sixth Avenue front (west) and the north side: a double door on the ground storey, canopy above.
const ENTRANCES = [
  { dir: [-1, 0], at: 14, w: 2, facing: "west" },
  { dir: [0, -1], at: 10, w: 2, facing: "north" },
];
const along = (x, z, dir) => (dir[0] !== 0 ? z : x);
const onFace = (x, z, dir) => D(x, z) === 0 && faceDir(x, z)[0] === dir[0] && faceDir(x, z)[1] === dir[1];
const entranceOf = (x, z) => ENTRANCES.find((e) => onFace(x, z, e.dir) && along(x, z, e.dir) >= e.at && along(x, z, e.dir) < e.at + e.w);
const canopyOf = (x, z) => ENTRANCES.some((e) => {
  if (D(x, z) === 0) return onFace(x, z, e.dir) && along(x, z, e.dir) >= e.at - 1 && along(x, z, e.dir) <= e.at + e.w;
  if (D(x, z) !== 1) return false;
  const a = x + e.dir[0], b = z + e.dir[1];
  return inFoot(a, b) && entranceOf(a, b) === e;
});

const lit = (x, y, z, n) => (x * 31 + y * 17 + z * 53) % n === 0;

const v = new Voxels([X, Y, Z]);
for (const [x, z] of pts) {
  const g = G(x, z), t = T(x, z), d = D(x, z), facade = isFacade(x, z);
  const dir = facade ? faceDir(x, z) : null;
  const corner = facade && outsideDirs(x, z).length >= 2;
  const out = outsideDirs(x, z)[0];
  const shopFront = !!out && (out[0] === -1 || out[1] === -1);   // Sixth Avenue (west) and north sides
  const a = facade ? along(x, z, dir) : 0;
  const glass = t <= 49 ? "gray_stained_glass" : "light_blue_stained_glass";
  for (let y = 0; y < t; y++) {
    const rel = y - g, ground = rel < 3;
    let b = null, st = null;
    if (y < g) b = "polished_andesite";                                    // foundation down to the lowest ground
    else if (y === t - 1) b = facade ? "polished_granite" : "smooth_stone"; // cornice on the skin, flat roof inside
    else if (!facade) {
      if (d >= 2) b = "white_concrete";                                    // solid core
      else if (rel > 0 && rel % 3 === 0) b = "smooth_stone";                // floor slab in the air gap
    } else {
      const e = entranceOf(x, z);
      if (e && rel <= 1) {
        b = "dark_oak_door";
        st = { facing: e.facing, half: rel === 0 ? "lower" : "upper", hinge: a - e.at === 0 ? "left" : "right", open: "false", powered: "false" };
      } else if (canopyOf(x, z) && rel === 3) b = "polished_granite";     // canopy over the entrance
      else if (rel > 0 && rel % 3 === 0) b = corner ? "polished_granite" : "light_gray_concrete"; // storey spandrel
      else if (rel === 0) b = "polished_granite";                          // base course
      else if (corner || a % 3 === 0) b = shopFront && ground ? "polished_granite" : "iron_block"; // mullions and piers
      else if (ground && !shopFront) b = "polished_granite";              // solid service base on the south and east
      else b = ground ? "glass" : glass;
      // A warm light a cell inside some panes: glowstone in the air gap, only where that cell stands at this height.
      const pane = b === "glass" || b === glass;
      const inn = pane && inward(x, z);
      if (inn && T(inn[0], inn[1]) > y && lit(x, y, z, ground ? 4 : 9)) v.set(inn[0], y, inn[1], "glowstone");
    }
    if (b) v.set(x, y, z, b, st ?? undefined);
  }
}

// Rooftop mechanical boxes on the 49 podium (a louvred unit each, cells well inside the skin).
for (const [x, z] of pts) {
  if (T(x, z) !== 49 || D(x, z) < 2 || x % 6 !== 3 || z % 5 !== 2) continue;
  for (let y = 49; y < 51; y++) v.set(x, y, z, "light_gray_concrete");
  v.set(x, 51, z, "iron_bars");
}

const res = v.save(`${DIR}/NYC1034502.nbt`);
console.log(`NYC1034502: ${res.blocks} blocks, palette ${res.palette}`);
