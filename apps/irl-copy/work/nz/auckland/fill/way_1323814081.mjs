// Way 1323814081: a slim 1980s concrete-and-glass office tower (84 blocks, about 21 storeys) on a one-storey
// shopfront wing, footprint 8 x 12. Storeys are 4 blocks: slab, two rows of glazing, spandrel. Lidar roofs are
// snapped to storey-aligned tiers (4 podium, 12 and 20 and 60 setbacks, 84 tower top); every storey slab is solid
// across the footprint, so nothing hangs. Facade = any cell with an open side; the cell inside it is air (the gap
// behind the glass), with warm lights on the floor where they sit behind a pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1323814081.cells.json`, "utf8"));

const W = 8, D = 12, YS = 96;
const SLAB = "light_gray_concrete", BASE = "stone_bricks", FRAME = "iron_block";
const GLASS_PANE = "light_blue_stained_glass_pane";

// lidar roof height -> clean storey-aligned tier (blocks above y 0)
const tier = (r) => (r <= 6 ? 4 : r <= 14 ? 12 : r <= 24 ? 20 : r <= 70 ? 60 : 84);

// H[x][z]: the top of each footprint cell's massing (0 = outside the footprint)
const H = Array.from({ length: W }, () => new Array(D).fill(0));
for (const [x, z, , roof] of cells) H[x][z] = tier(roof);

const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && H[x][z] > 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// sides of cell (x, z) at height y that open onto outside air (no footprint next door, or a lower roof there)
const openSides = (x, z, y) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !(inFp(x + dx, z + dz) && H[x + dx][z + dz] > y);
  });

// corner -> frame; otherwise mullions every second block along the face
const isMullion = (x, z, open) => {
  const ns = open.some((d) => d === "N" || d === "S"), ew = open.some((d) => d === "W" || d === "E");
  if (ns && ew) return true;
  return ew ? z % 2 === 0 : x % 2 === 0;
};

// kind[x][y][z]: null (nothing), "base", "slab", "frame", "glass", "air", "light", "door_lower", "door_upper"
const kind = Array.from({ length: W }, () => Array.from({ length: YS }, () => new Array(D).fill(null)));
for (let x = 0; x < W; x++)
  for (let z = 0; z < D; z++) {
    const h = H[x][z];
    for (let y = 0; y < h; y++) {
      const open = openSides(x, z, y);
      let k;
      if (y === h - 1 || y % 4 === 0) k = y === 0 && open.length ? "base" : "slab";   // cap, floor slab, base course
      else if (!open.length) k = "air";                                              // the gap behind the glass
      else if (y % 4 === 3) k = "slab";                                              // spandrel
      else k = isMullion(x, z, open) ? "frame" : "glass";
      kind[x][y][z] = k;
    }
  }

// the entrance: a double-height oak door on the south corner cell, with the lobby behind it
kind[2][1][11] = "door_lower";
kind[2][2][11] = "door_upper";

// warm lights on the floor of an interior cell that sits behind a pane (y = storey floor + 1)
const at = (x, y, z) => (x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < YS ? kind[x][y][z] : null);
for (let x = 0; x < W; x++)
  for (let z = 0; z < D; z++)
    for (let y = 1; y < H[x][z] - 1; y += 4) {
      if (kind[x][y][z] !== "air") continue;
      const behindGlass = Object.values(DIRS).some(([dx, dz]) => at(x + dx, y, z + dz) === "glass");
      if (behindGlass && (x * 3 + z * 5 + (y >> 2)) % 3 === 0) kind[x][y][z] = (x + z) % 2 ? "shroom" : "light";
    }

const SOLID_FOR_PANE = new Set(["base", "slab", "frame", "glass", "light", "shroom"]);
const paneState = (x, y, z) => {
  const s = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (SOLID_FOR_PANE.has(at(x, y, z - 1))) s.north = "true";
  if (SOLID_FOR_PANE.has(at(x + 1, y, z))) s.east = "true";
  if (SOLID_FOR_PANE.has(at(x, y, z + 1))) s.south = "true";
  if (SOLID_FOR_PANE.has(at(x - 1, y, z))) s.west = "true";
  return s;
};

const g = new Voxels([W, YS, D]);
for (let x = 0; x < W; x++)
  for (let y = 0; y < YS; y++)
    for (let z = 0; z < D; z++) {
      const k = kind[x][y][z];
      if (!k || k === "air") continue;
      if (k === "base") g.set(x, y, z, BASE);
      else if (k === "slab") g.set(x, y, z, SLAB);
      else if (k === "frame") g.set(x, y, z, FRAME);
      else if (k === "glass") g.set(x, y, z, GLASS_PANE, paneState(x, y, z));
      else if (k === "light") g.set(x, y, z, "glowstone");
      else if (k === "shroom") g.set(x, y, z, "shroomlight");
      else if (k.startsWith("door"))
        g.set(x, y, z, "oak_door", { facing: "south", half: k === "door_lower" ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    }

// roof plant on the one-storey wing: a short iron box on the cap
for (const [x, y, z] of [[5, 4, 2], [5, 5, 2], [6, 4, 2]]) g.set(x, y, z, FRAME);

// antenna on the tower top (cap at y 83), rod at the tip
for (let y = 84; y <= 87; y++) g.set(1, y, 7, "iron_bars", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
g.set(1, 88, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/way_1323814081.nbt`);
