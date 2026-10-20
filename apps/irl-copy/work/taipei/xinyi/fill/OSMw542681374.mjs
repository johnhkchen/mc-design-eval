import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681374";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 9;
const TOP = 10;   // top course (cornice / roof deck); roof surface sits at y=11
const ROOF = 11;  // roof equipment level

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const maxX = Math.max(...cells.map(c => c[0]));
const maxZ = Math.max(...cells.map(c => c[1]));
const minZ = Math.min(...cells.map(c => c[1]));

// Street (front) face: the lowest-z row. Entrance at the middle of that row.
const frontCells = cells.filter(c => c[1] === minZ).sort((a, b) => a[0] - b[0]);
const doorX = frontCells[Math.floor(frontCells.length / 2)][0];
const lanternXs = new Set([doorX - 3, doorX + 3]);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const front = z === minZ;
  // Pilasters every 3 blocks, plus corners.
  const pier = edge && (x % 3 === 0 || x === maxX || z % 3 === 0 || z === maxZ);

  for (let y = gr; y <= TOP; y++) {
    const r = y - gr;

    if (y === TOP) {
      g.set(x, y, z, edge ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    if (r === 0) {
      // Base course on the outside, floor slab inside.
      g.set(x, y, z, edge ? "polished_granite" : "smooth_quartz");
      continue;
    }

    if (r % 5 === 0) {
      // Storey line / floor slab.
      g.set(x, y, z, edge ? "white_concrete" : "smooth_quartz");
      continue;
    }

    if (!edge) {
      // Warm light behind the street-facing upper windows.
      if (front === false && z === minZ + 1 && r % 5 >= 1 && r >= 6 && x % 4 === 2 && has(x, minZ)) {
        g.set(x, y, z, "glowstone");
      }
      continue; // air gap behind the glass
    }

    const band = r % 5;
    if (band === 4) {
      // Red tile spandrel.
      g.set(x, y, z, "red_terracotta");
      continue;
    }

    // Bands 1..3: window zone.
    if (front && x === doorX && (r === 1 || r === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (front && lanternXs.has(x) && r === 3) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (pier) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    g.set(x, y, z, "light_blue_stained_glass");
  }
}

// Roof equipment: a small plant block on the roof deck, central.
for (const [x, z] of cells) {
  if (!isEdge(x, z) && x >= 3 && x <= 5 && z >= 2 && z <= 4) {
    g.set(x, ROOF, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
