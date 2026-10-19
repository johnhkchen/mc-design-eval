// 20 East 49th Street, 1930 commercial and office building: a 7-storey (21-block) limestone-and-glass street wall around a
// light well, with an 8-storey (24-block) tower and a penthouse on the north-east side, a 4-storey (12-block) rear wing
// along the south-west and 2-storey (6-block) sheds at the back. Footprint 22 x 32 (x across, low z = north = the 49th
// Street frontage). Lidar roofs are read as flat tiers: a cell's tier is set by its lidar height, and the tower is the
// 24 tier only where most of its 3 x 3 neighbourhood is tall, so single noisy cells do not make spikes.
// Facade: a dark granite base course with a shopfront of glass panes and calcite piers on the ground floor, then 3-block
// storeys each with a smooth-stone floor line and two rows of panes between calcite piers every 3 blocks. A polished
// andesite cornice band sits under a calcite parapet. The entrance is a recess (x 14-16) with a bronze-coloured iron door
// and a lantern under a granite canopy. Panes sit one block out from a 1-block air gap and a back wall (dark stone
// brick, or glowstone in about one window in six), with a solid floor slab in every storey: no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035447.cells.json`, "utf8"));
const X = 22, Z = 32, Y = 30;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const groundAt = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).ground : 0);

// Tower test: a cell is tower-like when at least 5 of the 9 cells around it (itself included) are lidar 23 or more.
// The tower is the largest 4-connected run of such cells, so single noisy spikes do not stand above the street wall.
const tall = (x, z) => (inFoot(x, z) && lidar(x, z) >= 23 ? 1 : 0);
const towerish = (x, z) => {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) n += tall(x + dx, z + dz);
  return n >= 5 && lidar(x, z) >= 18;
};
const tower = new Set();
{
  const seen = new Set();
  let best = [];
  for (const [x, z] of cells) {
    if (!towerish(x, z) || seen.has(`${x},${z}`)) continue;
    const run = [[x, z]]; seen.add(`${x},${z}`);
    for (let i = 0; i < run.length; i++) {
      for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const nx = run[i][0] + dx, nz = run[i][1] + dz, k = `${nx},${nz}`;
        if (towerish(nx, nz) && !seen.has(k)) { seen.add(k); run.push([nx, nz]); }
      }
    }
    if (run.length > best.length) best = run;
  }
  // The tower is squared off as the box around that run: one clean block, not a ragged set of lidar cells.
  if (best.length >= 12) {
    const xs = best.map(([x]) => x), zs = best.map(([, z]) => z);
    for (const [x, z] of cells) if (x >= Math.min(...xs) && x <= Math.max(...xs) && z >= Math.min(...zs) && z <= Math.max(...zs) && lidar(x, z) >= 18) tower.add(`${x},${z}`);
  }
}

// Roof tier per footprint cell (block height above y 0; 0 = open ground, the light well).
const roofAt = (x, z) => {
  if (!inFoot(x, z) || lidar(x, z) <= 0) return 0;
  const L = lidar(x, z);
  if (L <= 6) return 6;               // one- and two-storey sheds at the back
  if (L <= 12) return 12;             // the four-storey rear wing (lidar 10-12)
  return tower.has(`${x},${z}`) ? 24 : 21;    // 7-storey street wall, 8-storey tower
};
const isBuilt = (x, y, z) => inFoot(x, z) && roofAt(x, z) > y;

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E: low z = north = the 49th Street frontage
const cols = cells.map(([x, z]) => [x, z]);

// Distance from open air (outside the footprint, the light well, or above a roof), per height. An exterior skin cell has
// distance 1; the cells behind it are 2, 3, ... so windows get a skin, an air gap and a back wall by depth.
const dists = [];
for (let y = 0; y < Y; y++) {
  const d = new Map(), q = [];
  const key = (x, z) => `${x},${z}`;
  for (let z = -1; z <= Z; z++) for (let x = -1; x <= X; x++) {
    if (!isBuilt(x, y, z)) { d.set(key(x, z), 0); q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], v = d.get(key(x, z));
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz, k = key(nx, nz);
      if (!inFoot(nx, nz) || d.has(k) || !isBuilt(nx, y, nz)) continue;
      d.set(k, v + 1); q.push([nx, nz]);
    }
  }
  dists.push(d);
}
const dist = (x, y, z) => dists[y].get(`${x},${z}`) ?? 0;

// Outward faces of a skin cell (the neighbours that are open at this height).
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => !isBuilt(x + dx, y, z + dz));

// Facade of an exterior cell: null = air (the entrance recess), otherwise a block and its states plus a kind.
const WIN_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const WIN_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const facade = (x, y, z, T) => {
  const outs = outward(x, y, z);
  const [dx, dz] = outs[0];
  const corner = outs.length > 1;
  const along = dz !== 0 ? x : z;
  const r = y % 3;
  if (y === 0) return { block: "polished_granite", kind: "base" };
  if (dz === -1 && z === 0 && x >= 14 && x <= 16 && (y === 1 || y === 2)) return null;          // entrance recess
  if (dz === -1 && z === 0 && x >= 13 && x <= 17 && y === 3) return { block: "polished_granite", kind: "spandrel" };  // canopy
  if (y === T - 1) return { block: "polished_andesite", kind: "band" };                            // cornice
  if (r === 0) return { block: "smooth_stone", kind: "spandrel" };                                 // storey line
  if (corner || along % 3 === 0) return { block: "calcite", kind: "pier" };                        // piers, corners
  return { block: "glass_pane", state: dz !== 0 ? WIN_X : WIN_Z, kind: "glass" };                  // panes
};

// The exterior cell that a cell behind the skin belongs to: step outward along decreasing distance.
const anchor = (x, y, z) => {
  let c = [x, z], d = dist(x, y, z);
  while (d > 1) {
    c = DIRS.map(([dx, dz]) => [c[0] + dx, c[1] + dz]).find(([a, b]) => dist(a, y, b) === d - 1);
    d--;
  }
  return c;
};

const g = new Voxels([X, Y, Z]);

// 1. Massing, skin and back cells.
for (const [x, z] of cols) {
  const T = roofAt(x, z), ground = groundAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  if (!T) { g.set(x, 0, z, "smooth_stone"); continue; }                   // the light well floor
  for (let y = ground; y < T; y++) {
    const d = dist(x, y, z);
    if (d === 1) {
      const f = facade(x, y, z, T);
      if (f) g.set(x, y, z, f.block, f.state);
      continue;
    }
    const depth = d - 1;
    const [ex, ez] = anchor(x, y, z);
    const f = facade(ex, y, ez, roofAt(ex, ez));
    const kind = f ? f.kind : "recess";
    const window = kind === "glass" && y % 3 !== 0;
    if (depth === 1 && window) continue;                                  // air gap behind the pane
    if (depth === 2 && window) {
      const lit = (ex * 7 + y * 5) % 6 === 0;                              // warm glow behind about one pane in six
      g.set(x, y, z, lit ? "glowstone" : "stone_bricks");
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, "stone"); continue; }               // roof covering on the open top
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    g.set(x, y, z, y % 3 === 0 ? "smooth_stone" : "calcite");           // floor slab per storey, piers behind
  }
}

// 2. Parapet on every exterior top edge.
for (const [x, z] of cols) {
  const T = roofAt(x, z);
  if (T && dist(x, T - 1, z) === 1) g.set(x, T, z, "calcite");
}

// 3. Entrance: an iron door set one block back in the recess, and a lantern hanging under the granite canopy.
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(15, 1, 1, "iron_door", { ...door, half: "lower" });
g.set(15, 2, 1, "iron_door", { ...door, half: "upper" });
g.set(15, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Penthouse on the tower: columns of the 24 tier at least 4 cells in from its edge carry a one-storey box with
// glazing on each face, a solid floor slab and a calcite roof, leaving a stone roof terrace around it.
const pent = cols.filter(([x, z]) => roofAt(x, z) === 24 && dist(x, 23, z) >= 3);
const inPent = (x, z) => pent.some(([a, b]) => a === x && b === z);
for (const [x, z] of pent) {
  g.set(x, 24, z, "smooth_stone");
  const edge = DIRS.some(([dx, dz]) => !inPent(x + dx, z + dz));
  if (edge) {
    const alongP = DIRS.find(([dx, dz]) => !inPent(x + dx, z + dz))[1] !== 0 ? x : z;
    const isPier = alongP % 3 === 0;
    const face = DIRS.find(([dx, dz]) => !inPent(x + dx, z + dz));
    g.set(x, 25, z, isPier ? "calcite" : "glass_pane", isPier ? undefined : (face[1] !== 0 ? WIN_X : WIN_Z));
  }
  g.set(x, 26, z, "calcite");
}

const out = `${DIR}/NYC1035447.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ file: out, ...stats, penthouseCells: pent.length, size: [X, Y, Z] }));
