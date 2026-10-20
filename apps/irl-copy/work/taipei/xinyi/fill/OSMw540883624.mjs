import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883624";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Lookup of footprint cells -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Entrance: on the south (+z) face, the candidate closest to the centre line
const CX = (W - 1) / 2;
let entrance = null;
{
  let maxZ = -1;
  const cand = [];
  for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
    if (!has(x, z + 1)) cand.push([x, z]);
  }
  for (const [, z] of cand) maxZ = Math.max(maxZ, z);
  const row = cand.filter(([, z]) => z === maxZ);
  row.sort((a, b) => Math.abs(a[0] - CX) - Math.abs(b[0] - CX));
  if (row.length) entrance = row[0];
}

for (const [x, z, gr] of cells) {
  const ew = !has(x + 1, z) || !has(x - 1, z);   // east/west facing edge
  const ns = !has(x, z + 1) || !has(x, z - 1);   // north/south facing edge
  const perim = ew || ns;
  const corner = ew && ns;
  // Window-grid mullions every 3 blocks along each facade
  const mull = corner || (ew ? z % 3 === 0 : x % 3 === 0);
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

  // Foundation: fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Above 10 nothing is built (roof is at 10-11)
  if (gr > 10) continue;

  for (let y = gr; y <= 11; y++) {
    // Roof slab over every footprint cell
    if (y === 10) {
      g.set(x, y, z, perim ? "smooth_stone" : "stone");
      continue;
    }
    // Parapet and roof equipment
    if (y === 11) {
      if (perim) g.set(x, y, z, "smooth_stone");
      else if (x % 6 === 3 && z % 6 === 3) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Interior: floor slabs, optional warm lights, otherwise air
    if (!perim) {
      if (y === gr || y === 5) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (x % 6 === 3 && z % 6 === 3) {
        if ((y === gr + 1 && gr + 1 < 5) || y === 6) g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter shell
    if (y === gr) {
      g.set(x, y, z, "stone_bricks"); // base course
    } else if (y < 5) {
      // Ground floor: shopfront with entrance
      if (isEntrance && (y === gr + 1 || y === gr + 2) && y < 4) {
        g.set(x, y, z, "oak_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (y === 4) {
        g.set(x, y, z, "smooth_stone");
      } else if (mull) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (y === 4) {
      g.set(x, y, z, "smooth_stone"); // lintel band
    } else if (y === 5) {
      g.set(x, y, z, "white_concrete"); // storey line
    } else if (y <= 8) {
      g.set(x, y, z, mull ? "white_concrete" : "glass_pane");
    } else if (y === 9) {
      g.set(x, y, z, "smooth_stone"); // cornice
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
