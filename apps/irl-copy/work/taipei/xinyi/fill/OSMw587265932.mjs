import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265932";
const W = 2, H = 33, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Ground map keyed "x,z"; base level G is the lowest ground under the footprint.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const G = Math.min(...[...ground.values()]);
const TOP = G + 20;            // roof parapet top block (~21 blocks above lowest ground)

const GLASS = "light_blue_stained_glass_pane";
const SLAB = "white_concrete";  // floor slab / spandrel lines
const TRIM = "smooth_quartz";   // sills, heads, cornice
const BASE = "polished_granite";
const SIGN = "polished_andesite";
const FOUND = "stone_bricks";

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const gr = ground.has(`${x},${z}`) ? ground.get(`${x},${z}`) : G;

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

    // Facade and structure from this cell's ground up to the roof.
    for (let y = gr; y <= TOP; y++) {
      const rel = y - G;
      const end = z === 0 || z === D - 1;

      // Shopfront door at street-facing east face (x=1), centre of frontage.
      if (x === 1 && z === 5 && (y === gr || y === gr + 1) && rel <= 4) {
        put(x, y, z, "oak_door", {
          facing: "east",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // Cornice and parapet cap.
      if (rel === TOP - G) { put(x, y, z, TRIM); continue; }
      if (rel === TOP - G - 1) { put(x, y, z, SLAB); continue; }

      // Ground storey: base course, glazed shopfront, sign fascia.
      if (rel <= 4) {
        if (rel === 0) { put(x, y, z, BASE); continue; }
        if (rel === 4) { put(x, y, z, SIGN); continue; }
        if (end) { put(x, y, z, SLAB); continue; }
        put(x, y, z, "glass");
        continue;
      }

      // Upper storeys: floor slabs every 5 blocks, sill/head lines, window grid.
      const r5 = (rel - 5) % 5;
      if (r5 === 0) { put(x, y, z, SLAB); continue; }
      if (r5 === 4) { put(x, y, z, TRIM); continue; }
      if (end) { put(x, y, z, SLAB); continue; }
      const mullion = z % 2 === 0;
      if (mullion) { put(x, y, z, TRIM); continue; }

      // Warm lit windows behind the glass on the west-facing column.
      const storey = Math.floor((rel - 5) / 5);
      if (x === 0 && r5 === 2 && (z === 3 || z === 7) && (storey === 1 || storey === 3)) {
        put(x, y, z, "glowstone");
        continue;
      }
      put(x, y, z, GLASS);
    }
  }
}

// Roof equipment: a plant box on the middle of the roof and a short mast.
for (let x = 0; x < W; x++) {
  for (let z = 4; z <= 6; z++) {
    for (let y = TOP + 1; y <= TOP + 2; y++) {
      put(x, y, z, "light_gray_concrete");
    }
  }
}
put(1, TOP + 1, 5, "iron_bars");
for (let y = TOP + 3; y <= TOP + 4; y++) put(0, y, 5, "chain");

g.save(`${DIR}/${ID}.nbt`);
