import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~11 blocks above lowest ground, so a two-storey
// 1980s-style commercial block: pale tiled/concrete walls, red terracotta cornice,
// a glazed shopfront at street level, a parapet, and a roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407482";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 14;
const TOP_PARAPET = 11;   // parapet course
const CAP = 12;           // coping slab

const g = new Voxels([W, H, D]);

// Ground per footprint cell, clamped so storey lines stay above it.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), 9));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const exposed = (x, z) => ({
  w: !has(x - 1, z),
  e: !has(x + 1, z),
  n: !has(x, z - 1),
  s: !has(x, z + 1),
});

// Street entrance: middle of the south face (z = max), chosen from the footprint itself.
const southXs = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

// Interior cells that touch the perimeter ring get warm lights behind the glass.
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.w || e.e || e.n || e.s;
};

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gr = gnd(x, z);
  const e = exposed(x, z);
  const per = e.w || e.e || e.n || e.s;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (per) {
    // Pier on alternating bays along the exposed face.
    const idx = (e.w || e.e) ? z : x;
    const pier = idx % 3 === 0;
    const isEntrance = e.s && x === entranceX && z === D - 1;

    for (let y = gr; y <= CAP; y++) {
      if (y === gr) {
        g.set(x, y, z, "stone_bricks");                       // base course
      } else if (y <= 3) {                                      // ground-floor shopfront
        if (isEntrance && (y === gr + 1 || y === gr + 2) && gr + 2 <= 3) {
          g.set(x, y, z, "oak_door", {
            facing: "south",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else {
          g.set(x, y, z, pier ? "smooth_quartz" : "glass_pane");
        }
      } else if (y === 4) {
        g.set(x, y, z, "smooth_stone");                        // shopfront lintel
      } else if (y === 5) {
        g.set(x, y, z, "smooth_stone");                        // storey string course
      } else if (y === 6 || y === 9) {
        g.set(x, y, z, "smooth_quartz");                       // spandrels
      } else if (y === 7 || y === 8) {
        g.set(x, y, z, pier ? "smooth_quartz" : "glass_pane"); // upper windows
      } else if (y === 10) {
        g.set(x, y, z, "red_terracotta");                      // cornice
      } else if (y === TOP_PARAPET) {
        g.set(x, y, z, "smooth_quartz");                       // parapet
      } else if (y === CAP) {
        g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  } else {
    // Interior: floor slabs and roof deck, air gaps between.
    if (gr < 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, 10, z, "smooth_stone");
    g.set(x, TOP_PARAPET, z, "light_gray_concrete");

    // Roof plant: small boxes on a grid.
    if (x % 6 === 3 && z % 5 === 2) {
      g.set(x, TOP_PARAPET + 1, z, "iron_block");
    }

    // Warm light just behind a window on the upper floor.
    const nearPerim = isPerim(x - 1, z) || isPerim(x + 1, z) || isPerim(x, z - 1) || isPerim(x, z + 1);
    if (nearPerim && gr < 7 && (x + 2 * z) % 7 === 0) {
      g.set(x, 7, z, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
