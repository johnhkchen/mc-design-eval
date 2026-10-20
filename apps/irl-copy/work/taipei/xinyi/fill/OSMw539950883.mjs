import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source record. Read from lidar: roof about 11 blocks above lowest ground.
// Reading: a 2-storey commercial block (shophouse-era, late-20th-century Xinyi frontage):
// stone-clad shopfront at street level, white-tiled upper storey with a window grid,
// a red sign band, a stone cornice and a plant/AC roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950883";
const W = 29, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gy = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const TOP = minG + 10;          // topmost solid layer (cornice / roof deck); 11 layers total
const EQUIP = TOP + 1;          // roof equipment layer

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const zMin = Math.min(...cells.map((c) => c[1]));
// Entrance: the street-facing (min z) cell nearest the median x
const frontXs = cells.filter((c) => c[1] === zMin).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const isExt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const alongX = (x, z) => !has(x, z - 1) || !has(x, z + 1); // wall runs east-west

const pane = (x, z) =>
  alongX(x, z)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const lights = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = isExt(x, z);
  const door = ext && z === zMin && x === doorX;

  for (let y = gr; y <= TOP; y++) {
    const t = y - minG;

    if (!ext) {
      // Interior: floor slabs only, air otherwise (no interiors)
      if (y === gr || t === 5 || t === 10) put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_andesite"); continue; } // base course
    if (t === 10) { put(x, y, z, "smooth_stone"); continue; }     // cornice

    if (t <= 3) {
      // Ground floor shopfront
      if (door && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "iron_door", {
          facing: "south", half: y === gr + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (door && y === gr + 3) { put(x, y, z, "smooth_stone"); continue; }
      if (x % 4 === 0 || x === 0 || x === W - 1) { put(x, y, z, "polished_granite"); continue; }
      put(x, y, z, "glass_pane", pane(x, z));
      if ((x + z) % 4 === 0 && t === 2) lights.push([x, y, z, "glowstone"]);
      continue;
    }

    if (t === 4) { put(x, y, z, "red_terracotta"); continue; }   // sign band
    if (t === 5) { put(x, y, z, "white_concrete"); continue; }   // storey spandrel

    // Upper storey (t 6..9): piers, sills, lintels, glazing
    if (t >= 6 && t <= 9) {
      if (x % 3 === 0 || x === 0 || x === W - 1) { put(x, y, z, "white_concrete"); continue; }
      if (t === 6 || t === 9) { put(x, y, z, "smooth_stone"); continue; }
      put(x, y, z, "glass_pane", pane(x, z));
      if ((x + z) % 3 === 0 && t === 7) lights.push([x, y, z, "shroomlight"]);
    }
  }

  // Roof plant on the deck, interior cells only
  if (!ext && x % 7 === 3 && z % 5 === 2) put(x, EQUIP, z, "iron_block");
}

// Door canopy is implied by the lintel; warm light behind glass on the interior side
for (const [x, y, z, id] of lights) {
  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1; else if (!has(x, z + 1)) dz = -1;
  if (!has(x - 1, z)) dx = 1; else if (!has(x + 1, z)) dx = -1;
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isExt(ix, iz)) continue;
  if (y <= gy(ix, iz)) continue;
  put(ix, y, iz, id);
}

g.save(`${DIR}/${ID}.nbt`);
