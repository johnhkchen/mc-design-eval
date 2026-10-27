import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 260089799, on Mt Eden's flank: a 1970s concrete office block, six storeys of 4 blocks over a stone plinth.
// The lidar roof, smoothed by a 3x3 median into one flat tier, sets the top floor at 24 with a parapet at 25; a plant
// room sits one block in on the north-east core, to 26. Facade: white concrete piers on a 3-block bay, cyan ribbon glass
// between light-grey spandrels, a polished-andesite base course, a light-blue shopfront storey with a glass-door
// entrance and a lantern inside, glowstone behind some upper windows. A shell: a floor slab per storey, air behind glass.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260089799.cells.json", "utf8"));
const W = 27, D = 35, H = 38, FLOOR = 4;
const SIDES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const ground = Array.from({ length: D }, () => Array(W).fill(-1));
const lidar = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, gr, r] of cells) { ground[z][x] = gr; lidar[z][x] = r; }
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z][x] >= 0;

// lidar noise: a 3x3 median over the footprint, so single low or high cells fold into their tier
const roof = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(lidar[z + dz][x + dx]);
  v.sort((a, b) => a - b); roof[z][x] = v[v.length >> 1];
}

const top = (x, z) => (roof[z][x] >= 20 ? 24 : 16);                    // the storey's roof deck, flat tiers
const core = (x, z) => roof[z][x] >= 24 && Object.values(SIDES).every(([dx, dz]) => inFoot(x + dx, z + dz) && roof[z + dz][x + dx] >= 24);

const exposed = (x, z) => Object.keys(SIDES).filter((s) => { const [dx, dz] = SIDES[s]; return !inFoot(x + dx, z + dz) || top(x + dx, z + dz) !== top(x, z); });
const EX = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => (inFoot(x, z) ? exposed(x, z) : [])));
// a cell's facade pattern follows its primary face (north or south first): a stepped footprint has one-cell corners on every step
const primary = (e) => e.find((s) => s === "north" || s === "south") || e[0];
const bayU = (x, z, side) => (side === "north" || side === "south" ? x : z);   // position along the face
const inward = (side) => [-SIDES[side][0], -SIDES[side][1]];

// the entrance: a ground-floor bay on the face with the most street-level candidates, middle of its run
const doorCands = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const e = EX[z][x]; if (e.length !== 1 || ground[z][x] !== 0) continue;
  const side = e[0]; if (bayU(x, z, side) % 3 === 0) continue;
  const [ix, iz] = [x + inward(side)[0], z + inward(side)[1]];
  if (inFoot(ix, iz) && !EX[iz][ix].length) doorCands.push({ x, z, side });
}
const count = {}; for (const c of doorCands) count[c.side] = (count[c.side] || 0) + 1;
const doorSide = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
if (!doorSide) throw new Error("no street-level bay for the entrance");
const onSide = doorCands.filter((c) => c.side === doorSide).sort((a, b) => bayU(a.x, a.z, a.side) - bayU(b.x, b.z, b.side));
const door = onSide[onSide.length >> 1];

const pane = (side) => (side === "north" || side === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// one facade cell at height y: a pier, a spandrel, or glazing (shopfront below y 4), on its primary face
const wallBlock = (x, y, z, e, gr) => {
  if (y === gr) return { block: "polished_andesite" };                 // base course
  if (bayU(x, z, primary(e)) % 3 === 0) return { block: "white_concrete" };
  const r = y % FLOOR;
  if (r === 0 || r === 3) return { block: "light_gray_concrete" };
  return y < FLOOR ? { block: "light_blue_stained_glass_pane", state: pane(primary(e)) } : { block: "cyan_stained_glass_pane", state: pane(primary(e)) };
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const stats = { cells: 0, core: 0, walls: 0, lights: 0 };

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  stats.cells++;
  const gr = ground[z][x], t = top(x, z), e = EX[z][x];
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                       // foundation to the ground
  // floors: each storey's slab on the storey below (interior cells; a wall's own rows are below)
  const floors = new Set([gr]); for (let y = FLOOR; y < t; y += FLOOR) if (y > gr) floors.add(y);
  if (!e.length) for (const y of floors) put(x, y, z, "smooth_stone");
  put(x, t, z, "gray_concrete");                                                    // roof membrane
  if (e.length) {
    stats.walls++;
    for (let y = gr; y < t; y++) { const w = wallBlock(x, y, z, e, gr); put(x, y, z, w.block, w.state); }
    put(x, t + 1, z, "white_concrete");                                              // parapet
  }
  if (core(x, z)) { stats.core++; for (const y of [t + 1, t + 2]) put(x, y, z, "light_gray_concrete"); }
}

// entrance: glass doors under a polished lintel, a lantern on the floor just inside
const dgr = ground[door.z][door.x], dIn = [door.x + inward(door.side)[0], door.z + inward(door.side)[1]];
const facing = door.side === "north" ? "south" : door.side === "south" ? "north" : door.side === "west" ? "east" : "west";
put(door.x, dgr + 1, door.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(door.x, dgr + 2, door.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
put(door.x, dgr + 3, door.z, "polished_andesite");
put(dIn[0], dgr + 1, dIn[1], "lantern", { hanging: "false", waterlogged: "false" });

// warm light behind some upper windows: the bottom row of each glazed pair, one cell inside, on a slab
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const e = EX[z][x]; if (!e.length) continue;
  const side = primary(e);
  for (let y = FLOOR; y < top(x, z); y++) {
    if (y % FLOOR !== 1 || bayU(x, z, side) % 3 === 0 || ((x * 7 + z * 5 + y) % 9) !== 0) continue;
    const [ix, iz] = [x + inward(side)[0], z + inward(side)[1]];
    if (!inFoot(ix, iz) || EX[iz][ix].length || core(ix, iz)) continue;
    put(ix, y, iz, "glowstone"); stats.lights++;
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260089799.nbt";
console.log(JSON.stringify({ ...stats, door: { x: door.x, z: door.z, side: door.side }, saved: g.save(out) }));
