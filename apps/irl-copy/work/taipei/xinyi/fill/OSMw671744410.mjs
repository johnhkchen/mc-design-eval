import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw671744410";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 57, H = 23, D = 33;
const g = new Voxels([W, H, D]);

// Footprint lookup
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const inFp = (x, z) => fp.has(key(x, z));

const isEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const onZEdge = (x, z) => !inFp(x, z - 1) || !inFp(x, z + 1); // north/south faces
const onXEdge = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z); // east/west faces

// Mullion piers: every 4 blocks along each facade, corners always
const pier = (x, z) => {
  const zE = onZEdge(x, z), xE = onXEdge(x, z);
  if (zE && xE) return true;
  if (zE && x % 4 === 0) return true;
  if (xE && z % 4 === 0) return true;
  return false;
};

const zMax = Math.max(...cells.map(([, z]) => z));

// Roof is ~11 blocks above lowest ground: storey 1 (y gr..4), band y5,
// storey 2 (y6..10), roof slab y11, parapet y11..12.
for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(gr0, 0), 10);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floors only where the cell is above its own ground
  const put = (y, id, props) => {
    if (y >= gr && y < H) g.set(x, y, z, id, props);
  };

  const edge = isEdge(x, z);

  // Floor slab per storey and roof slab (stand on the cell below)
  put(5, "smooth_quartz");
  put(11, "smooth_quartz");

  if (edge) {
    const pr = pier(x, z);
    // Storey 1: shopfront glass with white piers
    for (let y = gr; y <= 4; y++) put(y, pr ? "white_concrete" : "glass");
    // Storey 2: glazing with piers
    for (let y = 6; y <= 10; y++) put(y, pr ? "white_concrete" : "glass");
    // Parapet / cornice
    put(11, "white_concrete");
    put(12, "white_concrete");

    // Entrance on the south face, centred
    if (onZEdge(x, z) && z === zMax && x >= 24 && x <= 32) {
      for (let y = gr; y <= 3; y++) put(y, "glass");
      put(4, "white_concrete"); // entrance lintel
    }
  }

  // Interior: ceiling lights attached to slabs above (warm, behind glass zone)
  if (!edge) {
    if ((x * 7 + z * 3) % 13 === 0) put(4, "glowstone");
    if ((x * 5 + z * 11) % 13 === 0) put(10, "shroomlight");

    // Roof equipment: small plant boxes standing on the roof slab
    if (x % 12 >= 5 && x % 12 <= 7 && z % 10 >= 3 && z % 10 <= 4) {
      g.set(x, 12, z, "light_gray_concrete");
      g.set(x, 13, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
