import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169557";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 63, H = 33, D = 19;
const ROOF = 20;           // top roof deck occupies y = 20; parapet at y = 21
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pass 1: foundation, body shell, floors, windows, parapet, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const longFace = z === 0 || z === D - 1;      // faces that run along x
  const pillar = edge && (longFace ? x % 3 === 0 : z % 3 === 0);
  const paneProps = longFace
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = gr; y <= ROOF; y++) {
    const s = y % 5;

    if (y === ROOF) {
      g.set(x, y, z, edge ? "smooth_stone" : "stone_bricks");
      continue;
    }

    if (!edge) {
      // Interior: floor slabs at storey lines, occasional warm glow behind glass
      if (s === 0) g.set(x, y, z, "smooth_stone");
      else if (s === 2 && (x * 7 + y * 3 + z) % 13 === 0) g.set(x, y, z, "glowstone");
      continue;
    }

    // Facade cells
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }      // base course
    if (s === 0) { g.set(x, y, z, "smooth_stone"); continue; }        // storey line
    if (s === 4) { g.set(x, y, z, "white_concrete"); continue; }      // spandrel
    if (pillar) { g.set(x, y, z, "white_concrete"); continue; }       // mullion
    g.set(x, y, z, "glass_pane", paneProps);                          // window
  }

  // Parapet on perimeter, standing on the roof deck
  if (isEdge(x, z)) g.set(x, ROOF + 1, z, "white_concrete");
}

// Pass 2: entrance on the south (z = D-1) long face, near centre
if (has(31, D - 1)) {
  const gr = ground.get(`31,${D - 1}`);
  g.set(31, gr, D - 1, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(31, gr + 1, D - 1, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(31, gr + 2, D - 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 3: rooftop plant enclosure and mast, all on existing footprint cells
for (const [x, z, gr] of cells) {
  if (x >= 22 && x <= 40 && z >= 6 && z <= 12) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    if ((x + z) % 2 === 0) g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}
if (has(31, 9)) g.set(31, ROOF + 3, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
