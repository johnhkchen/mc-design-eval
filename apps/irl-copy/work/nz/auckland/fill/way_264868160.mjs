// UniLodge Whitaker (450): a flat-roofed student tower, about 14 storeys of 4 blocks, on a single-storey west wing.
// Read from the lidar record: the roof is 58 blocks above y0 almost everywhere, with a 60-block plant core in the middle
// and a 9 to 11 block wing along the west edge. Era and materials are read from that shape: a late-20th/early-21st
// century CBD tower, white concrete piers and light grey spandrels between glass, a dark stone base, a plant box on top.
// Everything stands on the course below it: foundations to each cell's ground, then storeys on absolute 4-block lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_264868160.cells.json", "utf8"));

// lidar roofs smoothed into three tiers: wing (< 25: kept as its own low roof), tower (58), plant core (>= 59: 60)
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(`${x},${z}`, { ground, top: roof >= 59 ? 60 : roof < 25 ? roof : 58 });
const at = (x, z) => plan.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz));

// the entrance: the middle three cells of the south face (the lowest, most open side of the site)
const southX = cells.filter(([x, z]) => at(x, z + 1) === undefined).map(([x]) => x).sort((a, b) => a - b);
const midX = southX[Math.floor(southX.length / 2)];
const entrance = new Set(southX.filter((x) => Math.abs(x - midX) <= 1).map((x) => `${x},24`));

const g = new Voxels([26, 72, 25]);
const lanterns = [];
const pane = (fc) => {
  // a pane joins its neighbours along the wall it sits in (north/south on x-facing walls, east/west otherwise)
  const alongZ = fc.some(([dx]) => dx !== 0);
  return ["light_blue_stained_glass_pane", { north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" }];
};

for (const [key, { ground, top }] of plan) {
  const [x, z] = key.split(",").map(Number);
  const fc = outward(x, z), edge = fc.length > 0, corner = fc.length >= 2, core = top === 60;
  const T = top - 1, nextSlab = Math.ceil(ground / 4) * 4;
  // piers every third cell along a face, always at corners; the shopfront-free rhythm reads as a grid from the air
  const along = fc.some(([dx]) => dx !== 0) ? z : x;
  const pier = corner || along % 3 === 0;
  for (let y = 0; y <= T; y++) {
    const cls = y < ground ? "found"
      : ground % 4 && y < nextSlab ? "base"
      : y === T ? "cap"
      : y === T - 1 ? "deck"
      : y % 4 === 0 ? "slab"
      : y % 4 === 3 ? "head" : "win";
    if (entrance.has(key) && y >= ground && y <= ground + 2 && y < T) { g.set(x, y, z, "light_blue_stained_glass"); continue; }
    if (!edge) {
      // interior: solid floors, roof deck and foundation; air between, behind the glass
      if (cls === "found" || cls === "base") g.set(x, y, z, "stone_bricks");
      else if (cls === "cap") g.set(x, y, z, "gray_concrete");
      else if (cls === "deck" || cls === "slab") g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // facade: a 1-block wall with an air gap behind it
    if (cls === "found" || cls === "base") g.set(x, y, z, "stone_bricks");
    else if (cls === "cap") g.set(x, y, z, "white_concrete");
    else if (cls === "deck") g.set(x, y, z, core && !pier ? "iron_bars" : "light_gray_concrete");
    else if (cls === "slab") g.set(x, y, z, "light_gray_concrete");
    else if (cls === "head") g.set(x, y, z, "white_concrete");
    else if (cls === "win") {
      if (pier) g.set(x, y, z, "white_concrete");
      else {
        const [pb, ps] = pane(fc);
        g.set(x, y, z, pb, ps);
        // some windows show a warm lantern in the room behind them (a standing lantern on the floor slab)
        if (y % 4 === 1 && ((x * 7 + z * 5 + y * 3) % 5) < 2) {
          const [dx, dz] = fc[0];
          lanterns.push([x - dx, y, z - dz]);
        }
      }
    }
  }
}

// lanterns go in after the walls: each stands on the floor slab of its own room
for (const [x, y, z] of lanterns) if (at(x, z) && !outward(x, z).length) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// the entrance lantern, just inside the middle of the south lobby
for (const k of entrance) {
  const [x, z] = k.split(",").map(Number), gy = plan.get(k).ground;
  if (at(x, z - 1) && !outward(x, z - 1).length) g.set(x, gy + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// plant boxes on the tower roof: two 2 x 2 x 2 units on interior cells of the 58 tier, sitting on its roof cap
let boxes = 0;
for (let x = 16; x <= 22 && boxes < 2; x++) for (let z = 10; z <= 18 && boxes < 2; z++) {
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([a, b]) => at(a, b)?.top === 58 && !outward(a, b).length)) continue;
  for (const [a, b] of cs) for (let y = 58; y <= 59; y++) g.set(a, y, b, "light_gray_concrete");
  boxes++; x += 2;
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_264868160.nbt");
