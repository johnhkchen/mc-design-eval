import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103471";
const W = 42, H = 23, D = 49;
const ROOF = 11; // lidar: roof about 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => G.has(`${x},${z}`);
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const g = new Voxels([W, H, D]);

// Storey plan per cell: roof at ROOF (clamped), storeys about 5 blocks
const plan = (gr) => {
  const top = Math.min(Math.max(ROOF, gr + 5), 20);
  const span = top - gr;
  const storeys = Math.max(1, Math.round(span / 5));
  const levels = [];
  for (let k = 0; k < storeys; k++) levels.push(gr + Math.round((k * span) / storeys));
  return { top, levels };
};

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = G.get(`${x},${z}`);
  const per = perim(x, z);
  const { top, levels } = plan(gr);
  const storeyOf = (y) => {
    let k = 0;
    for (let i = 0; i < levels.length; i++) if (levels[i] <= y) k = i;
    return k;
  };

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (per) {
    const bay = (x + z) % 4;
    const pilaster = bay === 0;
    // Base course
    g.set(x, gr, z, "polished_andesite");
    for (let y = gr + 1; y <= top - 1; y++) {
      let id;
      if (y > gr && levels.includes(y)) {
        id = "light_gray_concrete"; // storey lines
      } else if (y === top - 1) {
        id = pilaster ? "stone_bricks" : "white_concrete"; // lintel row
      } else if (storeyOf(y) === 0) {
        // Shopfront: glass bays between polished piers
        id = pilaster ? "polished_andesite" : "light_blue_stained_glass";
      } else if (pilaster) {
        id = "stone_bricks"; // vertical pilasters
      } else {
        id = bay === 1 || bay === 2 ? "light_blue_stained_glass" : "white_concrete";
      }
      g.set(x, y, z, id);
    }
    // Projecting cornice slab on top of the wall, then parapet
    g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    if (top + 1 < H) g.set(x, top + 1, z, "white_concrete");
  } else {
    // Interior: floor slabs per storey, roof slab; air between
    g.set(x, gr, z, "smooth_stone");
    for (const lv of levels) if (lv > gr) g.set(x, lv, z, "light_gray_concrete");
    g.set(x, top, z, "stone");
    // Warm lanterns standing on floor slabs, behind the glass
    for (const lv of levels) {
      const y = lv + 1;
      if (y < top && (x * 5 + z * 3) % 11 === 0) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
    // Roof plant: grouped 2x2 boxes with iron caps
    const px = Math.floor(x / 2), pz = Math.floor(z / 2);
    if ((px * 7 + pz * 11) % 9 === 0 && top + 2 < H && x % 2 === 0 && z % 2 === 0) {
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const xx = x + dx, zz = z + dz;
        if (inside(xx, zz) && !perim(xx, zz)) {
          g.set(xx, top + 1, zz, "light_gray_concrete");
          g.set(xx, top + 2, zz, "iron_block");
        }
      }
    }
  }
}

// Recessed three-bay entrance on the street-facing (minimum z) side
const perimCells = cells.filter(([x, z]) => perim(x, z)).map(([x, z]) => [x, z]);
if (perimCells.length) {
  const minZ = Math.min(...perimCells.map(([, z]) => z));
  const front = perimCells.filter(([, z]) => z === minZ);
  const midX = Math.round(front.reduce((s, [x]) => s + x, 0) / front.length);
  for (const [x, z] of front) {
    const gr = G.get(`${x},${z}`);
    const { top } = plan(gr);
    const dx = Math.abs(x - midX);
    if (dx > 2 || gr + 4 > top - 1) continue;
    if (dx === 2) {
      // Stone jamb columns either side of the opening
      for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "stone_bricks");
    } else {
      // Three-high opening with glass lintel band above
      for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "air");
    }
    // Dark canopy band over the entrance
    g.set(x, gr + 4, z, "black_concrete");
  }
  // Hanging lantern in the middle of the opening
  const mid = front.find(([x]) => x === midX);
  if (mid) {
    const gr = G.get(`${mid[0]},${mid[1]}`);
    g.set(midX, gr + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
