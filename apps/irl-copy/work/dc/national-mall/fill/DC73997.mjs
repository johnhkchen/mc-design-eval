// DC73997: a 1920s Neoclassical office block of pale limestone on the Mall's flank. Four storeys of 3 blocks on a
// stone plinth, a 2-block tower core rising one tier to 16 with a 2x2 penthouse at 18, and a one-storey terrace at
// the low north wing. The envelope is a 1-block shell: window panes stand in the wall plane with a lit air gap behind
// them, one floor slab per storey, and the entrance is a dark oak double door in a quartz surround on the pavilion.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73997.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 20, Y = 27, Z = 14;
const g = new Voxels([X, Y, Z]);

const STONE = "stone_bricks", CALC = "calcite", QUARTZ = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "gray_concrete";
const PANE = "light_gray_stained_glass_pane", PILLAR = "quartz_pillar";
const TOP = { low: 3, body: 14, tower: 16 };             // roof surface per tier (lidar 3, 14, 15-16)
const FLOORS = new Set([2, 5, 8, 11, 14]);                // storey floors (interior)
const BAND = new Set([5, 8, 11, 14]);                     // stringcourses on the faces
const WIN_ROWS = [3, 6, 9, 12];                           // lower row of each window pair (lanterns stand on the floor below)

const fp = new Map();
for (const [x, z, gr, roof] of cells) fp.set(`${x},${z}`, { g: gr, r: roof });
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// tiers from the lidar: raw roof <= 4 is the low wing; a 3x3 median >= 15 is the tower; the rest is the body
const median3 = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(fp.get(`${x + dx},${z + dz}`).r);
  v.sort((a, b) => a - b); return v[Math.floor(v.length / 2)];
};
const tier = new Map();
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  tier.set(key, c.r <= 4 ? "low" : median3(x, z) >= 15 ? "tower" : "body");
}
const topOf = (x, z) => TOP[tier.get(`${x},${z}`)];

// a face is exposed when it looks onto open air, or onto a neighbour lower than this cell (the step up is a wall)
const exposed = (x, z) => {
  const out = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || topOf(nx, nz) < topOf(x, z)) out[d] = true;
  }
  return out;
};
const perimeter = (x, z) => Object.keys(exposed(x, z)).length > 0;

// the penthouse: the tower core, which must be tower cells all round
const PENT = [];
for (let z = 6; z <= 7; z++) for (let x = 4; x <= 5; x++) {
  if (tier.get(`${x},${z}`) !== "tower") throw new Error(`penthouse cell ${x},${z} is not tower`);
  PENT.push([x, z]);
}
const pentKey = new Set(PENT.map(([x, z]) => `${x},${z}`));

const paneFor = (ns, ew) => (ns
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// 1. shell: foundation and plinth, floors, walls, caps
for (const [key, { g: ground }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const t = topOf(x, z);
  const ex = exposed(x, z), per = perimeter(x, z);
  const ns = !!(ex.N || ex.S), ew = !!(ex.E || ex.W);
  for (let y = 0; y < 2; y++) g.set(x, y, z, STONE);      // foundation under every cell
  if (tier.get(key) === "low") {                           // the one-storey wing: a terrace slab on the plinth
    g.set(x, 2, z, per ? QUARTZ : ROOF);
    continue;
  }
  for (let y = 2; y <= t - 2; y++) {
    if (!per) { if (FLOORS.has(y)) g.set(x, y, z, FLOOR); continue; }
    if (y === 2) g.set(x, y, z, STONE);                    // base course
    else if (BAND.has(y)) g.set(x, y, z, QUARTZ);          // storey stringcourse
    else if (ns && ew) g.set(x, y, z, PILLAR, { axis: "y" }); // corner quoin column
    else if (ns) {                                         // north or south face: panes between piers at x%3==1
      if (x % 3 === 1) g.set(x, y, z, CALC); else g.set(x, y, z, PANE, paneFor(true, false));
    } else {                                               // east or west face: panes between piers at z%3==1
      if (z % 3 === 1) g.set(x, y, z, CALC); else g.set(x, y, z, PANE, paneFor(false, true));
    }
  }
  g.set(x, t - 1, z, per ? QUARTZ : ROOF);                 // roof surface; the perimeter course is the cornice
  if (per) g.set(x, t, z, CALC);                           // parapet on the edge
}

// 2. penthouse: a 2x2 setback on the tower roof, solid with a quartz cap at 18
for (const [x, z] of PENT) {
  for (let y = 16; y <= 17; y++) g.set(x, y, z, CALC, undefined);
  g.set(x, 18, z, QUARTZ);
}

// 3. entrance: the pavilion at the z=0 face (x 4..7); dark oak double door in a quartz surround, lintel over
const doorState = (hinge, half) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
g.set(5, 2, 0, "dark_oak_door", doorState("left", "lower"));
g.set(5, 3, 0, "dark_oak_door", doorState("left", "upper"));
g.set(6, 2, 0, "dark_oak_door", doorState("right", "lower"));
g.set(6, 3, 0, "dark_oak_door", doorState("right", "upper"));
for (const x of [5, 6]) g.set(x, 4, 0, QUARTZ);
for (const x of [4, 7]) for (const y of [3, 4]) g.set(x, y, 0, PILLAR, { axis: "y" });

// 4. warm light: a lantern on the floor inside some windows (about one window in three)
let lanterns = 0;
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (tier.get(key) === "low" || perimeter(x, z) === false) continue;
  const ex = exposed(x, z);
  for (const r of WIN_ROWS) {
    const side = ex.N ? [0, 1] : ex.S ? [0, -1] : ex.W ? [1, 0] : ex.E ? [-1, 0] : null;
    if (!side || g.get(x, r, z)?.block !== `minecraft:${PANE}`) continue;
    const [ix, iz] = [x + side[0], z + side[1]];
    if (!inFp(ix, iz) || perimeter(ix, iz)) continue;
    if ((x * 2 + z + r) % 3 !== 0) continue;
    g.set(ix, r, iz, "lantern", { hanging: "false", waterlogged: "false" });
    lanterns++;
  }
}

const out = `${DIR}/DC73997.nbt`;
const res = g.save(out);
console.log(`DC73997: ${res.blocks} blocks, ${res.palette} palette entries, ${lanterns} lanterns -> ${out}`);
