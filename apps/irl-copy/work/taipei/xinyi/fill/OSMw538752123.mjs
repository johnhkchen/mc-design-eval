import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752123";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 15;
const vox = new Voxels([W, H, D]);

// Footprint lookup: ground level per cell, clamped so the body keeps at least one storey.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(9, Math.max(0, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isBoundary = (x, z) =>
  !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const FACES = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];

const paneProps = (dx) =>
  dx === 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: north-facing boundary cell closest to the footprint's centre column.
const cxs = cells.map(([x]) => x);
const centreX = (Math.min(...cxs) + Math.max(...cxs)) / 2;
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - centreX);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cells) {
  const gr = gnd(x, z);
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs and roof deck on interior cells (no interiors, just air gaps).
for (const [x, z] of cells) {
  if (isBoundary(x, z)) continue;
  const gr = gnd(x, z);
  vox.set(x, gr, z, "smooth_stone");          // ground floor slab
  if (gr <= 5) vox.set(x, 5, z, "smooth_stone"); // second floor slab
  vox.set(x, 10, z, "gray_concrete");         // roof deck
}

// 3. Facades on every boundary face.
const lightSpots = [];
for (const [x, z] of cells) {
  const gr = gnd(x, z);
  for (const f of FACES) {
    if (has(x + f.dx, z + f.dz)) continue;

    const alongX = f.dx === 0;
    const u = alongX ? x : z;
    const corner = alongX
      ? (!has(x - 1, z) || !has(x + 1, z))
      : (!has(x, z - 1) || !has(x, z + 1));
    const pilaster = corner || u % 3 === 0;
    const isDoor = f.facing === "north" && doorKey === `${x},${z}`;
    const pp = paneProps(f.dx);

    for (let y = gr; y <= 10; y++) {
      if (isDoor && (y === gr || y === gr + 1) && y <= 4) {
        vox.set(x, y, z, "iron_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === 10) {
        vox.set(x, y, z, "light_gray_concrete"); // cornice
        continue;
      }
      if (y === 5) {
        vox.set(x, y, z, "light_gray_concrete"); // belt course / storey line
        continue;
      }
      if (y === gr) {
        vox.set(x, y, z, pilaster ? "quartz_block" : "polished_andesite"); // base course
        continue;
      }
      if (y <= 4) {
        // Ground storey: shopfront
        if (pilaster) vox.set(x, y, z, "quartz_block");
        else if (y === 4) vox.set(x, y, z, "white_concrete"); // transom
        else vox.set(x, y, z, "glass_pane", pp);
      } else {
        // Upper storey
        if (pilaster) vox.set(x, y, z, "quartz_block");
        else if (y === 6 || y === 9) vox.set(x, y, z, "white_concrete");
        else vox.set(x, y, z, "cyan_stained_glass_pane", pp);
      }
    }

    // Parapet above the cornice.
    vox.set(x, 11, z, pilaster ? "quartz_block" : "white_concrete");

    // Interior light spots behind selected windows.
    const ix = x - f.dx, iz = z - f.dz;
    if (!pilaster && has(ix, iz) && !isBoundary(ix, iz)) {
      if (gr + 1 <= 3 && !isDoor) lightSpots.push([ix, gr + 1, iz]);
      if (u % 6 === 1) lightSpots.push([ix, 6, iz]);
    }
  }
}

// 4. Warm lights behind glass.
for (const [x, y, z] of lightSpots) {
  if (y < 11 && has(x, z)) vox.set(x, y, z, "glowstone");
}

// 5. Roof equipment: a sparse grid of AC housings on the interior roof.
for (const [x, z] of cells) {
  if (isBoundary(x, z)) continue;
  if (gnd(x, z) > 9) continue;
  if (x >= 8 && x <= 13 && z >= 5 && z <= 9 && x % 2 === 0 && z % 2 === 0) {
    vox.set(x, 11, z, "light_gray_concrete");
    if (x % 4 === 0) vox.set(x, 12, z, "gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
