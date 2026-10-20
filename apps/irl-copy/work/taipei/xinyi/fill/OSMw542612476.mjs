import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612476";
const W = 16, H = 23, D = 43;
const ROOF = 11;            // roof surface sits at y = 11 above lowest ground
const STOREY = 5;           // storey line / second floor slab
const CORNICE = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 2, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const panes = new Set();      // "x,y,z" of glass panes on facades
const glow = [];              // [x, y, z] interior light sources behind glass
const k = (x, y, z) => `${x},${y},${z}`;

const DOOR_Z = 20;

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = gAt(x, z);
  const front = !has(x + 1, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (!isEdge(x, z)) {
    // Interior: floor slabs only, no interior fit-out, air gap behind glass.
    if (gr <= STOREY) g.set(x, STOREY, z, "smooth_stone");
    g.set(x, gr, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
    if (x % 5 === 2 && z % 8 === 4) {
      g.set(x, ROOF + 1, z, "iron_block");   // roof mechanical units
    }
    continue;
  }

  // Perimeter: facade, base course, storey lines, cornice, parapet.
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                       // base course
    } else if (y === ROOF) {
      g.set(x, y, z, "stone_bricks");                       // parapet
    } else if (y === CORNICE) {
      g.set(x, y, z, "white_concrete");                     // cornice
    } else if (y === STOREY) {
      g.set(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
    } else if (y < STOREY) {
      // Ground storey
      if (front) {
        if (z === DOOR_Z && (y === gr + 1 || y === gr + 2)) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "east",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (z % 4 === 0) {
          g.set(x, y, z, "stone_bricks");                   // shopfront mullion
        } else {
          g.set(x, y, z, "air");
          panes.add(k(x, y, z));
          if (y === gr + 1 && z % 4 === 2) glow.push(inwardOf(x, z, y));
        }
      } else {
        if (z % 3 !== 0 && (y === gr + 1 || y === gr + 2 || y === gr + 3)) {
          g.set(x, y, z, "air");
          panes.add(k(x, y, z));
        } else {
          g.set(x, y, z, "stone_bricks");
        }
      }
    } else {
      // Upper storey (y 6..9): terracotta wall with window ribbon
      if (y === 7 || y === 8) {
        if (z % 3 !== 0) {
          g.set(x, y, z, "air");
          panes.add(k(x, y, z));
          if ((z * 7 + y) % 5 === 0) glow.push(inwardOf(x, z, y));
        } else {
          g.set(x, y, z, "white_terracotta");
        }
      } else {
        g.set(x, y, z, y === 9 ? "quartz_block" : "white_terracotta");
      }
    }
  }
}

// Inward cell behind a facade cell (toward the interior), at height y.
function inwardOf(x, z, y) {
  let ix = x, iz = z;
  if (!has(x + 1, z)) ix = x - 1;
  else if (!has(x - 1, z)) ix = x + 1;
  else if (!has(x, z + 1)) iz = z - 1;
  else iz = z + 1;
  return [ix, y, iz];
}

// Glowstone behind glass only where the cell is a real interior cell.
for (const [ix, y, iz] of glow) {
  if (has(ix, iz) && !isEdge(ix, iz) && y > gAt(ix, iz)) {
    g.set(ix, y, iz, "glowstone");
  }
}

// Glass panes last, connected to neighbouring panes on the same plane.
for (const key of panes) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: String(panes.has(k(x, y, z - 1))),
    south: String(panes.has(k(x, y, z + 1))),
    west: String(panes.has(k(x - 1, y, z))),
    east: String(panes.has(k(x + 1, y, z))),
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
