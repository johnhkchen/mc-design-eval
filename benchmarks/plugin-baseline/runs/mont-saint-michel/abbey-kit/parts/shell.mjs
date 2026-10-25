// Part P1 "Rock and granite shell": every mass founded on the rock, hollow above its floor course,
// openings left as air (holes), gables, buttresses, terraces, Degre, Chatelet.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { onFootprint, groundTop } from "../vocab/base.mjs";

const K = (x, y, z) => (y * 121 + z) * 130 + x;
const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return ((h >>> 0) % 10000) / 10000; };
const rect = (x0, x1, z0, z1) => (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
const union = (...f) => (x, z) => f.some((q) => q(x, z));
const rows = (list) => union(...list.map(([z0, z1, x0, x1]) => rect(x0, x1, z0, z1)));

export function build(g) {
  const occ = new Set();
  const holes = new Set();
  const put = (x, y, z, b, st, onlyAir = false) => {
    if (y > 151 || !onFootprint(x, z)) return false;
    const k = K(x, y, z);
    if (holes.has(k) || (onlyAir && occ.has(k))) return false;
    occ.add(k);
    if (st === undefined) g.set(x, y, z, b); else if (Array.isArray(st)) g.set(x, y, z, ...st); else g.set(x, y, z, b, st);
    return true;
  };
  const stair = (x, y, z, facing, half = "bottom", onlyAir = true) => { const [b, s] = B.stairs("stone_brick", facing, half); return put(x, y, z, b, s, onlyAir); };
  const hole = (x0, x1, y0, y1, z0, z1) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const gt = groundTop(x, z); if (gt == null) continue;
      for (let y = Math.max(y0, gt); y <= y1; y++) holes.add(K(x, y, z));
    }
  };
  const wallBlock = (x, y, z, gt) => {
    const h = y - gt, r = hash(x, y, z);
    if (h <= 2) return r < 0.35 ? "mossy_cobblestone" : "cobblestone";
    if (h < 6 && r < 0.12) return r < 0.06 ? "mossy_stone_bricks" : "cracked_stone_bricks";
    if (r > 0.95) return r > 0.985 ? "tuff_bricks" : (r > 0.97 ? "andesite" : "tuff");
    if (r < 0.035) return "cracked_stone_bricks";
    return "stone_bricks";
  };
  // a mass: perimeter walls g..top, interior solid g..fill (or to top when solid)
  const mass = (inf, { top, fill = null, solid = false, quoin = true, x0 = 0, x1 = 129, z0 = 0, z1 = 120 }) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (!inf(x, z) || !onFootprint(x, z)) continue;
      const gt = groundTop(x, z); if (gt == null) continue;
      const nx = !inf(x - 1, z) || !inf(x + 1, z), nz = !inf(x, z - 1) || !inf(x, z + 1);
      const per = nx || nz || !inf(x - 1, z - 1) || !inf(x + 1, z + 1) || !inf(x - 1, z + 1) || !inf(x + 1, z - 1);
      const corner = nx && nz;
      const lim = solid ? top : (per ? top : fill);
      if (lim == null) continue;
      for (let y = gt; y <= lim; y++) {
        let b;
        if (per) {
          b = wallBlock(x, y, z, gt);
          if (quoin && corner && y - gt >= 3) b = (y % 2 === 0) ? "chiseled_stone_bricks" : "polished_andesite";
        } else b = y >= gt + 3 ? "stone_bricks" : "cobblestone";
        put(x, y, z, b);
      }
    }
  };
  const crown = (inf, y, upper, skip = () => false) => {
    for (let z = 0; z <= 120; z++) for (let x = 0; x <= 129; x++) {
      if (!inf(x, z) || !onFootprint(x, z) || skip(x, z)) continue;
      if (inf(x - 1, z) && inf(x + 1, z) && inf(x, z - 1) && inf(x, z + 1)) continue;
      const [b, s] = B.wall("stone_brick");
      put(x, y, z, b, s, true);
      if (upper === "full" || (upper === "alt" && (x + z) % 2 === 0)) put(x, y + 1, z, b, s, true);
    }
  };
  const gable = (axis, c, lo, hi, y0, y1) => {
    const cen = (lo + hi) / 2, hw = (hi - lo + 1) / 2;
    for (let y = y0; y <= y1; y++) {
      const half = hw * (y1 - y + 1) / (y1 - y0 + 2);
      for (let p = lo; p <= hi; p++) {
        if (Math.abs(p - cen) >= half) continue;
        const [x, z] = axis === "x" ? [c, p] : [p, c];
        put(x, y, z, hash(x, y, z) < 0.05 ? "cracked_stone_bricks" : "stone_bricks");
      }
    }
  };

  // ---------- openings first (kept air) ----------
  for (let k = 0; k < 4; k++) {
    const x = 18 + 8 * k;
    hole(x, x + 2, 47, 51, 52, 52); hole(x, x + 2, 47, 51, 76, 76);
    hole(x, x + 2, 58, 60, 58, 58); hole(x, x + 2, 58, 60, 70, 70);
  }
  hole(15, 15, 44, 48, 63, 65); hole(15, 15, 52, 58, 63, 65);
  hole(62, 62, 44, 47, 83, 84);
  // crossing belfry lancets
  for (const x of [51, 58]) { hole(x, x + 1, 85, 95, 58, 58); hole(x, x + 1, 85, 95, 70, 70); }
  for (const z of [60, 67]) { hole(49, 49, 85, 95, z, z + 1); hole(61, 61, 85, 95, z, z + 1); }
  // Merveille north face
  for (let x = 66; x <= 102; x += 6) hole(x, x, 14, 17, 7, 8);
  for (const x of [66, 72, 78]) { hole(x, x + 1, 29, 34, 7, 8); hole(x, x, 43, 45, 7, 7); hole(x + 1, x + 1, 43, 43, 7, 7); }
  for (const x of [90, 96, 102]) hole(x, x, 28, 34, 7, 8);
  for (const x of [86, 90, 92, 96, 98, 102, 104]) hole(x, x, 41, 47, 7, 7);
  // Belle Chaise
  for (const x of [105, 109, 113]) hole(x, x + 1, 30, 35, 62, 62);
  hole(116, 116, 27, 30, 52, 53);
  // logis south windows
  const winS = (x0, x1, zf, floors, step = 6) => {
    for (let x = x0 + 3; x + 1 <= x1 - 1; x += step) for (const f of floors) hole(x, x + 1, f + 1, f + 3, zf - 1, zf);
  };
  winS(18, 47, 92, [44, 49]); winS(57, 71, 98, [31, 36, 41, 46]); winS(72, 86, 104, [26, 31, 36, 41]);
  winS(48, 68, 116, [26, 31, 36, 41]);
  for (const f of [15, 20, 25, 30, 35, 40]) { hole(91, 92, f + 1, f + 3, 103, 104); hole(98, 99, f + 1, f + 3, 103, 104); }
  hole(57, 57, 41, 43, 90, 91);
  // turret slits
  for (const x of [118, 127]) for (const y of [20, 26]) hole(x, x, y, y + 2, 50, 51);

  // ---------- church ----------
  mass(rect(15, 47, 58, 70), { top: 62, fill: 43 });
  mass(rect(15, 47, 52, 57), { top: 53, fill: 43 });
  mass(rect(15, 47, 71, 76), { top: 53, fill: 43 });
  mass(rect(48, 62, 48, 56), { top: 62, fill: 43 });
  mass(rect(48, 62, 72, 86), { top: 62, fill: 43 });
  // crossing tower shaft, cap, corner buttresses
  mass(rect(49, 61, 58, 70), { top: 97, fill: 43, quoin: false });
  for (let z = 58; z <= 70; z++) for (let x = 49; x <= 61; x++) put(x, 98, z, "stone_bricks");
  for (const [bx, bz] of [[48, 57], [61, 57], [48, 69], [61, 69]]) {
    for (let y = 74; y <= 98; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) put(bx + dx, y, bz + dz, "stone_bricks", undefined, true);
  }
  for (const y of [83, 98]) {
    for (let x = 48; x <= 62; x++) { stair(x, y, 57, "south", "top"); stair(x, y, 71, "north", "top"); }
    for (let z = 57; z <= 71; z++) { stair(48, y, z, "east", "top"); stair(62, y, z, "west", "top"); }
  }
  const tow = rect(49, 61, 58, 70);
  crown(tow, 99, "full");
  // west front: pilasters, pediment, aisle balustrades and urns
  for (const z of [58, 61, 67, 70]) for (let y = 44; y <= 61; y++) put(14, y, z, "stone_bricks");
  for (let z = 58; z <= 70; z++) put(14, 62, z, "polished_andesite");
  gable("x", 15, 58, 70, 63, 73);
  for (const [za, zb] of [[52, 57], [71, 76]]) for (let z = za; z <= zb; z++) { const [b, s] = B.wall("stone_brick"); put(15, 54, z, b, s); }
  for (const z of [52, 76]) { const [b, s] = B.wall("stone_brick"); put(15, 55, z, b, s); put(15, 56, z, "polished_andesite_slab", { type: "bottom" }); }
  // nave buttress piers
  for (const x of [15, 23, 31, 39, 47]) {
    for (const [z, f] of [[51, "south"], [77, "north"]]) {
      const gt = groundTop(x, z); if (gt == null) continue;
      for (let y = gt; y <= 52; y++) put(x, y, z, wallBlock(x, y, z, gt));
      stair(x, 53, z, f, "bottom", false);
    }
  }
  gable("z", 48, 48, 62, 63, 73); gable("z", 86, 48, 62, 63, 73);

  // ---------- west terrace ----------
  const terW = rows([[54, 62, 6, 14], [63, 68, 9, 14], [69, 77, 12, 14]]);
  mass(terW, { top: 43, solid: true, quoin: false });
  crown(terW, 44, "full", (x) => x === 14);

  // ---------- choir crypt, chapels (walls above are P4) ----------
  const apse = (x, z) => x > 92 && x <= 97 && (x - 89) ** 2 + (z - 64) ** 2 <= 64;
  const crypt = union(rect(63, 92, 50, 78), apse, rect(77, 81, 46, 49), rect(84, 88, 46, 49),
    rect(66, 70, 79, 81), rect(73, 77, 79, 81), rect(80, 84, 79, 81), rect(87, 91, 79, 81),
    rect(97, 100, 55, 59), rect(97, 100, 62, 66), rect(97, 100, 69, 73));
  mass(crypt, { top: 43, solid: true, quoin: false });

  // ---------- Merveille ----------
  const mw = union(rect(63, 84, 7, 33), rect(56, 62, 9, 33));
  mass(mw, { top: 49, fill: 39 });
  const ring = rect(62, 78, 13, 27);
  for (let z = 7; z <= 33; z++) for (let x = 56; x <= 84; x++) {
    if (!mw(x, z) || ring(x, z)) continue;
    const gt = groundTop(x, z); if (gt == null || gt > 40) continue;
    put(x, 40, z, "stone_bricks", undefined, true);
  }
  mass(rect(85, 107, 7, 27), { top: 49, fill: 40 });
  mass(rect(85, 101, 28, 38), { top: 46, fill: 35 });
  gable("x", 107, 7, 27, 50, 61); gable("x", 85, 7, 27, 50, 61);
  // north buttresses
  for (let x = 63; x <= 106; x += 6) for (const xx of [x, x + 1]) {
    const dep = x >= 81 ? 3 : 1;
    for (let d = 0; d < dep; d++) {
      const z = 6 - d, gt = groundTop(xx, z); if (gt == null) continue;
      const topY = [49, 37, 21][d];
      for (let y = gt; y <= topY; y++) put(xx, y, z, wallBlock(xx, y, z, gt));
      if (topY + 1 >= gt) stair(xx, topY + 1, z, "south", "bottom", false);
    }
  }
  for (let x = 56; x <= 107; x++) for (const y of [23, 39, 49]) stair(x, y, 6, "south", "top");
  // north choir range, north terrace paving
  mass(rows([[34, 41, 63, 86], [42, 44, 63, 68]]), { top: 48, fill: 43 });
  gable("x", 63, 34, 41, 49, 55); gable("x", 86, 34, 41, 49, 55);
  for (let z = 24; z <= 47; z++) for (let x = 24; x <= 55; x++) {
    const gt = groundTop(x, z); if (gt == null) continue;
    const r = hash(x, 0, z);
    put(x, gt, z, r < 0.5 ? "stone" : (r < 0.8 ? "cobblestone" : "gravel"));
  }
  mass(rect(24, 55, 12, 23), { top: 47, fill: 42 });
  gable("x", 24, 12, 23, 48, 54); gable("x", 55, 12, 23, 48, 54);
  mass(rows([[15, 29, 6, 23], [30, 32, 9, 23], [33, 38, 12, 23]]), { top: 45, fill: 42 });
  gable("z", 15, 12, 23, 46, 52); gable("z", 38, 12, 23, 46, 52);
  mass(rows([[39, 41, 15, 23], [42, 44, 12, 23], [45, 47, 6, 23], [48, 51, 3, 23]]), { top: 44, fill: 42 });
  const nwf = rows([[18, 23, 0, 5], [24, 26, 3, 5]]);
  mass(nwf, { top: 13, solid: true, quoin: false });
  for (let z = 18; z <= 26; z++) for (let x = 0; x <= 5; x++) if (nwf(x, z) && (x + z) % 2 === 0) put(x, 14, z, "stone_bricks", undefined, true);
  // NE turret and rampart
  mass(rect(108, 110, 18, 23), { top: 52, solid: true });
  const ner = rows([[24, 29, 108, 116], [30, 32, 111, 116], [33, 38, 114, 116]]);
  mass(ner, { top: 31, solid: true, quoin: false });
  crown(ner, 32, "alt");

  // ---------- Belle Chaise, Chatelet, east ranges ----------
  mass(rect(102, 116, 51, 62), { top: 37, fill: 26 });
  gable("x", 102, 51, 62, 38, 45); gable("x", 116, 51, 62, 38, 45);
  mass(rows([[54, 68, 117, 128], [69, 74, 117, 122]]), { top: 37, fill: 19 });
  gable("z", 54, 117, 128, 38, 44); gable("z", 74, 117, 122, 38, 44);
  mass(rows([[63, 74, 101, 116], [75, 77, 101, 113]]), { top: 35, fill: 19 });
  gable("x", 101, 63, 77, 36, 42); gable("x", 116, 63, 74, 36, 42);

  // Chatelet body with dark entry stair
  const chat = rect(117, 128, 39, 47);
  const vault = rect(120, 125, 40, 46);
  for (let z = 39; z <= 47; z++) for (let x = 117; x <= 128; x++) {
    const gt = groundTop(x, z); if (gt == null || !onFootprint(x, z)) continue;
    const per = x === 117 || x === 128 || z === 39 || z === 47;
    const w = 16 + (47 - z);
    const entry = z === 47 && x >= 121 && x <= 124;
    for (let y = gt; y <= 31; y++) {
      let b = per ? wallBlock(x, y, z, gt) : "stone_bricks";
      if (vault(x, z)) {
        if (y <= w - 2) b = "stone_bricks";
        else if (y === w - 1) { const [bb, s] = B.stairs("stone_brick", "north", "bottom"); put(x, y, z, bb, s); continue; }
        else if (y <= w + 3) continue;
      } else if (entry) {
        if (y <= 14) b = "stone_bricks"; else if (y === 15) b = "stone_bricks"; else if (y <= 21) continue;
      }
      put(x, y, z, b);
    }
  }
  // arch head corners
  stair(121, 21, 47, "west", "top", false); stair(124, 21, 47, "east", "top", false);
  // machicolation ring & parapet
  for (let x = 117; x <= 128; x++) { stair(x, 31, 38, "south", "top"); }
  for (let x = 120; x <= 125; x++) stair(x, 31, 48, "north", "top");
  for (let z = 39; z <= 47; z++) { stair(116, 31, z, "east", "top"); stair(129, 31, z, "west", "top"); }
  crown(chat, 32, "alt");
  // half-round turrets
  for (const [a, b] of [[117, 119], [126, 128]]) {
    const t = (x, z) => x >= a && x <= b && z >= 48 && z <= 51 && !((z === 51) && (x === a || x === b));
    mass(t, { top: 33, solid: true, quoin: false });
    crown(t, 34, "alt");
  }

  // ---------- Grand Degre ----------
  for (let x = 63; x <= 104; x++) {
    const w = x <= 81 ? 43 : 43 - (x - 81);
    for (let z = 82; z <= 86; z++) {
      const gt = groundTop(x, z); if (gt == null) continue;
      const wall = z === 82 || z === 86;
      const bridge = x >= 88 && x <= 90;
      if (wall) {
        const top = bridge ? 52 : w + 7;
        for (let y = gt; y <= top; y++) put(x, y, z, wallBlock(x, y, z, gt));
        if (!bridge) put(x, w + 8, z, "stone_brick_slab", { type: "bottom" });
      } else {
        for (let y = gt; y <= w - 2; y++) put(x, y, z, y >= gt + 3 ? "stone_bricks" : "cobblestone");
        if (x <= 81) put(x, w - 1, z, "stone_bricks");
        else { const [b, s] = B.stairs("stone_brick", "west", "bottom"); put(x, w - 1, z, b, s); }
        if (bridge) {
          put(x, 52, z, "stone_bricks");
          if (z === 83 || z === 85) stair(x, 51, z, z === 83 ? "north" : "south", "top");
        }
      }
    }
  }

  // ---------- logis and the south-west ----------
  mass(rect(18, 47, 79, 92), { top: 55, fill: 43 });
  gable("x", 18, 79, 92, 56, 65); gable("x", 47, 79, 92, 56, 65);
  const saut = rect(51, 56, 87, 95);
  mass(saut, { top: 40, solid: true, quoin: false });
  crown(saut, 41, "full", (x, z) => x === 56 || z === 87);
  mass(rect(57, 71, 87, 98), { top: 53, fill: 30 });
  gable("x", 57, 87, 98, 54, 63); gable("x", 71, 87, 98, 54, 63);
  mass(rect(72, 86, 87, 104), { top: 46, fill: 25 });
  gable("x", 72, 87, 104, 47, 55); gable("x", 86, 87, 104, 47, 55);
  mass(rect(87, 104, 87, 104), { top: 45, fill: 14 });
  gable("z", 104, 87, 104, 46, 54); gable("z", 87, 87, 104, 46, 54);
  mass(rect(57, 62, 99, 101), { top: 56, fill: 33 });
  mass(rows([[108, 110, 57, 68], [111, 116, 48, 68]]), { top: 46, fill: 25 });
  gable("x", 48, 111, 116, 47, 54); gable("x", 68, 108, 116, 47, 54);
  const scrt = rows([[105, 107, 66, 98], [108, 110, 69, 83]]);
  mass(scrt, { top: 19, solid: true, quoin: false });
  crown(scrt, 20, "alt");
  mass(rows([[102, 104, 15, 23], [105, 110, 9, 26]]), { top: 48, fill: 33 });
  gable("x", 9, 105, 110, 49, 55); gable("x", 26, 105, 110, 49, 55);
  mass(rect(9, 26, 111, 113), { top: 21, solid: true, quoin: false });
  mass(rows([[93, 98, 21, 26], [99, 101, 21, 23]]), { top: 52, fill: 43 });
}
