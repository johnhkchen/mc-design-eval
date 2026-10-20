import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147846205";
const W = 77, H = 47, D = 18;
const ROOF_Y = 35;            // roof deck sits at y 35, roughly 35 blocks above lowest ground
const STOREY = 5;
const STOREYS = 7;            // 7 storeys x 5 blocks = 35

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Depth from the outer edge of the footprint: 0 = facade, 1 = air gap, 2 = lit room edge, ...
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !has(x + dx, z + dz))) {
    depth.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Which outward faces a cell touches
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Pane connection props: run the pane along the facade
function pane(zFace) {
  return zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Warm light spots sit one bay in from a window at the north/south and east/west edges
function lightSpot(x, z) {
  return (x % 12 === 6 && (z === 2 || z === D - 3)) ||
         (z % 12 === 6 && (x === 2 || x === W - 3));
}

for (const [x, z, gr] of cells) {
  if (gr >= ROOF_Y) continue;
  const d = depth.get(key(x, z)) ?? 0;
  const fs = faces(x, z);
  const isNorth = fs.includes("north");
  const zFace = fs.includes("north") || fs.includes("south");
  const idx = zFace ? x : z;   // bay index along the face this cell sits on

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storeys: floor line at each band start, facade bands above
  for (let k = 0; k < STOREYS; k++) {
    const base = k * STOREY;
    const start = Math.max(base, gr);
    const top = base + STOREY - 1;
    if (start > top) continue;

    for (let y = start; y <= top; y++) {
      // Floor slab at each storey line (base course on the ground storey)
      if (y === start) {
        if (d === 0) g.set(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete");
        else g.set(x, y, z, "smooth_stone");
        continue;
      }

      // Interior: air gap, with occasional warm light behind the glass
      if (d > 0) {
        if (d === 2 && k % 2 === 1 && y === base + 2 && lightSpot(x, z)) {
          g.set(x, y, z, "glowstone");
        }
        continue;
      }

      // Facade
      if (y === top) {
        // Spandrel / storey line; dark planks form the entrance canopy on the north face
        const canopy = k === 0 && isNorth && idx >= 35 && idx <= 41;
        g.set(x, y, z, canopy ? "dark_oak_planks" : "light_gray_concrete");
        continue;
      }

      const off = k === 0 ? y - start : y - base;

      // Entrance: a single door at the middle of the north face, glass either side
      if (k === 0 && isNorth && idx === 38 && (off === 1 || off === 2)) {
        g.set(x, y, z, "spruce_door", {
          facing: "north",
          half: off === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // Piers every fourth bay; ground floor piers are dark shopfront frames
      if (idx % 4 === 0) {
        g.set(x, y, z, k === 0 ? "gray_concrete" : "white_terracotta");
        continue;
      }

      // Glass windows (shopfront glass on the ground floor)
      g.set(x, y, z, "light_blue_stained_glass_pane", pane(zFace));
    }
  }

  // Roof deck across the whole footprint, with a parapet on the edge
  if (gr < ROOF_Y) g.set(x, ROOF_Y, z, "light_gray_concrete");
  if (d === 0) g.set(x, ROOF_Y + 1, z, "white_concrete");
}

// Roof equipment: plant boxes and a mast, all standing on the roof deck
for (const [x, z, gr] of cells) {
  if (gr >= ROOF_Y) continue;
  const d = depth.get(key(x, z)) ?? 0;

  if (d >= 3 && x >= 10 && x <= 18 && z >= 6 && z <= 11) {
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 3; y++) g.set(x, y, z, "gray_concrete");
  }
  if (d >= 3 && x >= 56 && x <= 64 && z >= 6 && z <= 11) {
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 2; y++) g.set(x, y, z, "gray_concrete");
  }
  if (x === 38 && z === 9 && d >= 2) {
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 9; y++) {
      g.set(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
