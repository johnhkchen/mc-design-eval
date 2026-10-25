// Revision pass (owner comment v2), run on the finished grid after the six parts:
// 1. dressed buff-grey granite: exposed masonry mixed in courses and patches (stone/tuff bricks, polished tuff,
//    andesite, cracked/mossy low and on the north face), chiseled/smooth jambs beside every window pane;
// 2. the rock: exposed masonry below each column's rock line (under floors and windows, following the GROUND map)
//    becomes rough rock (stone, cobble, andesite, tuff, gravel, moss, grass on top), stepped and battered;
//    the Merveille's north wall keeps only a low rock skirt so it still rises sheer;
// 3. Merveille buttresses picked out (quoined edges, stepped tops) and the choir's south pinnacles, apse flyers,
//    crockets and finials so the east end reads as Flamboyant.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { onFootprint, groundTop } from "../vocab/base.mjs";

const hash = (x, y, z, s = 0) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + s * 1013904223) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000; };
// smooth value noise on a coarse lattice (patches a few blocks across)
const lerp = (a, b, t) => a + (b - a) * t;
function noise(x, y, z, cell, s) {
  const fx = x / cell, fy = y / cell, fz = z / cell;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), z0 = Math.floor(fz);
  const tx = fx - x0, ty = fy - y0, tz = fz - z0;
  let v = 0;
  for (const [dx, wx] of [[0, 1 - tx], [1, tx]]) for (const [dy, wy] of [[0, 1 - ty], [1, ty]]) for (const [dz, wz] of [[0, 1 - tz], [1, tz]]) v += wx * wy * wz * hash(x0 + dx, y0 + dy, z0 + dz, s);
  return v;
}

const MASONRY = new Set(["stone_bricks", "cracked_stone_bricks", "mossy_stone_bricks", "cobblestone", "mossy_cobblestone", "stone", "andesite", "tuff", "tuff_bricks"].map((b) => "minecraft:" + b));
const PANE = /stained_glass_pane$/;
const N6 = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];

export function finish(g) {
  const [W, H, D] = [130, 154, 121];
  const bl = (x, y, z) => g.blockAt(x, y, z);
  const isMas = (x, y, z) => MASONRY.has(bl(x, y, z));
  const open = (x, y, z) => {
    if (x < 0 || z < 0 || x >= W || z >= D || y >= H) return true;
    if (!onFootprint(x, z)) return true;
    return g.isAir(x, y, z);
  };
  const exposed = (x, y, z) => N6.some(([dx, dy, dz]) => open(x + dx, y + dy, z + dz));
  const merv = (x, z) => x >= 56 && x <= 110 && z <= 8;

  // ---- rock line per column: below the first non-masonry cell (floor, window, door) of the column and its
  // neighbours, and below a terrain envelope (local high ground) so the rock climbs with the slope.
  const first = new Int16Array(W * D).fill(-1);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const gt = groundTop(x, z); if (gt == null || !onFootprint(x, z)) continue;
    let y = gt; while (y < H && isMas(x, y, z)) y++;
    first[z * W + x] = y;
  }
  const rockTop = new Int16Array(W * D).fill(-1);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const gt = groundTop(x, z); if (gt == null || first[z * W + x] < 0) continue;
    let cap = first[z * W + x], hi = gt;
    for (let dz = -12; dz <= 12; dz++) for (let dx = -12; dx <= 12; dx++) {
      const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= D) continue;
      const f = first[zz * W + xx]; if (f < 0) continue;
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && f > (groundTop(xx, zz) ?? 0) + 1) cap = Math.min(cap, f);  // open courts don't count
      const gg = groundTop(xx, zz); if (gg != null) hi = Math.max(hi, gg);
    }
    let top;
    if (merv(x, z)) top = gt + 2 + Math.floor(hash(x, 0, z, 3) * 3);
    else {
      // stepped: quantised to 3-course ledges, with irregular jitter
      const raw = gt + 0.85 * (hi - gt) + (noise(x, 0, z, 5, 7) - 0.5) * 6;
      top = Math.floor(raw / 3) * 3 + (hash(x, 0, z, 4) < 0.3 ? 1 : 0);
    }
    rockTop[z * W + x] = Math.min(top, cap - 2);
  }

  const rockBlock = (x, y, z, surface) => {
    const r = hash(x, y, z, 11), p = noise(x, y, z, 3, 12), q = noise(x, y, z, 7, 13);
    if (surface && r < 0.22) return "grass_block";
    if (surface && r < 0.34) return "mossy_cobblestone";
    if (q > 0.6 && r < 0.2) return "mossy_cobblestone";
    if (p > 0.6) return r < 0.45 ? "andesite" : (r < 0.7 ? "cobblestone" : "stone");
    if (p < 0.38) return r < 0.45 ? "tuff" : (r < 0.6 ? "gravel" : "cobblestone");
    if (r < 0.15) return "mossy_cobblestone";
    if (r < 0.5) return "cobblestone";
    if (r < 0.62) return "andesite";
    return "stone";
  };

  // ---- granite mix for exposed masonry above the rock line
  const wallMix = (x, y, z, low, north) => {
    const r = hash(x, y, z, 21), patch = noise(x, y, z, 5, 22), course = hash(0, y, 0, 23);
    if ((low || north) && r < (north ? 0.16 : 0.2)) return r < 0.08 ? "mossy_stone_bricks" : "cracked_stone_bricks";
    if (patch > 0.66) return r < 0.55 ? "tuff_bricks" : (r < 0.8 ? "polished_tuff" : "stone_bricks");
    if (patch < 0.3) return r < 0.25 ? "andesite" : (r < 0.4 ? "polished_andesite" : "stone_bricks");
    if (course < 0.18) return r < 0.6 ? "tuff_bricks" : "stone_bricks";      // a darker course now and then
    if (r < 0.06) return "tuff_bricks";
    if (r < 0.09) return "cracked_stone_bricks";
    return "stone_bricks";
  };

  const sets = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const rt = rockTop[z * W + x]; if (rt < 0) continue;
    const gt = groundTop(x, z);
    for (let y = gt; y < Math.min(H, 152); y++) {
      const b = bl(x, y, z);
      if (!MASONRY.has(b) || b === "minecraft:stone" && y < gt) continue;
      if (!exposed(x, y, z)) continue;
      if (y <= rt) { sets.push([x, y, z, rockBlock(x, y, z, open(x, y + 1, z))]); continue; }
      // window jambs: masonry beside a pane in the wall plane
      const jamb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => PANE.test(bl(x + dx, y, z + dz)));
      if (jamb) { sets.push([x, y, z, y % 2 ? "chiseled_stone_bricks" : "smooth_stone"]); continue; }
      if (/(cobblestone|:stone)$/.test(b)) continue;     // plinth cobble and paving stay as they are
      if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => open(x + dx, y, z + dz))) continue;  // wall faces only
      sets.push([x, y, z, wallMix(x, y, z, y - Math.max(rt, gt) < 7, z <= 8 || x <= 6)]);
    }
  }
  for (const [x, y, z, b] of sets) g.set(x, y, z, b);

  // string courses, corbel tables and window heads (upside-down stone brick stairs) in polished andesite, so trim reads
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < 100; y++) {
    const c = g.get(x, y, z);
    if (c && c.block === "minecraft:stone_brick_stairs" && c.state?.half === "top") g.set(x, y, z, "polished_andesite_stairs", c.state);
  }

  // battered rock skirt: in open footprint cells at the foot of a rock face, a stepped talus one course lower per cell out
  const talus = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const rt = rockTop[z * W + x]; if (rt < 0 || merv(x, z)) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, zz = z + dz; if (!onFootprint(xx, zz)) continue;
      const gg = groundTop(xx, zz); if (gg == null) continue;
      const top = Math.min(rt - 2, gg + 3);
      for (let y = gg; y <= top; y++) if (g.isAir(xx, y, zz) && g.isAir(xx, y + 2, zz)) talus.push([xx, y, zz, rockBlock(xx, y, zz, y === top)]);
    }
  }
  for (const [x, y, z, b] of talus) if (g.isAir(x, y, z)) g.set(x, y, z, b);

  // ---- Merveille buttresses: quoined outer arrises and stepped weathered tops
  for (let x = 63; x <= 106; x += 6) for (const xx of [x, x + 1]) for (let z = 4; z <= 6; z++) {
    const gt = groundTop(xx, z); if (gt == null || !onFootprint(xx, z)) continue;
    const rt = rockTop[z * W + xx];
    for (let y = Math.max(gt, rt + 1); y <= 49; y++) {
      if (!isMas(xx, y, z) && bl(xx, y, z) !== "minecraft:tuff_bricks" && !/polished_tuff|polished_andesite|stone_bricks$/.test(bl(xx, y, z))) continue;
      const edge = (xx === x ? open(xx - 1, y, z) : open(xx + 1, y, z)) || open(xx, y, z - 1);
      if (edge && y % 3 === 0) g.set(xx, y, z, "chiseled_stone_bricks");
      else if (edge && y % 3 === 1) g.set(xx, y, z, "polished_andesite");
    }
  }

  // ---- choir: south pinnacle shafts on the culées (north side has them), crockets, finials
  const air = (x, y, z) => onFootprint(x, z) && y <= 151 && g.isAir(x, y, z);
  const put = (x, y, z, b, s) => { if (air(x, y, z)) { s ? g.set(x, y, z, b, s) : g.set(x, y, z, b); return true; } return false; };
  const wall = (x, y, z) => put(x, y, z, ...B.wall("stone_brick"));
  const crockets = (x, y, z) => {
    for (const [f, dx, dz] of [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]]) {
      const [b, s] = B.stairs("stone_brick", f, "bottom");
      // a crocket on the face, its back to the shaft
      put(x + dx, y, z + dz, b, { ...s, facing: { east: "west", west: "east", south: "north", north: "south" }[f] });
    }
  };
  for (const x of [69, 75, 81, 87]) {
    for (const z of [49, 79]) {
      for (let y = 71; y <= 78; y++) wall(x, y, z);
      if (bl(x, 71, z).endsWith("stone_brick_wall")) { crockets(x, 73, z); crockets(x, 76, z); }
      put(x, 79, z, "end_rod");
    }
  }
  // pier pinnacles on the balustrade: finials
  for (const x of [63, 69, 75, 81, 87]) for (const z of [57, 71]) for (let y = 74; y <= 80; y++) {
    if (g.isAir(x, y, z) && !g.isAir(x, y - 1, z)) { put(x, y, z, "end_rod"); break; }
  }
  // apse corner culées with crocketed pinnacles (a diagonal arc can't join face to face on this grid)
  for (const [cx, cz, sz] of [[98, 54, 1], [98, 74, -1]]) {
    for (let y = 30; y <= 70; y++) for (const dx of [0, 1]) put(cx + dx, y, cz, "stone_bricks");
    for (let y = 71; y <= 78; y++) wall(cx, y, cz);
    crockets(cx, 73, cz); crockets(cx, 76, cz);
    put(cx, 79, cz, "end_rod");
  }
  // lanterns on the chapel cap finials (warm points at dusk)
  for (const [cx, cz] of [[68, 80], [75, 80], [82, 80], [89, 80], [79, 47], [86, 47], [98, 57], [98, 64], [98, 71]]) {
    for (let y = 60; y <= 64; y++) if (g.isAir(cx, y, cz) && !g.isAir(cx, y - 1, cz)) { put(cx, y, cz, ...B.lantern(false)); break; }
  }
}
