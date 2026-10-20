// Stair joiner: a switchback stair stack (two lanes, flights alternating east/west) in each building's core, plus
// secondary stacks where a wing or the drum is not reached from the core. Floors cut by flight(); no walls touched.
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export const FLIGHTS = [];

// Stack at (X, Z) in an 8 x 8 (or 8 wide x 6 deep: lane gap 3) box; floors = floor block ys, lowest first.
function stack(g, name, X, Z, floors, depth = 8) {
  const l1 = Z + 1, l2 = Z + (depth === 8 ? 5 : depth - 2);
  for (let i = 0; i + 1 < floors.length; i++) {
    const east = i % 2 === 0, from_y = floors[i] + 1, to = floors[i + 1];
    let x, z, facing;
    if (east) { x = i === 0 ? X : X + 1; z = l1; facing = "east"; }
    else { x = i === 1 ? X + 6 : X + 5; z = l2; facing = "west"; }
    const r = flight(g, { from: [x, from_y, z], facing, to, material: "quartz", width: 1 });
    // one more cell of opening: the walker's jump check wants three clear over the step before each rise
    const sx = east ? 1 : -1;
    for (let k = 0; k < r.steps; k++) if (from_y + k + 3 >= to && from_y + k < to) g.set(x + sx * k, to, z, "air");
    FLIGHTS.push({ name, from: [x, from_y, z], facing, to, steps: r.steps, landing: r.landing, notes: r.notes });
  }
}

const KOMO = [0, 7, 12, 17, 22, 27, 32];
const UP = [...KOMO, 37];

export function build(g) {
  stack(g, "KOMO E core", 60, 30, KOMO);
  stack(g, "KOMO E drum", 8, 14, KOMO);
  stack(g, "KOMO E south wing", 58, 50, [0, 7, 12, 17, 22, 27]);
  stack(g, "KOMO W core", 124, 36, KOMO);
  stack(g, "Hyatt core", 184, 72, UP);
  stack(g, "Hyatt annex", 154, 57, [0, 7, 12], 6);
  stack(g, "Aperture core", 230, 20, KOMO);
  for (const f of FLIGHTS) if (f.notes.length) console.log("stairs:", f.name, f.from, f.notes.join("; "));
}
