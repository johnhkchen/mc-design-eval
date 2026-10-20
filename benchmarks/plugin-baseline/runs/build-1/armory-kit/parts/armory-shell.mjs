// Armory shell (P1): A, B, C walls (smooth_sandstone, 2 thick, y1..27), floors y7/14/21, strip windows, slots,
// the south curtain wall, doors and stair flights. The roof tool adds deck, parapet and coping from y28.
import { flight, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stripWindowRun, doorPair, slotWindow, atriumRailing } from "../vocab.mjs";

const holes = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
const hole = (x0, y0, z0, x1, y1, z1) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) holes.add(key(x, y, z));
};
const COURSES = [8, 15, 22, 27];
// owner: pale grey-white concrete (calcite) with red-brown brick bands at each floor line and the frieze
const BODY = "calcite", BAND = "bricks";
const wallBlock = (y) => (y === 1 ? "polished_andesite" : COURSES.includes(y) ? BAND : BODY);
// the doors from the lawn-side glass arcade into the hall, in the 2-wide piers of the B east wall (z of the first leaf)
export const ARCADE_DOORS = [55, 79, 103];

function wallCells(cells, yTop = 27) {
  for (const [x, z] of cells) {
    for (let y = 1; y <= yTop; y++) if (!holes.has(key(x, y, z))) g_.set(x, y, z, wallBlock(y));
  }
}
let g_;
const rect = (x0, z0, x1, z1) => {
  const c = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) c.push([x, z]);
  return c;
};

// strip-window run: the outer plane cell (with its sill row) and the cell one back are left open, then glazed
const runs = [];
function run(face, plane, from, to, y, extra = {}) {
  const high = y === 2 ? 4 : 3;
  const horiz = face === "north" || face === "south";
  const back = face === "north" ? 1 : face === "south" ? -1 : face === "west" ? 1 : -1;
  for (let a = from; a <= to; a++) {
    const p = horiz ? [a, plane] : [plane, a];
    const q = horiz ? [a, plane + back] : [plane + back, a];
    hole(p[0], y - 1, p[1], p[0], y + high - 1, p[1]);
    hole(q[0], y, q[1], q[0], y + high - 1, q[1]);
  }
  runs.push({ face, plane, from, to, y });
}

export function build(g) {
  g_ = g;
  const YS = [2, 9, 16, 23];

  // ---- openings first (holes), then the walls around them ----
  // A north centre strip windows (z5), skipping the two runs at the porch doors
  for (let k = 0; k < 10; k++) for (const y of YS) {
    if (y === 2 && (k === 5 || k === 6)) continue;
    run("north", 5, 15 + 8 * k, 20 + 8 * k, y);
  }
  // pavilion slots
  for (const x of [5, 101]) hole(x, 2, 4, x + 1, 26, 5);
  // A ends
  for (let k = 0; k < 3; k++) for (const y of YS) { run("west", 0, 9 + 8 * k, 14 + 8 * k, y); run("east", 107, 9 + 8 * k, 14 + 8 * k, y); }
  // B west / east
  for (let k = 0; k < 11; k++) for (const y of YS) {
    const a = 41 + 8 * k, b = a + 5;
    run("west", 4, a, y === 2 && k === 5 ? 83 : b, y);
    if (!(y === 2 && k >= 10)) run("east", 103, a, y === 2 && k === 9 ? 118 : b, y);
  }
  // C ends
  for (const y of YS) { run("west", 0, 135, 140, y); run("east", 123, 135, 140, y); }
  // doors: porch, B west, galleria opening, doorways A<->B
  hole(60, 1, 5, 63, 3, 6);
  hole(4, 1, 85, 4, 3, 86); hole(5, 1, 85, 5, 3, 86);
  hole(4, 1, 84, 4, 4, 84); hole(4, 1, 87, 4, 4, 87); hole(4, 4, 85, 4, 4, 86);
  hole(102, 1, 122, 103, 5, 127);
  for (const x of [12, 94]) for (const y of [1, 8, 15, 22]) hole(x, y, 34, x + 1, y + 2, 35);
  for (const z of ARCADE_DOORS) hole(102, 1, z, 103, 3, z + 1);

  // ---- walls ----
  // A: ring x0..107 z4..35; the centre north wall is recessed one (z5..6)
  wallCells(rect(0, 4, 107, 35).filter(([x, z]) => (x < 2 || x > 105 || z < 6 || z > 33) && !(z === 4 && x >= 12 && x <= 95)));
  wallCells(rect(12, 6, 95, 6));
  // B west and east walls
  wallCells(rect(4, 36, 5, 131));
  wallCells(rect(102, 36, 103, 131));
  // C: west/east walls, north stubs, south bookends
  wallCells(rect(0, 132, 1, 143));
  wallCells(rect(122, 132, 123, 143));
  wallCells(rect(2, 132, 3, 133));
  wallCells(rect(104, 132, 121, 133));
  wallCells(rect(2, 142, 8, 143));
  wallCells(rect(115, 142, 121, 143));
  // A south wall already in ring (z34..35).

  // ---- floors y7, 14, 21: A interior and the two aisles, only where air ----
  const floor = (y, x0, z0, x1, z1) => {
    for (const [x, z] of rect(x0, z0, x1, z1)) if (g.isAir(x, y, z)) g.set(x, y, z, "smooth_stone");
  };
  for (const y of [7, 14, 21]) {
    floor(y, 2, 6, 105, 33);
    floor(y, 6, 36, 19, 131);
    floor(y, 88, 36, 101, 131);
  }

  // ---- windows ----
  for (const r of runs) stripWindowRun(g, r);
  // slots
  for (const x of [5, 101]) {
    slotWindow(g, { x, z: 4, face: "north", y0: 2, y1: 25 });
    for (const xx of [x, x + 1]) g.set(xx, 26, 4, BAND);
  }

  // ---- south curtain wall z142 glass / z143 frame: from y7 up between the bookends (the vestibule opens below) ----
  const Q = "smooth_quartz";
  const PANE = { north: "false", south: "false", east: "true", west: "true" };
  for (let x = 9; x <= 114; x++) {
    const mull = (x - 9) % 7 === 0;
    const y0 = x >= 112 ? 1 : 7;
    for (let y = y0; y <= 26; y++) {
      const transom = y === 7 || y === 14 || y === 21;
      if (mull) g.set(x, y, 143, Q);
      else if (transom) g.set(x, y, 142, Q);
      else g.set(x, y, 142, "glass_pane", PANE);
    }
    g.set(x, 27, 143, BAND);
    g.set(x, 27, 142, BAND);
    if (x < 112) { g.set(x, 7, 143, Q); }
  }
  // band rows across the bookends carried through (already in wallBlock)

  // ---- doors ----
  doorPair(g, { x: 60, z: 5, face: "north", width: 4 });
  doorPair(g, { x: 4, z: 85, face: "west", width: 2, surround: true });
  for (const z of ARCADE_DOORS) doorPair(g, { x: 103, z, face: "east", width: 2 });
  for (let y = 4; y <= 4; y++) for (const x of [60, 61, 62, 63]) g.set(x, y, 5, BODY);
  for (let z = 122; z <= 127; z++) { /* the E<->B opening is left open (no door) */ }

  // ---- stair flights F1..F3 and mirrors ----
  const F = (x, y, z, to) => flight(g, { from: [x, y, z], facing: "south", to, material: "polished_andesite", width: 2 });
  for (const x of [9, 99]) {
    F(x, 1, 8, 7);
    F(x, 8, 16, 14);
    F(x, 15, 8, 21);
    const xs = x === 9 ? 8 : 98;
    carve(g, [xs, 7, 8], [xs + 1, 7, 13]);
    carve(g, [xs, 14, 16], [xs + 1, 14, 21]);
    carve(g, [xs, 21, 8], [xs + 1, 21, 13]);
  }

  // ---- atrium railings along the aisle edges ----
  for (const y of [8, 15, 22]) {
    atriumRailing(g, { x: 20, z0: 36, z1: 131, y });
    atriumRailing(g, { x: 87, z0: 36, z1: 131, y });
  }
}
