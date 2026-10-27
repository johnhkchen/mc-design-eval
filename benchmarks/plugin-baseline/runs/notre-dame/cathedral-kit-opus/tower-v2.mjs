// v1 -> v2 tower fix: reads v1.nbt, rebuilds only the two west towers' upper stage (y 58..97), writes the out file.
// Usage: node tower-v2.mjs <out.nbt>     (run via make-v2.sh, which moves it into build.nbt)
// Written for the N tower (x 2..22, z 10..30); the S tower is its mirror about z = 38 (z' = 76 - z, facings flipped).
//   - the old belfry slits (3 x 25 boxes, louvres every 2nd course) are restored to ashlar,
//   - belfry: per face two 3-wide pointed lancets (y 71..86, stepped head) in a 2-deep reveal, black panes behind,
//     a sandstone_wall colonnette between, a stepped pointed hood moulding over the pair (y 87..91),
//   - blind arcade band y 64..67 (2-wide niches under stair heads), string courses y 70 and y 93,
//   - clasping corner buttresses (+1, stepping 4 -> 3 -> 2 cells), the west buttresses step back from +2 to +1,
//   - tops: openwork parapet (iron bars between posts under the stone rail) around the lead deck.
import { load, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { inFootprint } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node tower-v2.mjs <out.nbt>");
const g = load("v1.nbt");

const FLIP = { north: "south", south: "north", east: "east", west: "west", up: "up", down: "down" };
const bname = (b) => (b ? b.replace("minecraft:", "") : "air");
const cur = (x, y, z) => bname(g.blockAt(x, y, z));
const isAir = (x, y, z) => cur(x, y, z) === "air";

// mode: "force" (overwrite), "put" (only into air inside the footprint). Every write lands in both towers (mirror).
function W(mode, x, y, z, block, state = {}) {
  for (const m of [0, 1]) {
    const zz = m ? 76 - z : z;
    let st = state;
    if (m && st.facing) st = { ...st, facing: FLIP[st.facing] };
    if (!g.inBounds(x, y, zz) || !inFootprint(x, zz)) continue;
    if (mode === "put" && !isAir(x, y, zz)) continue;
    g.set(x, y, zz, block, st);
  }
}
const force = (x, y, z, b, s) => W("force", x, y, z, b, s);
const put = (x, y, z, b, s) => W("put", x, y, z, b, s);
const air = (x, y, z) => W("force", x, y, z, "air");
const stairs = (mat, facing, half = "bottom") => [`${mat}_stairs`, { facing, half, shape: "straight", waterlogged: "false" }];
const slab = (mat, type) => [`${mat}_slab`, { type, waterlogged: "false" }];

// ---- faces of the N tower: out = the way it looks; (u, d) -> [x, z]; d -1 proud, 0 outer layer, 1 inner layer, 2 behind
const FACES = {
  west:  { out: "west",  at: (u, d) => [2 + d, u],  lo: 15, hi: 28, c: 21, arc: [16, 27] },
  east:  { out: "east",  at: (u, d) => [22 - d, u], lo: 14, hi: 26, c: 20, arc: [14, 26] },
  north: { out: "north", at: (u, d) => [u, 10 + d], lo: 9,  hi: 18, c: 13, arc: [9, 18] },
  south: { out: "south", at: (u, d) => [u, 30 - d], lo: 9,  hi: 18, c: 13, arc: [9, 18] },
};
const INWARD = { west: "east", east: "west", north: "south", south: "north" };
// "toward low u" / "toward high u" as a facing, per face (u runs +z on west/east, +x on north/south)
const LOW = { west: "north", east: "north", north: "west", south: "west" };
const HIGH = { west: "south", east: "south", north: "east", south: "east" };

// 1. restore the old belfry slits to plain ashlar (box + a jamb each side, y 61..87)
for (const [zA, zB] of [[10, 30]]) {
  const boxes = [];
  for (const z0 of [zA + 4, zB - 6]) { boxes.push([2, z0 - 1, 3, z0 + 3]); boxes.push([21, z0 - 1, 22, z0 + 3]); }
  for (const x0 of [6, 16]) { boxes.push([x0 - 1, zA, x0 + 3, zA + 1]); boxes.push([x0 - 1, zB - 1, x0 + 3, zB]); }
  for (const [xa, za, xb, zb] of boxes) {
    const [x0, z0, x1, z1] = [xa, za, xb, zb];
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 61; y <= 87; y++) {
      if (cur(x, y, z) !== "air" || y > 61) force(x, y, z, "smooth_sandstone");
    }
  }
}

// black pane with connections along the face axis
const pane = (f, x, y, z, joinLow, joinHigh) => {
  const ns = f === "west" || f === "east";
  const st = { north: "false", south: "false", east: "false", west: "false" };
  if (ns) { st.north = String(joinLow); st.south = String(joinHigh); } else { st.west = String(joinLow); st.east = String(joinHigh); }
  force(x, y, z, "black_stained_glass_pane", st);
};

// 2. per face: belfry pair, hood, blind arcade
for (const [name, F] of Object.entries(FACES)) {
  const { c } = F, face = F.out, back = INWARD[name];
  const A = (u, d) => F.at(u, d);
  const place = (mode, u, d, y, b, s) => { const [x, z] = A(u, d); W(mode, x, y, z, b, s); };
  const clear = (u, d, y) => place("force", u, d, y, "air");
  // belfry pair: lancets c-3..c-1 and c+1..c+3, jambs c-4 / c+4, colonnette c; y 71..86; head rows 85 / 86
  for (let u = c - 4; u <= c + 4; u++) {
    for (const d of [0, 1]) {
      const jamb = u === c - 4 || u === c + 4, col = u === c;
      place("force", u, d, 70, ...slab("smooth_sandstone", "top"));                    // sill (the string course is outside)
      if (d === 1) place("force", u, d, 70, "smooth_sandstone");
      for (let y = 71; y <= 86; y++) {
        if (jamb) { place("force", u, d, y, "cut_sandstone"); continue; }
        if (col) { place("force", u, d, y, y <= 85 ? "sandstone_wall" : "cut_sandstone"); continue; }
        if (y === 86) { place("force", u, d, y, "cut_sandstone"); continue; }
        if (y === 85 && (u === c - 3 || u === c + 1)) { place("force", u, d, y, ...stairs("smooth_sandstone", LOW[name], "top")); continue; }
        if (y === 85 && (u === c - 1 || u === c + 3)) { place("force", u, d, y, ...stairs("smooth_sandstone", HIGH[name], "top")); continue; }
        clear(u, d, y);
      }
    }
    // dark glass behind (depth 2), joined along the run
    if (u >= c - 3 && u <= c + 3) for (let y = 71; y <= 85; y++) {
      const [x, z] = A(u, 2);
      pane(name, x, y, z, u > c - 3, u < c + 3);
    }
  }
  // hood moulding: a stepped pointed gable proud of the wall over the pair, y 87..91
  for (let k = 0; k < 4; k++) {
    place("put", c - 4 + k, -1, 87 + k, ...stairs("smooth_sandstone", HIGH[name]));
    place("put", c + 4 - k, -1, 87 + k, ...stairs("smooth_sandstone", LOW[name]));
  }
  place("put", c, -1, 91, "chiseled_sandstone");
  place("put", c, -1, 92, "end_stone_brick_wall");
  // blind arcade band: 2-wide niches (one layer deep) y 65..66 under stair heads at 67, a slab sill at 64
  for (let u = F.arc[0]; u + 1 <= F.arc[1]; u += 3) {
    for (const [i, uu] of [[0, u], [1, u + 1]]) {
      for (const y of [65, 66]) clear(uu, 0, y);
      place("force", uu, 0, 64, ...slab("smooth_sandstone", "top"));
      place("force", uu, 0, 67, ...stairs("smooth_sandstone", i ? HIGH[name] : LOW[name], "top"));
    }
    place("force", u + 2, 0, 65, "cut_sandstone");               // the pier between niches reads as a shaft
    place("force", u + 2, 0, 66, "cut_sandstone");
  }
}

// 3. string courses, 1 proud all round: y 70 (base of the belfry stage) and y 93 (under the top)
for (const y of [70, 93]) {
  for (const [name, F] of Object.entries(FACES)) {
    const lo = name === "west" || name === "east" ? 12 : 2, hi = name === "west" || name === "east" ? 30 : 22;
    for (let u = lo; u <= hi; u++) { const [x, z] = F.at(u, -1); put(x, y, z, ...stairs("smooth_sandstone", INWARD[name], "top")); }
  }
}

// 4. clasping corner buttresses: proud 1, arms 4 / 3 / 2 cells at y 58..71 / 72..83 / 84..92, a stair cap on each step
const tiers = [[58, 71, 4], [72, 83, 3], [84, 92, 2]];
function armCells(corner, L) {
  const [cx, cz, sx, sz] = corner, cells = [];
  for (let k = 0; k < L; k++) cells.push([cx - sx * k, cz + sz]);          // proud row on the north/south face
  for (let k = 0; k < L; k++) cells.push([cx + sx, cz - sz * k]);          // proud column on the east/west face
  cells.push([cx + sx, cz + sz]);
  return cells;
}
// corners: [x, z, outward sign x, outward sign z]; NW is the stepped one: arm along the step's west and the north face
const corners = [[22, 10, 1, -1], [22, 30, 1, 1]];
for (const corner of corners) {
  tiers.forEach(([y0, y1, L], i) => {
    for (const [x, z] of armCells(corner, L)) for (let y = y0; y <= y1; y++) put(x, y, z, "smooth_sandstone");
    const next = i + 1 < tiers.length ? new Set(armCells(corner, tiers[i + 1][2]).map((p) => p.join())) : new Set();
    for (const [x, z] of armCells(corner, L)) {
      if (next.has([x, z].join())) continue;
      const [cx, cz, sx, sz] = corner;
      const f = x === cx + sx ? (sx > 0 ? "west" : "east") : (sz > 0 ? "north" : "south");
      put(x, y1 + 1, z, ...stairs("smooth_sandstone", f));
    }
  });
}
// NW step corner (the face starts at x 5 there): the north arm and the step's own return
for (const [y0, y1, L] of tiers) {
  for (let y = y0; y <= y1; y++) {
    for (let k = 0; k < L; k++) put(5 + k, y, 9, "smooth_sandstone");
    for (const z of [10, 11]) put(4, y, z, "smooth_sandstone");
    put(4, y, 9, "smooth_sandstone");
  }
}
// SW corner: the arm on the south face beside the west buttress (z 29..31)
for (const [y0, y1, L] of tiers) for (let y = y0; y <= y1; y++) for (let k = 2; k < L; k++) put(k, y, 31, "smooth_sandstone");
// the west buttresses (x 0..1, z 12..14 / 29..31) step back from +2 to +1 at y 72, with a stair lip
for (const z0 of [12, 29]) for (let z = z0; z <= z0 + 2; z++) {
  for (let y = 72; y <= 93; y++) if (cur(0, y, z) !== "air") air(0, y, z);
  put(0, 72, z, ...stairs("smooth_sandstone", "east"));
  put(1, 94, z, ...stairs("smooth_sandstone", "east"));
}

// 5. tops: iron bars between the posts of the rim parapet (y 96), under the stone rail at 97
for (const m of [0, 1]) {
  for (let x = 2; x <= 22; x++) for (let z = 10; z <= 30; z++) {
    const zz = m ? 76 - z : z;
    if (!g.inBounds(x, 96, zz)) continue;
    if (cur(x, 96, zz) === "sandstone_wall" && cur(x, 97, zz) !== "air" && cur(x, 97, zz).endsWith("slab")) {
      if ((x + zz) % 3 !== 0) g.set(x, 96, zz, "iron_bars", { north: "false", south: "false", east: "false", west: "false" });
    }
  }
}

g.save(out);
console.log("saved", out);
