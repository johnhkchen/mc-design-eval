import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1339244513";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 6, H = 19, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => `${x},${z}`;
const cellG = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => cellG.has(key(x, z));
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const minG = Math.min(...cells.map(c => c[2]));
const maxG = Math.max(...cells.map(c => c[2]));

// Roof about 7 blocks above lowest ground; clamp so parapet fits in world height
const roofY = Math.min(maxG + 7, 17);

// Storey lines: ground floor ~4 blocks tall, then 4-block storeys (about 5 blocks each read as storeys)
const firstLine = minG + 4;
const lines = [];
for (let L = firstLine; L < roofY; L += 4) lines.push(L);
const isLine = y => lines.includes(y);

// Entrance: edge cell on the lowest z side (street face), middle of that run
const edges = cells.filter(([x, z]) => isEdge(x, z));
let door = null;
if (edges.length) {
  const minZ = Math.min(...edges.map(c => c[1]));
  const row = edges.filter(c => c[1] === minZ).sort((a, b) => a[0] - b[0]);
  door = row[Math.floor(row.length / 2)];
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const pier = (x + z) % 2 === 1;

  for (let y = gr; y < roofY; y++) {
    let b = null;

    if (y === gr) {
      b = edge ? "polished_granite" : "smooth_stone";            // base course / ground slab
    } else if (isLine(y)) {
      b = "smooth_quartz";                                        // storey line / cornice band
    } else if (y === roofY - 1 && edge) {
      b = "smooth_quartz";                                        // top course under parapet
    } else if (edge) {
      const ground = y < firstLine;
      if (ground) {
        b = pier ? "polished_andesite" : "glass";                 // shopfront bays with piers
      } else {
        b = pier ? "white_concrete" : "glass_pane";              // window grid with frames
      }
    } else {
      // Interior: air gap behind glass, with warm lights in some windows
      const band = y >= firstLine && (y - firstLine) % 4 !== 3;
      if (band && (x * 5 + z * 3 + y) % 4 === 0) b = "glowstone";
    }

    if (b) g.set(x, y, z, b);
  }

  // Entrance door and canopy on the street face
  if (door && x === door[0] && z === door[1] && gr < roofY) {
    if (gr + 1 < roofY) {
      g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    if (gr + 3 < firstLine) {
      g.set(x, gr + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }

  // Parapet on the edge, roof slab, rooftop equipment
  if (edge && roofY + 1 < H) g.set(x, roofY + 1, z, "stone_brick_wall");
  if (roofY < H) g.set(x, roofY, z, "light_gray_concrete");
  if (!edge && roofY + 1 < H && (x * 2 + z) % 5 === 0) g.set(x, roofY + 1, z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
