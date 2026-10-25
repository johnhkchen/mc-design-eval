import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499723";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 27, D = 9;
const g = new Voxels([W, H, D]);

const set = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup
const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, { gy: Math.round(c[2]), roof: c[3] });
const has = (x, z) => map.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxGy = 0;
for (const c of cells) {
  minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
  minZ = Math.min(minZ, c[1]); maxZ = Math.max(maxZ, c[1]);
  maxGy = Math.max(maxGy, Math.round(c[2]));
}
const w = maxX - minX;
const midX = minX + Math.floor(w / 2);

// Massing: median lidar roof as one ridge height, eaves 3 blocks lower.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = Math.round(roofs[Math.floor(roofs.length / 2)]);
let eave = Math.max(medRoof - 3, maxGy + 3);
eave = Math.min(eave, 22);
const ridge = eave + 3;

const WALL = "smooth_stone";
const BASE = "stone_bricks";
const TRIM = "stone_brick_slab";
const ROOF = "deepslate_tile_stairs";
const RAFTER = "stone_bricks";

// Front entrance: the front (min-z) cell closest to the centre line
let doorX = null;
for (const c of cells) {
  if (c[1] !== minZ) continue;
  if (doorX === null || Math.abs(c[0] - midX) < Math.abs(doorX - midX)) doorX = c[0];
}

const windowCells = [];

// Pass 1: foundations, walls, floors, ceilings, windows, pilasters, door
for (const c of cells) {
  const x = c[0], z = c[1];
  const gy = Math.round(c[2]);

  for (let y = 0; y < gy; y++) set(x, y, z, BASE);

  const west = !has(x - 1, z), east = !has(x + 1, z);
  const north = !has(x, z - 1), south = !has(x, z + 1);
  const perimeter = west || east || north || south;
  const corner = (west || east) && (north || south);

  if (perimeter) {
    for (let y = gy; y < eave; y++) set(x, y, z, WALL);

    // Plinth course and cornice band
    set(x, gy, z, BASE);
    set(x, eave - 1, z, BASE);

    // Mid-height string course on all walls
    const sill = gy + 1;
    set(x, sill, z, TRIM, { type: "bottom", waterlogged: "false" });

    // Corner pilasters: stone brick columns, full height
    if (corner) {
      for (let y = gy; y < eave; y++) set(x, y, z, BASE);
    }

    // Pilasters every third cell along side walls (vertical stone strips)
    const along = (west || east) ? z - minZ : x - minX;
    if (!corner && along % 3 === 0) {
      for (let y = gy + 2; y < eave - 1; y++) set(x, y, z, BASE);
    }

    const ylo = gy + 2, yhi = gy + 3;
    const canWindow = !corner && yhi <= eave - 2;

    let windowed = false;
    if (canWindow && (west || east) && along % 3 === 2) {
      // side face: panes run along z
      for (let y = ylo; y <= yhi; y++)
        set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      windowed = true;
    } else if (canWindow && north && !(x === doorX && z === minZ) && (x - minX) % 3 === 1) {
      // front or back face: panes run along x
      for (let y = ylo; y <= yhi; y++)
        set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      windowed = true;
    } else if (canWindow && south && (x - minX) % 3 === 1) {
      for (let y = ylo; y <= yhi; y++)
        set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      windowed = true;
    }
    if (windowed && (west || east)) {
      const nx = west ? x + 1 : x - 1;
      if (has(nx, z)) windowCells.push([nx, gy + 2, z]);
    }

    // Entrance on the front face: oak door, stone surround, lintel and canopy slab
    if (north && z === minZ && x === doorX) {
      set(x, gy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      set(x, gy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      set(x, gy + 2, z, BASE);
      set(x, gy + 3, z, TRIM, { type: "top", waterlogged: "false" });
    }
  } else {
    // Interior: floor slab at ground, ceiling slab under the roof
    set(x, gy, z, BASE);
    set(x, eave - 1, z, BASE);
  }
}

// Warm light behind some side windows
for (const [lx, ly, lz] of windowCells) {
  if ((lz - minZ) % 6 === 2) set(lx, ly, lz, "glowstone");
}

// Pass 2: gable roof, ridge along z, slopes facing west and east
for (const c of cells) {
  const x = c[0], z = c[1];
  const xi = x - minX;
  const d = Math.min(xi, w - xi);
  const yt = eave + Math.min(d, 3);
  const facing = xi <= w / 2 ? "west" : "east";

  for (let y = eave; y < yt; y++) set(x, y, z, RAFTER);
  set(x, yt, z, ROOF, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

// Ridge cap: a single stone brick course along the top of the ridge
for (const c of cells) {
  const x = c[0], z = c[1];
  const xi = x - minX;
  if (xi === Math.floor(w / 2) || xi === Math.ceil(w / 2)) {
    set(x, ridge, z, TRIM, { type: "bottom", waterlogged: "false" });
  }
}

// Small bell-cote on the front gable, a short stone pier with a lantern
if (has(midX, minZ)) {
  set(midX, ridge + 1, minZ, BASE);
  set(midX, ridge + 2, minZ, BASE);
  set(midX, ridge + 3, minZ, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
