// v3 (owner: "the bay side is really plain"): the bay face (z 77..79, and the east lunettes on x 100) rebuilt as the
// real one. Upper storey: one great round-arched fan light per section (white calcite frame, dark radiating mullions
// over gray panes, quartz_bricks keystone). Lower storey: a gallery along the water, arches on piers at z 78, a walk
// z 74..77 and lit shopfronts at z 73; a white string course at y 11. Plot 0: the gable's greatest fan light over a
// dark MARKETPLACE band. Plot 2: fan lights in the cross-gables and the east end, striped awnings over the shopfronts,
// market tents and cafe umbrellas on the covered terrace. Runs after every part, straight on the grid (it replaces
// v2 cells), and writes only x 0..100 / z 73..79 plus the x 100 lunettes: inside the plots.
const AND = "polished_andesite", SB = "stone_bricks", CAL = "calcite", QB = "quartz_bricks", SS = "smooth_stone";
const PD = "polished_deepslate", PANE = "gray_stained_glass_pane";
const AIR = "air";
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const fence = (n = {}) => ["spruce_fence", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false", ...n }];
const gableTop = (L) => (L % 2 ? 27 + (L - 1) / 2 : 26 + L / 2);   // as shell.mjs: the wall's top under the roof

export function build(g) {
  const set = (x, y, z, b, s) => { if (x >= 0 && x <= 101 && z >= 0 && z <= 79) g.set(x, y, z, b, s); };
  const fill = (x0, y0, z0, x1, y1, z1, b, s) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) set(x, y, z, b, s);
  };
  const isAir = (x, y, z) => /air$/.test(g.blockAt(x, y, z));

  // ---- fan light: c = centre along the wall (x.5 for an even width), R = half width, body rows yB..yS (yS = the
  // spring transom), round head above. plane "z": the window runs along x in the wall z = at; "x": along z in x = at.
  // cols: the body's vertical mullions as offsets from c. maxY(u): the wall's top at u (frame and keystone stay under it)
  const fan = ({ plane, at, back, c, R, yB, yS, cols, maxY = () => 99 }) => {
    const P = (u, y, b, s) => (plane === "z" ? set(u, y, at, b, s) : set(at, y, u, b, s));
    const B = (u, y, b, s) => (plane === "z" ? set(u, y, back, b, s) : set(back, y, u, b, s));
    const pane = plane === "z" ? paneZ : paneX;
    const inside = (u, y) => {
      const du = Math.abs(u - c);
      if (y >= yB && y <= yS) return du < R;
      if (y > yS) return du * du + (y - yS - 0.5) ** 2 <= (R - 0.25) ** 2;
      return false;
    };
    const ri = R * 0.45;
    let top = yS;
    const open = new Set();
    for (let u = Math.floor(c - R) - 1; u <= Math.ceil(c + R) + 1; u++) for (let y = yB; y <= yS + R + 1; y++) {
      if (!inside(u, y)) continue;
      open.add(`${u},${y}`); top = Math.max(top, y);
      const du = u - c, dy = y - yS, r = Math.hypot(du, dy);
      let mull = y === yS || Math.abs(du) <= 0.5;
      if (y < yS) mull ||= cols.some((k) => Math.abs(Math.abs(du) - k) < 0.01);
      if (y > yS) {
        if (Math.abs(r - ri) < 0.6) mull = true;
        if (r > ri && Math.abs(Math.abs(du) - dy) / Math.SQRT2 < 0.45) mull = true;   // the 45 degree rays
      }
      P(u, y, mull ? PD : "light_gray_stained_glass_pane", mull ? undefined : pane);
      if (back !== undefined && y <= 25) B(u, y, AIR);
    }
    // white frame round the opening, sill below, keystone on the crown
    for (let u = Math.floor(c - R) - 2; u <= Math.ceil(c + R) + 2; u++) for (let y = yB - 1; y <= top + 1; y++) {
      if (open.has(`${u},${y}`) || y > maxY(u)) continue;
      let near = false;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (open.has(`${u + a},${y + b}`)) near = true;
      if (near) P(u, y, CAL);
    }
    for (let u = Math.ceil(c - 0.5); u <= Math.floor(c + 0.5); u++) if (top + 1 <= maxY(u)) P(u, top + 1, QB);
    return top;
  };

  const hang = (x, y, z, top) => {
    set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    for (let k = y + 1; k <= top; k++) set(x, k, z, "chain", { axis: "y", waterlogged: "false" });
  };

  // ---- the gallery: wall z 77..78 restored, then a walk z 74..77 (y 1..10, ceiling y 11) behind arches at z 78, with
  // a shopfront at z 73: panes and a dark oak door per arch, a lantern hung in each arch, a white string course y 11
  const gallery = (x0, x1, arches, lamps) => {
    fill(x0, 1, 77, x1, 25, 78, AND); fill(x0, 1, 78, x1, 2, 78, SB);
    fill(x0, 1, 74, x1, 10, 77, AIR);
    fill(x0, 11, 74, x1, 11, 77, SS);
    fill(x0, 1, 73, x1, 10, 73, AND); fill(x0, 8, 73, x1, 8, 73, PD);        // shopfront wall, dark fascia y8
    fill(x0, 11, 78, x1, 11, 78, "smooth_quartz");
    for (let x = x0; x <= x1; x++) {
      if (isAir(x, 11, 79) || /smooth_quartz_slab/.test(g.blockAt(x, 3, 79))) set(x, 11, 79, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      if (/smooth_quartz_slab/.test(g.blockAt(x, 3, 79))) set(x, 3, 79, AIR);   // v2's tall-window sills
    }
    // lanterns on chains from the gallery ceiling every 4 x (lantern y 6: the walk floor gets 11+)
    for (const x of lamps ?? Array.from({ length: Math.floor((x1 - x0 - 1) / 4) + 1 }, (_, i) => x0 + 1 + 4 * i)) hang(x, 6, 76, 10);
    for (const [a, b] of arches) {
      const w = b - a + 1, mid = (a + b) / 2;
      fill(a, 1, 78, b, 7, 78, AIR);
      if (w >= 6) { fill(a + 1, 8, 78, b - 1, 8, 78, AIR); fill(a + 2, 9, 78, b - 2, 9, 78, AIR); }
      else fill(a + 1, 8, 78, b - 1, 8, 78, AIR);
      // calcite ring round the arch head, keystone on the crown
      for (let x = a - 1; x <= b + 1; x++) for (let y = 6; y <= 10; y++) {
        if (isAir(x, y, 78)) continue;
        let near = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]]) if (x + dx >= a && x + dx <= b && isAir(x + dx, y + dy, 78) && y + dy <= 9) near = true;
        if (near) set(x, y, 78, CAL);
      }
      for (let x = Math.ceil(mid - 0.5); x <= Math.floor(mid + 0.5); x++) {
        let y = 9; while (y > 1 && !isAir(x, y, 78)) y--;
        set(x, y + 1, 78, QB);
      }
      // shopfront: door pair (or one door) at the centre, panes y1..6 beside, a transom pane row y7
      for (let x = a; x <= b; x++) for (let y = 1; y <= 7; y++) set(x, y, 73, PANE, paneZ);
      const dl = Math.ceil(mid - 0.5), dr = Math.floor(mid + 0.5);
      for (const [x, hinge] of [[dl, "left"], [dr, "right"]]) {
        set(x, 1, 73, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
        set(x, 2, 73, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
      }
      set(dl, 1, 72, AIR); set(dl, 2, 72, AIR); set(dr, 1, 72, AIR); set(dr, 2, 72, AIR);
    }
  };
  // shop lamp column: barrels from the floor carry the lantern (no floating)
  const shopLamp = (x) => { for (let y = 1; y <= 5; y++) set(x, y, 72, "barrel", { facing: "up", open: "false" }); set(x, 6, 72, "lantern", { hanging: "false", waterlogged: "false" }); };

  // ================= plot 1: the wing section (x 48..63), symmetric about x 55.5 so it tiles
  gallery(48, 63, [[49, 54], [57, 62]], [50, 53, 58, 61]);   // lamps mirrored about x 55.5
  fill(55, 12, 79, 56, 25, 79, AIR);                       // the centre pilaster stops at the string course
  fan({ plane: "z", at: 78, back: 77, c: 55.5, R: 6, yB: 14, yS: 18, cols: [3.5] });
  for (const x of [49, 62]) shopLamp(x);

  // ================= plot 0: the bars either side of the gable (x 0..12, 34..47), mirrored about x 23
  gallery(0, 12, [[1, 6]]); gallery(34, 47, [[41, 46]]);
  fill(8, 1, 78, 12, 10, 78, AND); fill(34, 1, 78, 38, 10, 78, AND);
  for (const x of [7, 40]) fill(x, 12, 79, x, 25, 79, AIR);
  fan({ plane: "z", at: 78, back: 77, c: 5.5, R: 4, yB: 14, yS: 19, cols: [2.5] });
  fan({ plane: "z", at: 78, back: 77, c: 40.5, R: 4, yB: 14, yS: 19, cols: [2.5] });
  for (const x of [1, 46]) shopLamp(x);
  for (const x of [6, 10, 36, 40]) hang(x, 7, 68, 11);       // the side shops, hung from the y 12 deck

  // the central gable (x 13..33): wall restored, the greatest fan light, a dark MARKETPLACE band, the doors under it
  fill(14, 1, 77, 32, 25, 77, AND);
  for (let x = 14; x <= 32; x++) fill(x, 1, 78, x, gableTop(Math.min(x - 13, 33 - x)), 78, AND);
  fill(14, 1, 78, 32, 2, 78, SB);
  for (const x of [13, 14, 32, 33]) fill(x, 1, 79, x, 27, 79, CAL);                      // pilasters each side, white
  fill(15, 11, 78, 31, 11, 78, "smooth_quartz"); for (let x = 15; x <= 31; x++) set(x, 11, 79, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  fan({ plane: "z", at: 78, back: 77, c: 23, R: 6.5, yB: 14, yS: 21, cols: [3], maxY: (x) => gableTop(Math.min(x - 13, 33 - x)) });
  // sign band y 8..10, x 15..31: dark, the 11 letters of MARKETPLACE as light blocks (alternating so each reads apart)
  fill(15, 8, 78, 31, 10, 78, PD);
  "MARKETPLACE".split("").forEach((ch, i) => set(18 + i, 9, 78, i % 2 ? "smooth_quartz" : "quartz_bricks"));
  // entrance: a 9-wide opening y1..7, glazed screen with a door pair at x 22..24 (deepslate post), set in at z 77
  fill(19, 1, 78, 27, 7, 78, AIR);
  fill(18, 1, 78, 18, 7, 78, CAL); fill(28, 1, 78, 28, 7, 78, CAL);
  for (let x = 19; x <= 27; x++) for (let y = 1; y <= 7; y++) set(x, y, 77, PANE, paneZ);
  fill(23, 1, 77, 23, 7, 77, PD); fill(19, 3, 77, 27, 3, 77, AIR);
  for (let x = 19; x <= 27; x++) set(x, 3, 77, PANE, paneZ);
  for (const [x, hinge] of [[22, "left"], [24, "right"]]) {
    set(x, 1, 77, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    set(x, 2, 77, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
  for (let x = 19; x <= 27; x++) set(x, 1, 79, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // ================= plot 2: terrace gallery x 65..99 under the gables, cross-gable and east fan lights
  gallery(64, 99, [[65, 70], [73, 78], [81, 86], [89, 94], [97, 99]]);
  for (const x0 of [67, 85]) for (let x = x0; x <= x0 + 12; x++) {
    const t = x === x0 || x === x0 + 12 ? 27 : gableTop(Math.min(x - x0, x0 + 12 - x));
    fill(x, 12, 78, x, t, 78, AND);
    if (x > x0 && x < x0 + 12) fill(x, 26, 77, x, 27, 77, AIR);
  }
  for (const x of [71, 72, 87, 88]) fill(x, 12, 79, x, 25, 79, AIR);
  for (const x0 of [67, 85]) {
    fan({ plane: "z", at: 78, back: 77, c: x0 + 6, R: 4.5, yB: 13, yS: 21, cols: [2], maxY: (x) => (x <= x0 || x >= x0 + 12 ? 27 : gableTop(Math.min(x - x0, x0 + 12 - x))) });
  }
  // the lower blocks between the gables: a small arched window each
  for (const c of [82.5, 98.5]) fan({ plane: "z", at: 78, back: 77, c, R: c > 90 ? 1 : 2, yB: 15, yS: 20, cols: [] });
  for (const x of [65, 73, 81, 89]) shopLamp(x);
  // east end (x 100): the v2 lunettes become fan lights (old glass back to wall first)
  for (let z = 33; z <= 45; z++) fill(100, 8, z, 100, 29, z, AND);
  for (let z = 68; z <= 74; z++) fill(100, 6, z, 100, 22, z, AND);
  const navTop = (z) => { const m = Math.min(z, 78 - z); return m >= 34 ? 37 : 26 + Math.floor((m - 15) / 2); };
  fan({ plane: "x", at: 100, c: 39, R: 6.5, yB: 10, yS: 22, cols: [3], maxY: navTop });
  fan({ plane: "x", at: 100, c: 71, R: 3.5, yB: 8, yS: 17, cols: [], maxY: (z) => Math.max(26, gableTop(Math.min(z - 64, 78 - z))) });

  // awnings over the shopfronts: red and white stripes at y 7 (z 74) dropping to y 6 (z 75), on fence posts
  for (let x = 65; x <= 99; x++) { set(x, 7, 74, x % 2 ? "red_wool" : "white_wool"); set(x, 6, 75, x % 2 ? "red_wool" : "white_wool"); }
  for (let x = 65; x <= 99; x++) if (x % 6 === 5) for (let y = 1; y <= 5; y++) set(x, y, 75, ...fence());

  // market tents: 3x3 white/blue canopy at y 4 on four fence posts (z 76..78 is too tight with the arch piers, so
  // the tents stand z 76..77 two deep and the canopy reaches the arch line)
  const tent = (x0) => {
    for (const [x, z] of [[x0, 76], [x0 + 2, 76], [x0, 77], [x0 + 2, 77]]) for (let y = 1; y <= 3; y++) set(x, y, z, ...fence());
    for (let x = x0; x <= x0 + 2; x++) for (let z = 76; z <= 77; z++) set(x, 4, z, (x + z) % 2 ? "blue_wool" : "white_wool");
    set(x0 + 1, 1, 77, "barrel", { facing: "up", open: "false" }); set(x0 + 1, 2, 77, "spruce_slab", { type: "bottom", waterlogged: "false" });
  };
  for (const x0 of [74, 90]) tent(x0);
  // cafe tables: umbrella pole on a fence, a 3-wide canopy at y 4, two stair chairs
  const cafe = (x) => {
    for (let y = 1; y <= 3; y++) set(x, y, 77, ...fence());
    for (let u = x - 1; u <= x + 1; u++) for (let z = 76; z <= 77; z++) set(u, 4, z, u === x ? "white_wool" : "blue_wool");
    set(x, 1, 76, "spruce_slab", { type: "top", waterlogged: "false" });
    set(x - 1, 1, 77, "spruce_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
    set(x + 1, 1, 77, "spruce_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  };
  for (const x of [67, 83, 97]) cafe(x);
}
