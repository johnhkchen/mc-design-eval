// SEA1270159761: five-storey brick mid-rise on 5th Ave N near Denny Way (north Seattle Center fill).
// Local (0,0) = box corner (442,448); x east, z south. Y: 0-1 base course, 2 bulkhead, 3-5 storefront + lintel,
// upper storey floors at y 6, 9, 12, 15, 18 (cornice), parapet 19-20 (cap slab), top at 21; roof kit to 22-ish.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270159761";
const X0 = 442, Z0 = 448, W = 33, D = 36, H = 27;
const man = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = man.buildings.find((q) => q.id === ID);
const F = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

const g = new Voxels([W, H, D]);
const cells = [...F].map((k) => k.split(",").map(Number));

// ring = footprint cells with an outside 4-neighbour; outward = which side(s) face outside; corner = 2+ outside sides
const info = new Map();
for (const [x, z] of cells) {
  const outs = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  if (outs.length) info.set(`${x},${z}`, { outs, corner: outs.length >= 2, facade: outs[0][2] });
}
const ringOf = (x, z) => info.get(`${x},${z}`);
const along = (x, z, f) => (f === "west" || f === "east" ? z : x); // position along the facade

// deterministic facade material for piers / spandrel accents, varied by storey and position
const pierMat = (t, y) => {
  if (t % 9 === 0) return "smooth_sandstone";              // cream accent every ~9 blocks only
  return (t + y) % 3 === 0 ? "red_nether_bricks" : "bricks";
};

// doors and awning: one on 5th Ave (west facade), one on the south facade
const doorCells = new Map(); // "x,z" -> facing
const awning = new Set();
const pickWest = [...info.entries()].find(([k, v]) => v.facade === "west" && !v.corner && k.startsWith("0,") && +k.split(",")[1] === 13);
const doorW = pickWest ? "0,13" : null;
const doorS = [...info.keys()].find((k) => k.endsWith(",35") && +k.split(",")[0] === 14);
for (const [k, facing] of [[doorW, "west"], [doorS, "south"]]) {
  if (!k) continue;
  doorCells.set(k, facing);
  const [x, z] = k.split(",").map(Number);
  for (let d = -1; d <= 1; d++) awning.add(facing === "west" ? `${x},${z + d}` : `${x + d},${z}`);
}

const signBand = new Set();  // sign band over each entrance (text-less coloured band on the awning row)
for (const [k, facing] of [[doorW, "west"], [doorS, "south"]]) {
  if (!k) continue;
  const [x, z] = k.split(",").map(Number);
  for (let d = 0; d <= 0; d++) signBand.add(facing === "west" ? `${x},${z + d}` : `${x + d},${z}`);
}
// vertical recess bays on the long west (street) facade: outer cell stepped in one block for the window rows
const BAY_T = new Set([8, 9, 24, 25]);
const FLOORS = [6, 9, 12, 15];                  // upper storey floor/sill rows (ring); roof deck at 18
const WIN_ROWS = new Set([7, 10, 13, 16]);      // one-block-tall windows; the rest of each storey is brick
const SILL_ROWS = new Set([6, 9, 12, 15]);

// 1. foundation and interior floor slabs
for (const [x, z] of cells) {
  const r = ringOf(x, z);
  g.set(x, 0, z, r ? "stone_bricks" : "stone");
  g.set(x, 1, z, r ? "bricks" : "stone");
  if (!r) for (const f of FLOORS) g.set(x, f, z, "smooth_stone");
  if (!r) g.set(x, 18, z, "gray_concrete");
}

// 2. the walls: ring cells, storey by storey
for (const [k, v] of info) {
  const [x, z] = k.split(",").map(Number);
  const t = along(x, z, v.facade);
  const pier = v.corner || t % 3 === 0;
  const isWest = v.facade === "west" && !v.corner;
  const bay = isWest && BAY_T.has(z);
  const door = doorCells.get(k);
  const awn = awning.has(k);
  for (let y = 2; y <= 20; y++) {
    if (bay && y >= 6 && y <= 17) {
      if (SILL_ROWS.has(y)) g.set(x, y, z, "stone_bricks");
      else if (WIN_ROWS.has(y)) { g.set(x, y, z, "air"); g.set(1, y, z, "glass_pane"); }
      else g.set(x, y, z, "bricks");
      continue;
    }
    if (y === 2) { g.set(x, y, z, "bricks"); continue; }
    if (y <= 4) { // storefront: glass between dark piers, door cells
      if (door && y === 3) { g.set(x, y, z, "dark_oak_door", { facing: door, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (door && y === 4) { g.set(x, y, z, "dark_oak_door", { facing: door, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      g.set(x, y, z, pier ? (t % 6 === 0 ? "dark_oak_planks" : "bricks") : "glass_pane"); continue;
    }
    if (y === 5) {
      if (signBand.has(k)) { g.set(x, y, z, "black_concrete"); continue; }
      g.set(x, y, z, awn ? (t % 2 ? "red_wool" : "gray_wool") : "gray_wool"); continue;
    }
    if (y === 18) { g.set(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }
    if (y === 19) { g.set(x, y, z, v.corner ? "smooth_sandstone" : "red_nether_bricks"); continue; }
    if (y === 20) { g.set(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }
    // upper storeys: sill course (window cols only), one-block window, brick spandrel; piers every 3
    if (SILL_ROWS.has(y)) { g.set(x, y, z, pier ? (v.corner ? "smooth_sandstone" : pierMat(t, y)) : "light_gray_concrete"); continue; }
    if (WIN_ROWS.has(y)) { g.set(x, y, z, pier ? (v.corner ? "smooth_sandstone" : pierMat(t, y)) : "glass_pane"); continue; }
    g.set(x, y, z, v.corner ? "smooth_sandstone" : pier ? pierMat(t, y) : ((t + y) % 2 ? "bricks" : "red_nether_bricks"));
  }
}
function corner_or_pier(v, t) { return v.corner; }

// 3. roof: deck already at y18 interior; mechanical boxes, vents, stair penthouse
const inset = (x, z) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inF(x + dx, z + dz)));
const box = (x0, x1, z0, z1, y0, y1, block) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (inset(x, z))
    for (let y = y0; y <= y1; y++) g.set(x, y, z, block);
};
box(6, 9, 14, 16, 19, 20, "gray_concrete");                       // HVAC box A
for (let z = 14; z <= 16; z++) for (let y = 19; y <= 20; y++) if (inset(9, z)) g.set(9, y, z, "iron_bars");   // louvre face
box(12, 13, 21, 23, 19, 19, "gray_concrete");                    // low unit B
box(24, 26, 15, 17, 19, 20, "light_gray_concrete");              // small fan unit
for (let x = 24; x <= 26; x++) if (inset(x, 17)) g.set(x, 21, 17, "iron_bars");
// stair penthouse at x 18..22, z 26..30: shell to y21, cap slab at y22, door on the north face
for (let x = 18; x <= 22; x++) for (let z = 26; z <= 30; z++) {
  const edge = x === 18 || x === 22 || z === 26 || z === 30;
  if (!edge) continue;
  for (let y = 19; y <= 21; y++) g.set(x, y, z, "light_gray_concrete");
}
for (let x = 18; x <= 22; x++) for (let z = 26; z <= 30; z++) g.set(x, 22, z, "stone_brick_slab", { type: "bottom" });
g.set(20, 19, 26, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(20, 20, 26, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let z = 27; z <= 29; z++) g.set(22, 20, z, "iron_bars");     // penthouse slit vent
for (let z = 27; z <= 29; z++) g.set(18, 20, z, "iron_bars");

// 4. panes and bars connect to neighbouring panes/bars or solid blocks (post pass)
const SOLID = /(stone|brick|concrete|terracotta|planks|log|wool)/;
const solidNb = (name) => name && SOLID.test(name) && !/(slab|stairs|door)/.test(name);
for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) {
  const c = g.get(x, y, z);
  if (!c || !/^minecraft:(glass_pane|iron_bars)$/.test(c.block)) continue;
  const st = {};
  for (const [name, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]]) {
    const n = g.get(x + dx, y, z + dz);
    const nb = n ? n.block.replace("minecraft:", "") : null;
    st[name] = nb && (nb === "glass_pane" || nb === "iron_bars" || solidNb(nb)) ? "true" : "false";
  }
  g.set(x, y, z, c.block.replace("minecraft:", ""), st);
}

const out = `/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/${ID}.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ size: [W, H, D], ...r, doors: [...doorCells.entries()], bays: [...BAY_T] }));
