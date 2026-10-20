// Helpers from plan.md VOCABULARY: hillCell, crack, deckRail, trailRun, lampPost, tree (site, rocks, deck, trails, planting).
// Each takes the grid first, then its position (and facing or rotation where it has one). Every write goes through
// put(), which writes only into air, so an earlier part's blocks are never overwritten; a write that can't be made is
// skipped, never thrown. Block ids are literals from plan.md PALETTE. Imports nothing from the other vocab files.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /^(minecraft:)?(air|cave_air|void_air|structure_void)$/;
const SOIL = new Set(["grass_block", "dirt", "coarse_dirt", "podzol", "rooted_dirt"]); // blocks fern and grass can stand on
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Reserved trail columns (plan RESERVED): the trail boxes, plus the 2-wide diagonal from (78, 74) to (96..97, 100).
// Terrain leaves them to trailRun; rocks and lamp posts keep off them.
const TRAIL = [
  { x0: 67, x1: 68, z0: 0, z1: 45 },
  { x0: 67, x1: 79, z0: 42, z1: 43 },
  { x0: 78, x1: 79, z0: 44, z1: 74 },
  { x0: 60, x1: 61, z0: 45, z1: 59 },
];
function onTrail(x, z) {
  if (TRAIL.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1)) return true;
  if (z < 74 || z > 100) return false;
  const c = 78 + Math.round((18 * (z - 74)) / 26);
  return x === c || x === c + 1;
}

// Deterministic value in [0, 1) per cell and salt, so the same build comes out the same on every run
function unit(...n) {
  let h = 0x811c9dc5;
  for (const v of n) h = Math.imul(h ^ (Math.round(v * 2) + 0x9e37), 0x01000193);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

const isAir = (g, x, y, z) => !g.inBounds(x, y, z) || AIR.test(g.blockAt(x, y, z));
const idAt = (g, x, y, z) => g.blockAt(x, y, z).replace("minecraft:", "");

// Write one block into air, or do nothing. spec is [block, state?, nbt?], as the B helpers return it.
function put(g, x, y, z, spec) {
  if (!g.inBounds(x, y, z) || !isAir(g, x, y, z)) return false;
  g.set(x, y, z, ...spec);
  return true;
}

// y of the top solid block in column (x, z), searching down from `from`; -1 if there is none
function groundY(g, x, z, from = g.size[1] - 1) {
  for (let y = from; y >= 0; y--) if (!isAir(g, x, y, z)) return y;
  return -1;
}

/**
 * One terrain column (plan SITE and MATERIALS): stone down to y 0, 3 dirt under the surface, the surface block at y = h.
 * The caller interpolates h from the GROUND map. Options: rise = the largest height step to a neighbour (over 1 is a
 * slope, over 2 an outcrop); nearRock = a rock foot; podzol = under a tree. A column beside a reserved trail column
 * gets the trail edge (coarse or rooted dirt). Reserved trail columns are skipped (trailRun owns them).
 * @returns {number} blocks placed
 */
export function hillCell(g, x, z, h, { rise = 0, nearRock = false, podzol = false } = {}) {
  if (onTrail(x, z)) return 0;
  const top = Math.round(h);
  const r = unit(x, z, 1);
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => onTrail(x + dx, z + dz));
  let surface;
  if (podzol) surface = "podzol";
  else if (rise > 2) surface = r < 0.5 ? "stone" : "andesite";
  else if (edge) surface = r < 0.5 ? "coarse_dirt" : "rooted_dirt";
  else if (rise > 1) surface = "coarse_dirt";
  else if (nearRock) surface = r < 0.5 ? "moss_block" : "rooted_dirt";
  else surface = r < 0.15 ? "coarse_dirt" : "grass_block";
  let n = 0;
  for (let y = 0; y <= top; y++) {
    const block = y === top ? surface : y >= top - 3 ? "dirt" : "stone";
    if (put(g, x, y, z, [block])) n++;
  }
  return n;
}

/**
 * A 1-wide, 1-deep notch in a rock's wall, y0 up to y0 + len - 1 (plan SITE, facades: 2-3 per rock on the N and W faces).
 * face "north" cuts the z0 wall at x = pos; face "west" cuts the x0 wall at z = pos. The notch is carved to air, its
 * back and sides lined with tuff, and a fern stands on the ground at its foot. Edits only the rock's own cells, plus the
 * fern, which goes on air in front of the notch.
 * @param {{x0:number,x1:number,y0:number,y1:number,z0:number,z1:number}} rock inclusive box of the rock
 * @returns {number} cells changed
 */
export function crack(g, rock, face, pos, y0, len) {
  const north = face === "north";
  const inRock = (x, y, z) => x >= rock.x0 && x <= rock.x1 && y >= rock.y0 && y <= rock.y1 && z >= rock.z0 && z <= rock.z1;
  const solid = (x, y, z) => inRock(x, y, z) && !isAir(g, x, y, z);
  // side offset d moves across the wall face; the notch is at d = 0, the back is one cell into the rock
  const cell = (y, d) => (north ? [pos + d, y, rock.z0] : [rock.x0, y, pos + d]);
  const back = (y) => (north ? [pos, y, rock.z0 + 1] : [rock.x0 + 1, y, pos]);
  let n = 0;
  for (let y = y0; y < y0 + len; y++) {
    const [nx, ny, nz] = cell(y, 0);
    if (!solid(nx, ny, nz)) continue;
    g.set(nx, ny, nz, "minecraft:air");
    n++;
    for (const [lx, ly, lz] of [back(y), cell(y, -1), cell(y, 1)]) {
      if (!solid(lx, ly, lz)) continue;
      g.set(lx, ly, lz, "tuff");
      n++;
    }
  }
  // the fern goes on the soil in front of the notch's foot
  const [fx, fz] = north ? [pos, rock.z0 - 1] : [rock.x0 - 1, pos];
  const gy = groundY(g, fx, fz, rock.y1);
  if (gy >= 0 && SOIL.has(idAt(g, fx, gy, fz)) && put(g, fx, gy + 1, fz, ["fern"])) n++;
  return n;
}

/**
 * Deck railing (plan OPENINGS, DECK rail): spruce_fence at the walking height along `path`, a dark_oak_fence post every
 * `every` cells and at each corner, and a standing lantern on each corner post. Openings stay air. Fences connect to
 * neighbouring fences of the same wood, so the rail reads as one run.
 * @param {number[][]} path [x, z] cells in order along the rail line
 * @param {{y?:number, openings?:number[][], corners?:number[][], every?:number}} [opts] y defaults to the walking level 38
 * @returns {number} blocks placed
 */
export function deckRail(g, path, { y = 38, openings = [], corners = [], every = 4 } = {}) {
  const key = (x, z) => `${x},${z}`;
  const open = new Set(openings.map(([x, z]) => key(x, z)));
  const corner = new Set(corners.map(([x, z]) => key(x, z)));
  const wood = new Map(); // cell -> wood of its fence
  path.forEach(([x, z], i) => {
    if (open.has(key(x, z))) return;
    wood.set(key(x, z), corner.has(key(x, z)) || i % every === 0 ? "dark_oak" : "spruce");
  });
  let n = 0;
  for (const [k, mat] of wood) {
    const [x, z] = k.split(",").map(Number);
    const state = {};
    for (const [dir, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]]) {
      state[dir] = wood.get(key(x + dx, z + dz)) === mat ? "true" : "false";
    }
    if (put(g, x, y, z, [`${mat}_fence`, state])) n++;
    if (corner.has(k) && put(g, x, y + 1, z, B.lantern(false))) n++;
  }
  return n;
}

/**
 * Stone-brick trail (plan TRAIL, PALETTE trail): `width` cells across each centre point [x, y, z], so width 2 at x 68
 * covers x 67..68 on a trail running along z. y is a whole block, or .5 for a half step (a bottom slab at floor(y)).
 * A whole step up or down is a stair facing up the slope; a point at the same y as the one before it is a full stone
 * brick (put a flat point every 6-8 steps for a landing). About 1 in 6 cells is the mossy variant. Each trail cell
 * stands on dirt (3 deep) and then stone, filled down to y 0 into air. Writes only inside the trail's own columns.
 * @param {number[][]} points [x, y, z] centre cells in travel order
 * @param {number} [width=2]
 * @returns {number} blocks placed
 */
export function trailRun(g, points, width = 2) {
  const lo = -Math.floor(width / 2), hi = Math.ceil(width / 2) - 1;
  const travel = (a, b) => {
    const ex = b[0] - a[0], ez = b[2] - a[2];
    if (!ex && !ez) return null;
    return Math.abs(ex) >= Math.abs(ez) ? [Math.sign(ex), 0] : [0, Math.sign(ez)];
  };
  let dir = (points[1] && travel(points[0], points[1])) || [0, 1];
  let n = 0;
  points.forEach((pt, i) => {
    const [px, py, pz] = pt;
    const t = i > 0 ? travel(points[i - 1], pt) : null;
    if (t) dir = t;
    const prevY = i > 0 ? points[i - 1][1] : py;
    const climbs = py >= prevY;
    const facing = FACING[`${climbs ? dir : [-dir[0], -dir[1]]}`];
    const yb = Math.floor(py);
    const mossy = unit(px, pz, i + 7) < 1 / 6;
    const pre = mossy ? "mossy_stone_brick" : "stone_brick";
    const full = mossy ? "mossy_stone_bricks" : "stone_bricks";
    for (let o = lo; o <= hi; o++) {
      const [x, z] = dir[0] ? [px, pz + o] : [px + o, pz];
      let spec;
      if (py % 1 !== 0) spec = B.slab(pre, "bottom");
      else if (py === prevY) spec = [full];
      else spec = B.stairs(pre, facing, "bottom", "straight");
      if (put(g, x, yb, z, spec)) n++;
      for (let yy = yb - 1; yy >= 0 && isAir(g, x, yy, z); yy--) if (put(g, x, yy, z, [yb - 1 - yy < 3 ? "dirt" : "stone"])) n++;
    }
  });
  return n;
}

/**
 * Lamp post beside the trail (plan lampPost): a stone brick base on the ground, two dark oak fences, and a standing
 * lantern on top. All four cells must be air or nothing is written. Refuses a reserved trail cell.
 * @param {{ground?:number}} [opts] ground y; default: the top solid block of the column
 * @returns {number} blocks placed
 */
export function lampPost(g, x, z, { ground } = {}) {
  if (onTrail(x, z)) return 0;
  const gy = ground ?? groundY(g, x, z);
  if (gy < 0) return 0;
  const cells = [
    [gy + 1, ["stone_bricks"]],
    [gy + 2, B.fence("dark_oak")],
    [gy + 3, B.fence("dark_oak")],
    [gy + 4, B.lantern(false)],
  ];
  if (!cells.every(([y]) => isAir(g, x, y, z))) return 0;
  return cells.filter(([y, spec]) => put(g, x, y, z, spec)).length;
}

/**
 * Broadleaf tree (plan PLANTING, T1-T3): a 6-tall log trunk from ground + 1, and an irregular crown 9 wide and 5 tall
 * from ground + 4, of persistent leaves. kind "oak": oak_log with oak_leaves and jungle_leaves. kind "jungle": jungle_log
 * with jungle_leaves and azalea_leaves. The trunk and crown only go into air; the podzol patch under it is hillCell's
 * podzol option, set by the terrain part.
 * @param {{ground?:number}} [opts] ground y; default: the top solid block of the column
 * @returns {number} blocks placed
 */
export function tree(g, x, z, kind = "oak", { ground } = {}) {
  const gy = ground ?? groundY(g, x, z);
  if (gy < 0) return 0;
  const jungle = kind === "jungle";
  const leaves = jungle ? ["jungle_leaves", "azalea_leaves"] : ["oak_leaves", "jungle_leaves"];
  const radius = [3.2, 4.2, 4.4, 3.4, 2.2]; // crown radius per layer, from ground + 4 upward
  let n = 0;
  for (let y = gy + 1; y <= gy + 6; y++) if (put(g, x, y, z, B.log(jungle ? "jungle" : "oak", "y"))) n++;
  radius.forEach((r, dy) => {
    const y = gy + 4 + dy;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      const edge = r + (unit(x + dx, y, z + dz, 5) - 0.5) * 1.6; // jitter makes the crown irregular, not a sphere
      if (Math.hypot(dx, dz) > edge) continue;
      const block = unit(x + dx, y, z + dz, 9) < 0.6 ? leaves[0] : leaves[1];
      if (put(g, x + dx, y, z + dz, [block, { persistent: "true" }])) n++;
    }
  });
  return n;
}
