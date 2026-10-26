import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86650";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 29, D = 15;
const g = new Voxels([W, H, D]);

// ---- footprint and per-cell data -------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  cellMap.set(`${x},${z}`, {
    g: Math.min(H - 8, Math.max(0, Math.round(gr))),
    r: Math.round(roof),
  });
}
const has = (x, z) => cellMap.has(`${x},${z}`);
const cornerCell = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// window on a non-corner perimeter cell: z-faces index by x, x-faces index by z
const winFace = (x, z) => {
  if (cornerCell(x, z)) return false;
  if (!has(x, z - 1) || !has(x, z + 1)) return x % 2 === 1;
  if (!has(x - 1, z) || !has(x + 1, z)) return z % 2 === 1;
  return false;
};
const isFront = (x, z) => !has(x, z - 1) && z === 0;   // street face

// ---- snap lidar roof to clean tiers -----------------------------------------
const roofs = [...cellMap.values()].map((c) => c.r).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
for (const c of cellMap.values()) {
  if (Math.abs(c.r - median) <= 2) c.r = median;
  c.r = Math.min(H - 6, Math.max(c.g + 4, c.r));
}

// ---- materials and states ---------------------------------------------------
const TRIM = "calcite";            // light limestone string courses, corners, cornice
const BRICK = "bricks";
const FOUND = "stone_bricks";      // darker plinth
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// ---- per-cell massing -------------------------------------------------------
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.g, r = c.r;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const perim = isPerim(x, z);
  const corner = cornerCell(x, z);
  const nStor = Math.max(1, Math.floor((r - gr) / 4));

  if (perim) {
    for (let y = gr; y <= r - 2; y++) {
      const rel = y - gr;
      const band = rel % 4;
      const storey = Math.floor(rel / 4);
      let id = BRICK;
      if (corner) id = TRIM;
      else if (rel === 0) id = storey === 0 ? FOUND : TRIM;
      else if (band === 0 || band === 3) id = TRIM;
      else if ((band === 1 || band === 2) && storey < nStor) {
        if (isFront(x, z) && x === 3 && storey === 0) {
          id = null; // doorway
        } else if (winFace(x, z)) {
          id = "glass_pane";
        }
      }
      if (id === "glass_pane") {
        g.set(x, y, z, id, !has(x, z - 1) || !has(x, z + 1) ? GLASS_Z : GLASS_X);
      } else if (id) {
        g.set(x, y, z, id);
      }
    }
    // entrance on the street face
    if (isFront(x, z) && x === 3) {
      g.set(x, gr + 1, z, "oak_door", DOOR("lower"));
      g.set(x, gr + 2, z, "oak_door", DOOR("upper"));
    }
    // cornice and parapet cap
    g.set(x, r - 1, z, TRIM);
    g.set(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior: floor slab per storey, roof slab closing the top
    for (let s = 0; s < nStor; s++) g.set(x, gr + 4 * s, z, "smooth_stone");
    g.set(x, r - 1, z, "smooth_stone");
  }
}

// ---- warm lights behind some interior windows --------------------------------
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z) || x !== 1 || z !== 1) continue;
  const nStor = Math.max(1, Math.floor((c.r - c.g) / 4));
  for (let s = 0; s < nStor; s++) {
    const y = c.g + 4 * s + 1;
    if (s % 2 === 0) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    else g.set(x, y, z, "glowstone");
  }
}

// ---- rooftop penthouse on the central interior cells ------------------------
for (let x = 2; x <= 4; x++) {
  for (let z = 5; z <= 9; z++) {
    const c = cellMap.get(`${x},${z}`);
    if (!c) continue;
    const r = c.r;
    const edgeX = x === 2 || x === 4;
    const edgeZ = z === 5 || z === 9;
    for (let y = r; y <= r + 2; y++) {
      if (!edgeX && !edgeZ) {
        // solid core so nothing hangs: ceiling at the top of the box
        if (y === r + 2) g.set(x, y, z, "smooth_stone");
        continue;
      }
      if (y === r + 1 && !(edgeX && edgeZ)) {
        g.set(x, y, z, "glass_pane", edgeZ ? GLASS_Z : GLASS_X);
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
    // penthouse cap, sitting on the box walls and the ceiling
    g.set(x, r + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
