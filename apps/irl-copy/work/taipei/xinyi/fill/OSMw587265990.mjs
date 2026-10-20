import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265990";
const W = 25, H = 33, D = 17;
const TOP = 21;                       // roof slab level, 21 blocks above lowest ground
const vox = new Voxels([W, H, D]);

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(TOP - 2, Math.round(g))));
}

const key = (x, z) => `${x},${z}`;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const missing = (x, z) =>
  Object.keys(DIRS).filter(d => !ground.has(key(x + DIRS[d][0], z + DIRS[d][1])));
const facadeT = (x, z, miss) =>
  miss.some(d => d === "north" || d === "south") ? x : z;

// Entrance: north-facing perimeter cell nearest the footprint's centre
let minX = Infinity, maxX = -Infinity;
for (const k of ground.keys()) {
  const x = Number(k.split(",")[0]);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
}
const cx = (minX + maxX) / 2;
let entrance = null;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!missing(x, z).includes("north")) continue;
  if (!entrance || Math.abs(x - cx) < Math.abs(entrance.x - cx)) entrance = { x, z };
}

// Shell, foundations, floors, facade bands, roof and penthouse
for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);
  const base = Math.max(g, 1);
  const miss = missing(x, z);
  const perim = miss.length > 0;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < base; y++) vox.set(x, y, z, "stone");

  for (let y = base; y <= TOP - 1; y++) {
    if (y === base) {
      vox.set(x, y, z, perim ? "polished_granite" : "smooth_quartz");   // base course / slab
      continue;
    }
    if ((y - 1) % 5 === 0) {                 // floor slab line (6, 11, 16)
      vox.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (!perim) continue;                    // interior stays air behind the glass
    if (y % 5 === 0) {                       // spandrel band (5, 10, 15, 20)
      vox.set(x, y, z, "light_gray_concrete");
      continue;
    }
    // Glass band: mullions every 3 cells, corner pillars
    const corner = miss.length >= 2;
    const t = facadeT(x, z, miss);
    if (corner || t % 3 === 0) vox.set(x, y, z, "quartz_pillar", { axis: "y" });
    else vox.set(x, y, z, "light_blue_stained_glass");
  }

  // Roof slab at TOP
  vox.set(x, TOP, z, "light_gray_concrete");

  // Parapet and cornice on the perimeter
  if (perim) {
    vox.set(x, 22, z, "quartz_block");
    vox.set(x, 23, z, "quartz_block");
    vox.set(x, 24, z, "quartz_slab", { type: "bottom" });
  }

  // Roof plant penthouse, set back in the middle of the roof
  if (!perim && x >= 7 && x <= 17 && z >= 5 && z <= 11) {
    for (let y = 22; y <= 24; y++) vox.set(x, y, z, "light_gray_concrete");
    vox.set(x, 25, z, "smooth_stone_slab", { type: "bottom" });
  }
}

// Warm lights set just behind some glass panes (inside the air gap)
for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);
  const base = Math.max(g, 1);
  const miss = missing(x, z);
  if (miss.length !== 1) continue;
  const t = facadeT(x, z, miss);
  if (t % 3 === 0) continue;
  const [dx, dz] = DIRS[miss[0]];
  const ix = x - dx, iz = z - dz;
  if (!ground.has(key(ix, iz)) || missing(ix, iz).length !== 0) continue;
  for (let y = base + 1; y <= TOP - 2; y++) {
    if ((y - 1) % 5 === 0 || y % 5 === 0) continue;
    if ((x * 7 + y * 3 + z * 5) % 13 === 0) vox.set(ix, y, iz, "shroomlight");
  }
}

// Entrance door on the north face, with a frame of polished granite
if (entrance) {
  const { x, z } = entrance;
  const base = Math.max(ground.get(key(x, z)), 1);
  vox.set(x, base + 1, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  vox.set(x, base + 2, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  for (const dx of [-1, 1]) {
    const nx = x + dx;
    if (ground.has(key(nx, z)) && missing(nx, z).includes("north")) {
      vox.set(nx, base + 1, z, "polished_granite");
      vox.set(nx, base + 2, z, "polished_granite");
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
