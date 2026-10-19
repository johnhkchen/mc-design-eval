// 659 5 Avenue (1912, commercial & office): a Beaux-Arts loft of pale limestone over a dark granite-like base, a
// 36-block tower core set back from a 21-block podium on the Fifth Avenue side, a one-storey wing to the east, and a
// penthouse with lanterns on the core. Floors are solid slabs at every storey line and the interior between them is air.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035707.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 36, D = 20, H = 47;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                                    // [dx, dz]
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;

// The footprint, with each cell's ground and lidar roof.
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const at = (x, z) => cell.get(key(x, z));

// Distance from the outside: 1 on the outer ring, rising inward.
const depth = new Map(); const queue = [];
for (const c of cell.values()) if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !depth.has(key(n.x, n.z))) { depth.set(key(n.x, n.z), d + 1); queue.push(n); } }
}

// Lidar roofs are noisy: take the median of the 3x3 neighbourhood, then pick a tier.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
for (const c of cell.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  c.roof = median(near);
  // Tier: a one-storey wing below 10, a 21-block podium, and a 35-block tower core set back 3 cells from the edge.
  const d = depth.get(key(c.x, c.z));
  const target = c.roof < 10 ? 0 : c.roof < 28 ? 21 : d >= 3 ? 35 : 21;
  const storeys = target === 0 ? 1 : Math.max(1, Math.round((target - c.g) / 3));
  c.top = c.g + 3 * storeys;                                  // the roof slab; a parapet stands above it
}

// Does the side of cell c at height y face outdoors: off the footprint, or above the neighbour's roof.
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y > n.top; });
const alongOf = ([dx]) => (dx !== 0 ? "z" : "x");

// Block at cell c, height y (null = air). Storey rows: slab (row 0), window (row 1), header (row 2).
function blockAt(c, y) {
  const { g, top } = c;
  if (y < g) return ["polished_andesite"];                           // foundation under the slope
  if (y > top + 2) return null;
  const ex = exposed(c, y), base = y < g + 3;
  if (y === top + 1 || y === top + 2) {                               // cornice and parapet
    if (!ex.length) return null;
    return y === top + 1 ? ["smooth_quartz_stairs", { facing: DIR_NAME[ex[0].join(",")], half: "bottom", shape: "straight", waterlogged: "false" }] : ["calcite"];
  }
  if ((y - g) % 3 === 0) {                                            // floor slab, or the roof
    if (y === top) return ex.length ? ["smooth_quartz"] : ["deepslate_tiles"];
    return [base ? "polished_andesite" : "smooth_quartz"];
  }
  if (!ex.length) return null;                                        // interior air behind the facade
  const row = (y - g) % 3;
  if (row === 2) return [base ? "deepslate_tiles" : "calcite"];       // header or shop fascia
  if (ex.length >= 2) return ["smooth_quartz"];                       // corner quoin
  const along = alongOf(ex[0]) === "z" ? c.z : c.x;
  if (along % 3 === 0) return base ? ["polished_andesite"] : ["quartz_pillar", { axis: "y" }];
  return ["gray_stained_glass_pane"];
}

const v = new Voxels([W, H, D]);
const glow = [];                                                      // warm lights just behind some panes
for (const c of cell.values()) {
  for (let y = 0; y <= c.top + 2; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    v.set(c.x, y, c.z, b[0], b[1]);
    if (b[0] === "gray_stained_glass_pane") {
      const [dx, dz] = exposed(c, y)[0], k = Math.floor((y - c.g) / 3), along = alongOf([dx]) === "z" ? c.z : c.x;
      if ((k + along) % 5 === 0 && at(c.x - dx, c.z - dz)) glow.push([c.x - dx, y, c.z - dz]);
    }
  }
}
for (const [x, y, z] of glow) v.set(x, y, z, "glowstone");

// Entrance on the Fifth Avenue (west) face: a pair of dark oak doors, a lantern hung inside.
const door = at(0, 9);
if (door) {
  const y0 = door.g + 1;
  [[9, "left"], [10, "right"]].forEach(([z, hinge]) => {
    v.set(0, y0, z, "dark_oak_door", { facing: "east", half: "lower", hinge, open: "false", powered: "false" });
    v.set(0, y0 + 1, z, "dark_oak_door", { facing: "east", half: "upper", hinge, open: "false", powered: "false" });
  });
  v.set(1, y0 + 1, 9, "lantern", { hanging: "true", waterlogged: "false" });
}

// A penthouse on the tower core: a solid calcite mass with lanterns on its corners.
const core = [...cell.values()].filter((c) => c.top >= 33 && depth.get(key(c.x, c.z)) >= 3);
if (core.length) {
  const cx = core.reduce((s, c) => s + c.x, 0) / core.length, cz = core.reduce((s, c) => s + c.z, 0) / core.length;
  let best = null;
  for (let x0 = 0; x0 <= W - 4; x0++) for (let z0 = 0; z0 <= D - 4; z0++) {
    const cs = []; for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) cs.push(at(x0 + dx, z0 + dz));
    if (cs.some((c) => !c || c.top < 33 || depth.get(key(c.x, c.z)) < 3)) continue;
    const dist = Math.abs(x0 + 1.5 - cx) + Math.abs(z0 + 1.5 - cz);
    if (!best || dist < best.dist) best = { x0, z0, cs, dist };
  }
  if (best) {
    const yb = Math.max(...best.cs.map((c) => c.top));
    for (const c of best.cs) {
      for (let y = c.top + 1; y <= yb + 1; y++) v.set(c.x, y, c.z, "calcite");
      v.set(c.x, yb + 2, c.z, "smooth_quartz");
    }
    for (const [dx, dz] of [[0, 0], [3, 0], [0, 3], [3, 3]]) v.set(best.x0 + dx, yb + 3, best.z0 + dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Panes connect to any block beside them, as the game draws them.
for (const c of cell.values()) for (let y = 0; y <= c.top + 2; y++) {
  const b = v.get(c.x, y, c.z);
  if (!b || b.block !== "minecraft:gray_stained_glass_pane") continue;
  const side = (dx, dz) => (v.get(c.x + dx, y, c.z + dz) ? "true" : "false");
  v.set(c.x, y, c.z, "gray_stained_glass_pane", { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
}

const out = `${DIR}/NYC1035707.nbt`;
const r = v.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
