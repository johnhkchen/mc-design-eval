import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (c. 1990s Xinyi): cream ceramic-tile facade,
// red-brown spandrels, glazed shopfront at street level, flat roof with a plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738224";
const W = 54, H = 23, D = 41;
const ROOF = 10;      // roof slab level
const PARAPET = 11;   // top of parapet
const BAND = 5;       // storey string course / ground-floor ceiling

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const perimDirs = (x, z) => dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => perimDirs(x, z).length > 0;

const vox = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) vox.set(x, y, z, b, p);
  else vox.set(x, y, z, b);
};

// Entrance: north face, middle bays
const ENTRANCE = (x, u, dz) => dz === -1 && u >= 24 && u <= 29;

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const pd = perimDirs(x, z);
  const perim = pd.length > 0;
  const [dx, dz] = pd[0] ?? [0, 0];
  const u = dz !== 0 ? x : z;     // position along the face
  const pillar = u % 4 === 0;

  if (!perim) {
    // Interior: ground slab (if above ground floor), storey slabs, roof slab
    if (gr >= BAND) {
      for (let y = gr; y <= ROOF; y++) put(x, y, z, "stone");
    } else {
      put(x, gr, z, "smooth_stone");
      put(x, BAND, z, "smooth_quartz");
      put(x, ROOF, z, "smooth_quartz");
    }
    continue;
  }

  // Perimeter walls, gr..parapet
  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }      // cornice
    if (y === BAND) { put(x, y, z, "polished_andesite"); continue; }  // string course

    if (y < BAND) {
      // Ground storey: shopfront
      if (y === gr) { put(x, y, z, "polished_andesite"); continue; }
      if (y === 4) { put(x, y, z, pillar ? "smooth_quartz" : "black_concrete"); continue; }
      if (ENTRANCE(x, u, dz) && y <= 3 && (u === 24 || u === 29 || u === 25 || u === 28 || u === 26 || u === 27)) {
        // Doorway opening; glass doors in the two central bays
        if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
        if (u === 26 || u === 27) { put(x, y, z, "air"); continue; }
        put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper storey (y 6..9)
    if (y === 6 || y === 9) {
      put(x, y, z, pillar ? "smooth_quartz" : "red_terracotta");
      continue;
    }
    if (y === 7 || y === 8) {
      if (pillar) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }
  }

  // Warm lights behind some upper windows
  const winBay = !pillar && u % 4 === 2;
  if (winBay && ((u >> 2) + (dx + 2 * dz + 3)) % 3 === 0) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, 7, iz, "glowstone");
  }

  // Entrance light: sea lantern just inside the central doorway
  if (ENTRANCE(x, u, dz) && (u === 26 || u === 27) && gr < BAND) {
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, gr + 1, iz, "sea_lantern");
  }
}

// Roof plant enclosure (interior cells only) with a small mast
for (let x = 18; x <= 34; x++) {
  for (let z = 14; z <= 26; z++) {
    if (!has(x, z)) continue;
    for (let y = PARAPET; y <= 13; y++) put(x, y, z, "light_gray_concrete");
    put(x, 14, z, "smooth_stone");
  }
}
// Louvred vents on the plant box faces
for (let z = 16; z <= 24; z += 2) {
  if (has(18, z)) put(18, 12, z, "iron_bars");
  if (has(34, z)) put(34, 12, z, "iron_bars");
}
if (has(26, 20)) {
  put(26, 15, 20, "lightning_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
