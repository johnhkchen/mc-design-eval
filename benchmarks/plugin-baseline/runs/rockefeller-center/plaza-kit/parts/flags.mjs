// Flags: the end_rod flagpole ring with mixed-colour wool flags, one pole every 2 blocks on the four promenade lines
// (plan.md SITE, "Flagpoles"). Each pole stands from y5 to y11; its 2x2 flag sits at y10..11 and points out from the
// well. The colour pairs cycle round each line so the ring reads as mixed national flags, not one repeated colour.
import { flagPole } from "../vocab.mjs";

// [top row, bottom row] as dye names (flag_wool palette roles)
const FLAGS = [
  ["red", "white"],
  ["blue", "white"],
  ["yellow", "black"],
  ["green", "white"],
  ["orange", "white"],
  ["light_blue", "red"],
  ["white", "blue"],
  ["black", "yellow"],
  ["red", "blue"],
  ["green", "yellow"],
  ["white", "red"],
  ["orange", "black"],
  ["blue", "yellow"],
  ["white", "green"],
];

// Poles along a line: [x, z] pairs from..to every `step` blocks, on the line's fixed coordinate (x for "x", z for "z")
function line(axis, fixed, from, to, step = 2) {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(axis === "x" ? [fixed, v] : [v, fixed]);
  return out;
}

// Each line: its pole cells and the direction its flags point
const RING = [
  { dir: "north", poles: line("z", 7, 20, 46) },
  { dir: "south", poles: line("z", 48, 20, 46) },
  { dir: "west", poles: line("x", 17, 8, 48) },
  { dir: "east", poles: [...line("x", 48, 8, 16), ...line("x", 48, 38, 48)] },
];

export function build(g) {
  let i = 0;
  for (const { dir, poles } of RING) {
    for (const [x, z] of poles) {
      // the pole stands on the promenade surface: where the map puts the ground at y5 (the west sidewalk strip reads 5),
      // the pole starts on the first air cell above it instead of inside the ground
      let base = 5;
      while (base < 11 && !g.isAir(x, base, z)) base++;
      flagPole(g, x, z, dir, FLAGS[i % FLAGS.length], { base });
      i++;
    }
  }
}
