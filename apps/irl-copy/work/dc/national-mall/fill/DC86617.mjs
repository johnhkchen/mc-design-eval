import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86617.cells.json", "utf8"));
const W = 15, H = 32, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => cellMap.has(key(x, z));
const minG = Math.min(...cells.map(c => c[2]));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Hamilton Hotel (1924): Beaux-Arts brick hotel on a stone base, stone belt courses,
// stone cornice and parapet. Storeys are 3 blocks, aligned to the lowest ground.
const STOREY = 3;

for (const [x, z, gr, rf0] of cells) {
  const top = Math.min(H - 1, Math.max(rf0, gr + 3)); // exclusive top
  const edge = isEdge(x, z);

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - minG;
    const floorLine = rel >= 0 && rel % STOREY === 0;
    const isGround = rel >= 0 && rel < STOREY;

    // Roof: parapet on the edge, roof deck inside
    if (y === top - 1) {
      g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // Cornice: projecting-looking stone band just under the parapet
    if (y === top - 2 && edge) {
      g.set(x, y, z, "chiseled_stone_bricks");
      continue;
    }
    // Floor slabs / stone belt courses
    if (floorLine) {
      g.set(x, y, z, edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!edge) {
      // Interior: air gap behind glass; a few lamps near the facade only
      const nearEdge = isEdge(x + 1, z) || isEdge(x - 1, z) || isEdge(x, z + 1) || isEdge(x, z - 1);
      if (!isGround && nearEdge && (x * 5 + y * 2 + z * 3) % 13 === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }
    if (isGround) {
      // Shopfront: base course, glazing in two-thirds of bays, piers between
      if (y === gr) g.set(x, y, z, "polished_andesite");
      else if ((x + z) % 3 === 0) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "glass_pane");
    } else {
      // Upper storeys: regular bays, two panes and one brick pier
      if ((x + z) % 3 === 0) g.set(x, y, z, "bricks");
      else g.set(x, y, z, "glass_pane");
    }
  }
}

// Entrance: on the lowest street-facing (min z) edge, nearest the middle.
const minZ = Math.min(...cells.map(c => c[1]));
const southEdge = cells.filter(([x, z]) => isEdge(x, z) && z === minZ);
if (southEdge.length) {
  const midX = (W - 1) / 2;
  southEdge.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
  const [dx, dz, dg] = southEdge[0];
  // Stone surround: pilasters either side, lintel above the door
  for (const ox of [-1, 1]) {
    if (has(dx + ox, dz)) {
      g.set(dx + ox, dg, dz, "chiseled_stone_bricks");
      g.set(dx + ox, dg + 1, dz, "chiseled_stone_bricks");
      g.set(dx + ox, dg + 2, dz, "stone_bricks");
    }
  }
  g.set(dx, dg + 2, dz, "stone_bricks");
  g.set(dx, dg, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dg + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86617.nbt");
