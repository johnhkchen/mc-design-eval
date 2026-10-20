import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169551";
const W = 72, H = 33, D = 16;

// Mid-rise commercial block, late-1990s Xinyi: four storeys of glazed bays
// on white concrete piers, shopfronts at grade, a cornice, and rooftop plant.
const ROOF = 20;      // roof / cornice slab level (lidar roof ~21 above lowest ground)
const PARAPET = 21;   // parapet course

const FOUND = "stone_bricks";
const SL = "light_gray_concrete";
const WALL = "white_concrete";
const GLZ = "light_blue_stained_glass_pane";
const SHOP = "glass";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const v = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`) ?? 99;

// Entrance: median of the front (z = 0) footprint cells.
const frontXs = cells.filter(([, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[frontXs.length >> 1] : 36;

for (const [x, z, gr] of cells) {
  const xMiss = !has(x - 1, z) || !has(x + 1, z);
  const zMiss = !has(x, z - 1) || !has(x, z + 1);
  const perim = xMiss || zMiss;
  const corner = xMiss && zMiss;
  const zFace = zMiss && !xMiss;   // long front / back faces
  const u = zFace ? x : z;         // position along the face

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) v.set(x, y, z, FOUND);

  if (!perim) {
    // Interior: air behind the glass, one floor slab per storey, roof slab.
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y % 5 === 0) v.set(x, y, z, SL);
    }
    continue;
  }

  for (let y = gr; y <= PARAPET; y++) {
    if (corner || y === PARAPET) { v.set(x, y, z, WALL); continue; }
    if (y === ROOF || y === gr) { v.set(x, y, z, SL); continue; }

    const r = y % 5;
    const s = Math.floor(y / 5);
    if (r === 0 || r === 4) { v.set(x, y, z, SL); continue; } // floor lines and head bands

    if (s === 0) {
      // Ground-floor shopfront with entrance.
      const isDoor = z === 0 && x === doorX && gr <= 2 && (y === gr + 1 || y === gr + 2);
      if (isDoor) {
        const facing = "south";
        const half = y === gr + 1 ? "lower" : "upper";
        v.set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      } else if (u % 6 === 0) {
        v.set(x, y, z, WALL);
      } else {
        v.set(x, y, z, SHOP);
      }
    } else {
      // Upper storeys: glazed bays between white piers.
      if (u % 3 === 0) {
        v.set(x, y, z, WALL);
      } else {
        v.set(x, y, z, GLZ);
        // Warm light behind a few front/back windows.
        if (zFace && (z === 0 || z === 15) && u % 6 === 2 && r === 2) {
          const inner = z === 0 ? 1 : 14;
          if (groundAt(x, inner) <= y) v.set(x, y, inner, "glowstone");
        }
      }
    }
  }
}

// Penthouse on the roof slab (ring of white concrete with glazing).
for (let x = 30; x <= 41; x++) {
  for (let z = 5; z <= 10; z++) {
    if (!has(x, z)) continue;
    const ring = x === 30 || x === 41 || z === 5 || z === 10;
    if (ring) {
      v.set(x, 21, z, WALL);
      v.set(x, 22, z, (x % 3 !== 0 && x !== 30 && x !== 41 && z !== 5 && z !== 10) ? GLZ : WALL);
    }
    v.set(x, 23, z, SL);
  }
}

// Mechanical plant on the roof.
for (let x = 8; x <= 18; x++) {
  for (let z = 3; z <= 12; z++) {
    if (has(x, z)) v.set(x, 21, z, "gray_concrete");
  }
}

// Vent stack with a cap.
for (let x = 55; x <= 62; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!has(x, z)) continue;
    for (let y = 21; y <= 23; y++) v.set(x, y, z, WALL);
    v.set(x, 24, z, SL);
  }
}

// Entrance lantern hanging from the slab above (only where the ceiling exists).
if (has(doorX, 1) && groundAt(doorX, 1) <= 3) {
  v.set(doorX, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

v.save(`${DIR}/${ID}.nbt`);
