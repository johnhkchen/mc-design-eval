import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833540";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gy = (x, z) => ground.get(`${x},${z}`);
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return; // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Glass pane whose arms join along the wall it sits in
function pane(x, y, z, alongX) {
  put(x, y, z, "glass_pane", {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
  });
}

// Roof level (absolute) and parapet
const ROOF = 11;

// ---- Per-cell shell ----
for (const [x, z, gr] of cells) {
  // Foundation and ground surface
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "stone_bricks");

  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const E = !has(x + 1, z);
  const Wf = !has(x - 1, z);
  const nFaces = [N, S, E, Wf].filter(Boolean).length;
  const edge = nFaces > 0;

  // Storey line: ground storey ~4 blocks, upper ~5
  const lineY = Math.min(9, Math.max(5, gr + 4));

  if (!edge) {
    // Interior: floor slab at storey line, roof deck, air elsewhere
    put(x, lineY, z, "smooth_quartz");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Storey line band and roof cornice/parapet on perimeter
  put(x, lineY, z, "stone_bricks");
  put(x, ROOF, z, "stone_bricks");
  put(x, ROOF + 1, z, "smooth_quartz");

  if (nFaces >= 2) {
    // Corner or concave column: full-height pier
    for (let y = gr + 1; y <= 10; y++) put(x, y, z, "smooth_quartz");
    continue;
  }

  // Single-face wall cell
  let alongX, dx, dz, u, minU;
  if (N) { alongX = true; dx = 0; dz = 1; u = x; minU = minX; }
  else if (S) { alongX = true; dx = 0; dz = -1; u = x; minU = minX; }
  else if (E) { alongX = false; dx = -1; dz = 0; u = z; minU = minZ; }
  else { alongX = false; dx = 1; dz = 0; u = z; minU = minZ; }

  const k = u - minU;

  // Ground storey: bulkhead, glazing, header
  const groundPier = k % 3 === 0;
  put(x, gr + 1, z, "polished_andesite");
  for (let y = gr + 2; y <= lineY - 2; y++) {
    if (groundPier) put(x, y, z, "smooth_quartz");
    else pane(x, y, z, alongX);
  }
  put(x, lineY - 1, z, groundPier ? "smooth_quartz" : "dark_oak_planks");

  // Upper storey: piers alternate with windows, sill and header courses
  const upperPier = k % 2 === 0;
  for (let y = lineY + 1; y <= 10; y++) {
    if (upperPier) {
      put(x, y, z, "smooth_quartz");
    } else if (y === lineY + 1 || y === 10) {
      put(x, y, z, "stone_bricks");
    } else {
      pane(x, y, z, alongX);
    }
  }

  // Warm light behind some upper windows (air gap is the interior cell)
  if (!upperPier && k % 4 === 1 && has(x + dx, z + dz)) {
    put(x + dx, lineY + 3, z + dz, "glowstone");
  }
  // Shroomlight behind some shopfront panes
  if (!groundPier && k % 3 === 1 && has(x + dx, z + dz)) {
    put(x + dx, gr + 2, z + dz, "shroomlight");
  }
}

// ---- Entrance on the south face, centred ----
const doorX = Math.floor((minX + maxX) / 2);
if (has(doorX, maxZ) && !has(doorX, maxZ + 1)) {
  const dgr = gy(doorX, maxZ);
  g.set(doorX, dgr + 1, maxZ, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dgr + 2, maxZ, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lanterns flanking the door on the wall line
  for (const lx of [doorX - 1, doorX + 1]) {
    if (has(lx, maxZ) && !has(lx, maxZ + 1)) {
      put(lx, dgr + 3, maxZ, "lantern", { hanging: "false" });
    }
  }
}

// ---- Rooftop: water tank and an AC plant ----
const tankCells = [];
for (let x = 2; x <= 4; x++) for (let z = 5; z <= 7; z++) tankCells.push([x, z]);
if (tankCells.every(([x, z]) => has(x, z))) {
  for (const [x, z] of tankCells) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
    put(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (const [x, z] of [[6, 10], [7, 10], [6, 11], [7, 11]]) {
  if (has(x, z)) put(x, ROOF + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
