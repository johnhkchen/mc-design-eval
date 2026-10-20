// Part "Palihotel" (plot 2, x133..191, z0..61): brick shell G..28 on the block rings of the footprint, polished andesite
// plinth and cornice, shopfront glass with green fascia, 2x3 windows with sills and lintels on the tread rhythm, two
// shop doors and the entrance, a gray concrete deck with brick parapet, the lit PALIHOTEL blade sign and two HVAC boxes.
// Plot-local coordinates; writes are buffered per cell, then flushed into air (a later part's cells are never replaced).
import { ringOf, awning, bladeSign, hvacBox } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OX = 133;                                  // plot offset along x
const W_MAX = 59, D_MAX = 62;                    // place box w x d
const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const FOOT = [
  ".......###....................",
  "......#######.................",
  "......#########...............",
  "......##########.####.........",
  ".....###################......",
  ".....#######################..",
  "....##########################",
  "....#########################.",
  "....##########################",
  "...##########################.",
  "...##########################.",
  "...##########################.",
  "...#########################..",
  "..##########################..",
  "..##########################..",
  "..##########################..",
  "..#########################...",
  ".##########################...",
  ".##########################...",
  ".##########################...",
  ".#########################....",
  ".#########################....",
  "##########################....",
  "##########################....",
  "#########################.....",
  "...######################.....",
  "......###################.....",
  "............############......",
  "..............##########......",
  ".................#######......",
  ".....................###......",
];

// GROUND per 2x2 cell, copied from the brief ('.' = no value; nearest known cell is used).
const GROUND_TXT = `
. . . . . . . 2 2 2 . . . . . . . . . . . . . . . . . . . . .
. . . . . . 2 2 2 2 2 2 2 2 . . . . . . . . . . . . . . . . .
. . . . . 2 2 2 2 2 2 2 2 2 2 . . 2 2 . . . . . . . . . . .
. . . . . 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3 3 . . . . . . . . .
. . . . . 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3 3 3 . . . . . .
. . . . 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3 3 3 3 3 3 . .
. . . . 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3 3 3 3 3
. . . . 1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3 3 3
. . . . 1 1 1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3
. . . 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 .
. . . 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 .
. . . 1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 .
. . . 1 1 1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 .
. . 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 2 2 . .
. . 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 2 . .
. . 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2 2 2 2 2 2 . .
. 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2 2 2 2 . .
. 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . . .
. 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . . .
. 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . . .
. 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . . . .
. 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . . . .
0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 . . . .
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 . . . .
0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 . . . . .
. . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 . . . .
. . . . . . 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 . . . .
`;
const GROUND = GROUND_TXT.trim().split("\n").map((r) => r.trim().split(/\s+/).map((v) => (v === "." ? null : Number(v))));

function groundAt(x, z) {
  const r0 = z >> 1, c0 = x >> 1;
  for (let d = 0; d < 40; d++) for (let r = r0 - d; r <= r0 + d; r++) for (let c = c0 - d; c <= c0 + d; c++) {
    if (Math.max(Math.abs(r - r0), Math.abs(c - c0)) !== d) continue;
    const v = GROUND[r]?.[c];
    if (typeof v === "number") return v;
  }
  return 0;
}

export function build(g) {
  const ring = ringOf({ footprint: FOOT });
  const W = new Map();
  const put = (x, y, z, spec) => { if (x >= 0 && z >= 0 && x < W_MAX && z < D_MAX) W.set(`${x},${y},${z}`, [x, y, z, spec]); };
  const del = (x, y, z) => W.delete(`${x},${y},${z}`);
  const inPlot = (x, z) => x >= 0 && z >= 0 && x < W_MAX && z < D_MAX;
  const cellsWhere = (pred) => [...ring.entries()].map(([k, v]) => [...k.split(",").map(Number), v]).filter(([x, z, v]) => inPlot(x, z) && pred(v));
  const ring0Of = (x, z, f) => [x + DIR[f][0], z + DIR[f][1]];

  // 1. Shell: wall plane (ring 1) bricks from the ground to the parapet, ring 0 plinth, interior floors, deck.
  for (const [x, z, v] of cellsWhere(() => true)) {
    const G = groundAt(x, z);
    if (v.ring === 0) for (let y = G; y <= 2; y++) put(x, y, z, "polished_andesite");
    if (v.ring === 1) {
      for (let y = G; y <= 28; y++) put(x, y, z, "bricks");
      put(x, 30, z, "bricks"); put(x, 31, z, "bricks");
      put(x, 32, z, B.slab("polished_andesite", "bottom"));
    }
    if (v.ring >= 2) for (const fy of [3, 9, 14, 19, 24]) if (fy >= G) put(x, fy, z, "spruce_planks");
    if (v.ring >= 1) put(x, 29, z, "gray_concrete");
  }

  // 2. Cornice (ring 0, y27..30) and sheet-metal course; parapet cap ring 1.
  for (const [x, z, v] of cellsWhere((v) => v.ring === 0)) {
    put(x, 28, z, "polished_andesite"); put(x, 29, z, "polished_andesite");
    if ((x + z) % 2 === 0) put(x, 27, z, B.stairs("polished_andesite", OPP[v.faceDir], "top"));
    put(x, 30, z, B.slab("polished_andesite", "bottom"));
  }

  // 3. Treads: runs of ring-1 cells on one face, in order along the wall. Windows on the rhythm, sills, lintels.
  const treads = [];
  for (const f of ["north", "south", "east", "west"]) {
    const cells = cellsWhere((v) => v.ring === 1 && v.faceDir === f).map(([x, z]) => [x, z]);
    const along = f === "north" || f === "south" ? ([x, z]) => [z, x] : ([x, z]) => [x, z];
    const groups = new Map();
    for (const c of cells) { const [k, t] = along(c); if (!groups.has(k)) groups.set(k, []); groups.get(k).push([t, c]); }
    for (const list of groups.values()) {
      list.sort((a, b) => a[0] - b[0]);
      let run = [];
      const flush = () => { if (run.length) treads.push({ face: f, cells: run.map((c) => c) }); run = []; };
      list.forEach(([t, c], i) => { if (i && t !== list[i - 1][0] + 1) flush(); run.push(c); });
      flush();
    }
  }
  const winPairs = (n) => {
    if (n === 8) return [[1, 2], [5, 6]];
    if (n === 6) return [[2, 3]];
    if (n >= 10) { const out = []; for (let i = 1; i + 1 <= n - 2; i += 3) out.push([i, i + 1]); return out; }
    return [];
  };
  for (const t of treads) {
    const n = t.cells.length;
    const pairs = winPairs(n);
    for (const floor of [9, 14, 19, 24]) {
      for (const [a, b] of pairs) for (const i of [a, b]) {
        const [x, z] = t.cells[i];
        for (let y = floor + 1; y <= floor + 3; y++) put(x, y, z, ["glass_pane", paneState(x, z, t.face)]);
        const [rx, rz] = ring0Of(x, z, t.face);
        put(rx, floor, rz, B.slab("smooth_stone", "top"));
        if (floor + 4 < 28) put(rx, floor + 4, rz, B.stairs("stone_brick", OPP[t.face], "top"));
      }
    }
    // L1 shopfront: glass y4..7 between the run-end piers; green fascia on ring 0 at y8.
    for (let i = 0; i < n; i++) {
      const [x, z] = t.cells[i];
      const [rx, rz] = ring0Of(x, z, t.face);
      put(rx, 8, rz, "green_terracotta");
      if (i > 0 && i < n - 1) for (let y = 4; y <= 7; y++) put(x, y, z, ["glass_pane", paneState(x, z, t.face)]);
    }
  }

  // 4. Entrance (E, z28..29) and shop doors (W z38..39 at y1, N z7 x37..38 at y3): two cells wide, two high.
  const door = (face, tang, floor) => {
    const cells = [];
    for (const [x, z, v] of cellsWhere((v) => v.ring === 1 && v.faceDir === face)) {
      const t = face === "east" || face === "west" ? z : x;
      if (tang.includes(t)) cells.push([x, z]);
    }
    cells.sort((a, b) => (face === "east" || face === "west" ? a[1] - b[1] : a[0] - b[0]));
    for (const [x, z] of cells) {
      put(x, floor, z, B.door("dark_oak", face, "lower", "left"));
      put(x, floor + 1, z, B.door("dark_oak", face, "upper", "left"));
      for (let y = floor + 2; y <= 7; y++) put(x, y, z, "bricks"); // wall above the door, over the shop glass
      const [rx, rz] = ring0Of(x, z, face);
      for (let y = floor - 2; y < floor; y++) del(rx, y, rz); // the plinth is cut open in front of the door
      put(rx, floor - 1, rz, B.slab("smooth_stone", "bottom")); // one slab threshold, then the street
    }
  };
  door("east", [28, 29], 3);
  door("west", [38, 39], 1);
  door("north", [37, 38], 3);

  // 5. Flush: each buffered cell goes in only where the grid is air.
  let placed = 0;
  for (const [x, y, z, spec] of W.values()) {
    const [block, state, nbt] = Array.isArray(spec) ? spec : [spec];
    const gx = x + OX;
    if (!g.inBounds(gx, y, z) || !g.isAir(gx, y, z)) continue;
    g.set(gx, y, z, block, state, nbt);
    placed++;
  }

  // 6. Local proxy so the helpers take plot-local coordinates.
  // white_wall_banner (the blade's letters, from vocab) is not in palette.json: the same cell gets white_wool, a solid
  // white letter on the red board, which is the nearest palette block to a white banner letter.
  const L = {
    set: (x, y, z, block, state, nbt) => (block === "white_wall_banner"
      ? g.set(x + OX, y, z, "white_wool")
      : g.set(x + OX, y, z, block, state, nbt)),
    isAir: (x, y, z) => g.isAir(x + OX, y, z),
    inBounds: (x, y, z) => g.inBounds(x + OX, y, z),
  };
  for (const t of treads) if (t.face === "north" && t.cells.length >= 4) {
    awning(L, t, { y: 9, colors: ["green", "white"], depth: 1 });
  }
  bladeSign(L, { x0: 53, z: 10, y0: 9, y1: 28, face: "north", board: "red_concrete", lamp: "glowstone", word: "PALIHOTEL" });
  hvacBox(L, [26, 30, 26, 28, 31, 28], { block: "light_gray_concrete", vents: ["north"], over: false });
  hvacBox(L, [36, 30, 36, 38, 31, 38], { block: "light_gray_concrete", vents: ["north"], over: false });
  console.log(`palihotel: ${placed} cells placed from ${W.size} planned`);
}

// Pane connection states: a pane joins its neighbours along the wall (the tangent) and the wall it sits in.
function paneState(x, z, f) {
  const tangentX = f === "north" || f === "south";
  return tangentX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
}
