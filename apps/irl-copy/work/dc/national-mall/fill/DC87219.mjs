import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87219.cells.json`, "utf8"));

const W = 6, H = 20, D = 6;
const g = new Voxels([W, H, D]);

// Building-level datums: lowest ground anchors the storey lines, mean lidar roof gives a flat roof.
const G0 = Math.min(...cells.map(c => c[2]));
const R = Math.round(cells.reduce((s, c) => s + c[3], 0) / cells.length);

// Vacant brick commercial block, c.1900: two storeys under a stone cornice.
// Storeys are 3 blocks: ground shopfront (G0+1..2), belt G0+3, upper (G0+4..5), belt G0+6, cornice at R-1.

function paneProps(face) {
  if (face === "x") {
    return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  }
  return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

for (const [x, z, gr, rr] of cells) {
  const isEdgeX = x === 0 || x === W - 1;
  const isEdgeZ = z === 0 || z === D - 1;
  const perim = isEdgeX || isEdgeZ;
  const corner = isEdgeX && isEdgeZ;
  const top = R - 1;

  // Foundation under the cell up to its own ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs at each storey line and a roof deck; the rest is air.
    if (gr < H) g.set(x, gr, z, "oak_planks");
    for (let y = gr + 1; y <= top; y++) {
      if (y === top) g.set(x, y, z, "smooth_stone");
      else if (y > G0 && (y - G0) % 3 === 0) g.set(x, y, z, "oak_planks");
    }
    continue;
  }

  // Perimeter shell.
  g.set(x, gr, z, "smooth_stone"); // base course

  let face = null, i = null;
  if (!corner) {
    if (isEdgeX) { face = "x"; i = z; } else { face = "z"; i = x; }
  }

  for (let y = gr + 1; y <= top; y++) {
    const rel = y - G0;
    if (y === top) { g.set(x, y, z, "smooth_stone"); continue; }          // cornice
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }            // corner piers

    // Storey belt; over the entrance it becomes a dark stone lintel slab.
    if (rel > 0 && rel % 3 === 0) {
      if (face === "z" && z === D - 1 && i >= 1 && i <= 3) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else {
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }

    const ground = rel === 1 || rel === 2;
    if (ground) {
      // Shopfront, boarded for vacancy; door on the south (z=5) face.
      if (face === "z" && z === D - 1 && i === 2) {
        const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
        if (rel === 1) g.set(x, y, z, "oak_door", { ...props, half: "lower" });
        else g.set(x, y, z, "oak_door", { ...props, half: "upper" });
        continue;
      }
      if (i === 2 || i === 3) g.set(x, y, z, "glass_pane", paneProps(face));
      else g.set(x, y, z, "oak_planks");
      continue;
    }

    // Upper storeys: brick piers between paired windows.
    if (i === 2 || i === 3) g.set(x, y, z, "glass_pane", paneProps(face));
    else g.set(x, y, z, "bricks");
  }
}

// Warm lights behind upper glass, on both the street (south) and rear faces.
if (G0 + 4 < R - 1) {
  g.set(2, G0 + 4, 4, "glowstone");
  g.set(3, G0 + 4, 1, "glowstone");
}

// Small rooftop HVAC unit on the roof deck.
if (R < H) {
  g.set(2, R, 2, "copper_block");
  g.set(2, R, 3, "copper_block");
}

g.save(`${DIR}/DC87219.nbt`);
