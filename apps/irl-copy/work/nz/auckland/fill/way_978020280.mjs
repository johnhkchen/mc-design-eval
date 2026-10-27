// A Stripped Classical brick commercial block, c.1925: four storeys of red brick on a stone plinth, cream
// string courses and lintels, a dark timber shopfront on the street side, a flat roof under a cornice. The
// massing follows the lidar roof, smoothed and stepped to 4-block storeys (2, 3 and 4 storeys), so the downhill
// side shows its extra storeys and the taller tier is the corner tower on the podium.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_978020280.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 38, D = 24, H = 28;

// footprint: ground G and lidar roof R per cell, keyed x + z * W
const G = new Map(), R = new Map();
for (const [x, z, g, r] of cells) { G.set(x + z * W, g); R.set(x + z * W, r); }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G.has(x + z * W);

// the lidar roof, mean-smoothed twice over the 3x3 footprint neighbourhood (lidar peaks become tiers, not spikes),
// then stepped to whole 4-block storeys (8, 12, 16 = two, three, four storeys); a low roof is a plinth above its ground
const smooth = (src) => {
  const out = new Map();
  for (const k of G.keys()) {
    const x = k % W, z = Math.floor(k / W);
    let s = 0, n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) { s += src.get(x + dx + (z + dz) * W); n++; }
    out.set(k, s / n);
  }
  return out;
};
const RS = smooth(smooth(R));
const T = new Map();
for (const k of G.keys()) {
  const r = RS.get(k), g = G.get(k);
  const t = r >= 6 ? (r >= 12.5 ? 16 : 4 * Math.round(r / 4)) : 4 * Math.round(r / 4);
  T.set(k, Math.max(t, g + 1));
}
// the top tier is one tower on the podium, not pins: a 16 with fewer than two 16 neighbours steps down to 12
for (const k of G.keys()) {
  if (T.get(k) !== 16) continue;
  const x = k % W, z = Math.floor(k / W);
  const n = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => inF(x + dx, z + dz) && T.get(x + dx + (z + dz) * W) >= 16).length;
  if (n < 2) T.set(k, 12);
}
if (process.env.TIERS) for (let z = 0; z < D; z++) {
  let s = ""; for (let x = 0; x < W; x++) s += G.has(x + z * W) ? String(T.get(x + z * W)).padStart(3) : "  ."; console.log(s);
}

// a block column is solid from y 0 up to its top; a neighbour counts as open at y when it is off the footprint or lower
const solid = (x, z, y) => inF(x, z) && y < T.get(x + z * W);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // west, east, north, south (x, z)
const outward = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));
const DIR_NAME = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false" };   // a pane run along z
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true" };   // a pane run along x

const g = new Voxels([W, H, D]);
const doorCells = [];
const shopCands = [];
const cx = 19, cz = 12;

for (const k of G.keys()) {
  const x = k % W, z = Math.floor(k / W), g0 = G.get(k), t = T.get(k);
  for (let y = 0; y < t; y++) {
    if (y < g0) { g.set(x, y, z, "stone_bricks"); continue; }                  // foundation: solid down to the lowest ground
    const out = outward(x, z, y);
    if (y === t - 1) {                                                       // the roof: cornice on the edge, covering inside
      g.set(x, y, z, out.length ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (out.length === 0) {                                                  // inside: a floor slab per storey, air between
      if (y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const [dx, dz] = out[0], onX = dx !== 0;
    const u = onX ? z : x;                                                   // along the face
    const pier = ((u % 4) + 4) % 4 < 2;                                      // 2-block brick piers, 2-block windows
    const shop = g0 <= 3 && y < 4;
    const o = y % 4;
    let b, st;
    if (y === g0 && !shop) b = "stone_bricks";                               // base course on the plinth
    else if (shop && (o === 0 || o === 3)) b = "dark_oak_planks";            // shopfront bulkhead and fascia
    else if (shop) { if (pier) b = "bricks"; else { b = "glass_pane"; st = onX ? GLASS_X : GLASS_Z; } }
    else if (o === 0) b = "smooth_quartz";                                   // string course at each floor line
    else if (o === 3) b = "bricks";                                          // soldier-course brick head over the windows
    else if (pier) b = "bricks";
    else { b = "glass_pane"; st = onX ? GLASS_X : GLASS_Z; }
    g.set(x, y, z, b, st);

    // a warm light behind some panes: glowstone on the inside cell, the room air between it and the glass stays
    if (b === "glass_pane" && !shop && o === 1 && ((x * 7 + y * 3 + z * 5) % 5) === 0) {
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && outward(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
    if (shop && !pier && y === g0 && g0 <= 2) shopCands.push({ x, z, dx, dz, g0 });
  }
  // roof plant: a couple of iron boxes on the top tier, standing on the roof covering
  if (t >= 16 && outward(x, z, t - 1).length === 0 && (x * 7 + z * 11) % 23 === 0) g.set(x, t, z, "iron_block");
}

// one shopfront entrance: a dark oak door on the shop line, the inward side facing into the room
if (shopCands.length) {
  shopCands.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  const d = shopCands[0];
  const facing = DIR_NAME[`${-d.dx},${-d.dz}`];                              // inward
  g.set(d.x, d.g0, d.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(d.x, d.g0 + 1, d.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  doorCells.push(d);
}

const stats = g.save(`${DIR}/way_978020280.nbt`);
const hist = {}; for (const t of T.values()) hist[t] = (hist[t] || 0) + 1;
console.log("tops", JSON.stringify(hist), "door", doorCells.length, "saved", stats);
