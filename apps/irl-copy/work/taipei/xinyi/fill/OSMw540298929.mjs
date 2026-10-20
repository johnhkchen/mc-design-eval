import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298929";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 30, H = 23, D = 45;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => x + "," + z;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const inside = (x, z) => foot.has(key(x, z));
const edge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Roof sits 11 blocks above the lowest ground: top block at gMin + 10
const gMin = Math.min(...cells.map(c => c[2]));
const TOP = gMin + 10;

// Character: 1980s-90s Xinyi-style commercial block, two storeys over a
// granite base, white tiled piers, blue glass bays, stone cornice, plant on roof.
const WALL = "white_concrete";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass_pane";
const BASE = "polished_granite";
const FASCIA = "smooth_stone";
const BAND = "smooth_quartz";
const CAP = "smooth_stone";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOF = "gray_concrete";
const EQUIP = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const p = x + z;

  if (edge(x, z)) {
    // Facade: rel r = height above this cell's ground
    for (let y = gr; y <= TOP; y++) {
      const r = y - gr;
      let id = null;
      let props = undefined;

      if (r === 0) {
        id = BASE;
      } else if (r <= 3) {
        const entrance = (p % 15 === 7);
        if (entrance) {
          if (r === 1) continue; // open doorway
          if (r === 2) { id = "lantern"; props = { hanging: "true" }; }
          if (r === 3) id = "dark_oak_planks"; // lintel
        } else if (p % 3 === 0) {
          id = PIER;
        } else {
          id = SHOP;
        }
      } else if (r === 4) {
        id = FASCIA;
      } else if (r === 5) {
        id = BAND;
      } else if (r >= 6 && r <= 8) {
        if (p % 3 === 0) id = PIER;
        else if (r === 7 && p % 9 === 4) id = "glowstone"; // warm lit bay
        else id = GLASS;
      } else if (r === 9) {
        id = BAND;
      } else if (r === 10) {
        id = CAP; // parapet cap
      }

      if (id) g.set(x, y, z, id, props);
    }
  } else {
    // Interior cell: ground floor slab, storey slab, roof membrane
    g.set(x, gr, z, FLOOR);
    if (gr + 5 <= TOP) g.set(x, gr + 5, z, FLOOR);
    if (TOP >= gr) g.set(x, TOP, z, ROOF);
  }
}

// Roof equipment on interior roof cells (two-high plant boxes, sparse)
for (const [x, z] of cells) {
  if (edge(x, z)) continue;
  if (((x * 7 + z * 3) % 23) !== 0) continue;
  if (TOP + 2 >= H) continue;
  g.set(x, TOP + 1, z, EQUIP);
  g.set(x, TOP + 2, z, EQUIP);
}

g.save(`${DIR}/${ID}.nbt`);
