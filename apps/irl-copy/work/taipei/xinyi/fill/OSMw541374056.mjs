import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541374056";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 21 x 23 x 22: two commercial storeys (5 blocks each) plus parapet, roof at ground+11.
const W = 21, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(key(x, z), Math.min(11, Math.max(0, Math.round(gr))));
}
const has = (x, z) => G.has(key(x, z));

// Exterior normal directions: [dx, dz, facing name]
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

const perimeterMissing = new Map();
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  perimeterMissing.set(k, miss);
}

// 1. Foundation and base course: solid from y 0 up to each cell's ground.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs at each storey line and the roof deck, across the whole footprint.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const perim = perimeterMissing.get(k).length > 0;
  const floorId = perim ? "smooth_quartz" : "light_gray_concrete";
  g.set(x, gr + 5, z, floorId);
  g.set(x, gr + 10, z, perim ? "smooth_quartz" : "gray_concrete");
}

// 3. Facade walls: piers, shopfront, window bays with sills, spandrels and lights.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const miss = perimeterMissing.get(k);
  if (miss.length === 0) continue;

  // Corners and pier columns: solid quartz, full height.
  if (miss.length >= 2) {
    for (let y = gr + 1; y <= gr + 10; y++) g.set(x, y, z, "smooth_quartz");
    continue;
  }

  const [dx, dz] = miss[0];
  const idx = dx !== 0 ? z : x;
  if (idx % 3 === 0) {
    for (let y = gr + 1; y <= gr + 10; y++) g.set(x, y, z, "smooth_quartz");
    continue;
  }

  // Window bay.
  // Storey 1: shopfront plinth then glass.
  g.set(x, gr + 1, z, "polished_andesite");
  for (let y = gr + 2; y <= gr + 4; y++) g.set(x, y, z, "glass_pane");
  g.set(x, gr + 5, z, "smooth_quartz");
  // Storey 2: sill then glass.
  g.set(x, gr + 6, z, "light_gray_concrete");
  for (let y = gr + 7; y <= gr + 9; y++) g.set(x, y, z, "glass_pane");
  g.set(x, gr + 10, z, "smooth_quartz");

  // Warm light behind selected glass on the interior side.
  const tx = x - dx, tz = z - dz;
  const tk = key(tx, tz);
  if (G.has(tk) && perimeterMissing.get(tk).length === 0) {
    const tgr = G.get(tk);
    if (idx % 6 === 1) {
      const lightId = idx % 12 === 1 ? "shroomlight" : "glowstone";
      g.set(tx, tgr + 3, tz, lightId);
      g.set(tx, tgr + 8, tz, lightId);
    }
  }
}

// 4. Entrance on the north face: double-height door set with transom glass.
{
  const candidates = [];
  for (const [k, gr] of G) {
    const [x, z] = k.split(",").map(Number);
    const miss = perimeterMissing.get(k);
    if (miss.length !== 1) continue;
    const [dx, dz, face] = miss[0];
    if (face !== "north") continue;
    if (x % 3 === 0) continue; // pier columns are not doors
    candidates.push({ x, z, gr });
  }
  if (candidates.length) {
    const xs = candidates.map(c => c.x).sort((a, b) => a - b);
    const median = xs[Math.floor(xs.length / 2)];
    candidates.sort((a, b) => Math.abs(a.x - median) - Math.abs(b.x - median));
    const e = candidates[0];
    const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
    g.set(e.x, e.gr + 1, e.z, "dark_oak_door", { ...props, half: "lower" });
    g.set(e.x, e.gr + 2, e.z, "dark_oak_door", { ...props, half: "upper" });
    g.set(e.x, e.gr + 3, e.z, "glass_pane");
    g.set(e.x, e.gr + 4, e.z, "glass_pane");
  }
}

// 5. Parapet and roof equipment.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const miss = perimeterMissing.get(k);
  if (miss.length > 0) {
    g.set(x, gr + 11, z, "smooth_quartz");
  } else if (x % 5 === 2 && z % 5 === 2) {
    g.set(x, gr + 11, z, "iron_block");
  }
}

g.save(`${dir}/${id}.nbt`);
