import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499477.cells.json`, "utf8"));

const W = 12, H = 36, D = 5;
const g = new Voxels([W, H, D]);

const cell = new Map();
for (const [x, z, gr, roof] of cells) {
  cell.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => cell.has(`${x},${z}`);
const ext = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const set = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Shared datum and flat roof level (smooth the lidar noise)
const gVals = [...cell.values()].map(v => v.g);
const rVals = [...cell.values()].map(v => v.r).sort((a, b) => a - b);
const Gbase = Math.max(0, Math.min(...gVals));
const medianR = rVals[Math.floor(rVals.length / 2)];
const R = Math.min(34, Math.max(Gbase + 5, medianR));
const nStoreys = Math.max(1, Math.floor((R - Gbase) / 5));

// ---- Pass 1: foundations, walls, floors, roof ----
for (const [key, { g: G0 }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const G = Math.max(0, Math.min(30, G0));

  // plinth fill up to this cell's ground
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  if (ext(x, z)) {
    for (let y = G; y < R; y++) set(x, y, z, "bricks");
    set(x, G, z, "stone_bricks");          // base course
    set(x, R - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice line
    set(x, R, z, "stone_bricks");          // parapet cap
  } else {
    for (let k = 0; k < nStoreys; k++) {
      const ys = Gbase + 5 * k;
      if (ys >= G) set(x, ys, z, "smooth_stone");
    }
    set(x, R, z, "smooth_stone");
  }
}

// ---- Pass 2: windows, piers, shopfront, entrance, spandrels, lanterns ----
for (const [key, { g: G0 }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!ext(x, z)) continue;
  const G = Math.max(0, Math.min(30, G0));

  const northFace = !has(x, z - 1);
  const southFace = !has(x, z + 1);
  if (!northFace && !southFace) continue;
  const outward = northFace ? "north" : "south";
  const inside = northFace ? z + 1 : z - 1;
  const insideOk = has(x, inside);

  for (let k = 0; k < nStoreys; k++) {
    const ys = Gbase + 5 * k;
    const top = ys + 3;
    if (top > R - 3) continue;          // keep the cornice band clear

    // spandrel course between storeys
    if (ys + 4 <= R - 2 && ys + 4 >= G) set(x, ys + 4, z, "stone_bricks");

    if (northFace || southFace) {
      // pier columns stand proud in stone for rhythm
      if (x % 3 === 0 && ys + 1 >= G) {
        for (let y = ys + 1; y <= top; y++) set(x, y, z, "stone_bricks");
      }
    }

    if (k === 0) {
      if (x >= 1 && x <= W - 2) set(x, Gbase + 3, z, "dark_oak_planks"); // shopfront fascia
    }

    // entrance: centre bay of ground floor
    if (k === 0 && x === 5) {
      set(x, Gbase + 1, z, "oak_door", {
        facing: outward, half: "lower", hinge: "left", open: "false", powered: "false",
      });
      set(x, Gbase + 2, z, "oak_door", {
        facing: outward, half: "upper", hinge: "left", open: "false", powered: "false",
      });
      set(x, Gbase + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    // glazing in the bays between piers
    if (x >= 1 && x <= W - 2 && x % 3 !== 0) {
      const rows = k === 0 ? [Gbase + 1, Gbase + 2] : [ys + 1, ys + 2, ys + 3];
      for (const y of rows) {
        if (y < G) continue;
        set(x, y, z, "glass_pane", {
          east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
        });
      }
      // warm lanterns just inside, standing on the floor slab
      if (insideOk && k % 2 === 1 && x % 3 === 1 && ys + 1 >= G) {
        set(x, ys + 1, inside, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/FR301499477.nbt`);
