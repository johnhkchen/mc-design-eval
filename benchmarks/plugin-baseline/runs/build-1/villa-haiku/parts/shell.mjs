/*
Plinth polished_andesite at y0 across x0..35 z0..47; floor layer y1 with mosaicFloor (white_terracotta field, black_terracotta border) in every room and walkway, grass_block in the court (x12..23 z30..37). Walls smooth_quartz at y2..5 with red_terracotta dado at y2..3 (plaster helper), raised to the roof high sides listed in plan.md ROOFS. Interior walls: x=8, 15, 20, 27 at z1..7; z=8 (x0..35); x=9 and 26 at z9..20; z=21; x=12 and 23 at z22..25; z=26; x=8 and 27 at z27..40; z=41 at x8..27; x=11 and 24 at z42..46; z=47 outer. Outer walls x=0 and x=35. Openings: pocket carve (16..19,2..5,0); fauces door pair (17..18,2..3,1) with jambs; shop openings (2..5, 10..13, 22..25, 30..33 at y2..4, z=0) with shutters (dark_oak_trapdoor open) at x 1,6,9,14,21,26,29,34; fauces-atrium carve (16..19,2..5,8); atrium doors (9,2..3,10), (9,2..3,17), (26,2..3,10), (26,2..3,17); tablinum opening (14..21,2..4,21); back doorway (16..19,2..4,26); storeroom doors (10,2..3,26), (25,2..3,26), (10,2..3,41), (25,2..3,41); peristyle doors (8,2..3,33), (27,2..3,33); triclinium doorway (16..19,2..4,41); windows iron_bars at x=0 and x=35 (z 11..12, 17..18, 35..36, y3..4) and z=47 (x 14..15, 20..21, y3..4). Helpers: plaster, mosaicFloor, doorway, shutter, window, shopOpening. Ticks E01 E02 E03 E04 E17 E19 E22 E23 E25.
*/
import {
  ROOMS, IMPLUVIUM, FOUNTAIN, COURT, SHOP_OPENINGS, PLINTH, GRASS, DADO,
  plaster, mosaicFloor, doorway, doorwayFacing, opening, window, shopOpening, pediment,
} from "../vocab.mjs";

// the peristyle walkway ring (x9..26, z27..40); the court sits inside it
const RING = [9, 27, 26, 40];
const ZONES = [...ROOMS.map((r) => [r.box[0], r.box[2], r.box[3], r.box[5]]), RING];
// y1 cells a later part lays its own floor into (basins, the fountain, the beds, the path legs): this part writes nothing there
const LATER_FLOOR = [IMPLUVIUM, FOUNTAIN, [13, 31, 14, 36], [21, 31, 22, 36], [17, 27, 18, 29], [17, 38, 18, 40]];

// a view that skips the LATER_FLOOR y1 cells: runParts locks every cell an earlier part wrote (air included), so writing
// them here (even as air) would refuse the impluvium, the fountain, the beds and the path legs
const unclaimed = (g) => {
  const later = (x, y, z) => y === 1 && LATER_FLOOR.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, ...rest) => { if (!later(x, y, z)) target.set(x, y, z, ...rest); return view; };
      if (prop === "unset") return (x, y, z) => { if (!later(x, y, z)) target.unset(x, y, z); return view; };
      if (prop === "fill") return (a, b, ...rest) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) view.set(x, y, z, ...rest);
        return view;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
};
// wall runs [x0, z0, x1, z1, top]: 5 for a plain wall, 8 or 9 where a roof's high side is walled (plan.md ROOFS)
const WALLS = [
  [0, 0, 35, 0, 9],                                     // street front (RA high side)
  [0, 1, 0, 47, 5], [35, 1, 35, 47, 5],                 // outer walls x=0, x=35
  [0, 8, 35, 8, 5],                                     // z=8: shops to atrium
  [0, 21, 35, 21, 9],                                   // z=21: tablinum wall (RG, RH, RI high side)
  [8, 1, 8, 7, 5], [15, 1, 15, 7, 5], [20, 1, 20, 7, 5], [27, 1, 27, 7, 5],
  [16, 1, 19, 1, 5],                                    // fauces front
  [9, 9, 9, 20, 5], [26, 9, 26, 20, 5],                 // atrium walls
  [12, 22, 12, 25, 5], [23, 22, 23, 25, 5],             // tablinum walls
  [0, 26, 35, 26, 5],                                   // z=26: back of tablinum and storerooms
  [8, 27, 8, 40, 8], [27, 27, 27, 40, 8],               // peristyle walls (RJ-W, RJ-E high side)
  [8, 41, 27, 41, 8],                                   // z=41: triclinium wall (RJ-S high side)
  [11, 42, 11, 46, 5], [24, 42, 24, 46, 5],             // triclinium walls
  [0, 14, 8, 14, 5], [27, 14, 35, 14, 5],               // cubicula and kitchen: north-south split
  [0, 28, 8, 28, 5], [27, 28, 35, 28, 5],               // cubicula W-P and E-P: north walls
  [0, 39, 8, 39, 5], [27, 39, 35, 39, 5],               // cubicula W-P and E-P: south walls
  [0, 9, 0, 20, 9], [35, 9, 35, 20, 9],                 // RE, RF high sides
  [0, 28, 0, 39, 8], [35, 28, 35, 39, 8],               // RK-W, RK-E high sides
  [0, 42, 0, 46, 8], [35, 42, 35, 46, 8],               // RL-SW, RL-SE high sides
  [0, 47, 35, 47, 8],                                   // z=47 outer wall (RL-T, RL-SW, RL-SE)
  [9, 12, 9, 17, 9], [26, 12, 26, 17, 9],               // RC, RD high sides
];

export function build(part) {
  const g = unclaimed(part);

  // plinth at y0 across the footprint
  g.fill([0, 0, 0], [35, 0, 47], PLINTH);

  // floor layer y1: plinth under the walls, mosaic in the rooms and the walkway, grass in the court
  g.fill([0, 1, 0], [35, 1, 47], PLINTH);
  for (const box of ZONES) mosaicFloor(g, box);
  g.fill([COURT[0], 1, COURT[1]], [COURT[2], 1, COURT[3]], GRASS);
  g.fill([17, 1, 23], [18, 1, 24], DADO);                // red medallion in the tablinum

  // walls: cream plaster with the red dado
  for (const run of WALLS) plaster(g, run.slice(0, 4), run[4]);

  // street front: the pocket, the fauces pediment in the gable cells above it, the four shops
  opening(g, [16, 2, 0, 19, 5, 0]);
  pediment(g, 16, 19, 0);
  for (const [x0, x1] of SHOP_OPENINGS) shopOpening(g, x0, x1);

  // fauces: the door set back from the pocket, and the carve to the atrium
  doorwayFacing(g, 17, 1);
  opening(g, [16, 2, 8, 19, 5, 8]);

  // atrium: four doors, the tablinum opening
  doorway(g, 9, 10, "z");
  doorway(g, 9, 17, "z");
  doorway(g, 26, 10, "z");
  doorway(g, 26, 17, "z");
  opening(g, [14, 2, 21, 21, 4, 21]);

  // tablinum: the back doorway and the storeroom doors
  opening(g, [16, 2, 26, 19, 4, 26]);
  doorway(g, 10, 26, "x");
  doorway(g, 25, 26, "x");

  // peristyle: the cubicula doors
  doorway(g, 8, 33, "z");
  doorway(g, 27, 33, "z");

  // triclinium: the doorway from the peristyle and the storeroom doors
  opening(g, [16, 2, 41, 19, 4, 41]);
  doorway(g, 10, 41, "x");
  doorway(g, 25, 41, "x");

  // outer windows: cubicula, kitchen, triclinium
  for (const z of [11, 12, 17, 18, 35, 36]) {
    window(g, 0, z);
    window(g, 35, z);
  }
  for (const x of [14, 15, 20, 21]) window(g, x, 47);

  return part;
}
