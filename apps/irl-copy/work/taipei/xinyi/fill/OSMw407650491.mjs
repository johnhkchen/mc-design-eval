import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650491";
const W = 133, H = 23, D = 46;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = Math.min(...cells.map((c) => c[2]));
const TOP = G + 10;          // parapet cap (roof surface at G+11)
const S1 = [G + 1, G + 3];   // ground-floor glazing band
const S2 = [G + 6, G + 8];   // upper-floor glazing band

const key = (x, z) => x + "," + z;
const gmap = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => gmap.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function faceNormal(x, z) {
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  return null;
}

const DIR_NAME = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const inRange = (v, [a, b]) => v >= a && v <= b;

// Central pavilion: interior cells near the footprint centroid, on the roof deck.
const cxAvg = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const czAvg = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const pavilion = new Set();
for (const [x, z, gr] of cells) {
  if (faceNormal(x, z)) continue;
  if (gr > G + 9) continue;
  if (Math.abs(x - cxAvg) <= 7 && Math.abs(z - czAvg) <= 5) pavilion.add(key(x, z));
}
const pav = [...pavilion].map((k) => k.split(",").map(Number));
const pavRim = (x, z) => !pavilion.has(key(x - 1, z)) || !pavilion.has(key(x + 1, z)) ||
                         !pavilion.has(key(x, z - 1)) || !pavilion.has(key(x, z + 1));

const ENTRANCE_CENTRE = 60;   // entrances every 60 blocks along each face

for (const [x, z, gr] of cells) {
  // Foundation.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const nrm = faceNormal(x, z);

  for (let y = gr; y <= TOP; y++) {
    if (nrm) {
      const [nx, nz] = nrm;
      const p = nz !== 0 ? x : z;
      const m = ((p % 60) + 60) % 60;
      const m4 = ((p % 4) + 4) % 4;
      const isDoor = (m === 30 || m === 31);
      const isPillar = (m === 29 || m === 32);
      const dirName = DIR_NAME[`${nx},${nz}`];
      const paneProps = nz !== 0
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      const windowCol = m4 === 1 || m4 === 2;
      const doorHinge = m === 30 ? "left" : "right";

      if (y === gr) {
        put(x, y, z, "smooth_quartz");                              // base course
      } else if (y === TOP) {
        put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      } else if (y === G + 9) {
        put(x, y, z, "red_terracotta");                             // tiled cornice band
      } else if (y === G + 5 || y === G + 4) {
        // string course and lintels; entrance lintel doubles as a red canopy band
        if (isDoor || isPillar) put(x, y, z, "red_terracotta");
        else put(x, y, z, "light_gray_concrete");
      } else if (inRange(y, S1)) {
        if (isDoor) {
          if (y === G + 1) put(x, y, z, "dark_oak_door",
            { facing: dirName, half: "lower", hinge: doorHinge, open: "false", powered: "false" });
          else if (y === G + 2) put(x, y, z, "dark_oak_door",
            { facing: dirName, half: "upper", hinge: doorHinge, open: "false", powered: "false" });
          else put(x, y, z, "glass");                               // transom
        } else if (isPillar) {
          put(x, y, z, "smooth_quartz");
        } else if (windowCol) {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps);
        } else {
          put(x, y, z, "white_concrete");
        }
        // warm light behind a ground-floor pane
        if (windowCol && y === G + 2 && m4 === 1 && p % 12 === 6) {
          const ix = x - nx, iz = z - nz;
          if (has(ix, iz)) put(ix, y, iz, "shroomlight");
        }
      } else if (inRange(y, S2)) {
        if (windowCol) {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps);
        } else {
          put(x, y, z, "white_concrete");
        }
        if (windowCol && y === G + 7 && m4 === 2 && p % 12 === 2) {
          const ix = x - nx, iz = z - nz;
          if (has(ix, iz)) put(ix, y, iz, "shroomlight");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    } else {
      // Interior: floor slab at the storey line and roof deck.
      if (y === G + 5 || y === G + 9) put(x, y, z, "smooth_stone");
    }
  }

  // Rooftop AC plant on interior roof cells (outside the pavilion).
  if (!nrm && gr <= G + 9 && !pavilion.has(key(x, z))) {
    if ((x % 14 === 4 || x % 14 === 5 || x % 14 === 6) && (z % 10 === 3 || z % 10 === 4)) {
      put(x, G + 10, z, "light_gray_concrete");
    }
  }
}

// Lanterns standing inside each entrance, on the interior ground floor.
for (const [x, z, gr] of cells) {
  const nrm = faceNormal(x, z);
  if (!nrm) continue;
  const [nx, nz] = nrm;
  const p = nz !== 0 ? x : z;
  const m = ((p % 60) + 60) % 60;
  if (m !== 30 && m !== 31) continue;
  if (gr > G + 1) continue;
  if (m === 30) {
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && gmap.get(key(ix, iz)) <= G + 1) {
      put(ix, G + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Central pavilion: solid mass on the roof deck, glass rim, flat cap.
for (const [x, z] of pav) {
  put(x, G + 10, z, "white_concrete");
  put(x, G + 11, z, pavRim(x, z) ? "glass" : "white_concrete");
  put(x, G + 12, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
