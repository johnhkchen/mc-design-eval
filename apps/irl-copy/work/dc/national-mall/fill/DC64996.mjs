// DC64996: 1828 L St NW, a 1960s-70s Commercial-Office-Large on the lidar footprint (24 x 21 blocks, flat ground at y 0).
// Massing: lidar roof heights are median-smoothed and snapped to four clean tiers (14 parapet band, 17 wings, 19 core,
// 24 tower), plus a 2-high entry lobby on the south face and a stoop pavilion on the north face. Facades are a
// Portland-stone-like body with a storey rhythm (band / glass / spandrel per 4 blocks), mullioned glass, one air cell
// behind every window (the floor bands stay solid as slabs), a few glowstone windows, and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64996.cells.json", "utf8"));
const X = 24, Z = 21, Y = 36;
const TIERS = [14, 17, 19, 24];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// footprint and lidar roof heights
const raw = new Map();
for (const [x, z, , r] of cells) raw.set(`${x},${z}`, r);
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && raw.has(`${x},${z}`);
const snap = (v) => TIERS.reduce((b, t) => (Math.abs(t - v) < Math.abs(b - v) ? t : b), TIERS[0]);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// roof per cell: the 24 tower is kept as lidar has it; the rest is a 3x3 median of the massing (entry and stoop cells excluded), snapped to a tier
const R = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  if (v === 24) { R.set(k, 24); continue; }
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const r = raw.get(`${x + dx},${z + dz}`);
    if (r > 5) nb.push(r);
  }
  R.set(k, snap(nb.length ? median(nb) : v));
}
const setR = (x, z, h) => R.set(`${x},${z}`, h);
for (const z of [17, 18, 19, 20]) for (const x of [10, 11, 12]) setR(x, z, 2);   // south entry lobby, 2 high
for (const x of [9, 10, 11]) { setR(x, 0, 1); setR(x, 1, 14); }                   // north entry pavilion: stoop, then its 14 block

const H = (x, z) => (inFoot(x, z) ? R.get(`${x},${z}`) : 0);
const solid = (x, y, z) => y >= 0 && y < H(x, z);
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// the facade / body material of a solid cell
function skin(x, y, z) {
  const h = H(x, z), e = exposed(x, y, z);
  if (y === h - 1) return e.length ? "smooth_stone" : "gray_concrete";      // cornice on the edge, roof deck on top
  if (!e.length) return "calcite";                                           // body
  if (y === 0) return "stone_bricks";                                        // base course
  if (e.length >= 2) return y % 4 === 0 ? "smooth_stone" : "calcite";        // corner pilaster
  if (y % 4 === 0) return "smooth_stone";                                    // floor band
  if (y % 4 === 3) return "calcite";                                         // spandrel
  const [dx, dz] = e[0];
  const along = dz !== 0 ? x : z;
  return along % 3 === 0 ? "polished_andesite" : "cyan_stained_glass";       // mullion or glass
}

const g = new Voxels([X, Y, Z]);
const gap = new Map();          // air cells behind window glass
const glass = [];
const put = new Map();          // "x,y,z" -> block

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    const b = skin(x, y, z);
    put.set(`${x},${y},${z}`, [b, null]);
    if (b === "cyan_stained_glass") glass.push([x, y, z, exposed(x, y, z)[0]]);
  }
}

// one air cell behind each glass pane (interior, not on an edge); one in nine is lit with glowstone behind the glass
for (const [x, y, z, [dx, dz]] of glass) {
  const ix = x - dx, iz = z - dz;
  if (!solid(ix, y, iz) || exposed(ix, y, iz).length) continue;
  gap.set(`${ix},${y},${iz}`, (x * 7 + y * 13 + z * 5) % 9 === 0 ? "glowstone" : "air");
}
for (const [k, v] of gap) {
  if (v === "glowstone") put.set(k, ["glowstone", null]);
  else put.delete(k);
}

// entries: south lobby door under a canopy, north pavilion door
put.set("11,0,20", ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }]);
put.set("11,1,20", ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }]);
put.set("10,1,20", ["cyan_stained_glass", null]);
put.set("12,1,20", ["cyan_stained_glass", null]);
for (const x of [10, 11, 12]) put.set(`${x},2,20`, ["dark_oak_slab", { type: "bottom", waterlogged: "false" }]);
put.set("10,0,1", ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }]);
put.set("10,1,1", ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }]);
for (const x of [9, 10, 11]) put.set(`${x},0,0`, ["stone_brick_slab", { type: "bottom", waterlogged: "false" }]);

// roof plant on the 19 core and a lightning rod on the 24 tower
for (const [x0, z0] of [[4, 9], [14, 9]]) {
  let ok = true;
  for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 3; x++) if (H(x, z) !== 19) ok = false;
  if (!ok) continue;
  for (let y = 19; y <= 20; y++) for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 3; x++) put.set(`${x},${y},${z}`, ["light_gray_concrete", null]);
}
put.set("8,24,17", ["lightning_rod", null]);

let n = 0;
for (const [k, [b, st]] of put) {
  const [x, y, z] = k.split(",").map(Number);
  if (b === "air") continue;
  g.set(x, y, z, b, st ?? undefined); n++;
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64996.nbt";
const r = g.save(out);
console.log(`DC64996: ${n} blocks placed, saved ${r.blocks} to ${out} (palette ${r.palette})`);
