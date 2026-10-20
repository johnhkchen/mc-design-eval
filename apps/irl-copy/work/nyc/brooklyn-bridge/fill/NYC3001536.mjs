import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001536";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 21, D = 13;
const g = new Voxels([W, H, D]);

// Footprint lookup
const cm = new Map();
let G0 = Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(H - 1, gr));
  cm.set(`${x},${z}`, { gr: ground });
  G0 = Math.min(G0, ground);
}
const has = (x, z) => cm.has(`${x},${z}`);

// Smoothed massing: one flat roof about 9 blocks above the lowest ground
const R = Math.min(H - 1, G0 + 9);

// Storey pitch of 4: lintel at y%4==0, glass at y%4 = 2..3, sill at y%4==1
const PANE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const isWindowCol = (x) => x >= 1 && x <= 4;

// Exterior shell: foundation, walls, cornice, roof; interior holds only floor planks
for (const [key, { gr: rawGr }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.min(rawGr, R - 3);

  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const sideL = !has(x - 1, z);
  const sideR = !has(x + 1, z);
  const exterior = front || back || sideL || sideR;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < R; y++) {
    if (!exterior) {
      // Interior: floor planks per storey, ground floor and attic floor; air otherwise
      if (y === gr || y === R - 1 || y % 4 === 0) g.set(x, y, z, "spruce_planks");
      continue;
    }

    if (y === R - 1) { g.set(x, y, z, "smooth_stone"); continue; }     // cornice
    if (y === gr) { g.set(x, y, z, "brown_terracotta"); continue; }   // brownstone base course

    if (front || back) {
      if (y % 4 === 0) {
        g.set(x, y, z, "brown_terracotta");                            // lintel band
      } else if (y % 4 === 1) {
        g.set(x, y, z, isWindowCol(x) ? "brown_terracotta" : "bricks"); // sill
      } else if (isWindowCol(x)) {
        g.set(x, y, z, "glass_pane", PANE);                            // glazing
      } else {
        g.set(x, y, z, "bricks");                                      // piers
      }
    } else {
      // Party walls: plain brick
      g.set(x, y, z, "bricks");
    }
  }

  // Flat roof of dark tiles on the cornice
  g.set(x, R, z, "deepslate_tiles");
}

// Street entrance on the front, centre bay (x = 2): brownstone surround, oak door
for (const [key, { gr: rawGr }] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z - 1) || x !== 2) continue;
  const gr = Math.min(rawGr, R - 3);
  g.set(1, gr + 1, z, "brown_terracotta");
  g.set(3, gr + 1, z, "brown_terracotta");
  g.set(1, gr + 2, z, "brown_terracotta");
  g.set(3, gr + 2, z, "brown_terracotta");
  g.set(x, gr, z, "oak_door", { facing: "north", hinge: "left", half: "lower", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: "north", hinge: "left", half: "upper", open: "false", powered: "false" });
}

// Warm light glowing behind some street-front windows (interior side of the glass)
for (const [key, { gr: rawGr }] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (has(x, z - 1) || !isWindowCol(x) || !has(x, z + 1)) continue;
  const gr = Math.min(rawGr, R - 3);
  for (let y = gr + 1; y < R - 1; y++) {
    if (y % 4 === 2 && (x === 2 || x === 4)) g.set(x, y, z + 1, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
