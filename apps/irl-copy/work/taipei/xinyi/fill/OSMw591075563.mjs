import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075563.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw591075563.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 12, H = 20, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup and datum
const key = (x, z) => `${x},${z}`;
const S = new Map();
for (const [x, z, gr] of cells) S.set(key(x, z), gr);
const minG = Math.min(...cells.map((c) => c[2]));
const roofY = minG + 8;      // roof slab / parapet course, ~8 blocks above lowest ground
const floor1 = minG + 4;     // ground-floor / upper-floor slab and lintel line

// Door: centred on the south (+z) street front
const frontXs = cells
  .filter(([x, z]) => !S.has(key(x, z + 1)))
  .map(([x]) => x);
const doorX = frontXs.length
  ? Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2)
  : Math.floor(W / 2);

const faces = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const facingOf = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const near = (x, z) => faces.some(([dx, dz]) => S.has(key(x + dx, z + dz)) && !isPerim(x + dx, z + dz));
function isPerim(x, z) {
  return faces.some(([dx, dz]) => !S.has(key(x + dx, z + dz)));
}

for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc && y < H; y++) g.set(x, y, z, "stone_bricks");

  const edges = faces.filter(([dx, dz]) => !S.has(key(x + dx, z + dz)));
  const per = edges.length > 0;
  const corner = edges.length >= 2;
  const [edx, edz] = edges[0] ?? [0, 0];
  const t = edx !== 0 ? z : x;           // position along the face
  const front = edges.some(([dx, dz]) => dz === 1);
  const isDoor = per && front && !corner && x === doorX && gc + 2 < floor1;
  const lanternHere = !per && (x + z) % 4 === 0;

  for (let y = gc; y <= roofY && y < H; y++) {
    // Roof level
    if (y === roofY) {
      g.set(x, y, z, per ? "white_concrete" : "smooth_stone");
      continue;
    }
    // Interior: floor slabs only, air otherwise
    if (!per) {
      if (y === gc || y === floor1) g.set(x, y, z, "smooth_stone");
      else if (y === gc + 2 && y < floor1 && (x + z) % 3 === 0) g.set(x, y, z, "glowstone");
      else if (y === floor1 + 1 && lanternHere && near(x, z)) {
        g.set(x, y, z, "lantern", { hanging: "false" });
      }
      continue;
    }
    // Perimeter shell
    if (y === gc) { g.set(x, y, z, "stone_bricks"); continue; }     // base course
    if (y === floor1) { g.set(x, y, z, "stone_bricks"); continue; } // storey line / lintel
    if (y < floor1) {
      // Ground floor: shopfront
      if (isDoor && (y === gc + 1 || y === gc + 2)) {
        g.set(x, y, z, "oak_door", {
          facing: facingOf[`${edx},${edz}`] ?? "south",
          half: y === gc + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (corner || t % 4 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass_pane");
      continue;
    }
    // Upper storey: spandrel at top, windows between pillars
    if (y === roofY - 1) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (corner || t % 3 === 0) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "glass_pane");
  }

  // Roof equipment: a small plant box on the interior roof
  if (!per && roofY + 1 < H && x >= 4 && x <= 7 && z >= 5 && z <= 10) {
    g.set(x, roofY + 1, z, "light_gray_concrete");
    if (roofY + 2 < H && x >= 5 && x <= 6) g.set(x, roofY + 2, z, "light_gray_concrete");
  }
}

g.save(OUT);
