// Part 1: South shell: Down Under (z161..311), main building C (z189..279), corner block D (z280..311), terraces T.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { rng, inFootprint, groundY } from "../vocab.mjs";

const GROUND = `
. . . 13 18 18 .|. . . 13 17 18 .|. . . 13 17 18 .|. . . 13 17 18 .|. . . 14 17 18 .|. . . 14 18 19 .|. . . 14 18 19 .|. . . 14 18 19 .|. . . 15 18 19 .|. . . 15 18 19 .|. . . 14 18 19 .|. . . 13 17 19 .|. . . 12 17 19 .|. . . 11 17 19 .|. . . 11 16 19 .|. . . . 16 19 .|. . . . 16 20 .|. . . . 16 19 .|. . . . 16 19 .|. . . . 15 20 .|. . . . 16 20 .|. . . 7 16 20 .|. . . 7 15 20 .|. . . 8 15 20 .|. . 5 10 16 20 .|. . 5 10 16 21 .|. . 6 11 16 20 .|. . 7 12 17 20 .|. 3 7 12 17 21 .|. 3 8 12 17 21 .|. 3 8 13 17 20 .|. 4 8 13 17 22 .|. 4 9 13 17 21 .|2 5 9 13 18 21 .|2 5 10 14 18 21 .|2 6 10 14 18 21 .|3 7 10 14 18 21 .|4 7 11 14 18 22 .|4 8 11 15 18 22 .|5 8 12 15 19 22 .|5 9 12 15 19 22 .|6 9 12 16 19 22 .|6 9 12 16 19 23 23|7 10 12 16 19 23 23|7 10 12 15 19 23 23`
  .trim().split("|").map((r) => r.trim().split(/\s+/).map((v) => (v === "." ? null : +v)));
const gr = (x, z) => GROUND[Math.min(GROUND.length - 1, Math.floor(z / 7))]?.[Math.floor(x / 7)] ?? groundY(x, z);

// Down Under footprint: west edge per z band, east edge x33
const duW = (z) => (z < 161 || z > 311 ? null : z < 189 ? 21 : z < 224 ? 14 : z < 252 ? 7 : z < 308 ? 0 : 7);
const du = (x, z) => { const w = duW(z); return w !== null && x >= w && x <= 33; };
const deckY = (z) => (z < 189 ? 20 : z < 280 ? 22 : 23);
const inC = (x, z) => x >= 14 && x <= 33 && z >= 189 && z <= 279;
const inD = (x, z) => x >= 14 && x <= 41 && z >= 280 && z <= 311;
const inB2 = (x, z) => x >= 21 && x <= 33 && z >= 161 && z <= 188;

export function build(g) {
  const r = rng(7);
  const open = new Set();
  const mk = (x0, x1, y0, y1, z0, z1, win) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { open.add(`${x},${y},${z}`); if (win) win.add(`${x},${y},${z}`); } };
  const put = (x, y, z, ...b) => { if (inFootprint(x, z)) g.set(x, y, z, ...b); };
  const fillFp = (x0, x1, y, z0, z1, blk) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(x, y, z, blk); };

  // ---- openings ----
  for (let k = 0; k <= 14; k++) {
    const s = 190 + 6 * k;
    for (const y of [[30, 32], [36, 38]]) mk(33, 33, y[0], y[1], s + 1, s + 4);
    mk(33, 33, 23, 25, s + 1, s + 4);
    for (const y of [[24, 26], [30, 32], [36, 38]]) mk(14, 14, y[0], y[1], s + 1, s + 4);
  }
  for (const s of [280, 286, 292, 298, 304]) {
    const clock = s >= 298;
    mk(40, 40, 31, 33, s + 1, s + 4); mk(14, 14, 31, 33, s + 1, s + 4);
    if (!clock) { mk(40, 40, 37, 39, s + 1, s + 4); }
    mk(14, 14, 37, 39, s + 1, s + 4);
  }
  for (const x of [16, 22, 28, 34]) { mk(x, x + 3, 31, 33, 311, 311); if (x < 34) mk(x, x + 3, 37, 39, 311, 311); }
  // Down Under windows (v2: the face was walled over them): 3 wide x 3 tall at y f+1..f+3 in each 6-bay, only where the
  // window clears the ground. West faces, the north-facing step faces, and the south face (z 311).
  // the glow behind them: an ochre_froglight one cell inside, on about four windows in five (the rest stay dark)
  const duGlow = new Set(), duWin = new Set(), lit = (s, f) => (s * 7 + f * 3) % 5 !== 0;
  const westRuns = [[21, 161, 188, 160], [14, 189, 223, 190], [7, 224, 251, 224], [0, 252, 307, 252]];
  for (const f of [2, 7, 12, 17]) {
    for (const [x, z0, z1, s0] of westRuns) for (let s = s0; s + 1 <= z1; s += 6) {
      if (s + 3 < z0 || s + 3 > z1) continue;
      if (f === 12 && x === 7 && s + 1 <= 237 && s + 3 >= 236) continue;
      if (f === 7 && x === 0 && s + 1 <= 301 && s + 3 >= 300) continue;
      if (f + 1 > gr(x, s + 2)) {
        mk(x, x, f + 1, f + 3, Math.max(z0 + 1, s + 1), s + 3, duWin);
        if (lit(s, f)) for (let z = Math.max(z0 + 1, s + 1); z <= s + 3; z++) duGlow.add(`${x + 1},${f + 2},${z}`);
      }
    }
    for (const [z, x0] of [[161, 21], [189, 14], [224, 7], [252, 0]]) if (f + 1 > gr(x0 + 2, z)) {
      mk(x0 + 1, x0 + 3, f + 1, f + 3, z, z, duWin);
      if (lit(x0, f)) for (let x = x0 + 1; x <= x0 + 3; x++) duGlow.add(`${x},${f + 2},${z + 1}`);
    }
    for (let s = 7; s + 3 <= 33; s += 6) if (!(f === 12 && s === 7) && f + 1 > gr(s + 2, 311)) {
      mk(s + 1, s + 3, f + 1, f + 3, 311, 311, duWin);
      for (let x = s + 1; x <= s + 3; x++) duGlow.add(`${x},${f + 2},310`);
    }
  }
  // the corner clock (5 across, corners cut) hangs on the east face at x 41; its neon glow goes in the wall at x 40
  const glow = new Set();
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
    if (Math.abs(a) === 2 && Math.abs(b) === 2) continue;
    if (Math.abs(a) === 2 || Math.abs(b) === 2) glow.add(`40,${37 + b},${307 - a}`);
  }
  mk(0, 0, 8, 10, 300, 301); mk(7, 7, 13, 15, 236, 237); mk(14, 14, 13, 15, 200, 201); mk(10, 11, 13, 15, 311, 311);

  // ---- Down Under: carve, footing walls, floors ----
  const per = [];
  for (let z = 161; z <= 311; z++) for (let x = 0; x <= 41; x++) if (du(x, z)) {
    const edge = !du(x - 1, z) ? "west" : !du(x + 1, z) ? "east" : !du(x, z - 1) ? "north" : !du(x, z + 1) ? "south" : null;
    const edge2 = !du(x - 1, z) || !du(x + 1, z) || !du(x, z - 1) || !du(x, z + 1);
    if (edge2) per.push([x, z, edge]); else for (let y = 3; y < deckY(z); y++) g.set(x, y, z, ...(duGlow.has(`${x},${y},${z}`) ? ["ochre_froglight", { axis: "y" }] : ["air"]));
  }
  const perSet = new Set(per.map(([x, z]) => `${x},${z}`));
  const IN = { west: "east", east: "west", north: "south", south: "north" };
  for (const [x, z, edge] of per) {
    const g0 = gr(x, z), top = deckY(z) - 1;
    for (let y = Math.max(0, g0 - 2); y <= top; y++) {
      // a Down Under window is glazed here (the ground fill under it would otherwise show through the opening)
      if (duWin.has(`${x},${y},${z}`)) { g.set(x, y, z, "glass_pane", edge === "west" || edge === "east" ? { north: "true", south: "true" } : { east: "true", west: "true" }); continue; }
      if (open.has(`${x},${y},${z}`)) continue;
      let blk;
      if (y <= g0 + 1) blk = "cobbled_deepslate";
      else {
        // v2: above the plinth the Down Under is white-painted brick, with a grey storey line at each level
        blk = "quartz_bricks";
        if (y > 6 && [7, 12, 17].includes(y)) { put(x, y, z, ...B.stairs("stone_brick", IN[edge], "top")); continue; }
      }
      put(x, y, z, blk);
    }
  }
  for (let z = 161; z <= 311; z++) for (let x = 0; x <= 33; x++) if (du(x, z)) {
    const isP = perSet.has(`${x},${z}`), dy = deckY(z);
    if (!isP) for (const f of [2, 7, 12, 17]) put(x, f, z, "smooth_stone");
    put(x, dy, z, !isP && (inC(x, z) || inD(x, z) || inB2(x, z)) ? "polished_andesite" : "smooth_stone");
  }
  // terrace parapets on the outer edge (outside the buildings)
  for (const [x, z] of per) if (!inC(x, z) && !inD(x, z) && !inB2(x, z)) put(x, deckY(z) + 1, z, ...B.wall("stone_brick"));

  // ---- D arcade ground floor (x34..41) ----
  for (let x = 34; x <= 41; x++) for (let z = 280; z <= 311; z++) {
    for (let y = Math.max(0, gr(x, z) - 2); y <= 22; y++) put(x, y, z, "cobbled_deepslate");
    put(x, 23, z, x === 41 || z === 311 || x === 34 ? "smooth_stone" : "polished_andesite");
  }

  // ---- C walls and floors ----
  for (const f of [28, 34]) fillFp(14, 33, f, 189, 279, "smooth_stone");
  for (let y = 23; y <= 39; y++) for (let x = 14; x <= 33; x++) for (let z = 189; z <= 279; z++) {
    if (!(x === 14 || x === 33 || z === 189 || z === 279)) continue;
    if (open.has(`${x},${y},${z}`) || y === 28 || y === 34) continue;
    put(x, y, z, "quartz_bricks");
  }
  for (const y of [28, 34]) for (let x = 14; x <= 33; x++) for (let z = 189; z <= 279; z++) if (x === 14 || x === 33 || z === 189 || z === 279) put(x, y, z, "smooth_quartz");

  // ---- D walls, floors, deck ----
  fillFp(14, 33, 23, 280, 311, "polished_andesite");
  for (const f of [29, 35]) fillFp(14, 40, f, 280, 311, "smooth_stone");
  for (let y = 24; y <= 41; y++) for (let x = 14; x <= 40; x++) for (let z = 280; z <= 311; z++) {
    const ring = x === 14 || z === 280 || z === 311 || x === 40;
    if (!ring || open.has(`${x},${y},${z}`) || y === 29 || y === 35) continue;
    if (y <= 28 && x > 33) continue;
    put(x, y, z, glow.has(`${x},${y},${z}`) ? "glowstone" : "quartz_bricks");
  }
  for (const y of [29, 35]) for (let x = 14; x <= 40; x++) for (let z = 280; z <= 311; z++) if ((x === 14 || z === 280 || z === 311 || x === 40) && !open.has(`${x},${y},${z}`)) put(x, y, z, glow.has(`${x},${y},${z}`) ? "glowstone" : "smooth_quartz");
  for (let x = 14; x <= 41; x++) for (let z = 280; z <= 311; z++) put(x, 42, z, "smooth_stone");
  for (let x = 14; x <= 41; x++) for (let z = 280; z <= 311; z++) {
    if (!(x === 14 || x === 41 || z === 280 || z === 311)) continue;
    put(x, 43, z, "smooth_quartz"); put(x, 44, z, ...B.slab("smooth_quartz", "top"));
  }
}
