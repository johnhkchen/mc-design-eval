import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499494";
const W = 59, H = 24, D = 16;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => ({ x: c[0], z: c[1], g: c[2], r: c[3] }));
const F = new Map();
for (const c of cells) F.set(`${c.x},${c.z}`, c);
const has = (x, z) => F.has(`${x},${z}`);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const isEdge = (x, z) => {
  if (!has(x, z)) return false;
  return NB.some(([dx, dz]) => !has(x + dx, z + dz));
};

// Smooth lidar roof heights, then quantize to clean two-block tiers
for (const c of cells) {
  const pts = [c.r];
  for (const [dx, dz] of NB) {
    const n = F.get(`${c.x + dx},${c.z + dz}`);
    if (n) pts.push(n.r);
  }
  const avg = pts.reduce((a, b) => a + b, 0) / pts.length;
  const tier = Math.round(avg / 2) * 2;
  c.top = clamp(tier, c.g + 6, 22);
}

const g = new Voxels([W, H, D]);

// 1. Foundations, ground slab, roof slab over every footprint cell
for (const c of cells) {
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone_bricks");
  g.set(c.x, c.g, c.z, "smooth_stone");
  g.set(c.x, c.top, c.z, "smooth_stone");
}

// 2. Perimeter walls: render, plinth, cornice, parapet
for (const c of cells) {
  if (!isEdge(c.x, c.z)) continue;
  for (let y = c.g + 1; y <= c.top - 1; y++) {
    g.set(c.x, y, c.z, "smooth_sandstone");
  }
  // Stone plinth course at the base of the shopfront
  g.set(c.x, c.g + 1, c.z, "stone_bricks");
  // Cornice course under the roof
  g.set(c.x, c.top - 1, c.z, "stone_bricks");
  // Parapet
  g.set(c.x, c.top + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 3. Facade articulation on each exposed face
for (const c of cells) {
  if (!isEdge(c.x, c.z)) continue;
  for (const f of FACES) {
    if (has(c.x + f.dx, c.z + f.dz)) continue;
    const along = f.dz !== 0 ? c.x : c.z;
    const maxRel = c.top - c.g;

    // Pilasters every 8 blocks: full-height stone_bricks strips
    if (along % 8 === 0) {
      for (let rel = 1; rel <= maxRel - 1; rel++) {
        g.set(c.x, c.g + rel, c.z, "stone_bricks");
      }
    }

    // Shopfront band rel 2..3: glass with dark frames every 4 blocks
    for (let rel = 2; rel <= 3; rel++) {
      const y = c.g + rel;
      if (along % 4 === 0) {
        g.set(c.x, y, c.z, "dark_oak_planks");
      } else {
        g.set(c.x, y, c.z, "glass");
      }
    }
    // Shopfront lintel rel 4 in stone; red canopy band over the entrance
    g.set(c.x, c.g + 4, c.z, "stone_bricks");

    // Upper window grid
    for (let rel = 6; rel <= maxRel - 3; rel++) {
      const y = c.g + rel;
      if (along % 4 === 1 || along % 4 === 2) {
        g.set(c.x, y, c.z, "glass");
        const ix = c.x - f.dx, iz = c.z - f.dz;
        if (along % 8 === 1 && rel === 7 && has(ix, iz) && !isEdge(ix, iz)) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }

    // Entrance on the south frontage: door, glazed flanks, red canopy band
    if (f.name === "south" && c.x >= 5 && c.x <= 7) {
      if (c.x === 6) {
        g.set(c.x, c.g + 1, c.z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        g.set(c.x, c.g + 2, c.z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(c.x, c.g + 1, c.z, "stone_bricks");
        g.set(c.x, c.g + 2, c.z, "glass");
        g.set(c.x, c.g + 3, c.z, "glass");
      }
      g.set(c.x, c.g + 4, c.z, "red_terracotta");
      g.set(c.x, c.g + 5, c.z, "red_terracotta");
    }
  }
}

// 4. Roof equipment and a lit skylight strip
const plant = [
  [10, 5], [11, 5], [10, 6], [11, 6],
  [34, 9], [35, 9], [34, 10], [35, 10],
  [50, 4], [51, 4], [50, 5], [51, 5],
];
for (const [x, z] of plant) {
  if (has(x, z) && !isEdge(x, z)) {
    g.set(x, F.get(`${x},${z}`).top + 1, z, "iron_block");
  }
}
for (let x = 20; x <= 26; x++) {
  const z = 8;
  if (has(x, z) && !isEdge(x, z)) {
    g.set(x, F.get(`${x},${z}`).top, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
