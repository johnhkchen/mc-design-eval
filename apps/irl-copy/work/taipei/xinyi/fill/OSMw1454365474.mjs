import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1454365474";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, D = 16, H = 23;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground per cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map(c => c[2]));
// Two storeys of ~5 blocks, parapet cap; roof surface at minG + 11
const F1 = minG + 5;     // second-floor line
const R = minG + 11;     // roof deck top (roof slab occupies R-1)

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter test and which face(s) a perimeter cell sits on
const faceZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const faceX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isPerim = (x, z) => faceZ(x, z) || faceX(x, z);

const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const fz = faceZ(x, z);
  const fx = faceX(x, z);
  // Along-facade index: x on north/south faces, z on east/west faces
  const along = fz && !fx ? x : (fx && !fz ? z : x + z);
  const corner = fz && fx;
  const pillar = corner || along % 4 === 0;

  // Floor at the cell's ground
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  if (perim) {
    for (let y = gr + 1; y <= R - 2; y++) {
      if (y === F1) {
        put(x, y, z, "smooth_quartz");                      // storey string course
      } else if (y < F1) {
        // Ground storey: shopfront
        if (y === F1 - 1) {
          put(x, y, z, "red_terracotta");                   // signage / awning band
        } else if (z === 0 && x === 5 && (y === gr + 1 || y === gr + 2)) {
          put(x, y, z, "oak_door", {
            facing: "north",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (pillar) {
          put(x, y, z, "quartz_pillar", { axis: "y" });
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", fz && !fx ? PANE_Z : PANE_X);
        }
      } else {
        // Upper storey
        if (y === R - 2) {
          put(x, y, z, "quartz_block");                     // cornice
        } else if (along % 2 === 1 && !corner) {
          put(x, y, z, "light_blue_stained_glass_pane", fz && !fx ? PANE_Z : PANE_X);
        } else {
          put(x, y, z, "white_terracotta");
        }
      }
    }
    // Parapet cap on the roof line
    put(x, R - 1, z, "stone_bricks");
  } else {
    // Interior: only floor slabs and roof deck, air between
    put(x, F1, z, "smooth_stone");
    put(x, R - 1, z, "light_gray_concrete");
  }
}

// Warm lights behind glass: lanterns in the shopfront, shroomlights upstairs
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (z === 1 && (x === 3 || x === 7)) {
    put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    put(x, F1 + 2, z, "shroomlight");
  }
}

// Roof plant box on the roof, if the footprint allows it
let plantOk = true;
for (let x = 3; x <= 6; x++) for (let z = 5; z <= 9; z++) if (!has(x, z)) plantOk = false;
if (plantOk) {
  for (let x = 3; x <= 6; x++) for (let z = 5; z <= 9; z++) {
    put(x, R, z, "white_terracotta");
    put(x, R + 1, z, "white_terracotta");
  }
  for (let x = 4; x <= 5; x++) for (let z = 6; z <= 8; z++) put(x, R + 2, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
