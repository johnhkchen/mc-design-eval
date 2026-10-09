// Art Deco dance hall. Trace-driven: front.txt/side-trace.txt cells -> spec material map, depth.txt -> relief.
// usage: node build.mjs [1|2]   (writes round-N.nbt; round 2 = fixes after reading round-1 render)
import fs from "node:fs";
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";

const ROUND = Number(process.argv[2] || 1);
const HERE = new URL(".", import.meta.url).pathname;
const W = 28, H = 28, D = 33;
const g = new Grid([W, H, D]);

// ---- read the traces -------------------------------------------------------------------------------------------
const rd = (f) => fs.readFileSync(HERE + f, "utf8").split("\n").filter((l) => /^y\d\d/.test(l)).map((l) => l.trim().split(/\s+/).slice(1));
const front = rd("trace.txt");        // [row top..bottom][x] hex
const side = rd("side-trace.txt");    // [row][z]
const depthRows = fs.readFileSync(HERE + "depth.txt", "utf8").split("\n").filter((l) => /^y\d\d/.test(l)).map((l) => l.trim().split(/\s+/).slice(1));
const cell = (grid, x, y) => grid[27 - y][x];
const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dcol = (x) => Math.min(25, x <= 13 ? x : x === 14 ? 13 : x - 1);
function depthAt(x, y) {
  const v = depthRows[27 - y][dcol(x)];
  return v === "." || v === undefined ? 0 : Number(v);
}

// ---- palette (spec material map) ---------------------------------------------------------------------------------
// [block, rgb]; nearest colour wins, with position rules below.
const PAL = [
  ["air", "c9cacc"], ["cut_sandstone", "d5c796"], ["sandstone", "b7a371"], ["smooth_quartz", "f4f4f0"],
  ["lapis_block", "323989"], ["blue_concrete", "15214b"], ["black_concrete", "000000"],
  ["gold_block", "ccac4f"], ["yellow_concrete", "fde538"], ["orange_concrete", "fd7e11"],
  ["light_blue_concrete", "2b91e3"], ["smooth_quartz", "ebeae3"], ["cut_sandstone", "e1cb9c"], ["black_concrete", "2b2b2a"], ["black_concrete", "141747"],
  ["light_blue_stained_glass", "a1bfdf"], ["yellow_stained_glass", "d4d6a5"], ["orange_stained_glass", "d6b788"],
  ["tinted_glass", "5c6ca2"], ["gold_block", "feb30a"], ["glowstone", "fdb209"],
  ["sandstone", "8d7e57"], ["sandstone", "aa8e45"],
].map(([b, h]) => [b, rgb(h)]);
const near = (hex) => { const c = rgb(hex); let best = null, bd = 1e9; for (const [b, p] of PAL) { const d = dist(c, p); if (d < bd) { bd = d; best = b; } } return best; };

function frontBlock(x, y, hex) {
  let b = near(hex);
  const c = rgb(hex);
  if (b === "air") return null;
  if ([11, 12, 15, 16].includes(x) && y <= 1) return "dark_oak_door";
  const wingSlit = (x === 5 || x === 22) && y >= 5 && y <= 11;
  if (b === "lapis_block" && wingSlit) b = "tinted_glass";
  if (b === "sandstone" && c[0] < 0xb0 && c[2] < 0x60 && y >= 15) b = "gold_block";   // shaded sunburst / tower slot
  if (b === "sandstone" && x >= 12 && x <= 15 && y >= 17) b = "gold_block";
  if (b === "gold_block" && y <= 3) b = "sandstone";
  if (b === "glowstone" && y !== 4) b = "gold_block";                                  // amber only as the marquee lip
  if (b === "gold_block" && c[0] > 0xf0 && y === 4) b = "glowstone";
  if (b === "yellow_concrete" && y === 4) b = "glowstone";
  if (hex.startsWith("e2e2dd")) b = "sea_lantern";
  if (y <= 1 && [11, 12, 15, 16].includes(x)) b = "dark_oak_door";
  return b;
}

// ---- front: every traced cell is a column from its front face (z = P0 - depth) back to the fill end --------------
const P0 = 6;
const FILL_END = 9;
const colBlocks = {};
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const blk = frontBlock(x, y, cell(front, x, y));
  if (!blk) continue;
  let d = depthAt(x, y);
  // spec/side-trace: lapis outer fins stand proudest (z=4); tan fins +1
  if ((x === 9 || x === 18) && y >= 8) d = 2;
  if ((x === 10 || x === 17) && y >= 8 && y <= 20) d = 1;
  if (ROUND >= 2 && (blk === "smooth_quartz") && y >= 4 && y <= 14 && (x <= 7 || x >= 20) && d < 0) d = 0;
  const zf = P0 - d;
  const tower = y >= 21 && x >= 10 && x <= 17;
  const end = tower ? 10 : FILL_END;
  const isGlass = /glass/.test(blk);
  // filler behind the face: quartz behind glass (pastel), sandstone otherwise
  const fill = tower ? "cut_sandstone" : "sandstone";
  if (blk === "dark_oak_door") {
    const lower = y === 0;
    const left = x === 11 || x === 15;
    g.set(x, y, 8, ...B.door("dark_oak", "north", lower ? "lower" : "upper", left ? "left" : "right"));
    for (let z = 9; z <= end; z++) g.set(x, y, z, "sandstone");
    continue;
  }
  g.set(x, y, zf, blk);
  for (let z = zf + 1; z <= end; z++) g.set(x, y, z, z === zf + 1 && isGlass ? "smooth_quartz" : fill);
}

// ---- canopy / marquee: z=0..3 stepped pyramid rising toward the wall ---------------------------------------------
function marquee() {
  // body y4..7 x8..19 at z=0..3, lip y4 glowstone
  for (let x = 8; x <= 19; x++) for (let y = 4; y <= 7; y++) {
    const hex = cell(front, x, y);
    let b = frontBlock(x, y, hex) ?? "gold_block";
    if (y === 4) b = "glowstone";
    g.set(x, y, 0, b);
    for (let z = 1; z <= 3; z++) {
      let f = y === 4 ? "glowstone" : y === 7 ? "gold_block" : "gold_block";
      if ((x === 8 || x === 19) && y >= 5 && y <= 6) f = z <= 1 ? "orange_concrete" : z === 2 ? "cyan_terracotta" : "sea_lantern";
      g.set(x, y, z, f);
    }
  }
  // steps: y8 x10..17 from z=1, y9 x12..15 from z=2
  for (let x = 10; x <= 17; x++) {
    const b = frontBlock(x, 8, cell(front, x, 8)) ?? "gold_block";
    g.set(x, 8, 1, b);
    for (let z = 2; z <= 3; z++) g.set(x, 8, z, "gold_block");
  }
  for (let x = 12; x <= 15; x++) {
    const b = frontBlock(x, 9, cell(front, x, 9)) ?? "gold_block";
    g.set(x, 9, 2, b);
    g.set(x, 9, 3, "gold_block");
  }
  // clear any front-fill that the canopy replaces at z=4 (y4..9 stays: the wall face behind the marquee)
}
marquee();

// ---- body: solid mass behind the front fill ---------------------------------------------------------------------
const topZ = (z) => z <= 23 ? 20 : z === 24 ? 19 : z === 25 ? 18 : z === 26 ? 17 : z <= 28 ? 16 : z === 29 ? 15 : z === 30 ? 14 : 13;
const capX = (x) => (x >= 10 && x <= 17) ? 20 : (x === 9 || x === 18) ? 19 : (x === 8 || x === 19) ? 18 : 14;
for (let x = 1; x <= 26; x++) for (let z = FILL_END + 1; z < D; z++) {
  const top = Math.min(capX(x), topZ(z));
  for (let y = 0; y <= top; y++) {
    let b = "sandstone";
    if (y === top) b = (top === 18 && capX(x) === 18) ? "lapis_block" : x === 9 || x === 18 ? "lapis_block" : "cut_sandstone";
    if (y === 0) b = "black_concrete";
    g.set(x, y, z, b);
  }
}

// ---- side walls from side-trace (z >= 10), mirrored. outer plane x=1; recesses go in -------------------------------
function sideBlock(hex, y) {
  const c = rgb(hex);
  if (c[1] > 0xe0 && c[0] < 0x40) return null; // green bg
  const b = near(hex);
  if (b === "air") return null;
  return b;
}
function sideCell(z, y) {
  const hex = cell(side, z, y);
  const c = rgb(hex);
  if (c[1] > 0xd0 && c[0] < 0x40 && c[2] < 0x40) return null;
  let b = near(hex);
  let s = 0; // recess 0..2
  if (b === "sandstone") s = (c[0] < 0xa0) ? 2 : 1;       // shadow brown = reveal, sandstone = field
  else if (b === "cut_sandstone") s = 0;                   // tan = proud pier
  else if (b === "smooth_quartz") s = 1;
  else if (/glass/.test(b)) s = 2;
  else if (b === "black_concrete" || c[0] < 0x30) { b = "black_stained_glass_pane"; s = 2; }
  else if (b === "lapis_block" || b === "blue_concrete") { b = "lapis_block"; s = 0; }
  else if (b === "gold_block") { b = /glass/.test(b) ? b : "gold_block"; s = 2; }
  else if (b === "dark_oak_door") s = 2;
  else s = 1;
  return { b, s, hex };
}
if (ROUND === 1) {
for (let z = 10; z < D; z++) for (let y = 0; y <= 14; y++) {
  const sc = sideCell(z, y);
  if (!sc) continue;
  if (y === 0) continue;                           // black plinth already
  if (sc.b === "lapis_block") continue;            // front fin ends belong to the front pass
  for (const [x, sgn] of [[1, 1], [26, -1]]) {
    const xs = x + sgn * sc.s;
    // carve by exclusion: clear cells between the outer plane and the recessed face
    for (let k = 0; k < sc.s; k++) g.set(x + sgn * k, y, z, "air");
    if (sc.b === "dark_oak_door") {
      g.set(xs, y, z, "sandstone");
    } else g.set(xs, y, z, sc.b);
  }
}
// side doors at z=17..18 (side-trace brown cells), recessed 2
for (const [x, sgn, fc] of [[1, 1, "west"], [26, -1, "east"]]) for (const [z, hinge] of [[17, "left"], [18, "right"]]) {
  for (const k of [0, 1]) for (const y of [1, 2]) g.set(x + sgn * k, y, z, "air");
  g.set(x + sgn * 2, 1, z, ...B.door("dark_oak", fc, "lower", hinge));
  g.set(x + sgn * 2, 2, z, ...B.door("dark_oak", fc, "upper", hinge));
}
} else {
  // designed side wall: piers (proud, x=1) / white-and-slit bays (field at x=2) / recessed side doors, mirrored
  const pier = (z) => (z >= 10 && z <= 10) || (z >= 16 && z <= 19) || (z >= 27 && z <= 29);
  const slit = [["light_blue_stained_glass", "yellow_stained_glass", "orange_stained_glass", "tinted_glass"]];
  const glassCycle = ["light_blue_stained_glass", "orange_stained_glass", "yellow_stained_glass", "tinted_glass", "light_blue_stained_glass", "yellow_stained_glass", "orange_stained_glass", "tinted_glass"];
  for (const [x, sgn, fc] of [[1, 1, "west"], [26, -1, "east"]]) {
    for (let z = 10; z < D; z++) {
      for (let y = 1; y <= 14; y++) {
        if (pier(z)) { g.set(x, y, z, "cut_sandstone"); continue; }
        g.set(x, y, z, "air");                                   // bay: carve by exclusion, field sits at x+sgn
        let f = "sandstone";
        if (y >= 7 && y <= 12 && z >= 11 && z <= 25) f = "smooth_quartz";
        if (y === 13) f = "cut_sandstone";
        if (y === 6 || y === 3) f = "cut_sandstone";             // sill / base bands
        if (z >= 30) f = "sandstone";
        g.set(x + sgn, y, z, f);
      }
      // cornice band proud at y=13 (a ledge running the full length)
      g.set(x, 13, z, "cut_sandstone");
    }
    // slit windows in the white panels (recessed one more)
    for (const zc of [13, 22, 23]) for (let y = 7; y <= 10; y++) g.set(x + sgn, y, zc, glassCycle[(y + zc) % 8]);
    // central door bay: two doors recessed, checker glass strip above (side-trace col 17..18)
    for (const [z, hinge] of [[17, "left"], [18, "right"]]) {
      for (const y of [1, 2]) { g.set(x, y, z, "air"); g.set(x + sgn, y, z, "air"); }
      g.set(x + sgn * 2, 1, z, ...B.door("dark_oak", fc, "lower", hinge));
      g.set(x + sgn * 2, 2, z, ...B.door("dark_oak", fc, "upper", hinge));
      g.set(x + sgn, 3, z, "black_concrete");
      for (let y = 4; y <= 11; y++) { g.set(x, y, z, "air"); g.set(x + sgn, y, z, glassCycle[(y + z) % 8]); g.set(x + sgn * 2, y, z, "smooth_quartz"); }
    }
    for (const z of [16, 19]) for (let y = 1; y <= 14; y++) g.set(x, y, z, "cut_sandstone");
  }
}
// clerestory + cornice on the raised central block flanks (x=8 / x=19), from side-trace rows y15..18
for (let z = 10; z <= 25; z++) for (let y = 15; y <= 18; y++) {
  if (y > Math.min(20, topZ(z))) continue;
  const sc = sideCell(z, y);
  if (!sc) continue;
  for (const x of [8, 19]) {
    let b = sc.b;
    if (y === 18) b = "lapis_block";
    if (b === "black_stained_glass_pane") { g.set(x, y, z, "smooth_quartz"); continue; }
    g.set(x, y, z, b);
  }
}
for (let z = 10; z <= 23; z++) {
  const sc = sideCell(z, 16);
  if (sc && sc.b === "black_stained_glass_pane") for (const x of [8, 19]) g.set(x, 16, z, "black_concrete");
}
// roof tiers: risers
for (let z = FILL_END + 1; z <= 25; z++) {
  const t = topZ(z);
  if (t >= 20) for (const x of [10, 17]) g.set(x, 20, z, "black_concrete");
}

// ---- spikes (ledge finials) at x=0 and x=27, y=11 ---------------------------------------------------------------
for (const x of [0, 27]) for (let z = P0 - 0; z <= FILL_END; z++) g.set(x, 11, z, "sandstone");

g.save(HERE + `round-${ROUND}.nbt`);
console.log(JSON.stringify({ saved: `round-${ROUND}.nbt`, refused: g.refused?.length }));
export { g };
