import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833569.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833569.nbt";
const W = 17, H = 23, D = 22;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade directions: name, dx, dz, and whether the facade runs along x (north/south) or z (east/west)
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

const facadesOf = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.floor((minX + maxX) / 2);
const midZ = Math.floor((minZ + maxZ) / 2);

// Pass 1: foundations, floors, walls, parapets, roof
for (const [x, z, gyRaw] of cells) {
  const gy = Math.round(gyRaw);
  const facades = facadesOf(x, z);
  const top = gy + 11;

  // Foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Base course and floor slabs (ground, storey 2 line, roof)
  put(x, gy, z, "polished_andesite");
  put(x, gy + 5, z, "light_gray_concrete");

  if (facades.length === 0) {
    // Interior: no walls, just the roof slab
    put(x, top, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: walls, parapet and cornice cap
  for (let y = gy + 1; y <= gy + 10; y++) put(x, y, z, "white_concrete");
  put(x, top, z, "white_concrete");
  put(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: facade articulation (window grids, shopfronts, door, awning, lamps)
for (const [x, z, gyRaw] of cells) {
  const gy = Math.round(gyRaw);
  for (const [name, dx, dz] of facadesOf(x, z)) {
    const alongX = name === "north" || name === "south";
    const tc = alongX ? x : z;           // coordinate along the facade
    const mid = alongX ? midX : midZ;
    const pillar = tc % 3 === 0;
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    // Storey 1: shopfront
    if (pillar) {
      for (let y = gy + 1; y <= gy + 4; y++) put(x, y, z, "gray_concrete");
    } else {
      for (let y = gy + 1; y <= gy + 3; y++) put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      put(x, gy + 4, z, tc % 2 ? "red_concrete" : "white_concrete"); // awning band
    }

    // Storey 2: window grid with sills and lintels
    if (pillar) {
      for (let y = gy + 6; y <= gy + 10; y++) put(x, y, z, "gray_concrete");
    } else {
      put(x, gy + 6, z, "light_gray_concrete");
      for (let y = gy + 7; y <= gy + 9; y++) put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      put(x, gy + 10, z, "light_gray_concrete");
    }

    // Entrance on the centre bay of the facade
    if (tc === mid && !pillar) {
      const outward = name;
      put(x, gy + 1, z, "oak_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gy + 2, z, "oak_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gy + 3, z, "light_blue_stained_glass_pane", paneProps);
    }

    // Warm light: glowstone on the interior floor behind some storey-2 windows
    if (!pillar && tc % 6 === 1) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && facadesOf(ix, iz).length === 0) {
        put(ix, gy + 6, iz, "glowstone");
      }
    }
  }
}

// Pass 3: roof equipment and a stair/lift penthouse
for (const [x, z, gyRaw] of cells) {
  const gy = Math.round(gyRaw);
  const top = gy + 11;
  if (facadesOf(x, z).length !== 0) continue;

  // Mechanical units
  if (x % 4 === 1 && z % 5 === 2) put(x, top + 1, z, "iron_block");

  // Penthouse block on the north-west part of the roof
  if (x >= minX + 2 && x <= minX + 6 && z >= minZ + 2 && z <= minZ + 5) {
    put(x, top + 1, z, "white_concrete");
    put(x, top + 2, z, "white_concrete");
    put(x, top + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
