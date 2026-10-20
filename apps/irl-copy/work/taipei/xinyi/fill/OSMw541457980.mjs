import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source tags. Read as a two-storey (about 11 block) low-rise civic/commercial block of
// the 1980s-90s Taipei type: white ceramic-tiled walls, a granite-look plinth, tinted glass bands,
// a shopfront ground storey, a central entrance on the long north face, and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541457980";
const W = 43, H = 23, D = 24;
const TOP = 10;                       // top body layer; parapet cap sits here, roof ~11 blocks

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(TOP, Math.round(gr))));
}
const L = Math.min(...ground.values());          // lowest ground under the footprint (y 0 by rule)
const inside = (x, z) => ground.has(key(x, z));

// Only place blocks on footprint cells, within the volume.
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inside(x, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const ENTRY_X = 21;

for (const [k, gr0] of ground) {
  const [x, z] = k.split(",").map(Number);
  const gr = gr0 - 0;                                   // cell's own ground (absolute y)
  const xFace = !inside(x - 1, z) || !inside(x + 1, z); // exposed to east/west
  const zFace = !inside(x, z - 1) || !inside(x, z + 1); // exposed to north/south
  const per = xFace || zFace;
  const corner = xFace && zFace;
  const idx = xFace ? z : x;                            // position along the exposed face
  const pier = corner || idx % 3 === 0;
  const isEntry = z === 0 && x === ENTRY_X;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let y = gr; y <= TOP; y++) {
    // Floor / plinth at the cell's ground.
    if (y === gr) {
      put(x, y, z, per ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Entrance doorway on the north face (two-block door on the ground floor).
    if (isEntry && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (!per) {
      // Interior: floor slabs at storey lines and roof, air between (no interiors).
      if (y === 5) put(x, y, z, "smooth_stone");
      if (y === TOP) put(x, y, z, "gray_concrete");
      // Warm lights in the interior, on a grid.
      if (y === 3 || y === 8) {
        if (x % 6 === 3 && z % 6 === 3) put(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter: horizontal courses.
    if (y === TOP) { put(x, y, z, "light_gray_concrete"); continue; }   // parapet cap
    if (y === 5) { put(x, y, z, "light_gray_concrete"); continue; }     // storey line / cornice

    if (y === 1) {                                                      // ground kickplate
      put(x, y, z, pier ? "white_concrete" : "polished_andesite");
      continue;
    }
    if (y === 6) {                                                      // upper spandrel
      put(x, y, z, pier ? "white_concrete" : "smooth_quartz");
      continue;
    }

    // Window zones: storey 1 (2..4) is shopfront glass, storey 2 (7..9) is glass panes.
    const ground1 = y >= 2 && y <= 4;
    const ground2 = y >= 7 && y <= 9;
    if (ground1 || ground2) {
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      if (ground1) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }
    put(x, y, z, "smooth_quartz");
  }
}

// Rooftop plant: a stepped mechanical box and a lower side unit, on the roof slab.
for (let x = 12; x <= 18; x++)
  for (let z = 8; z <= 14; z++) put(x, 11, z, "light_gray_concrete");
for (let x = 14; x <= 16; x++)
  for (let z = 10; z <= 12; z++) put(x, 12, z, "white_concrete");
for (let x = 26; x <= 30; x++)
  for (let z = 9; z <= 13; z++) put(x, 11, z, "gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
