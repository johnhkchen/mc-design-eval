// Part 4: Entry, garage doors and bay. Ticks elements 4 (bay glazing), 6 (portico, double door), 7 (fanlight),
// 11 (carriage doors, lantern posts) and 21 (portico steps and floor; the walkway is P5's). Shell and facade leave
// these openings empty, so every write here goes into air only: a block an earlier part placed is skipped, not
// refused, and nothing is carved.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as V from "../vocab.mjs";

const { SMOOTH_QUARTZ, GLASS, STONE_BRICKS, PORTICO_COLUMNS, CARRIAGE_X, LAMP_POSTS } = V;

/** The grid with writes limited to air, so the vocab helpers can be reused without clobbering earlier parts. */
function airOnly(g) {
  const set = (x, y, z, block, state, nbt) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, state, nbt); };
  return new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return set;
      if (prop === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) set(x, y, z, block, state);
        return target;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

/** Portico: quartz columns (y1..9) and the y9 beam across x26..35 at z4. */
function portico(a) {
  for (const x of PORTICO_COLUMNS) V.column(a, x);
  V.beam(a);
}

/** Portico floor (stone brick, y1, z4..6) and the two-step rise from the lawn at z3 (tall side south, to the floor). */
function porticoFloorAndSteps(a) {
  a.fill([26, 1, 4], [35, 1, 6], STONE_BRICKS);
  for (let x = 28; x <= 33; x++) a.set(x, 1, 3, ...B.stairs("stone_brick", "south", "bottom"));
}

/** Entry door surround (smooth_quartz pilasters at x29 and x32, y2..4) and the double dark-oak door with fanlight. */
function entryDoor(a) {
  for (const x of [29, 32]) a.fill([x, 2, 7], [x, 4, 7], SMOOTH_QUARTZ);
  V.doorDouble(a, V.DOUBLE_DOOR.x, V.DOUBLE_DOOR.z);
  V.fanlight(a, V.DOUBLE_DOOR.x, V.DOUBLE_DOOR.z);
  V.pedimentWindow(a);
}

/** Three carriage doors on z5 with a lantern post between them and at each end (z4, outside the garage wall). */
function garage(a) {
  for (const x of CARRIAGE_X) V.carriageDoor(a, x, 5);
  for (const x of LAMP_POSTS) V.carriageLamp(a, x, 4);
}

/** Bay glazing: glass in the three cardinal faces of the turret bay at y3..5 and y7..9 (walls are P1/P3's). */
function bayGlazing(a) {
  const ys = [3, 4, 5, 7, 8, 9];
  for (const y of ys) {
    for (let x = 38; x <= 40; x++) a.set(x, y, 4, GLASS);
    for (const x of [37, 41]) for (let z = 5; z <= 6; z++) a.set(x, y, z, GLASS);
  }
}

export function build(g) {
  const a = airOnly(g);
  portico(a);
  porticoFloorAndSteps(a);
  entryDoor(a);
  garage(a);
  bayGlazing(a);
}
