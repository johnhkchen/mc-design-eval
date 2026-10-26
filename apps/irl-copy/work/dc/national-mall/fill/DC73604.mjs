import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1730 R St NW: an early-20th-century red-brick educational block (a schoolhouse or institute
// building of the Dupont Circle sort): brick walls on a buff limestone plinth, sandstone sill and
// head bands at every storey, brick piers between the window bays, and a sandstone cornice.
// A three-storey main block (lidar 6) with a 5-high lower wing on the east, west and south edges,
// a 7-high core in the middle with a glazed roof, and a recessed entrance court on the north side.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73604.cells.json`, "utf8"));

const W = 12, D = 12, H = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const has = (x, z) => raw.has(key(x, z));

// Lidar roof, median over the 3x3 neighbourhood (noise out, flat tiers of 5, 6 and 7)
const TOP = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(key(x + dx, z + dz));
      if (c) vals.push(c.roof);
    }
  vals.sort((a, b) => a - b);
  TOP.set(key(x, z), vals[Math.floor(vals.length / 2)]);
}
const top = (x, z) => TOP.get(key(x, z));
const exposed = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

// The recessed entrance court on the north face: the notch at z 0, x 5..7 (cells absent)
const DOOR = [6, 1];
const PILLARS = [[5, 1], [7, 1]];
const LINTEL_Y = 3;

// The core: the 7-high cells, roofed in glass so the lamps inside show through the top
const isCore = (x, z) => top(x, z) === 7 && !Object.values(exposed(x, z)).some(Boolean);
const SKY = new Set();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) if (isCore(x, z) && x >= 6 && x <= 7 && z >= 7 && z <= 8) SKY.add(key(x, z));

const hash = (x, y, z) => (x * 31 + z * 17 + y * 7) % 11;

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = top(x, z);
  const ex = exposed(x, z);
  const nE = Object.values(ex).filter(Boolean).length;

  if (nE === 0) {
    // Interior: a floor slab per storey (even rows), a room of air behind the glass (odd rows), a roof on top
    for (let y = 0; y < T; y++) {
      if (y === T - 1) g.set(x, y, z, SKY.has(key(x, z)) ? "glass" : "stone");
      else if (y % 2 === 0) g.set(x, y, z, y === 0 ? "smooth_stone" : "oak_planks");
    }
    continue;
  }

  // Facade: solid from the plinth to the cornice. Windows on odd rows, storey bands (sills and heads) on
  // even rows, brick piers at the corners and every third cell along each face.
  const corner = nE >= 2;
  const along = ex.n || ex.s ? x : z;
  const pier = corner || along % 3 === 0;
  for (let y = 0; y < T; y++) {
    if (y === 0 || y === T - 1) { g.set(x, y, z, "smooth_sandstone"); continue; }
    if (y % 2 === 1) g.set(x, y, z, pier ? "bricks" : "glass_pane");
    else g.set(x, y, z, pier ? "bricks" : "smooth_sandstone");
  }
}

// Entrance court: the door in the back of the notch, pillars either side, a stone lintel over all three
const [dx, dz] = DOOR;
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(dx, 1, dz, "dark_oak_door", doorState("lower"));
g.set(dx, 2, dz, "dark_oak_door", doorState("upper"));
for (const [px, pz] of PILLARS) {
  g.set(px, 1, pz, "smooth_sandstone");
  g.set(px, 2, pz, "smooth_sandstone");
}
for (const x of [5, 6, 7]) g.set(x, LINTEL_Y, dz, "smooth_sandstone");

// Warm lights: a few windows get a lamp or a glowstone just inside them (in the room behind the glass)
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const ex = exposed(x, z);
  const faces = Object.keys(ex).filter((k) => ex[k]);
  if (faces.length !== 1) continue;
  const T = top(x, z);
  const [ix, iz] = [x + INWARD[faces[0]][0], z + INWARD[faces[0]][1]];
  if (!has(ix, iz)) continue;
  for (let y = 1; y < T - 1; y += 2) {
    if (g.get(x, y, z)?.block !== "glass_pane") continue;
    const h = hash(x, y, z);
    if (h === 0) g.set(ix, y, iz, "glowstone");
    else if (h === 5) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Core lamps under the glass roof, so the skylight glows at dusk
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!SKY.has(key(x, z))) continue;
  if (x === 6 && z === 7) g.set(x, 5, z, "glowstone");
  if (x === 7 && z === 8) g.set(x, 5, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Glass panes connect along their face only, to whatever is beside them in the wall
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const ex = exposed(x, z);
  if (ex.n || ex.s) {
    for (let y = 1; y < H; y++) {
      if (g.get(x, y, z)?.block !== "glass_pane") continue;
      const l = g.get(x - 1, y, z) !== null, r = g.get(x + 1, y, z) !== null;
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: String(r), west: String(l), waterlogged: "false" });
    }
  } else if (ex.w || ex.e) {
    for (let y = 1; y < H; y++) {
      if (g.get(x, y, z)?.block !== "glass_pane") continue;
      const a = g.get(x, y, z - 1) !== null, b = g.get(x, y, z + 1) !== null;
      g.set(x, y, z, "glass_pane", { north: String(a), south: String(b), east: "false", west: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/DC73604.nbt`);
