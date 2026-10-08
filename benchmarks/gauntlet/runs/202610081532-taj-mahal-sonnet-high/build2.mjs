// Taj Mahal — generator for round-2.nbt (spec.md binding). Design one face, rotate it onto all four sides.
// Plinth frame: x/z 0..40 (centre 20), front faces NORTH (-z). The grid is 1 bigger each way for the brick apron.
import { Grid, face } from "../../../../../minecraft-design/tools/bin/../src/build.mjs";

const OUT = new URL("./round-2.nbt", import.meta.url).pathname;
const g = new Grid([43, 41, 43]);
const OFF = 1;
const set = (x, y, z, b, s) => g.set(x + OFF, y, z + OFF, b, s);
const at = (x, y, z) => g.blockAt(x + OFF, y, z + OFF);
const air = (x, y, z) => at(x, y, z) === "minecraft:air";
const fillB = (a, b, blk, s) => { for (let x = a[0]; x <= b[0]; x++) for (let y = a[1]; y <= b[1]; y++) for (let z = a[2]; z <= b[2]; z++) set(x, y, z, blk, s); };
const CAR = (a, b) => fillB(a, b, "air");
const C = "calcite", Q = "smooth_quartz", QB = "quartz_block", SS = "smooth_sandstone", AN = "andesite", BK = "polished_blackstone";
const stairs = (m, facing, half = "bottom") => [`${m}_stairs`, { facing, half, shape: "straight", waterlogged: "false" }];
const slab = (m, type = "bottom") => [`${m}_slab`, { type, waterlogged: "false" }];
const place = (x, y, z, b) => { const [n, s] = Array.isArray(b) ? b : [b]; set(x, y, z, n, s); };

// ---- round-disk helpers (odd diameters centred on a cell) ----
const inD = (dx, dz, dia) => dx * dx + dz * dz <= (dia / 2) ** 2;
const edgeD = (dx, dz, dia) => inD(dx, dz, dia) && !(inD(dx + 1, dz, dia) && inD(dx - 1, dz, dia) && inD(dx, dz + 1, dia) && inD(dx, dz - 1, dia));
const inward = (dx, dz) => (Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : dz > 0 ? "north" : "south");
function disk(cx, cz, y, dia, blk, edgeBlk) {
  const r = Math.ceil(dia / 2);
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (!inD(dx, dz, dia)) continue;
    if (edgeBlk && edgeD(dx, dz, dia)) { const e = typeof edgeBlk === "function" ? edgeBlk(dx, dz) : edgeBlk; place(cx + dx, y, cz + dz, e); }
    else set(cx + dx, y, cz + dz, ...(Array.isArray(blk) ? blk : [blk]));
  }
}
const ringStairs = (cx, cz, y, dia, inner = Q) => disk(cx, cz, y, dia, inner, (dx, dz) => stairs("quartz", inward(dx, dz)));

// ---- apron, plinth, parapet ----
fillB([-1, 0, -1], [41, 0, 41], "bricks");
fillB([0, 1, 0], [40, 4, 40], C);
for (let i = 0; i <= 40; i++) for (const [x, z] of [[i, 0], [i, 40], [0, i], [40, i]]) {
  set(x, 1, z, "bricks"); // base course
  set(x, 5, z, C); set(x, 6, z, C);
  if (i % 4 === 0) set(x, 7, z, SS); // pier posts frame the panels
}

// ---- mausoleum body 25x25, 3x3 chamfered corners ----
fillB([8, 5, 8], [32, 19, 32], C);
for (const [cx, cz, sx, sz] of [[8, 8, 1, 1], [32, 8, -1, 1], [8, 32, 1, -1], [32, 32, -1, -1]])
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1]]) CAR([cx + sx * dx, 5, cz + sz * dz], [cx + sx * dx, 19, cz + sz * dz]);
// roof balustrade slab ring on the roof edge
for (let x = 8; x <= 32; x++) for (let z = 8; z <= 32; z++) {
  if (air(x, 19, z)) continue;
  if (air(x + 1, 19, z) || air(x - 1, 19, z) || air(x, 19, z + 1) || air(x, 19, z - 1)) place(x, 20, z, slab("quartz"));
}

// ---- one face, painted in local (u, y, d) then rotated k quarter-turns ----
const rot = (k, u, d) => [[u, d], [40 - d, u], [40 - u, 40 - d], [d, 40 - u]][k];
const rotF = (k, f) => { for (let i = 0; i < k; i++) f = face.cw(f); return f; };
function paintFace(k) {
  const P = (u, y, d, b, s) => { const [x, z] = rot(k, u, d); set(x, y, z, b, s && s.facing ? { ...s, facing: rotF(k, s.facing) } : s); };
  const PS = (u, y, d, [b, s]) => P(u, y, d, b, s);
  const solid = (u, y, d) => { const [x, z] = rot(k, u, d); return !air(x, y, z); };
  const fillU = (u0, u1, y0, y1, d0, d1, b, s) => { for (let u = u0; u <= u1; u++) for (let y = y0; y <= y1; y++) for (let d = d0; d <= d1; d++) P(u, y, d, b, s); };
  const mir = (u) => 40 - u;

  // skirting, calligraphy band
  for (let u = 8; u <= 32; u++) {
    if (u >= 15 && u <= 25) continue;
    if (solid(u, 5, 8)) P(u, 5, 8, SS);
    if (solid(u, 17, 8)) P(u, 17, 8, BK);
    if (solid(u, 19, 8)) P(u, 19, 8, QB); // cornice course
  }
  // cornice lip, overhangs 1
  for (const u of [10, 11, 12, 13, 14, 26, 27, 28, 29, 30]) PS(u, 19, 7, stairs("quartz", "south", "top"));
  // proud cream pilasters on the piers
  for (const u of [11, 29]) fillU(u, u, 5, 18, 7, 7, SS);

  // niches: 2 wide, 4 high, 1 deep, inverted-stair arch; lower y6-9, upper y11-14
  for (const [a, b] of [[9, 10], [13, 14]]) for (const [A, Bu] of [[a, b], [mir(b), mir(a)]]) for (const t of [6, 11]) {
    for (const u of [A, Bu]) {
      if (solid(u, t, 8)) CAR_P(u, t, t + 2);
      P(u, t, 9, AN); P(u, t + 1, 9, AN); P(u, t + 2, 9, AN); P(u, t + 3, 9, AN);
    }
    if (solid(A, t + 3, 8)) PS(A, t + 3, 8, stairs("quartz", "west", "top"));
    if (solid(Bu, t + 3, 8)) PS(Bu, t + 3, 8, stairs("quartz", "east", "top"));
  }
  function CAR_P(u, y0, y1) { for (let y = y0; y <= y1; y++) P(u, y, 8, "air"); }

  // ---- pishtaq: slab proud by 1, black bands, pointed iwan cut 3 deep, door + jali ----
  fillU(15, 25, 5, 21, 7, 8, C);
  fillU(15, 15, 5, 19, 7, 7, SS); fillU(25, 25, 5, 19, 7, 7, SS);
  fillU(16, 16, 6, 19, 7, 7, BK); fillU(24, 24, 6, 19, 7, 7, BK);
  fillU(16, 24, 19, 19, 7, 7, BK);
  fillU(15, 25, 21, 21, 7, 8, QB);
  const hw = (y) => (y <= 13 ? 3 : y <= 15 ? 2 : y === 16 ? 1 : y === 17 ? 0 : -1);
  for (let y = 5; y <= 17; y++) for (let o = -hw(y); o <= hw(y); o++) {
    fillU(20 + o, 20 + o, y, y, 7, 10, "air");
    P(20 + o, y, 11, AN);
  }
  // door: black U frame, jali above
  fillU(19, 21, 5, 8, 11, 12, "air"); fillU(19, 21, 5, 8, 13, 13, BK);
  fillU(18, 18, 5, 9, 11, 11, BK); fillU(22, 22, 5, 9, 11, 11, BK); fillU(19, 21, 9, 9, 11, 11, BK);
  fillU(19, 21, 10, 14, 12, 12, AN); fillU(19, 21, 10, 14, 11, 11, "iron_bars");

  // pier kiosks (y19-22) over the pilasters, small cap
  for (const u of [11, 14, 26, 29]) { fillU(u, u, 20, 21, 8, 8, SS); PS(u, 22, 8, slab("quartz")); }
  for (const u of [9, 31]) if (solid(u, 19, 9)) { fillU(u, u, 20, 21, 9, 9, SS); PS(u, 22, 9, slab("quartz")); }
}
for (let k = 0; k < 4; k++) paintFace(k);

// ---- drum, onion dome, finial (centre 20,20) ----
for (let y = 20; y <= 26; y++) disk(20, 20, y, 13, Q, (y === 22 || y === 24) ? BK : undefined);
const DOME = { 27: 11, 28: 13, 29: 15, 30: 15, 31: 15, 32: 13, 33: 11, 34: 9, 35: 7, 36: 7, 37: 3 };
for (const [y, dia] of Object.entries(DOME)) {
  const Y = +y;
  if (Y === 36) ringStairs(20, 20, Y, dia);
  else if (Y === 29 || Y === 33) disk(20, 20, Y, dia, Q, QB);
  else disk(20, 20, Y, dia, Q);
}
// cream lancet panels on each face of the dome
for (let k = 0; k < 4; k++) {
  const LANCET = { 29: 0, 30: 1, 31: 1, 32: 1, 33: 0 }; // slim pointed oval, not a yellow cap
  for (const [ys, hw] of Object.entries(LANCET)) for (let o = -hw; o <= hw; o++) for (let d = 0; d <= 20; d++) {
    const [x, z] = rot(k, 20 + o, d);
    if (!air(x, +ys, z)) { set(x, +ys, z, SS); break; }
  }
}
fillB([20, 38, 20], [20, 39, 20], "gold_block");
set(20, 40, 20, "end_rod", { facing: "up" });

// ---- chhatris at (12,12) (28,12) (12,28) (28,28): 5x5, 4 pillars, small dome, gold tip ----
for (const [cx, cz] of [[12, 12], [28, 12], [12, 28], [28, 28]]) {
  for (const [sx, sz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) fillB([cx + sx, 20, cz + sz], [cx + sx, 22, cz + sz], SS);
  disk(cx, cz, 23, 5, QB); // 5x5 cap
  // 5x5 stair ring over a 3x3 core
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const e = Math.max(Math.abs(dx), Math.abs(dz)) === 2;
    if (e) place(cx + dx, 24, cz + dz, stairs("quartz", inward(dx, dz)));
    else set(cx + dx, 24, cz + dz, Q);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) set(cx + dx, 25, cz + dz, Q);
  set(cx, 26, cz, Q); set(cx, 27, cz, "gold_block");
}

// ---- minarets (2,2) (38,2) (2,38) (38,38): free-standing ----
for (const [cx, cz] of [[2, 2], [38, 2], [2, 38], [38, 38]]) {
  fillB([cx - 2, 5, cz - 2], [cx + 2, 7, cz + 2], C);
  fillB([cx - 2, 7, cz - 2], [cx + 2, 7, cz + 2], SS);
  fillB([cx - 1, 8, cz - 1], [cx + 1, 31, cz + 1], Q);
  for (const y of [12, 19, 26]) {
    fillB([cx - 2, y, cz - 2], [cx + 2, y, cz + 2], SS);
    if (y !== 26) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++)
      if (Math.max(Math.abs(dx), Math.abs(dz)) === 2) set(cx + dx, y + 1, cz + dz, "diorite_wall");
  }
  // lantern y27-31: corner + mid pillars, open between, centre column
  fillB([cx - 1, 27, cz - 1], [cx + 1, 30, cz + 1], "air");
  fillB([cx, 27, cz], [cx, 30, cz], Q);
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) fillB([cx + dx, 27, cz + dz], [cx + dx, 30, cz + dz], SS);
  fillB([cx - 2, 31, cz - 2], [cx + 2, 31, cz + 2], QB);
  ringStairs(cx, cz, 32, 5, QB);
  ringStairs(cx, cz, 33, 3, Q);
  set(cx, 34, cz, "gold_block");
}

// ---- connect walls to neighbours ----
for (const c of g.cells.values()) {
  if (!c.block.endsWith("_wall")) continue;
  const [x, y, z] = c.pos;
  const conn = (dx, dz) => { const n = g.blockAt(x + dx, y, z + dz); return n !== "minecraft:air" && n !== "minecraft:end_rod" ? "low" : "none"; };
  c.state = { up: "true", north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
}

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, cells: g.cells.size }));
