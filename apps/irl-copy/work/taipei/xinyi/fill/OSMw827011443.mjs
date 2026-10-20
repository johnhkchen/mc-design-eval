import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s Taipei office block: five storeys of white tiled piers, tinted
// glass bays, grey spandrels, a granite base with a shopfront entrance, a cornice
// and parapet, and a central plant core with an aviation light on a short mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011443";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 38, D = 19;
const ROOF = 26;          // parapet top, from lidar roof height
const STOREY = 5;         // blocks per storey
const CORNICE = 25;       // top storey line

const g = new Voxels([W, H, D]);

const gnd = new Map();
for (const [x, z, h] of cells) gnd.set(`${x},${z}`, h);
const has = (x, z) => gnd.has(`${x},${z}`);
const G = (x, z) => gnd.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerimeter = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const isCorner = (x, z) =>
  (!has(x + 1, z) || !has(x - 1, z)) && (!has(x, z + 1) || !has(x, z - 1));

// Bay coordinate along the face the cell sits on
const faceU = (x, z) => (!has(x, z - 1) || !has(x, z + 1) ? x : z);

// Inward direction from an exterior face
const inward = (x, z) => {
  if (!has(x, z - 1)) return [0, 1];
  if (!has(x, z + 1)) return [0, -1];
  if (!has(x - 1, z)) return [1, 0];
  if (!has(x + 1, z)) return [-1, 0];
  return null;
};

const isEntrance = (x, z) => z === 0 && x >= 10 && x <= 12;

// Pass 1: foundation, floor at each cell's ground, walls, floors, parapet
for (const [x, z, gc] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const perim = isPerimeter(x, z);

  // Base slab at the cell's ground level
  put(x, gc, z, perim ? "polished_granite" : "smooth_stone");

  if (perim) {
    const corner = isCorner(x, z);
    const u = faceU(x, z);
    const pier = corner || u % 3 === 0;

    for (let y = gc + 1; y <= ROOF; y++) {
      if (y === ROOF) { put(x, y, z, "smooth_stone"); continue; }     // parapet cap
      if (y === CORNICE) { put(x, y, z, "white_concrete"); continue; } // cornice line
      const r = y % STOREY;
      const storey = Math.floor(y / STOREY);

      if (storey === 0 && isEntrance(x, z) && y >= 1 && y <= 3) continue; // open entrance

      if (r === 0) { put(x, y, z, "white_concrete"); continue; }        // storey line
      if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; }   // spandrel
      // window band rows 1..3
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  } else {
    // Interior: floor slabs only, air gap otherwise
    for (let y = gc + 1; y <= 25; y++) {
      if (y % STOREY === 0) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Pass 2: entrance lintel and hanging lantern
for (let x = 9; x <= 13; x++) put(x, 4, 0, "polished_granite");
put(11, 4, 1, "lantern", { hanging: "true" });

// Pass 3: warm lights behind some glazed bays
for (const [x, z, gc] of cells) {
  if (!isPerimeter(x, z) || isCorner(x, z)) continue;
  const u = faceU(x, z);
  if (u % 3 === 0) continue;
  const inw = inward(x, z);
  if (!inw) continue;
  const [dx, dz] = inw;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  for (let k = 0; k < 5; k++) {
    const y0 = k * STOREY;
    if (y0 + 2 <= gc) continue;
    if (k === 0 && isEntrance(x, z)) continue;
    if ((u + k * 3) % 7 === 2) put(ix, y0 + 2, iz, "shroomlight");
  }
}

// Pass 4: plant core on the roof with aviation mast
for (let x = 8; x <= 14; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    const ring = x === 8 || x === 14 || z === 6 || z === 12;
    for (let y = ROOF; y <= 28; y++) {
      if (ring) put(x, y, z, "light_gray_concrete");
    }
    put(x, 29, z, "smooth_stone");
  }
}
for (let y = 30; y <= 33; y++) put(11, y, 9, "iron_bars");
put(11, 34, 9, "shroomlight");

g.save(`${DIR}/${ID}.nbt`);
