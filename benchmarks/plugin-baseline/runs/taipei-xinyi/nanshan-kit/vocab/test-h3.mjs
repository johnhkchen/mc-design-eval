// Smoke test for vocab/h3.mjs: each helper once on a small grid. Checks that it placed blocks, that every block it wrote
// lies inside the footprint it was given, and that it writes nothing over existing blocks (air only).
// Run: node vocab/test-h3.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h from "./h3.mjs";

const SIZE = [60, 60, 60];
const DATA_VERSION = 3955;   // DataVersion of 1.21.1
const within = ([x0, y0, z0, x1, y1, z1], [x, y, z]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// name -> [call on a grid, footprint box]
const cases = {
  chamferCorner: [(g) => h.chamferCorner(g, { x: 10, z: 10, sx: 1, sz: 1 }, 20, 22), [10, 20, 10, 17, 22, 17]],
  doorBay: [(g) => h.doorBay(g, [20, 4, 30], "north"), [19, 4, 30, 22, 7, 30]],
  crownGlow: [(g) => h.crownGlow(g, [20, 23, 26, 29].map((x) => ({ x, z: 20, face: "north" })), 40), [20, 40, 20, 29, 41, 21]],
  goldScreen: [(g) => h.goldScreen(g, [5, 9, 5, 25, 18, 25], "north", 2), [5, 9, 5, 25, 18, 7]],
  darkGlassBox: [(g) => h.darkGlassBox(g, [10, 30, 10, 30, 34, 30]), [10, 30, 10, 30, 36, 30]],
  planter: [(g) => h.planter(g, [30, 20, 30]), [30, 20, 30, 31, 21, 31]],
  atriumRoof: [(g) => h.atriumRoof(g, [40, 40, 52, 52], 20), [40, 19, 40, 52, 20, 52]],
  podiumFace: [(g) => h.podiumFace(g, [5, 2, 5, 25, 12, 15], "south"), [5, 2, 14, 25, 12, 15]],
  taperStep: [(g) => h.taperStep(g, 40, [10, 10, 30, 30]), [10, 40, 10, 30, 40, 30]],
  mast: [(g) => h.mast(g, [30, 40, 30]), [29, 40, 29, 31, 51, 31]],
};

let failures = 0;
for (const [name, [run, box]] of Object.entries(cases)) {
  const g = new Grid(SIZE, { dataVersion: DATA_VERSION });
  const placed = run(g);
  const written = [...g].filter((c) => c.block !== "minecraft:air");
  const strays = written.filter((c) => !within(box, c.pos));

  // Air only: the same footprint pre-filled with stone must take no writes.
  const taken = new Grid(SIZE, { dataVersion: DATA_VERSION });
  taken.fill([box[0], box[1], box[2]], [box[3], box[4], box[5]], "stone");
  const takenPlaced = run(taken);

  const ok = placed > 0 && placed === written.length && strays.length === 0 && takenPlaced === 0;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: placed ${placed}, strays ${strays.length}, into stone ${takenPlaced}`);
}

process.exitCode = failures ? 1 : 0;
console.log(failures ? `${failures} helper(s) failed` : "all helpers passed");
