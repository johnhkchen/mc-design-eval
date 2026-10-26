// DC68411: a five-storey Federal-style office block (stripped classical, pale limestone on a granite plinth, bronze-tinted
// glass). Lidar roofs are smoothed and tiered at 16 / 18 / 20 blocks; the core's top storey is set back one block from the
// terrace ring. Walls are a one-block shell with air behind the glass and a floor slab per storey; piers and storey
// courses frame the windows, a parapet caps each tier, and the long west face has a central door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68411.cells.json`, "utf8"));

const W = 14, D = 27, Y = 32;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIR_NAME = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };

const fp = Array.from({ length: W }, () => Array(D).fill(false));
const roof = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, , r] of cells) { fp[x][z] = true; roof[x][z] = r; }
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp[x][z];

// lidar noise: the mean roof of the footprint cells in each 3x3, then three flat tiers (16, 18, 20 blocks)
const smoothRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) { s += roof[x + dx][z + dz]; n++; }
  return s / n;
};
const tier = (r) => (r >= 19 ? 20 : r >= 18 ? 18 : 16);
const H = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) => (fp[x][z] ? tier(smoothRoof(x, z)) : 0)));

// the core (20 tall) keeps its top storey only where it is one block in from its edge; the ring is a terrace at 16
const core = (x, z) => inFp(x, z) && H[x][z] === 20;
const upper = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) =>
  core(x, z) && core(x - 1, z) && core(x + 1, z) && core(x, z - 1) && core(x, z + 1)));
const terrace = Array.from({ length: W }, (_, x) => Array.from({ length: D }, (_, z) => core(x, z) && !upper[x][z]));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (terrace[x][z]) H[x][z] = 16;

const occ = (x, y, z) => inFp(x, z) && y >= 0 && y < H[x][z];
const exposures = (x, y, z) => DIRS.filter(([dx, dz]) => !occ(x + dx, y, z + dz));

// each wall line (a fixed x or z on one side) is keyed by its side and fixed coordinate. A cell open on
// both axes is a corner only where the wall stops; on a stepped edge the wall runs on along the other axis, so it is a line.
const lineKey = (x, y, z, ex) => {
  let xf = ex.find(([dx]) => dx !== 0), zf = ex.find(([, dz]) => dz !== 0);
  if (xf && zf) {
    const alongZ = [-1, 1].some((s) => exposures(x, y, z + s).some(([dx, dz]) => dx === xf[0] && dz === 0));
    const alongX = [-1, 1].some((s) => exposures(x + s, y, z).some(([dx, dz]) => dz === zf[1] && dx === 0));
    if (alongZ) zf = null; else if (alongX) xf = null; else return null;   // a convex corner: always a pier
  }
  return xf ? { key: `X${xf[0]}:${x}`, t: z } : { key: `Z${zf[1]}:${z}`, t: x };
};

const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => out.get(`${x},${y},${z}`);
const slab = { type: "bottom", waterlogged: "false" };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!fp[x][z]) continue;
  for (let y = 0; y < H[x][z]; y++) {
    const ex = exposures(x, y, z);
    if (!ex.length) {                                      // interior: a floor slab per storey, a roof slab on top, air between
      // the row under a storey's courses is a ceiling where the wall above stands on it, so no wall hangs over a room
      const shellAbove = occ(x, y + 1, z) && exposures(x, y + 1, z).length > 0;
      if (y === 0 || y % 4 === 0 || y === H[x][z] - 1 || (y % 4 === 3 && shellAbove)) put(x, y, z, "stone");
      continue;
    }
    if (y === H[x][z] - 1) { put(x, y, z, "smooth_quartz_slab", slab); continue; }   // parapet cap
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                     // plinth course
    const lk = lineKey(x, y, z, ex);
    if (!lk) { put(x, y, z, "smooth_quartz"); continue; }                            // corner pier
    const pier = lk.t % 3 === 0;                                                     // one bay rhythm per axis: short runs keep their windows
    if (pier || y % 4 === 0) { put(x, y, z, "smooth_quartz"); continue; }           // piers and storey courses
    if (y % 4 === 3) { put(x, y, z, "calcite"); continue; }                          // spandrel above each window
    put(x, y, z, "gray_stained_glass_pane");                                          // window rows 1-2 of each storey
    // a few windows are lit: a glowstone on the sill row of the air gap behind the glass
    if (y % 4 === 1 && (x * 5 + z * 3 + y) % 13 === 0) put(x - ex[0][0], y, z - ex[0][1], "glowstone");
  }
}

// the west door: the middle of the long x=0 face, flanked by piers, under a quartz lintel; lanterns just inside
const westZ = [];
for (let z = 0; z < D; z++) if (fp[0][z]) westZ.push(z);
const zc = Math.round((westZ[0] + westZ[westZ.length - 1]) / 2);
for (const dz of [-1, 0, 1]) for (let y = 1; y <= 3; y++) put(0, y, zc + dz, "smooth_quartz");
const door = { facing: "east", hinge: "left", open: "false", powered: "false" };
put(0, 1, zc, "dark_oak_door", { ...door, half: "lower" });
put(0, 2, zc, "dark_oak_door", { ...door, half: "upper" });
put(1, 1, zc - 1, "lantern", { hanging: "false", waterlogged: "false" });
put(1, 1, zc + 1, "lantern", { hanging: "false", waterlogged: "false" });

// the terrace balustrade: outer-edge cells of the ring, one block above its roof slab
const rail = (x, z) => at(x, 16, z)?.block === "stone_brick_wall";
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!terrace[x][z] || !exposures(x, 15, z).length) continue;
  put(x, 16, z, "stone_brick_wall", { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
}
const railNames = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
for (const [x, y, z] of [...out.keys()].filter((k) => at(...k.split(",").map(Number))?.block === "stone_brick_wall").map((k) => k.split(",").map(Number))) {
  const st = { ...at(x, y, z).state };
  for (const [name, [dx, dz]] of Object.entries(railNames)) st[name] = rail(x + dx, z + dz) ? "low" : "none";
  put(x, y, z, "stone_brick_wall", st);
}

// roof plant: two boxes of stone brick on the core's top storey, away from the parapet
const topBox = (x0, z0) => {
  for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) if (!upper[x][z]) return false;
  return true;
};
const boxes = [];
for (let x = 1; x < W - 2 && boxes.length < 2; x++) for (let z = 1; z < D - 2 && boxes.length < 2; z++) {
  if (!topBox(x, z) || boxes.some(([bx, bz]) => Math.abs(bx - x) < 3 && Math.abs(bz - z) < 3)) continue;
  boxes.push([x, z]);
}
for (const [x0, z0] of boxes) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
  put(x, 20, z, "stone_bricks");
  put(x, 21, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// panes join the glass and piers beside them, as the block states a real pane would have
const solid = new Set(["gray_stained_glass_pane", "smooth_quartz", "calcite", "polished_granite", "stone_bricks"]);
for (const [k, c] of out) {
  if (c.block !== "gray_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const st = { waterlogged: "false" };
  for (const [name, [dx, dz]] of Object.entries(railNames)) {
    const n = at(x + dx, y, z + dz);
    st[name] = n && solid.has(n.block) ? "true" : "false";
  }
  c.state = st;
}

const g = new Voxels([W, Y, D]);
for (const [k, c] of out) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, c.block, c.state);
}
g.save(`${DIR}/DC68411.nbt`);
