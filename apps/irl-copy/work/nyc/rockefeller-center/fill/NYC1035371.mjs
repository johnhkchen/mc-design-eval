// 343 Madison Avenue: a 1920s-style setback office tower. Pale stone piers and storey bands, blue-glazed bays, a
// granite base course and a shopfront entrance on the avenue face, the lidar roof stepping from the central core
// (about 75 blocks, 25 storeys) down to the south wing (about 51). Each cell's roof is smoothed to a 3-block storey
// line; every column is solid from y 0 up to its roof, so each storey stands on the one below. Interiors are an air
// gap behind the glass (warm glowstone in some bays) with a floor slab per storey and a solid core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035371.cells.json`, "utf8"));
const W = 16, D = 13, H = 87, STOREY = 3, GLASS = "light_blue_stained_glass_pane";

const at2 = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1);
const raw = new Array(W * D).fill(null);
for (const [x, z, g, r] of cells) raw[at2(x, z)] = { g, r };

// Roof per cell: lidar zero is a missed return, so it takes the median of its valid neighbours; every roof is then
// quantised to a storey line (3 blocks), which flattens the lidar noise into clean tiers.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const Rq = new Array(W * D).fill(0);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!raw[at2(x, z)]) continue;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const j = at2(x + dx, z + dz);
    if (j >= 0 && raw[j] && raw[j].r > 0) nb.push(raw[j].r);
  }
  if (nb.length) Rq[at2(x, z)] = Math.round(median(nb) / STOREY) * STOREY;
}
const topMax = Math.max(...Rq);

const occ = (x, z, y) => { const i = at2(x, z); return i >= 0 && y < Rq[i]; };
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };        // N is low z (uptown)
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => !occ(x + DIRS[d][0], z + DIRS[d][1], y));

const B = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, s) => B.set(key(x, y, z), { b, s });
const has = (x, y, z) => B.has(key(x, y, z));

const windows = [];
const facade = (x, y, z, ex) => {
  const xFace = ex.includes("W") || ex.includes("E"), zFace = ex.includes("N") || ex.includes("S");
  if (xFace && zFace) return put(x, y, z, "calcite");                  // corner pier
  const idx = xFace ? z : x, period = y < STOREY ? 2 : 3;               // shopfront bays at grade, wider bays above
  if (idx % period === 0) return put(x, y, z, "calcite");
  put(x, y, z, GLASS);
  windows.push({ x, y, z, ex, idx });
};

// Columns: storey bands (granite base, quartz bands), glazed bays with an air gap behind, solid core, roof deck, parapet.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = Rq[at2(x, z)];
  if (!top) continue;
  const g0 = raw[at2(x, z)].g;
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y < g0) { put(x, y, z, "stone"); continue; }                      // foundation to the lowest ground
    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }        // roof deck (a cornice line on the edge)
    if (y % STOREY === 0) { put(x, y, z, ex.length ? (y === 0 ? "polished_granite" : "smooth_quartz") : "stone_bricks"); continue; }
    if (ex.length) { facade(x, y, z, ex); continue; }
    const beside = Object.values(DIRS).some(([dx, dz]) => occ(x + dx, z + dz, y) && exposed(x + dx, z + dz, y).length);
    if (!beside) put(x, y, z, "stone");                                    // else: air gap behind the glass
  }
  if (exposed(x, z, top).length) put(x, top, z, "calcite");                // parapet on the open edges
}

// Avenue entrance on the west face: recessed under a dark canopy band, a door with hanging lanterns either side.
for (let z = 4; z <= 6; z++) put(0, 3, z, "polished_andesite");
put(0, 2, 4, "lantern", { hanging: "true", waterlogged: "false" });
put(0, 2, 6, "lantern", { hanging: "true", waterlogged: "false" });
const door = { facing: "east", hinge: "left", open: "false", powered: "false" };
put(0, 1, 5, "dark_oak_door", { ...door, half: "lower" });
put(0, 2, 5, "dark_oak_door", { ...door, half: "upper" });

// Warm light behind some glazed bays: glowstone in the air gap, on the storey band, every other storey.
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
for (const w of windows) {
  if (w.y % STOREY !== 1 || Math.floor(w.y / STOREY) % 2 !== 1 || w.idx % 4 !== 2) continue;
  if (B.get(key(w.x, w.y, w.z))?.b !== GLASS) continue;
  const [dx, dz] = INWARD[w.ex[0]];
  const gx = w.x + dx, gz = w.z + dz;
  if (occ(gx, gz, w.y) && !has(gx, w.y, gz)) put(gx, w.y, gz, "glowstone");
}

// Plant on the lower tiers: two-high mechanical boxes, kept off the edges.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = Rq[at2(x, z)];
  if (!top || top === topMax || x % 4 !== 1 || z % 4 !== 1) continue;
  if (exposed(x, z, top).length) continue;
  put(x, top, z, "polished_andesite"); put(x, top + 1, z, "polished_andesite");
}

// Crown: a glazed penthouse over the core at the top tier, a copper spire and a lantern at the tip.
const PH = (x, z) => x >= 5 && x <= 8 && z >= 4 && z <= 6 && Rq[at2(x, z)] === topMax;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!PH(x, z)) continue;
  const edge = Object.values(DIRS).some(([dx, dz]) => !PH(x + dx, z + dz));
  if (edge) { put(x, topMax, z, "calcite"); put(x, topMax + 1, z, GLASS); }
  put(x, topMax + 2, z, "calcite");
}
put(6, topMax + 3, 5, "copper_block");
put(6, topMax + 4, 5, "copper_block");
put(6, topMax + 5, 5, "lantern", { hanging: "false", waterlogged: "false" });

// Pane arms: a pane joins its neighbours that are panes or solid blocks.
const joins = (x, y, z) => { const p = B.get(key(x, y, z)); return !!p && !/door|lantern/.test(p.b); };
for (const [k, p] of B) {
  if (p.b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  p.s = { east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, p] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, p.b, p.s); }
const out = g.save(`${DIR}/NYC1035371.nbt`);
console.log(`tiers ${[...new Set(Rq.filter(Boolean))].sort((a, b) => a - b)}, top ${topMax + 5}, blocks ${out.blocks}, palette ${out.palette}`);
