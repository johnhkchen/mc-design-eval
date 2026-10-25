import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499461";
const W = 41, H = 21, D = 96;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, r] of cells) map.set(key(x, z), { g: gr, r });
const inside = (x, z) => map.has(key(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// ---- lidar roof smoothing: 3x3 median over footprint cells -------------------
const smoothRoof = (x, z) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (inside(x + dx, z + dz)) vals.push(map.get(key(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
};

const groundOf = (x, z) => Math.min(H - 8, map.get(key(x, z)).g);
const topOf = (x, z) =>
  Math.min(H - 3, Math.max(Math.round(smoothRoof(x, z)), groundOf(x, z) + 7));

// street entrance: northernmost row, nearest the middle
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
let doorX = null;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  if (doorX === null || Math.abs(x - W / 2) < Math.abs(doorX - W / 2)) doorX = x;
}

// ---- massing ---------------------------------------------------------------
for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  const top = topOf(x, z);
  const edge = isEdge(x, z);

  // foundation and ground floor slab
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");
  g.set(x, gr, z, "smooth_stone");

  if (edge) {
    const pilaster = (x + z) % 8 === 0;

    // ground floor: stone base course at the floor row, shopfront above
    g.set(x, gr + 1, z, pilaster ? "stone_bricks" : "stone_brick_wall", pilaster ? {} : {
      up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false",
    });
    for (let y = gr + 2; y <= gr + 3; y++) {
      const mullion = (x % 4 === 0);
      g.set(x, y, z, pilaster || mullion ? "spruce_planks" : "glass");
    }

    // lintel course and storey line
    g.set(x, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // render upper wall with pilasters and small windows
    for (let y = gr + 5; y <= top - 2; y++) {
      if (pilaster) {
        g.set(x, y, z, "stone_bricks");
      } else {
        const win = y <= gr + 6 && (x + z) % 4 === 2;
        g.set(x, y, z, win ? "glass" : "calcite");
      }
    }

    // cornice and parapet
    g.set(x, top - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    g.set(x, top + 1, z, "stone_brick_wall", {
      up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false",
    });
  }

  // flat roof on this cell's tier
  g.set(x, top, z, "smooth_stone");
}

// ---- entrance: stone surround, glazed transom, recessed door -----------------
{
  const gr = groundOf(doorX, minZ);
  // door opening
  g.set(doorX, gr + 1, minZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false",
  });
  g.set(doorX, gr + 2, minZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false",
  });
  // stone jambs either side of the door
  for (const dx of [-1, 1]) {
    const x = doorX + dx;
    if (!inside(x, minZ)) continue;
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, minZ, "stone_bricks");
  }
  // glazed transom above the door
  g.set(doorX, gr + 3, minZ, "glass");
  // standing lantern just inside, lighting the entrance
  if (inside(doorX, minZ + 1)) {
    g.set(doorX, gr + 1, minZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- warm interior lights and roof plant -----------------------------------
for (const [x, z] of cells) {
  const gr = groundOf(x, z);
  const top = topOf(x, z);
  if (!isEdge(x, z)) {
    const nearEdge = isEdge(x, z + 1) || isEdge(x, z - 1) || isEdge(x + 1, z) || isEdge(x - 1, z);
    if (nearEdge && (x + z) % 8 === 0) {
      g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    if (x % 13 === 6 && z % 25 === 12) {
      g.set(x, top + 1, z, "iron_block");
      g.set(x, top + 2, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
