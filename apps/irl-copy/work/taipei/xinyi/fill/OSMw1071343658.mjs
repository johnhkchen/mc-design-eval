import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial block, c.1990s-2000s Xinyi: white tiled concrete frame,
// glazed shopfront at grade, two storeys of window bays, quartz cornice,
// flat roof with plant room and lightning rod. Roof top sits at y = 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343658";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, D = 14, H = 23;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(8, gy)));

const inside = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// inward direction for an edge cell (used to light rooms behind the glass)
function inward(x, z) {
  if (z === 0) return [0, 1];
  if (z === D - 1) return [0, -1];
  if (x === 0) return [1, 0];
  if (x === W - 1) return [-1, 0];
  return null;
}

// position along the facade, for bay rhythm
const along = (x, z) => (z === 0 || z === D - 1 ? x : z);

// entrance: two bays on the north (z = 0) face
const isEntrance = (x, z) => z === 0 && (x === 14 || x === 15);

// place a block only inside the footprint and above that cell's ground
function put(x, y, z, id, props) {
  const gy = ground.get(`${x},${z}`);
  if (gy === undefined || y < gy) return;
  g.set(x, y, z, id, props);
}

// 1. foundations, base course and floor slab at grade
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
  const edge = isEdge(x, z);
  put(x, gy, z, edge ? "stone_bricks" : "smooth_stone");
}

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const a = along(x, z);
  const inw = inward(x, z);
  const bayPillar = a % 3 === 0;

  // 2. ground floor shopfront: y gy+1 .. gy+4 (slab at y 5 caps it)
  if (edge) {
    for (let y = gy + 1; y <= 4; y++) {
      if (isEntrance(x, z)) {
        if (y <= gy + 2) {
          // doorway
          const half = y === gy + 1 ? "lower" : "upper";
          if (x === 14) put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "oak_door", { facing: "north", half, hinge: "right", open: "false", powered: "false" });
        } else {
          put(x, y, z, "white_concrete"); // lintel over the entrance
        }
      } else if (bayPillar || a % 6 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
      }
    }
    // warm interior light behind some shopfront glass
    if (inw && a % 6 === 4 && !isEntrance(x, z) && gy + 2 <= 4) {
      put(x + inw[0], gy + 2, z + inw[1], "glowstone");
    }
  }

  // 3. storey slab / belt course at y = 5, all footprint cells
  put(x, 5, z, edge ? "white_concrete" : "smooth_stone");

  // 4. upper storey: y 6..9, window bays with mullions
  if (edge) {
    for (let y = 6; y <= 9; y++) {
      if (bayPillar) put(x, y, z, "white_concrete");
      else if (y === 9) put(x, y, z, "white_concrete"); // head band
      else put(x, y, z, "glass_pane");
    }
    if (inw && a % 3 === 1) {
      put(x + inw[0], 7, z + inw[1], a % 6 === 4 ? "shroomlight" : "glowstone");
    }
  }

  // 5. roof: cornice band at y = 10 on the edge, roof deck inside
  if (edge) {
    put(x, 10, z, "quartz_block");
    put(x, 11, z, "white_concrete"); // parapet cap, roof top at y 11
  } else {
    put(x, 10, z, "light_gray_concrete");
  }
}

// 6. roof equipment on the deck (y 11..12), kept off the parapet
const plant = [
  [5, 4, 8, 7],
  [20, 5, 24, 8],
];
for (const [x0, z0, x1, z1] of plant) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!inside(x, z) || isEdge(x, z)) continue;
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
    }
}

// lightning rod on the roof centre
if (inside(15, 7) && !isEdge(15, 7)) {
  for (let y = 11; y <= 13; y++) put(15, y, 7, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
