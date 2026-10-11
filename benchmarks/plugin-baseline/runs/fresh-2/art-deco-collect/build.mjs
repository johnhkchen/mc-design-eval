// Art Deco cinema "ROXY". Front faces NORTH (-z); x runs along the street.
//   node build.mjs 1   -> stage1.nbt  (body, facade structure)   then:  mcd roof stage1.nbt stage2.nbt --spec roof.json
//   node build.mjs 2   -> stage3.nbt  (tower, sunburst, marquee, signs, brushes) from stage2.nbt
import { Grid, load, shell, B, fins, setbacks, plaque, signboard } from "../../../../../../minecraft-design/tools/src/build.mjs";

const HERE = new URL(".", import.meta.url).pathname;
const phase = process.argv[2] ?? "1";

// ---- plan -----------------------------------------------------------------------------------------------------------
const X0 = 2, X1 = 28, CX = 15;          // building x range (27 wide), centre line
const Z0 = 6, Z1 = 33;                   // front plane z=6, back wall z=33
const EAVE = 15;                         // top wall course
const mx = (x) => 2 * CX - x;            // mirror across the centre line

// ---- palette by role ------------------------------------------------------------------------------------------------
const P = {
  wall: "smooth_sandstone",              // dominant cream
  base: "polished_blackstone",           // plinth, door columns
  black: "black_terracotta",             // frieze ground, marquee
  quartz: "smooth_quartz",               // fins, cornices
  teal: "cyan_concrete",                  // recessed panels
  gold: "gold_block",                    // relief rays, finial
  copper: "gold_block",                   // gilt lines, trims, door columns
  glass: "cyan_stained_glass_pane",
};
const door = (g, x, y, z, facing, hinge, mat = "dark_oak") => {
  g.set(x, y, z, ...B.door(mat, facing, "lower", hinge));
  g.set(x, y + 1, z, ...B.door(mat, facing, "upper", hinge));
};
const FRIEZE_Y = 12;                     // chevron stairs row; black behind and above (y13..15)

if (phase === "1") {
  const g = new Grid([31, 56, 37]);

  // ground: road, kerb, pavement
  g.fill([0, 0, 0], [30, 0, 36], "polished_andesite");
  g.fill([0, 0, 0], [30, 0, 1], "gray_concrete");
  g.fill([0, 0, 2], [30, 0, 2], "stone_bricks");

  // body: a two-thick shell so recesses have a back
  shell(g, [X0, 1, Z0], [X1, EAVE, Z1], P.wall, { floor: false, ceiling: false });
  shell(g, [X0 + 1, 1, Z0 + 1], [X1 - 1, EAVE, Z1 - 1], P.wall, { floor: false, ceiling: false });
  g.fill([X0 + 2, 0, Z0 + 2], [X1 - 2, 0, Z1 - 2], "polished_blackstone");        // lobby/auditorium floor

  // plinth (y1..2) on all four sides
  for (let y = 1; y <= 2; y++) {
    for (let x = X0; x <= X1; x++) for (const z of [Z0, Z0 + 1, Z1, Z1 - 1]) g.set(x, y, z, P.base);
    for (let z = Z0; z <= Z1; z++) for (const x of [X0, X0 + 1, X1, X1 - 1]) g.set(x, y, z, P.base);
  }

  // ---- front (z=6..7): one wing described, mirrored ---------------------------------------------------------------
  const half = (set) => {
    // piers: fins at x=2, 5 and the double pier at 8..9
    for (const x of [2, 5, 8, 9]) for (let y = 3; y <= 13; y++) set(x, y, Z0, P.quartz);
    // two strips (3-4, 6-7) per wing: poster alcove below, slit window above
    for (const [a, b] of [[3, 4], [6, 7]]) {
      for (let x = a; x <= b; x++) {
        for (let y = 3; y <= 7; y++) { set(x, y, Z0, "air"); set(x, y, Z0 + 1, P.teal); }          // alcove, backed (poster wall)
        set(x, 8, Z0, P.copper);                                                                  // lintel
        for (let y = 9; y <= 11; y++) { set(x, y, Z0, "air"); set(x, y, Z0 + 1, P.glass); }       // slit window, set back 1
      }
    }
  };
  half((x, y, z, b, s) => g.set(x, y, z, b, s));
  half((x, y, z, b, s) => g.set(mx(x), y, z, b, s));

  // centre bay: recessed vestibule (x 10..20, y 1..4), door wall at z=8, teal field above for the sunburst
  g.fill([10, 1, Z0], [20, 4, Z0 + 1], "air");
  g.fill([10, 5, Z0], [20, 14, Z0 + 1], P.teal);
  g.fill([10, 5, Z0 + 2], [20, 8, Z0 + 2], P.teal);
  g.fill([10, 1, Z0 + 2], [20, 4, Z0 + 2], P.black);
  for (const x of [10, 13, 17, 20]) g.fill([x, 1, Z0 + 2], [x, 4, Z0 + 2], P.copper);              // gilded door-wall columns
  for (const [a, b] of [[11, 12], [18, 19]]) for (let x = a; x <= b; x++) for (let y = 3; y <= 4; y++) g.set(x, y, Z0 + 2, P.glass);   // fanlights
  door(g, 11, 1, Z0 + 2, "north", "left"); door(g, 12, 1, Z0 + 2, "north", "right");
  door(g, 19, 1, Z0 + 2, "north", "right"); door(g, 18, 1, Z0 + 2, "north", "left");
  g.fill([14, 1, Z0 + 2], [16, 4, Z0 + 2], P.teal);                                                // panel behind the booth

  // ---- frieze: black band (y12..15) with a copper stair sawtooth on y12, all four walls (the front centre is the sunburst)
  const chev = (a) => (a % 2 ? 1 : 0);
  for (let x = X0; x <= X1; x++) for (const z of [Z0, Z0 + 1, Z1 - 1, Z1]) {
    if ((z === Z0 || z === Z0 + 1) && x >= 10 && x <= 20) { g.set(x, 15, z, P.wall); continue; }
    for (let y = FRIEZE_Y + 1; y <= 15; y++) g.set(x, y, z, y === 15 ? P.wall : P.black);
    if (z === Z0 || z === Z1) g.set(x, FRIEZE_Y, z, ...B.stairs("smooth_quartz", chev(x) ? "east" : "west")); else g.set(x, FRIEZE_Y, z, P.black);
  }
  for (let z = Z0; z <= Z1; z++) for (const x of [X0, X0 + 1, X1 - 1, X1]) {
    for (let y = FRIEZE_Y + 1; y <= 15; y++) g.set(x, y, z, y === 15 ? P.wall : P.black);
    if (x === X0 || x === X1) g.set(x, FRIEZE_Y, z, ...B.stairs("smooth_quartz", chev(z) ? "south" : "north")); else g.set(x, FRIEZE_Y, z, P.black);
  }

  g.save(HERE + "stage1.nbt");
  console.log(JSON.stringify({ saved: "stage1.nbt", refused: g.refused?.length ?? 0 }));
}

if (phase === "2") {
  const g = load(HERE + "stage2.nbt");

  // ============ sides and back: stepped fins every 4, recessed teal panels, exit doors =======================
  const finBlock = P.quartz;
  const sideFins = (face, plane, from, to) =>
    fins(g, { face, plane, from, to, every: 4, y0: 3, y1: 13, depth: 1, block: finBlock, cap: { block: "smooth_quartz_slab" } });
  sideFins("east", X1, 10, 30); sideFins("west", X0, 10, 30);
  fins(g, { face: "south", plane: Z1, from: 6, to: 26, every: 4, y0: 3, y1: 13, depth: 1, block: finBlock, cap: { block: "smooth_quartz_slab" } });
  // east front returns: the wing fin continues down the side
  for (const side of ["east", "west"]) {
    const px = side === "east" ? X1 : X0, ox = side === "east" ? 1 : -1;
    // panels between the fins: recess the outer layer (carve), back it with teal in the inner layer
    for (let z = 11; z <= 29; z++) if ((z - 10) % 4 !== 0 && z !== 28 && z !== 27 && z !== 29) {
      for (let y = 4; y <= 11; y++) { g.set(px, y, z, "air"); g.set(px - ox, y, z, P.teal); }
      g.set(px, 3, z, P.quartz); g.set(px, 12, z, P.quartz);
    }
  }
  // back panels
  for (let x = 7; x <= 25; x++) if ((x - 6) % 4 !== 0 && !(x >= 5 && x <= 7)) {
    for (let y = 4; y <= 11; y++) { g.set(x, y, Z1, "air"); g.set(x, y, Z1 - 1, P.teal); }
    g.set(x, 3, Z1, P.quartz); g.set(x, 12, Z1, P.quartz);
  }
  // exit doors: side z=28 (both), back x=5 and x=25
  for (const [dx, dz, dirOut] of [[X1, 28, "east"], [X0, 28, "west"]]) {
    for (let z = dz - 1; z <= dz + 1; z++) for (let y = 1; y <= 12; y++) { const o = dirOut === "east" ? 1 : -1; if (y <= 2 || y >= 3) { g.set(dx, y, z, y <= 2 && z === dz ? "air" : P.wall); } }
  }
  for (const [dx, dz, dirOut] of [[X1, 28, "east"], [X0, 28, "west"]]) {
    const inward = dirOut === "east" ? -1 : 1;
    g.set(dx + inward, 1, dz, "air"); g.set(dx + inward, 2, dz, "air");
    door(g, dx, 1, dz, dirOut, "left", "iron");
    g.set(dx + (dirOut === "east" ? 1 : -1), 3, dz, ...B.sign("spruce", ["", "EXIT"], { facing: dirOut, color: "red", glow: true, dataVersion: 4556 }));
    g.set(dx + (dirOut === "east" ? 1 : -1), 4, dz, ...B.lantern(false));
  }
  for (const dx of [6, 24]) {
    g.set(dx, 1, Z1 - 1, "air"); g.set(dx, 2, Z1 - 1, "air");
    door(g, dx, 1, Z1, "south", "left", "iron");
    g.set(dx, 3, Z1 + 1, ...B.sign("spruce", ["", "EXIT"], { facing: "south", color: "red", glow: true, dataVersion: 4556 }));
  }

  // ============ the tower: three flush-front tiers, stepped pylons ===========================================
  g.fill([7, 16, Z0], [23, 55, 13], "air");                                                    // clear parapet, rail and deck cells
  const T = setbacks(g, { base: [7, 16, Z0], footprint: [17, 8], align: "front", tiers: [
    { height: 11, block: P.wall, cornice: { block: "smooth_quartz_stairs" } },
    { height: 10, inset: 2, block: P.wall, cornice: { block: "smooth_quartz_stairs" } },
    { height: 8, inset: 2, block: P.wall, coping: { block: "smooth_quartz_slab" } },
  ] });
  console.log("tiers", JSON.stringify(T.tiers));
  const [t1, t2, t3] = T.tiers;
  // tier fronts: black board for the name on tier 1, teal/white slit stripes on tier 2, amber slits on tier 3
  for (let x = 8; x <= 22; x++) { g.set(x, 18, Z0, P.copper); g.set(x, 24, Z0, P.copper); }
  for (let x = 11; x <= 19; x++) for (let y = 28; y <= 35; y++) g.set(x, y, Z0, x % 2 ? P.glass : P.quartz);
  for (let x = 13; x <= 17; x++) for (let y = 38; y <= 43; y++) g.set(x, y, Z0, x % 2 ? P.glass : P.quartz);
  const pylon = (x0, x1, yb, yt) => fins(g, { face: "north", plane: Z0, from: x0, to: x1, every: x1 - x0 || 1, y0: yb, y1: yt, depth: 2, stepped: true, stepBy: 2, block: P.quartz, cap: { block: "smooth_quartz_slab" } });
  pylon(7, 23, 16, 31);                  // tier 1 flanks, rising past the tier
  pylon(9, 21, 27, 41);                 // tier 2
  pylon(11, 19, 37, 50);                 // tier 3
  // the name plaque on tier 1
  const pl = plaque(g, "ROXY", { at: [22, 19, Z0], face: "north", width: 15, height: 5, material: "black_terracotta", letter: "gold_block", frame: null, relief: "raised" });
  console.log("plaque", JSON.stringify(pl).slice(0, 300));

  // finial: stepped pedestal, gold knob, rod and end rods
  for (let x = 14; x <= 16; x++) for (let z = 7; z <= 8; z++) { g.set(x, 46, z, P.quartz); g.set(x, 47, z, P.quartz); }
  g.set(15, 48, 7, P.gold); g.set(15, 49, 7, P.gold);
  for (let y = 50; y <= 52; y++) g.set(15, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  g.set(15, 53, 7, "end_rod", { facing: "up" });

  // ============ sunburst over the entrance (relief: gold rays proud, copper rays flush) ==========================
  const cy = 9, Rin = 2.2, Rout = 5.6;
  const put = (x, y) => { g.set(x, y, Z0 - 1, P.gold); g.set(x, y, Z0, P.gold); };
  for (let dx = -5; dx <= 5; dx++) for (let dy = 0; dy <= 5; dy++) {
    const r = Math.hypot(dx, dy);
    if (r <= Rin) { put(CX + dx, cy + dy); continue; }               // hub
    if (r > Rout) continue;
    // seven rays 30 degrees apart: a cell is on a ray when it is within half a cell of that line
    const th = Math.atan2(dy, dx);
    for (let k = 0; k <= 6; k++) {
      const a = k * Math.PI / 6;
      if (Math.abs(r * Math.sin(th - a)) < 0.62 && Math.cos(th - a) > 0) { put(CX + dx, cy + dy); break; }
    }
  }

  // ============ marquee: black box with a sea-lantern soffit, gilded edge, title in banner letters ================
  g.fill([9, 5, 2], [21, 7, 5], P.black);
  for (let x = 9; x <= 21; x++) { g.set(x, 8, 2, ...B.slab("smooth_quartz")); for (let z = 3; z <= 5; z++) g.set(x, 8, z, ...B.slab("polished_blackstone")); }
  for (let x = 10; x <= 20; x += 2) for (const z of [3, 5]) g.set(x, 5, z, "sea_lantern");
  for (let x = 9; x <= 21; x++) g.set(x, 5, 2, x % 2 ? P.black : "sea_lantern");
  for (const x of [10, 15, 20]) g.set(x, 4, 3, ...B.lantern(true));
  const mq = plaque(g, "NOW SHOWING", { at: [21, 6, 2], face: "north", width: 13, height: 2, material: "black_terracotta", letter: "white_concrete" });
  console.log("marquee plaque", JSON.stringify(mq).slice(0, 300));

  // ============ ticket booth in the vestibule ================================================================
  for (let x = 14; x <= 16; x++) { g.set(x, 1, Z0, P.black); g.set(x, 4, Z0, P.copper); }
  for (let x = 14; x <= 16; x++) for (const y of [2, 3]) g.set(x, y, Z0, "glass_pane");
  for (const x of [14, 16]) { g.set(x, 1, Z0 + 1, P.black); g.set(x, 4, Z0 + 1, P.copper); for (const y of [2, 3]) g.set(x, y, Z0 + 1, "glass_pane"); }
  g.set(15, 1, Z0 + 1, P.black); g.set(15, 4, Z0 + 1, P.copper);
  g.set(15, 4, Z0 - 1, ...B.sign("spruce", ["", "TICKETS"], { facing: "north", color: "black", dataVersion: 4556 }));

  // ============ poster cases: banners in the alcoves, a lantern over each ===========================================
  const posters = {
    3: ["red", [["stripe_center", "white"], ["border", "black"]]],
    4: ["black", [["rhombus", "white"], ["border", "red"]]],
    6: ["cyan", [["circle", "white"], ["stripe_bottom", "black"]]],
    7: ["white", [["cross", "red"], ["border", "black"]]],
  };
  for (const [xs, [c, pats]] of Object.entries(posters)) {
    const x = +xs;
    g.set(x, 5, Z0, ...B.banner(c, pats, { facing: "north" }));
    g.set(x, 7, Z0, ...B.lantern(true));
    g.set(mx(x), 5, Z0, ...B.banner(c, pats, { facing: "north" }));
    g.set(mx(x), 7, Z0, ...B.lantern(true));
  }

  // ============ blade signs on the wing piers =====================================================================
  for (const x of [5, 25]) {
    const sb = signboard(g, "CINEMA", { at: [x, 9, Z0], face: "north", mode: "hanging", wood: "birch" });
    console.log("blade", x, JSON.stringify(sb).slice(0, 200));
  }

  // ============ street lamps ==================================================================================
  for (const x of [5, 25]) { for (let y = 1; y <= 4; y++) g.set(x, y, 3, ...B.fence("nether_brick")); g.set(x, 5, 3, ...B.lantern(false)); }

  g.save(HERE + "stage3.nbt");
  console.log(JSON.stringify({ saved: "stage3.nbt", refused: g.refused?.length ?? 0 }));
}
