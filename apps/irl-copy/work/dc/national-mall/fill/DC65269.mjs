import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 10 x 3 footprint, 24 m x 7 m at 0.42 blocks/m, with lidar roofs 11-13 above y 0. Read as a Federal Triangle-style
// limestone office block (1930s, Neoclassical): a rusticated-free plinth, five storeys of window bands over a 2-block
// storey rhythm, a six-storey central pavilion with a portico, and a lower east wing that steps down. The lidar's
// roof noise is smoothed into three flat tiers: 12 (body), 13 (pavilion, x 3..6), 11 (east wing, x 9).
// Storeys are 2 blocks (about 4.8 m at this scale), so the window rows are 1 block tall, framed by string courses.
// The front (z = 0) has a notch at x = 3 (not in the footprint): it reads as a light well, its back wall at z = 1 glazed.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65269.cells.json`, "utf8"));

const W = 10, H = 25, D = 3;
const g = new Voxels([W, H, D]);

const onFootprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => onFootprint.has(`${x},${z}`);
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, Math.max(0, Math.round(gr))]));

const H_BODY = 12, H_PAVILION = 13, H_WING = 11;
const tier = (x) => (x >= 3 && x <= 6 ? H_PAVILION : x === 9 ? H_WING : H_BODY);

const BASE = "stone_bricks";
const WALL = "calcite";
const BAND = "chiseled_stone_bricks";
const GLASS = "glass_pane";
const SOLID_GLASS = "glass";
const LAMP = "glowstone";
const LANTERN = "shroomlight";
const DOOR = "dark_oak_door";

const PANE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const isFloor = (y) => y >= 2 && y <= 10 && y % 2 === 0;       // storey lines (string course / floor slab)
const isWindowRow = (y, H_) => y >= 1 && y < H_ - 1 && y % 2 === 1;
const isPier = (x) => x === 0 || x === 3 || x === 6 || x === 9;

// the warm lights behind glass (x, y, z=1): ground-floor, mid, and in the pavilion attic
const LAMPS = [[1, 1, 1, LAMP], [7, 3, 1, LAMP], [2, 5, 1, LAMP], [8, 9, 1, LAMP], [4, 11, 1, LANTERN]];

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!has(x, z)) continue;
    const Hc = tier(x);
    const gr = ground.get(`${x},${z}`);

    // foundation below the ground line (ground is 0 here, so none) and the plinth at y 0
    for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);
    for (let y = gr; y < Hc; y++) {
      const edge = z !== 1;                       // z = 0 and z = 2 are the facades; z = 1 is the core
      let block = null, state = null;

      const entrance = z === 0 && (x === 4 || x === 5) && (y === 1 || y === 2);
      if (y === 0) block = BASE;                  // plinth course
      else if (y === Hc - 1) block = BAND;        // cornice on the roof deck
      else if (entrance) {
        // the entrance: a double door under the pavilion, hinged at its outer edges
        block = DOOR;
        state = { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" };
      } else if (isFloor(y)) block = BAND;        // string course at facades, floor slab in the core
      else if (!edge) {                            // the core: air gap behind the glass, a glowstone or lantern here and there
        if (x === 3 && isWindowRow(y, Hc)) block = SOLID_GLASS;   // light-well back wall, glazed
        else block = null;
      } else if (isWindowRow(y, Hc)) {
        if (isPier(x)) block = WALL;
        else { block = GLASS; state = { ...PANE }; }
      } else block = WALL;                        // pier and spandrel course

      if (block) g.set(x, y, z, block, state);
    }
  }
}

// warm lights in the core behind the glazed bays
for (const [x, y, z, b] of LAMPS) if (has(x, z) && y < tier(x) - 1) g.set(x, y, z, b);

const stats = g.save(`${DIR}/DC65269.nbt`);
console.log("saved DC65269.nbt", stats);
