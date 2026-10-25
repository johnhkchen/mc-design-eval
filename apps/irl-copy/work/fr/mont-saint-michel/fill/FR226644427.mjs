import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR226644427";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 22, D = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr, rf] of cells) {
  fp.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => fp.has(key(x, z));
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth roof heights over the 3x3 neighbourhood
const cellsXZ = [...fp.keys()].map((k) => k.split(",").map(Number));
const smoothRoof = (x, z) => {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (has(x + dx, z + dz)) {
        sum += fp.get(key(x + dx, z + dz)).rf;
        n++;
      }
    }
  }
  return sum / n;
};

// Door: southern-most (max z) perimeter cell nearest x = 8
let doorZ = -Infinity;
for (const [, z] of cellsXZ) if (z > doorZ) doorZ = z;
let doorX = -1, bestD = Infinity;
for (const [x, z] of cellsXZ) {
  if (z === doorZ && Math.abs(x - 8) < bestD) { bestD = Math.abs(x - 8); doorX = x; }
}

// Per-cell massing: whole storeys, stepped from the smoothed lidar roof
const info = new Map();
for (const [x, z] of cellsXZ) {
  const { gr } = fp.get(key(x, z));
  const avg = smoothRoof(x, z);
  let s = Math.round((avg - gr) / 5);
  s = Math.max(1, Math.min(4, s));
  const cap = Math.min(20, gr + 5 * s); // top surface row of the building
  info.set(key(x, z), { x, z, gr, cap, perim: isPerim(x, z) });
}

for (const c of info.values()) {
  const { x, z, gr, cap, perim } = c;

  // Foundation in granite up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");

  // Solid column from the ground to the cap: nothing floats
  for (let y = gr; y <= cap; y++) {
    const r = (y - gr) % 5;
    if (y === cap) {
      // Roof: parapet ring on the perimeter, slate across the interior
      g.set(x, y, z, perim ? "stone_bricks" : "deepslate_tiles");
      continue;
    }
    if (r === 0) {
      // Storey floor / belt course
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (!perim) {
      // Interior core: solid, no air pockets under the roof
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    // Facade: window grid of panes with stone piers, sill/lintel row
    if (r >= 1 && r <= 3) {
      const glass = (x + z) % 2 === 0;
      if (glass && (x * 3 + z + (y - gr)) % 7 === 0) {
        g.set(x, y, z, "glowstone"); // warm glow in a few windows
      } else {
        g.set(x, y, z, glass ? "glass_pane" : "stone_bricks");
      }
    } else {
      g.set(x, y, z, "chiseled_stone_bricks");
    }
  }

  // Cornice: a slab course under the parapet on the perimeter
  if (perim && cap - 1 > gr) {
    g.set(x, cap - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Entrance on the south face: door, surround, lintel
const dc = info.get(key(doorX, doorZ));
if (dc) {
  const dy = dc.gr + 1;
  g.set(doorX, dy, doorZ, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dy + 1, doorZ, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  for (const dx of [-1, 1]) {
    const nx = doorX + dx;
    if (has(nx, doorZ)) {
      g.set(nx, dy, doorZ, "chiseled_stone_bricks");
      g.set(nx, dy + 1, doorZ, "chiseled_stone_bricks");
    }
  }
  g.set(doorX, dy + 2, doorZ, "chiseled_stone_bricks");
  // Stone step in front of the door, on the ground outside the footprint if free
  if (dc.gr >= 0) {
    g.set(doorX, dc.gr, doorZ, "stone_brick_stairs", {
      facing: "north", half: "bottom", shape: "straight", waterlogged: "false",
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);
