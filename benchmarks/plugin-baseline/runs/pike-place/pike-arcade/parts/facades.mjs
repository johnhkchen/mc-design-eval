// Part 4: Facades: windows, doors, trim, awnings, lamps (plan.md FACADES, OPENINGS, elements 5-11, 19, 22).
// Every write goes into air only (the shells left the openings open); the vocabulary refuses anything built.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { window_bay, du_window, cornice, string_course, quoins, awning, pier_bay, shop_door, hang_lamp, stall_sign } from "../vocab.mjs";

// The GROUND map from the brief: ground height above y 0 per 7x7 cell. Row = floor(z / 7), column = floor(x / 7).
const GROUND = [
  [null, null, null, 13, 18, 18, null], [null, null, null, 13, 17, 18, null], [null, null, null, 13, 17, 18, null],
  [null, null, null, 13, 17, 18, null], [null, null, null, 14, 17, 18, null], [null, null, null, 14, 18, 19, null],
  [null, null, null, 14, 18, 19, null], [null, null, null, 14, 18, 19, null], [null, null, null, 15, 18, 19, null],
  [null, null, null, 15, 18, 19, null], [null, null, null, 14, 18, 19, null], [null, null, null, 13, 17, 19, null],
  [null, null, null, 12, 17, 19, null], [null, null, null, 11, 17, 19, null], [null, null, null, 11, 16, 19, null],
  [null, null, null, null, 16, 19, null], [null, null, null, null, 16, 20, null], [null, null, null, null, 16, 19, null],
  [null, null, null, null, 16, 19, null], [null, null, null, null, 15, 20, null], [null, null, null, null, 16, 20, null],
  [null, null, null, 7, 16, 20, null], [null, null, null, 7, 15, 20, null], [null, null, null, 8, 15, 20, null],
  [null, null, 5, 10, 16, 20, null], [null, null, 5, 10, 16, 21, null], [null, null, 6, 11, 16, 20, null],
  [null, null, 7, 12, 17, 20, null], [null, 3, 7, 12, 17, 21, null], [null, 3, 8, 12, 17, 21, null],
  [null, 3, 8, 13, 17, 20, null], [null, 4, 8, 13, 17, 22, null], [null, 4, 9, 13, 17, 21, null],
  [2, 5, 9, 13, 18, 21, null], [2, 5, 10, 14, 18, 21, null], [2, 6, 10, 14, 18, 21, null],
  [3, 7, 10, 14, 18, 21, null], [4, 7, 11, 14, 18, 22, null], [4, 8, 11, 15, 18, 22, null],
  [5, 8, 12, 15, 19, 22, null], [5, 9, 12, 15, 19, 22, null], [6, 9, 12, 16, 19, 22, null],
  [6, 9, 12, 16, 19, 23, 23], [7, 10, 12, 16, 19, 23, 23], [7, 10, 12, 15, 19, 23, 23],
];
const groundAt = (x, z) => GROUND[Math.floor(z / 7)]?.[Math.floor(x / 7)] ?? 0;

// A 2-tall door on a west or south wall: lower and upper halves, both leaves share facing; hinge per leaf.
function door2(g, x, y, z, face, hinges) {
  for (let i = 0; i < 2; i++) {
    const hinge = hinges[i];
    const [block, state] = B.door("dark_oak", face, "lower", hinge);
    const [blockU, stateU] = B.door("dark_oak", face, "upper", hinge);
    const [px, pz] = face === "west" ? [x, z + i] : [x + i, z];
    if (!g.isAir(px, y, pz) || !g.isAir(px, y + 1, pz)) continue;
    g.set(px, y, pz, block, state);
    g.set(px, y + 1, pz, blockU, stateU);
  }
}

// A glazed bay on a wall plane (x for east and west faces, z for the south face): w x h cells from `start` along the
// wall at height y, glass panes joined to their neighbours, a dark oak mullion down the middle of a 4-wide window.
// Writes into air only; no proud sill or lintel (those fall outside the footprint at the plot edge).
function bayGlass(g, face, plane, start, y, w = 4, h = 3) {
  const alongZ = face === "south" || face === "north"; // the wall runs along x
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const [x, z] = alongZ ? [start + i, plane] : [plane, start + i];
    if (!g.isAir(x, y + j, z)) continue;
    if (w === 4 && i === 2) { g.set(x, y + j, z, "dark_oak_planks", {}); continue; }
    const along = alongZ ? { east: i < w - 1 ? "true" : "false", west: i > 0 ? "true" : "false", north: "false", south: "false" }
      : { north: i < w - 1 ? "true" : "false", south: i > 0 ? "true" : "false", east: "false", west: "false" };
    g.set(x, y + j, z, "glass_pane", { ...along, waterlogged: "false" });
  }
}

// Down Under window: 3 x 2 panes centred in the 6-bay from `start`, only where level f is above the ground.
// v2: 3 tall (y f+1..f+3); the shell leaves the opening and lays the glow one cell inside (most windows lit).
function duGlass(g, face, plane, start, f, ground) {
  if (f + 1 <= ground) return;
  bayGlass(g, face, plane, start + 1, f + 1, 3, 3);
}

// Glazing on the south face (z 311 is the outer cell, so there is no room for a proud sill or lintel): w x h panes at
// plane z = 311 from x0 and y0, joined along x, with a froglight one cell in behind every pane column.
function southGlass(g, { x0, y0, w = 4, h = 3, glow = true }) {
  for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) {
    if (!g.isAir(x, y, 311)) continue;
    g.set(x, y, 311, "glass_pane", { east: x < x0 + w - 1 ? "true" : "false", west: x > x0 ? "true" : "false", north: "false", south: "false", waterlogged: "false" });
    if (glow && g.isAir(x, y, 310)) g.set(x, y, 310, "ochre_froglight", { axis: "y" });
  }
}

export function build(g) {
  // ---- street awnings (red/white valance under the fascia, on the street face) ----
  awning(g, { x: 34, y: 24, z0: 0, z1: 132, face: "east" }); // North Arcade, over the head beam
  awning(g, { x: 41, y: 24, z0: 133, z1: 160, face: "east" }); // North Arcade hall (B1)
  awning(g, { x: 41, y: 24, z0: 161, z1: 188, face: "east" }); // Street arcade, north (floor 20)
  awning(g, { x: 41, y: 26, z0: 189, z1: 279, face: "east" }); // Street arcade, main (floor 22)

  // ---- hanging lanterns under the head beams, one per bay (x 40, between the posts) ----
  // a lamp sits 2 under its beam (chain in between): the beam is the head beam at x 40 (floor + 5)
  for (let z = 163; z <= 187; z += 4) hang_lamp(g, { x: 40, y: 23, z }); // S north: floor 20, beam 25
  for (let z = 191; z <= 275; z += 4) hang_lamp(g, { x: 40, y: 25, z }); // S main: floor 22, beam 27
  for (let z = 135; z <= 159; z += 4) hang_lamp(g, { x: 40, y: 25, z }); // B1: beam 27

  // hand-painted trade signs on brackets under the beam, every third bay of the street arcade (x 40, between posts)
  const TRADES = ["FRESH|PRODUCE", "FLOWERS", "FISH", "HONEY", "BAKERY", "CRAFTS"];
  for (let k = 0; k < 29; k++) {
    if (k % 3 !== 0) continue;
    const z = 162 + 4 * k;
    if (z <= 187) stall_sign(g, { x: 40, y: 23, z, text: TRADES[(k / 3) % TRADES.length], face: "east" });
    else if (z >= 190) stall_sign(g, { x: 40, y: 25, z, text: TRADES[(k / 3) % TRADES.length], face: "east" });
  }

  // ---- North Arcade west wall (x 29): 2 x 2 windows, y 21..22, z 2+4k..3+4k ----
  // v2: the North Arcade's west side is open on posts (shell-north), so the old 2 x 2 panes in x 29 are not set

  // ---- B2 (north upper building, x 33 east face, bays start at z 184 - 6k) ----
  for (const s of [160, 166, 172, 178, 184]) {
    if (s === 160 || s === 172 || s === 184) shop_door(g, { x: 33, y: 21, z: s + 2, face: "east" });
    else bayGlass(g, "east", 33, s + 1, 21);
    bayGlass(g, "east", 33, s + 1, 28);
    bayGlass(g, "west", 21, s + 1, 28);
    pier_bay(g, { face: "east", x: 33, z0: s + 5, y0: 27, y1: 31, pilaster: ((184 - s) / 6) % 3 === 0 });
  }
  cornice(g, { x: 34, y: 31, z0: 161, z1: 188, face: "east" });

  // ---- C (Main Arcade upper building, 3 storeys, bays start at z 190 + 6k, k = 0..14) ----
  for (let k = 0; k <= 14; k++) {
    const s = 190 + 6 * k;
    if (k % 2 === 0) shop_door(g, { x: 33, y: 23, z: s + 2, face: "east" });
    else bayGlass(g, "east", 33, s + 1, 23);
    bayGlass(g, "east", 33, s + 1, 30);
    bayGlass(g, "east", 33, s + 1, 36);
    bayGlass(g, "west", 14, s + 1, 24);
    bayGlass(g, "west", 14, s + 1, 30);
    bayGlass(g, "west", 14, s + 1, 36);
    pier_bay(g, { face: "east", x: 33, z0: s + 5, y0: 23, y1: 39, pilaster: k % 3 === 0 });
  }
  string_course(g, { face: "east", x: 34, from: 189, to: 279, y: 34 });
  cornice(g, { x: 34, y: 39, z0: 189, z1: 279, face: "east" });

  // ---- D corner block (x 40 east wall plane for y 30..40, bays start at z 280 + 6k) ----
  const dBays = [280, 286, 292, 298, 304];
  for (const s of dBays) {
    bayGlass(g, "east", 40, s + 1, 31);
    if (s <= 292) bayGlass(g, "east", 40, s + 1, 37); // clock sits at z 302..308
    bayGlass(g, "west", 14, s + 1, 31);
    bayGlass(g, "west", 14, s + 1, 37);
  }
  // south face (z 311), storeys 29 and 35; bays x 16.., the clock's face takes x 33..39 at y 35..41
  for (const x0 of [16, 22, 28, 34]) {
    southGlass(g, { x0: x0 + 0, y0: 31 });
    if (x0 !== 34) southGlass(g, { x0, y0: 37 });
  }
  quoins(g, { x: 41, z: 311, y0: 30, y1: 40 });
  quoins(g, { x: 41, z: 280, y0: 30, y1: 40 });
  cornice(g, { x: 41, y: 41, z0: 280, z1: 311, face: "east" });

  // ---- Down Under: windows in each level's 6-bay, lit from behind ----
  // west faces (wall planes x = 21, 14, 7, 0); the window's 3-wide pane centres in each bay
  const westRuns = [
    { x: 21, z0: 161, z1: 188 }, { x: 14, z0: 189, z1: 223 }, { x: 7, z0: 224, z1: 251 }, { x: 0, z0: 252, z1: 307 },
  ];
  // bay grids: 6-bays from the building's own bay line (x 21 from 160 like B2, x 14 from 190 like C, x 7 from 224, x 0 from 252)
  const westGrid = { 21: 160, 14: 190, 7: 224, 0: 252 };
  for (const f of [2, 7, 12, 17]) {
    for (const { x, z0, z1 } of westRuns) {
      for (let s = westGrid[x]; s + 1 <= z1; s += 6) {
        if (s + 3 < z0) continue;
        // skip the bays that hold a door at grade (x 7 z 236..237 at level 12; x 0 z 300..301 at level 7)
        if (f === 12 && x === 7 && s + 1 <= 237 && s + 3 >= 236) continue;
        if (f === 7 && x === 0 && s + 1 <= 301 && s + 3 >= 300) continue;
        duGlass(g, "west", x, s, f, groundAt(x, s + 2));
      }
    }
  }
  // north-facing step faces (wall planes z = 161, 189, 224, 252)
  const northRuns = [
    { z: 161, x0: 21, x1: 27 }, { z: 189, x0: 14, x1: 20 }, { z: 224, x0: 7, x1: 13 }, { z: 252, x0: 0, x1: 6 },
  ];
  for (const f of [2, 7, 12, 17]) {
    for (const { z, x0 } of northRuns) {
      duGlass(g, "north", z, x0, f, groundAt(x0 + 2, z));
    }
  }
  // south face (z 311, x 7..33): 6-grid from the west edge; skip the bay that holds the level-12 door (x 10..11)
  for (const f of [2, 7, 12, 17]) {
    for (let s = 7; s + 1 <= 33; s += 6) {
      if (f === 12 && s === 7) continue;
      if (f + 1 > groundAt(s + 2, 311)) southGlass(g, { x0: s + 1, y0: f + 1, w: 3, h: 3, glow: false });
    }
  }

  // ---- Down Under doors at grade (2 cells wide, 2 tall, one step up from the walk) ----
  door2(g, 0, 8, 300, "west", ["left", "right"]);
  door2(g, 7, 13, 236, "west", ["left", "right"]);
  door2(g, 14, 13, 200, "west", ["left", "right"]);
  door2(g, 10, 13, 311, "south", ["left", "right"]);
}
