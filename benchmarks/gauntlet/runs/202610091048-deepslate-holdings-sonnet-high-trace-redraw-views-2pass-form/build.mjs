// Deepslate Holdings — PASS 1: FRONT ONLY (form). Front faces NORTH (-z); drawing column c -> world x = W-1-c.
// frontFace() owns every front cell (trace.txt colours + depth/spec relief); body() is the plain volume the
// next pass may redesign (sides, back, roof) without touching frontFace().
import fs from "node:fs";
import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const W = 19, H = 24, ZO = 4, DEPTH = 19, D = ZO + DEPTH;   // ZO = z of the main wall plane
const WALL = 3;                                             // front wall layers: z = ZO .. ZO+2
const g = new Grid([W, H, D]);
const X = (c) => W - 1 - c;                                 // MIRROR: drawing column -> world x

// ---- the tracing -----------------------------------------------------------------------------
const pix = {};
for (const line of fs.readFileSync(new URL("./trace.txt", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^y(\d+)\s+(.*)$/); if (!m) continue;
  pix[+m[1]] = m[2].trim().split(/\s+/).map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
}
const isBg = ([r, gg, b]) => r >= 0xd0 && r <= 0xd3 && Math.abs(r - gg) <= 2 && Math.abs(gg - b) <= 2;
const lum = ([r, gg, b]) => (r + gg + b) / 3;
const hash = (a, b) => ((a * 73856093) ^ (b * 19349663)) >>> 0;

// ---- cell store: cells[y][c] = { b: [block,state], d: depth (+proud/-recessed), open: no backing (glass) } ----
const cells = Array.from({ length: H }, () => Array(W).fill(null));
const put = (c, y, block, d = 0, open = false) => { if (c < 0 || c >= W || y < 0 || y >= H) return; cells[y][c] = { b: typeof block === "string" ? [block, {}] : block, d, open }; };
const wallBlock = (c, y) => (hash(c, y) % 100 < 18 ? "cracked_deepslate_bricks" : "deepslate_bricks");
const plinthBlock = (c, y) => { const h = hash(c, y) % 100; return h < 30 ? "mossy_stone_bricks" : h < 55 ? "cobbled_deepslate" : "stone_bricks"; };
const oakLog = B.log("stripped_oak");
const PANE = ["glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }];

function frontFace() {
  // 1. base layer from the tracing colours (wall / polished / plinth / greens / cream); everything else is overridden by role below
  for (let y = 0; y < H; y++) for (let c = 0; c < W; c++) {
    const p = pix[y][c]; if (isBg(p)) continue;
    const [r, gg, b] = p, l = lum(p);
    let blk, d = 0;
    if (y <= 1) { blk = plinthBlock(c, y); d = 1; }
    else if (gg > r + 8 && gg > b + 8) { blk = y <= 2 ? "moss_block" : "oak_leaves"; d = 1; }
    else if (r > 0xd0 && gg > 0xc0) blk = "quartz_block";
    else if (l >= 0x5a) blk = "polished_deepslate";
    else blk = wallBlock(c, y);
    put(c, y, blk, d);
  }
  for (let y = 0; y < H; y++) for (let c = 0; c < W; c++) { const e = cells[y][c]; if (e && e.b[0] === "oak_leaves") e.b = ["oak_leaves", { persistent: "true", distance: "7" }]; }

  // 2. cornice, frieze, pilaster caps and feet
  for (let c = 1; c <= 14; c++) { put(c, 17, "polished_deepslate", 1); put(c, 16, wallBlock(c, 16), -1); }
  for (const c of [1, 5, 9, 13]) { put(c, 16, "chiseled_deepslate", 1); put(c, 8, "chiseled_deepslate", 2); for (let y = 9; y <= 15; y++) put(c, y, oakLog, 1); }
  for (const c of [1, 2, 3, 4, 13, 14]) put(c, 7, "polished_deepslate", 0);       // ground-storey lintel band
  for (let y = 2; y <= 6; y++) put(1, y, "polished_deepslate", 0);                // left quoin
  put(0, 0, plinthBlock(0, 0), 1);

  // 3. windows: [glass cols], recessed -2 (glass at z=ZO+2), dark head recessed -1, oak sill proud +1
  const bays = [[2, 3], [6, 7], [10, 11], [14, 14]];
  for (const [a, b] of bays) {
    for (let c = a; c <= b; c++) {
      for (const y of [9, 10, 13, 14]) put(c, y, PANE, -2, true);
      for (const y of [11, 15]) put(c, y, wallBlock(c, y), -1);
      for (const y of [8, 12]) put(c, y, "oak_planks", 1);
    }
  }
  for (const [a, b] of [[2, 3], [14, 14]]) for (let c = a; c <= b; c++) {      // ground-storey windows
    for (let y = 3; y <= 5; y++) put(c, y, PANE, -2, true);
    put(c, 6, wallBlock(c, 6), -1);
  }
  // planters / bushes at the plinth (trace greens), 3 tall at c1,c3 (leaves y3..y4) and right planter
  for (const c of [1, 2, 3, 4]) { put(c, 1, "moss_block", 1); put(c, 2, "moss_block", 1); }
  for (const c of [14, 15]) { put(c, 1, "moss_block", 1); put(c, 2, "moss_block", 1); }
  const leaves = ["oak_leaves", { persistent: "true", distance: "7" }];
  put(4, 3, leaves, 1); put(1, 3, leaves, 1);

  // 4. pediment (flush) over the roof, oak rafters on the slopes, slit at c9, spire
  const rows = { 18: [6, 12], 19: [7, 11], 20: [8, 10] };
  for (const [y, [a, b]] of Object.entries(rows)) for (let c = a; c <= b; c++) put(c, +y, wallBlock(c, +y), 0);
  for (const [c, y] of [[5, 17], [6, 18], [7, 19], [8, 20], [13, 17], [12, 18], [11, 19], [10, 20]]) put(c, y, oakLog, y === 17 ? 1 : 0);
  put(9, 18, "oak_planks", -1); put(9, 19, "oak_planks", -1);
  put(9, 21, ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }], 0, true);
  put(9, 22, ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }], 0, true);

  // 5. roof front (hip courses as full blocks), recessed 1 behind the cornice
  for (let c = 2; c <= 14; c++) for (const y of [18, 19]) if (!(c >= 6 && c <= 12 && y === 18) && !(c >= 7 && c <= 11 && y === 19)) put(c, y, "deepslate_tiles", -1);
  for (const y of [18, 19]) put(14, y, "deepslate_tiles", -1);

  // 6. entrance portico (proud 2): quartz pillars c5,c7,c10,c12, glass sidelights c6/c11, door c8-9, sign band y6-7
  for (let y = 2; y <= 5; y++) {
    put(5, y, "quartz_pillar", 2); put(12, y, "quartz_pillar", 2); put(13, y, "quartz_block", 1);
    put(7, y, ["quartz_pillar", { axis: "y" }], 1); put(10, y, ["quartz_pillar", { axis: "y" }], 1);
    put(6, y, "glass", -1, true); put(11, y, "glass", -1, true);
  }
  put(5, 5, "chiseled_quartz_block", 2); put(12, 5, "chiseled_quartz_block", 2);
  for (const c of [5, 6, 12, 13]) put(c, 1, plinthBlock(c, 1), 2);
  for (const c of [8, 9]) { put(c, 4, "glass", -2, true); put(c, 5, "glass", -2, true); put(c, 3, "dark_oak_planks", -2); }
  put(8, 1, B.door("dark_oak", "north", "lower", "left"), -2, true); put(8, 2, B.door("dark_oak", "north", "upper", "left"), -2, true);
  put(9, 1, B.door("dark_oak", "north", "lower", "right"), -2, true); put(9, 2, B.door("dark_oak", "north", "upper", "right"), -2, true);
  for (let c = 5; c <= 12; c++) { put(c, 6, "quartz_block", 2); put(c, 7, "quartz_block", 2); }
  put(13, 6, "quartz_block", 1);
  for (let c = 6; c <= 11; c++) if (c !== 7 && c !== 10) put(c, 5, "glass", -1, true);    // transom
  for (const c of [7, 10]) put(c, 5, "quartz_pillar", 1);
  // steps (apron, polished andesite) + oak posts
  for (let c = 7; c <= 11; c++) put(c, 0, "polished_andesite", 3);
  put(7, 1, oakLog, 3); put(11, 1, oakLog, 3);

  // 7. shaft: oak piers c15/c18 (proud 1), glass c16-17 recessed 1, quartz flights where the tracing is cream, cap y19
  for (let y = 2; y <= 18; y++) { put(15, y, oakLog, 1); put(18, y, oakLog, 1); }
  put(15, 1, "moss_block", 1); put(15, 2, "moss_block", 1);
  put(18, 1, oakLog, 1);
  for (let y = 1; y <= 18; y++) for (const c of [16, 17]) {
    const p = pix[y][c]; const cream = p[0] > 0xe0 && p[1] > 0xd0;
    put(c, y, cream ? "quartz_block" : "glass", -1, !cream);
  }
  for (let c = 15; c <= 18; c++) put(c, 19, "polished_deepslate", 1);
  for (const c of [15, 16, 17, 18]) put(c, 0, plinthBlock(c, 0), 1);

  // 8. elevator head (set back 2): c14-16, y20-21 (c13 cap at y21), oak slit c15, rail row at y22
  for (let c = 14; c <= 16; c++) for (const y of [20, 21]) put(c, y, wallBlock(c, y), -2);
  put(13, 21, "polished_deepslate", -2);
  put(15, 20, "oak_planks", -2);
  put(14, 22, "oak_planks", -2); put(15, 22, "oak_planks", -2);

  // ---- write cells to the grid ----
  for (let y = 0; y < H; y++) for (let c = 0; c < W; c++) {
    const e = cells[y][c]; if (!e) continue;
    const s = ZO - e.d, x = X(c);
    if (e.open) { g.set(x, y, s, ...e.b); continue; }          // glass/door/rod: just the one surface cell
    for (let z = s; z < ZO + WALL; z++) g.set(x, y, z, ...(z === s ? e.b : [e.d >= 0 ? e.b[0] : "deepslate_bricks", z === s ? e.b[1] : {}]));
  }
}

// ---- PASS 2: sides, back and roof. Everything here sits at z >= ZB (behind the front slab) so frontFace() is untouched. ----
// Flank layers: d = +1 proud, 0 field, -1/-2 recessed (walls 3 thick: field + 2 backing). k = depth index (z = ZO + k).
const ZB = ZO + WALL, ZE = ZO + DEPTH - 1;                  // 7 .. 22
const FACES = {
  W: { pos: (u, d) => [1 - d, ZO + u], pane: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }, plain: 8 },
  E: { pos: (u, d) => [16 + d, ZO + u], pane: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }, plain: 3 },
  N: { pos: (u, d) => [u, 21 + d], pane: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }, plain: -1 },
};
const FOFF = { W: 7, E: 31, N: 53 };
const bset = (f, u, y, d, b) => { const [x, z] = FACES[f].pos(u, d); if (typeof b === "string") g.set(x, y, z, b, {}); else g.set(x, y, z, ...b); };
const clear = (f, u, y, d) => { const [x, z] = FACES[f].pos(u, d); g.set(x, y, z, "air", {}); };
const fieldBlock = (f, u, y) => (FACES[f].plain === u ? "deepslate_bricks" : wallBlock(u + FOFF[f], y));
const chis = "chiseled_deepslate", pol = "polished_deepslate";

function pilaster(f, u) {                                    // ground quoin / chiseled foot / oak shaft / chiseled cap, proud 1
  for (let y = 2; y <= 7; y++) bset(f, u, y, 1, pol);
  bset(f, u, 8, 1, chis); for (let y = 9; y <= 15; y++) bset(f, u, y, 1, oakLog); bset(f, u, 16, 1, chis);
}
function windows(f, us, ground = true) {                     // 2-wide, head recessed 1, glass recessed 2, oak sill proud 1
  const pane = ["glass_pane", FACES[f].pane];
  for (const u of us) {
    const lv = [[9, 10, 11, 8], [13, 14, 15, 12]]; if (ground) lv.unshift([3, 5, 6, null]);
    for (const [a, b, h, sill] of lv) {
      for (let y = a; y <= b; y++) { clear(f, u, y, 0); clear(f, u, y, -1); bset(f, u, y, -2, pane); }
      clear(f, u, h, 0); bset(f, u, h, -1, "deepslate_bricks");
      if (sill) bset(f, u, sill, 1, "oak_planks");
    }
  }
}
function flank(f, u0, u1, { pil = [], win = [], ground = true, noFrieze = [] }) {
  for (let u = u0; u <= u1; u++) {
    for (let y = 2; y <= 15; y++) { clear(f, u, y, 1); bset(f, u, y, 0, fieldBlock(f, u, y)); }
    clear(f, u, 16, 1); if (!noFrieze.includes(u)) clear(f, u, 16, 0);   // frieze recessed 1 (corner returns stay: no see-through along the wall)
    bset(f, u, 7, 0, pol);                                   // ground-storey lintel band
    bset(f, u, 17, 1, pol);                                  // cornice, proud 1
    for (const y of [0, 1]) bset(f, u, y, 1, plinthBlock(u + FOFF[f], y));
  }
  for (const u of pil) pilaster(f, u);
  windows(f, win, ground);
}

function body() {
  const x0 = 0, x1 = 17;
  g.fill([x0, 0, ZB], [x1, 17, ZE], "deepslate_bricks");                  // solid shell
  g.fill([x0, 0, ZB], [x1, 0, ZE], "stone_bricks");                       // floor
  g.fill([1, 1, ZB], [13, 16, ZB + 4], "air");                            // shaft zone + main hall (z7..11)
  g.fill([4, 1, ZB + 5], [13, 16, ZE - 4], "air");                        // hall (z12..18); walls 3 thick W/E/back
  g.fill([1, 17, ZB], [2, 18, ZB + 4], "air");                            // shaft headroom behind the glass
  g.fill([8, 1, ZB], [8, 16, ZE - 4], "deepslate_bricks");                // core wall: no see-through between the hollow halves

  // ---- roof (flat top y19, back steps down y19 -> y18 -> y17 eave) ----
  g.fill([4, 18, ZB], [16, 18, ZO + 16], "deepslate_tiles");
  g.fill([4, 19, ZB], [16, 19, ZO + 13], "deepslate_tiles");
  g.fill([1, 18, ZB + 5], [3, 18, ZO + 16], "deepslate_tiles");           // west hip course beside the shaft cap
  g.fill([2, 19, ZB + 5], [3, 19, ZO + 13], "deepslate_tiles");
  g.fill([1, 18, ZB + 5], [3, 18, ZB + 5], pol);
  g.fill([0, 19, ZB], [3, 19, ZB + 4], pol);                              // shaft cap
  g.fill([3, 18, ZB], [3, 18, ZB + 4], pol);

  // ---- west flank (shaft side): k0-2 front pier | k3-4 glass | k5 pier | k6 recess | k7 pier | bay k8-11 | pier k12 | chute niche k13-14 | channel k15 | k16-17 wall | k18 corner pier
  for (let y = 2; y <= 18; y++) {
    for (const k of [3, 4]) g.set(0, y, ZO + k, "glass", {});
    for (const k of [5, 7]) g.set(0, y, ZO + k, ...oakLog);
    g.set(0, y, ZO + 6, "air", {}); g.set(1, y, ZO + 6, y === 18 ? pol : "deepslate_bricks", {});
  }
  for (const y of [0, 1]) for (let k = 3; k <= 7; k++) g.set(0, y, ZO + k, plinthBlock(k + 7, y), {});
  flank("W", 8, 17, { pil: [12], win: [9, 10], noFrieze: [17] });
  for (let u = 13; u <= 14; u++) for (let y = 3; y <= 16; y++) { clear("W", u, y, 1); clear("W", u, y, 0); clear("W", u, y, -1); bset("W", u, y, -2, "deepslate_bricks"); }
  for (let u = 13; u <= 14; u++) { bset("W", u, 7, 0, "air"); bset("W", u, 7, -2, "deepslate_bricks"); }
  for (const y of [4, 8, 12]) for (let u = 13; u <= 14; u++) {            // chute landings with stepped brackets under them
    bset("W", u, y, 1, "oak_planks"); bset("W", u, y, 0, "oak_planks"); bset("W", u, y - 1, 0, "oak_planks"); bset("W", u, y - 2, -1, "oak_planks");
  }
  for (let y = 2; y <= 16; y++) { clear("W", 15, y, 1); clear("W", 15, y, 0); clear("W", 15, y, -1); bset("W", 15, y, -2, "polished_blackstone"); }
  bset("W", 15, 7, 1, "air");
  for (let y = 2; y <= 6; y++) bset("W", 12, y, 1, pol);                  // keep pier 12 ground quoin crisp

  // ---- east flank: pilasters k6,10,14,18; windows right-aligned in each 3-wide bay (k3 plain: seen through the front windows)
  flank("E", 3, 17, { pil: [6, 10, 14], win: [4, 5, 8, 9, 12, 13, 16, 17], noFrieze: [17] });

  for (let y = 2; y <= 6; y++) bset("E", 3, y, 1, "deepslate_bricks");   // quoin return: opaque behind the front-corner leaves
  // ---- back: pilasters x17,13,9,5,0; 2-wide windows left of each bay; service door at x5-6
  flank("N", 1, 16, { pil: [4, 8, 12], win: [], noFrieze: [1, 16] });
  for (const u of [0, 17]) { pilaster("N", u); bset("N", u, 17, 1, pol); for (const y of [0, 1]) bset("N", u, y, 1, plinthBlock(u + 3, y)); }   // back corners
  // window columns avoid every front opening and the shaft glass (x1,2,4,7,8,11,12,15,16) so no sky shows through the hollow hall
  windows("N", [13, 14], true);
  windows("N", [5, 6], false);
  for (const u of [5, 6]) {                                              // double door, glass transom
    for (let y = 1; y <= 5; y++) { clear("N", u, y, 1); clear("N", u, y, 0); clear("N", u, y, -1); }
    bset("N", u, 1, 1, "air");
    bset("N", u, 6, 0, "air"); bset("N", u, 6, -1, "deepslate_bricks");
    bset("N", u, 3, -2, "dark_oak_planks"); bset("N", u, 4, -2, "glass"); bset("N", u, 5, -2, "glass");
  }
  bset("N", 5, 1, -2, B.door("dark_oak", "south", "lower", "left")); bset("N", 5, 2, -2, B.door("dark_oak", "south", "upper", "left"));
  bset("N", 6, 1, -2, B.door("dark_oak", "south", "lower", "right")); bset("N", 6, 2, -2, B.door("dark_oak", "south", "upper", "right"));

  // ---- elevator head (set back 2, z6..10), oak slits on its flanks, rail row at y22 on its east/back edge
  for (let c = 14; c <= 16; c++) for (let y = 20; y <= 21; y++) g.fill([X(c), y, ZO + 3], [X(c), y, ZO + 6], "deepslate_bricks");
  for (const y of [20, 21]) g.set(4, y, ZO + 4, "oak_planks", {});
  for (let k = 3; k <= 6; k++) g.set(4, 22, ZO + k, "oak_planks", {});
  g.set(3, 22, ZO + 6, "oak_planks", {});
  g.set(0, 18, ZE, pol, {});
}

body();
frontFace();
g.save("round-2.nbt");
console.log("saved round-2.nbt", g.refused ?? "");
