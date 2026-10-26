import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63664.cells.json`, "utf8"));

const W = 21, H = 32, D = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup
const fp = new Map();
for (const [x, z, gr, roof] of cells) fp.set(`${x},${z}`, { gr, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);

// Outward face directions for an edge cell
function outward(x, z) {
  const dirs = [];
  if (!inFp(x, z - 1)) dirs.push([0, -1]);
  if (!inFp(x, z + 1)) dirs.push([0, 1]);
  if (!inFp(x - 1, z)) dirs.push([-1, 0]);
  if (!inFp(x + 1, z)) dirs.push([1, 0]);
  return dirs;
}

// Chebyshev distance to the nearest non-footprint cell (edge = 1)
function edgeDist(x, z) {
  for (let r = 1; r < 30; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!inFp(x + dx, z + dz)) return r;
      }
    }
  }
  return 30;
}

// Smooth the lidar roof over a 3x3 neighbourhood, then snap to storey multiples
const roofTop = new Map();
let maxRoof = -Infinity;
for (const [x, z, gr, roof] of cells) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const c = fp.get(`${x + dx},${z + dz}`);
      if (c) { sum += c.roof; n++; }
    }
  }
  const s = sum / n;
  const snapped = Math.min(H - 6, 3 * Math.round(s / 3));
  roofTop.set(`${x},${z}`, Math.max(snapped, gr + 6));
  maxRoof = Math.max(maxRoof, snapped);
}

// Main massing
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const dirs = outward(x, z);
  const edge = dirs.length > 0;
  const isCorner = dirs.length > 1;
  const top = roofTop.get(`${x},${z}`);

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const isTopCell = y === top - 1;

    if (!edge) {
      // Interior: roof deck and floor slabs only; air elsewhere
      if (isTopCell) g.set(x, y, z, "light_gray_concrete");
      else if (rel % 3 === 0 && rel > 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    const [dx, dz] = dirs[0];
    const t = dx !== 0 ? z : x;
    const pier = isCorner || t % 3 === 0;

    // Parapet and cornice
    if (isTopCell) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === top - 2) { g.set(x, y, z, "white_concrete"); continue; }

    // Base course
    if (rel === 0) { g.set(x, y, z, "polished_granite"); continue; }

    // Entrance on the street face (lowest z), centre three bays
    const onStreet = dz === -1 && z === 0;
    const minX = Math.min(...cells.filter(c => c[1] === 0).map(c => c[0]));
    const maxX = Math.max(...cells.filter(c => c[1] === 0).map(c => c[0]));
    const midX = Math.round((minX + maxX) / 2);
    const doorBay = onStreet && Math.abs(x - midX) <= 1;

    if (doorBay && rel === 1) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: "lower",
        hinge: x === midX ? "left" : "right", open: "false", powered: "false",
      });
      continue;
    }
    if (doorBay && rel === 2) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: "upper",
        hinge: x === midX ? "left" : "right", open: "false", powered: "false",
      });
      continue;
    }
    if (doorBay && rel >= 3 && rel < 4) {
      // Stone lintel over the entrance, in the wall itself
      g.set(x, y, z, "quartz_block");
      continue;
    }

    // Storey lines
    if (rel % 3 === 0) {
      g.set(x, y, z, pier ? "quartz_block" : "white_concrete");
      continue;
    }

    // Piers
    if (pier) { g.set(x, y, z, "quartz_block"); continue; }

    // Glazing: clear-ish at shopfront, tinted above
    const ground = rel < 3;
    g.set(x, y, z, ground ? "light_blue_stained_glass" : "gray_stained_glass");

    // Warm light behind some upper windows
    if (!ground && (x * 7 + y * 3) % 11 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inFp(ix, iz) && outward(ix, iz).length === 0) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Roof penthouse on the central roof, standing on the roof deck
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const top = roofTop.get(`${x},${z}`);
  if (top < maxRoof) continue;
  const d = edgeDist(x, z);
  if (d < 4) continue;
  for (let y = top; y < top + 3; y++) {
    if (y >= H) break;
    const isCap = y === top + 2;
    if (isCap) g.set(x, y, z, "smooth_stone");
    else if (d === 4) g.set(x, y, z, y === top ? "white_concrete" : "gray_stained_glass");
    else g.set(x, y, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC63664.nbt`);
