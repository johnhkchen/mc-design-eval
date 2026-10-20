// P3 roofs and crowns: the flying-saucer crown of the KOMO E drum (with its set-back penthouse), the half-drum crown
// of KOMO W's bow, the Hyatt plant screen, the Aperture roof pergola and the stair/lift overrun. Flat parapets are
// laid from roof.json (the modern preset) by runParts right after the shell.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { crownRing, plantScreen, pergola } from "../vocab.mjs";

// Flat roofs of the two hotel-type masses. runParts lays roof.json only right after the KOMO shell (the first part),
// so Hyatt's wedge and annex and Aperture's block are roofed here, once their walls stand. Same modern preset as roof.json.
const FLAT = { preset: "modern", eave: "plain", parapet: 1, rail: true, texture: false, contrast: false };
const HYATT_WEDGE = [[192, 8, 199, 11], [188, 12, 199, 15], [184, 16, 199, 19], [180, 20, 199, 23], [176, 24, 199, 31],
  [172, 32, 199, 35], [168, 36, 199, 39], [164, 40, 199, 47], [168, 48, 199, 55], [176, 56, 199, 63], [152, 64, 199, 91]];
const APERTURE = [[201, 2, 248, 35], [201, 36, 248, 51]];
// The Hyatt core's stair comes up through the south block's deck here (stairs.mjs carved and set these cells): the deck
// is left open for it, so the roof's commit refuses nothing of the earlier part's.
const HYATT_STAIR_OPENING = { from: [186, 37, 73], to: [189, 37, 73] };

const CYAN = "cyan_stained_glass";
const QUARTZ = "smooth_quartz";

// Plan-view ring of cells at distance d from (cx, cz), d2lo <= dist^2 < d2hi.
function ringCells(cx, cz, r2lo, r2hi) {
  const out = [];
  const R = Math.ceil(Math.sqrt(r2hi)) + 1;
  for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
    const d2 = (x - cx) ** 2 + (z - cz) ** 2;
    if (d2 >= r2lo && d2 < r2hi) out.push([x, z]);
  }
  return out;
}

// The Hyatt and Aperture shells are earlier parts, locked: their walls, top courses and parapets already stand in these
// cells, and a write there is refused. roof() may only fill air, so it writes through this view, which drops any write
// into a block (the shell's own top course already is the eave and parapet there).
function intoAir(g) {
  const air = (x, y, z) => !g.inBounds(x, y, z) || /(^|:)(cave_)?air$/.test(g.blockAt(x, y, z));
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { if (air(x, y, z)) target.set(x, y, z, ...rest); return view; };
      if (prop === "unset") return (x, y, z) => { if (air(x, y, z)) target.unset(x, y, z); return view; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

// Paint the cells at height y; writes into earlier parts' blocks are refused by the grid and counted there.
function paint(g, cells, y, block) {
  const before = g.refused?.length ?? 0;
  for (const [x, z] of cells) g.set(x, y, z, block);
  return { placed: cells.length - ((g.refused?.length ?? 0) - before), cells: cells.length };
}

export function build(g) {
  const report = {};

  // KOMO E drum: crown ring r13 (overhang 2 over the r11 glass), rail on the outer edge at y43, lid at y41.
  report.drumCrown = crownRing(g, { cx: 13, cz: 20, r: 13, y: 42, rail: 43, lid: 41 });

  // Drum penthouse: a set-back green-glass ring r7 at y42..43 with a flat white lid at y44.
  const penRing = ringCells(13, 20, 36, 50);                  // 6 <= dist < 7.07
  for (const y of [42, 43]) report[`penthouse${y}`] = paint(g, penRing, y, CYAN);
  const penLid = ringCells(13, 20, 0, 50);
  report.penthouseLid = paint(g, penLid, 44, QUARTZ);

  // KOMO W bow: the half-drum crown on the north half (z <= 14), r14, rail y43, lid y41.
  report.bowCrown = crownRing(g, { cx: 127, cz: 14, r: 14, y: 42, rail: 43, lid: 41, half: true });

  // Hyatt plant enclosure: kerb y38, iron-bar screen to y43, flat stone slab lid at y44.
  report.plant = plantScreen(g, [168, 38, 70, 187, 44, 85]);

  // Aperture roof terrace pergola (posts to y39, rafters at y40), and the stair/lift overrun box.
  report.pergola = pergola(g, [210, 38, 10, 225, 40, 25]);
  const over = [];
  for (let x = 230; x <= 237; x++) for (let z = 20; z <= 27; z++) for (let y = 38; y <= 40; y++) over.push([x, y, z]);
  for (const [x, y, z] of over) g.set(x, y, z, "white_concrete");
  report.overrun = { cells: over.length };

  // Flat roofs of the hotel-type masses: Hyatt wedge and south block (deck y37), Hyatt annex (y17), Aperture (y37).
  report.hyattRoof = roof(intoAir(g), HYATT_WEDGE, "modern", { ...FLAT, y: 37, material: "smooth_stone", trim: "smooth_stone_slab", keep: [HYATT_STAIR_OPENING] });
  report.annexRoof = roof(intoAir(g), [152, 56, 171, 63], "modern", { ...FLAT, y: 17, material: "smooth_stone", trim: "smooth_stone_slab" });
  report.apertureRoof = roof(intoAir(g), APERTURE, "modern", { ...FLAT, y: 37, material: "smooth_stone", trim: "smooth_stone_slab" });

  return report;
}
