import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${dir}/FR301499517.cells.json`, "utf8"));

const W = 71, H = 24, D = 39;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// raw values
const raw = new Map();
for (const [x, z, gr0, rf0] of cells) {
  raw.set(key(x, z), { gr: Math.max(0, gr0), rf: rf0 });
}

// smooth lidar noise: average over a neighbourhood, then quantise to tiers
function smooth(getter, radius) {
  const out = new Map();
  for (const [k] of raw) {
    const [x, z] = k.split(",").map(Number);
    let sum = 0, n = 0;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const v = raw.get(key(x + dx, z + dz));
        if (v) { sum += getter(v); n++; }
      }
    }
    out.set(k, sum / n);
  }
  return out;
}

const smGround = smooth((v) => v.gr, 2);
const smRoof = smooth((v) => v.rf, 2);

const map = new Map();
for (const [k, v] of raw) {
  const gr = Math.round(smGround.get(k));
  // flat tiers: roof rounded to even blocks
  let top = Math.round(smRoof.get(k) / 2) * 2;
  top = Math.min(H - 2, Math.max(top, gr + 5));
  map.set(k, { gr, top });
}

const entries = [...map.entries()].map(([k, v]) => {
  const [x, z] = k.split(",").map(Number);
  return [x, z, v];
});

// 1. Foundations, floors, perimeter walls, roof and shell
for (const [x, z, { gr, top }] of entries) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const missing = N.filter(([dx, dz]) => !map.has(key(x + dx, z + dz)));
  const perim = missing.length > 0;

  if (!perim) {
    g.set(x, gr, z, "smooth_stone");
  } else {
    const zFace = missing.some(([, dz]) => dz !== 0);
    const xFace = missing.some(([dx]) => dx !== 0);
    const idx = zFace && !xFace ? x : (xFace && !zFace ? z : x + z);
    const [mdx, mdz] = missing[0];
    const inDx = -mdx, inDz = -mdz;

    for (let y = gr; y <= top - 2; y++) {
      let id = "smooth_sandstone";
      if (y < gr + 2) id = "stone_bricks";                          // base course
      else if (y === top - 2) id = "stone_bricks";                  // cornice band
      else if (y <= top - 4 && (idx % 5 === 2 || idx % 5 === 3)) id = "glass_pane";
      else if (y <= top - 4 && idx % 5 === 0) id = "stone_bricks";  // pier
      g.set(x, y, z, id);

      // warm light behind some windows
      if (y === gr + 4 && idx % 10 === 2) {
        const ix = x + inDx, iz = z + inDz;
        if (map.has(key(ix, iz))) g.set(ix, y, iz, "glowstone");
      }
    }

    // parapet cap
    g.set(x, top, z, "smooth_sandstone_slab", { type: "top", waterlogged: "false" });
  }

  // flat roof surface (lighter render-coloured membrane)
  g.set(x, top - 1, z, "smooth_stone");
}

// 2. Entrance on the street (z minimum) face, nearest the middle
let minZ = Infinity;
for (const [, z] of entries) minZ = Math.min(minZ, z);
let door = null;
for (const [x, z, v] of entries) {
  if (z !== minZ) continue;
  if (!door || Math.abs(x - 35) < Math.abs(door.x - 35)) door = { x, z, gr: v.gr };
}
if (door) {
  const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(door.x, door.gr, door.z, "oak_door", { ...props, half: "lower" });
  g.set(door.x, door.gr + 1, door.z, "oak_door", { ...props, half: "upper" });
  // lantern either side of the door on the wall face
  for (const lx of [door.x + 2, door.x - 2]) {
    if (map.has(key(lx, door.z))) {
      const gr = map.get(key(lx, door.z)).gr;
      g.set(lx, gr + 3, door.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/FR301499517.nbt`);
