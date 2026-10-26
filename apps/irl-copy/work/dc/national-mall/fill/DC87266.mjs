import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87266.cells.json`, "utf8"));

const W = 15, D = 20, H = 32;
const g = new Voxels([W, H, D]);

// ---- 1. Read footprint: ground and raw lidar roof per cell ----
const raw = new Map();   // "x,z" -> { gr, roof }
for (const c of cells) {
  const [x, z, gr0, roof0] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(`${x},${z}`, {
    gr: Math.max(0, Math.round(gr0)),
    roof: Math.round(roof0),
  });
}

// ---- 2. Smooth roof heights over a 3x3 neighbourhood, then snap to storey lines ----
// Storey height is 4 blocks; tops land on multiples of 4 measured from y 0.
const cellMap = new Map();
for (const [key, { gr, roof }] of raw) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const nb = raw.get(`${x + dx},${z + dz}`);
      if (nb) { sum += nb.roof; n++; }
    }
  }
  const smoothed = sum / n;
  let top = Math.round(smoothed / 4) * 4;
  top = Math.max(gr + 4, Math.min(H - 3, top));
  cellMap.set(key, { gr, top });
}

// ---- 3. Foundation under every footprint cell ----
for (const [key, { gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// ---- 4. Walls, piers, storey lines, cornice ----
for (const [key, { gr, top }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const edgeX = x === 0 || x === W - 1;
  const edgeZ = z === 0 || z === D - 1;
  if (!(edgeX || edgeZ)) continue;

  const corner = edgeX && edgeZ;
  const along = edgeZ ? x : z;
  const len = edgeZ ? W : D;
  const pierCol = corner || along % 3 === 0 || along === len - 1;

  // Solid from y 0 so the perimeter has no gaps on any slope.
  for (let y = 0; y < top; y++) {
    const h = y - gr;
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
    } else if (h === 0) {
      g.set(x, y, z, "stone_bricks");            // base course
    } else if (y === top - 1) {
      g.set(x, y, z, "smooth_quartz");           // cornice
    } else if (h % 4 === 0) {
      g.set(x, y, z, "light_gray_concrete");     // storey line
    } else if (pierCol) {
      g.set(x, y, z, "white_concrete");         // pier
    } else {
      g.set(x, y, z, "light_blue_stained_glass"); // window
    }
  }

  // Entrance on the z=0 face, centred on x=7
  if (z === 0) {
    if (x === 6 || x === 8) {
      g.set(x, gr + 1, z, "white_concrete");
      g.set(x, gr + 2, z, "white_concrete");
    }
    if (x === 7) {
      g.set(x, gr + 1, z, "oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }
    // Canopy band over the doorway, wider than the door
    if (x >= 5 && x <= 9) {
      g.set(x, gr + 3, z, "smooth_quartz");
    }
  }
}

// ---- 5. Interior: floor slabs per storey, roof deck, lights, rooftop plant ----
for (const [key, { gr, top }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const interior = x >= 1 && x <= W - 2 && z >= 1 && z <= D - 2;
  if (!interior) continue;

  for (let y = gr; y < top; y++) {
    const h = y - gr;
    if (y === top - 1) {
      g.set(x, y, z, "light_gray_concrete");     // roof deck
    } else if (h % 4 === 0) {
      g.set(x, y, z, "smooth_stone");            // storey floor
    }
  }

  // Warm lights on storey floors
  for (let y = gr + 4; y < top - 2; y += 4) {
    if (x === 2 && z % 6 === 3) g.set(x, y + 1, z, "shroomlight");
  }

  // Rooftop plant
  if (x % 5 === 2 && z % 6 === 3) {
    g.set(x, top, z, "iron_block");
    if (top + 1 < H) g.set(x, top + 1, z, "iron_block");
  }
}

g.save(`${DIR}/DC87266.nbt`);
