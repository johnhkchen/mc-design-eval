import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690445";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Vertical layout (block indices; roof surface is y = ROOF + 1 = 11)
const ROOF = 10;     // top solid course (parapet cap / roof deck)
const FLOOR = 5;     // upper storey slab / storey line
const FASCIA = 4;    // ground storey top band
const GF_TOP = 3;    // last ground storey window/shop row

// Footprint lookup: key "x,z" -> ground height (clamped)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(Math.round(gr), ROOF - 1)));
}
const has = (x, z) => ground.has(`${x},${z}`);

// Which outward face a perimeter cell sits on, and its position along that face
function faceOf(x, z) {
  if (!has(x, z - 1)) return { dir: "north", u: x };
  if (!has(x, z + 1)) return { dir: "south", u: x };
  if (!has(x - 1, z)) return { dir: "west", u: z };
  if (!has(x + 1, z)) return { dir: "east", u: z };
  return null;
}

// Inward offset for a face (into the building)
const INWARD = {
  north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  for (let y = gr; y <= ROOF; y++) {
    // Roof / parapet course
    if (y === ROOF) {
      g.set(x, y, z, face ? "white_concrete" : "gray_concrete");
      continue;
    }

    // Upper storey slab (storey line)
    if (y === FLOOR) {
      g.set(x, y, z, face ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    // Fascia band between ground and upper storey
    if (y === FASCIA) {
      if (face) g.set(x, y, z, "smooth_stone");
      continue; // interior air
    }

    if (!face) continue; // interior: air gap, no interiors

    const { dir, u } = face;
    const isPillar = u === 0 || u === 16 || u % 3 === 0;

    if (y <= GF_TOP) {
      // Ground-floor shopfront
      const doorCol = dir === "south" && u === 8;
      if (doorCol && y <= gr + 1 && gr + 1 <= GF_TOP) {
        const half = y === gr ? "lower" : "upper";
        g.set(x, y, z, "oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (u % 4 === 0 || u === 0 || u === 16) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    // Upper storey: y 6..8 window band, y 9 spandrel
    if (y === 9) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // y 6..8
    if (isPillar) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", PANE);
      // Warm light behind some windows, one block inside the glass
      if (y === 7 && (u === 2 || u === 8 || u === 14)) {
        const [ix, iz] = INWARD[dir];
        if (has(x + ix, z + iz)) g.set(x + ix, y, z + iz, "glowstone");
      }
    }
  }

  // Parapet cap keeps a clear roof edge on perimeter; interior roof deck already set
  // Rooftop plant box on the central cells
  if (!face && x >= 7 && x <= 9 && z >= 7 && z <= 9) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// Rooftop vent cap on the plant box
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!faceOf(x, z) && x === 8 && z === 8) {
    g.set(x, ROOF + 3, z, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
