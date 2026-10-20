import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833628";

// Footprint: 17 x 11 cells, [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 17, H = 23, D = 11;

const ground = new Map();
for (const [x, z, gy] of raw) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Storey plan (relative to lowest ground r = y - minG):
//  r0      base course / ground-floor slab
//  r1-3    shopfront glazing with white pillars, entrance at mid south face
//  r4      lintel band
//  r5      storey line (also 2nd-floor slab inside)
//  r6-8    upper storey windows with white mullions
//  r9      cornice (perimeter) / roof deck (interior)
//  r10     parapet (perimeter) / rooftop plant (interior)
// Roof top sits at minG + 11, about 11 blocks above lowest ground.

const cells = [...ground.entries()].map(([k, gc]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gc };
});

const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Axis along which the facade runs for pattern purposes
const axisOf = (x, z) => (!has(x, z - 1) || !has(x, z + 1)) ? "x" : "z";
const tOf = (x, z) => (axisOf(x, z) === "x" ? x : z);
const atEnd = (x, z) => axisOf(x, z) === "x"
  ? (!has(x - 1, z) || !has(x + 1, z))
  : (!has(x, z - 1) || !has(x, z + 1));
const isPillar = (x, z, r) => {
  const t = tOf(x, z);
  if (atEnd(x, z)) return true;
  if (r <= 3) return t % 3 === 0;
  return t % 2 === 0;
};
// Inward neighbour for a perimeter cell (first missing side)
const inward = (x, z) => {
  if (!has(x, z - 1)) return [x, z + 1];
  if (!has(x, z + 1)) return [x, z - 1];
  if (!has(x - 1, z)) return [x + 1, z];
  return [x - 1, z];
};

// Entrance: middle of the south (z max) face
const southCells = cells.filter(c => !has(c.x, c.z + 1)).sort((a, b) => a.x - b.x);
const entranceKey = southCells.length
  ? `${southCells[Math.floor(southCells.length / 2)].x},${southCells[Math.floor(southCells.length / 2)].z}`
  : null;

// Warm lights behind some windows (shroomlight upstairs, glowstone in shopfronts)
const glow = new Map();
for (const c of cells) {
  if (!perim(c.x, c.z)) continue;
  const t = tOf(c.x, c.z);
  const [ix, iz] = inward(c.x, c.z);
  if (!has(ix, iz) || perim(ix, iz)) continue;
  if (`${c.x},${c.z}` === entranceKey) continue;
  // upper windows
  if (!isPillar(c.x, c.z, 7) && t % 4 === 1) {
    glow.set(`${ix},${minG + 7},${iz}`, "shroomlight");
  }
  // shopfront
  if (!isPillar(c.x, c.z, 2) && t % 6 === 2) {
    glow.set(`${ix},${minG + 2},${iz}`, "glowstone");
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const roofTop = minG + 10; // highest body block; top surface at minG + 11

for (const c of cells) {
  const { x, z, gc } = c;

  // Foundation under the cell
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const isPer = perim(x, z);
  const isEntrance = `${x},${z}` === entranceKey;

  for (let y = gc; y <= roofTop; y++) {
    const r = y - minG;

    if (isPer) {
      if (r === 10) { put(x, y, z, "smooth_stone"); continue; }     // parapet
      if (r === 9) { put(x, y, z, "white_concrete"); continue; }    // cornice
      if (r === 8 || r === 7 || r === 6) {
        if (isPillar(x, z, r)) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (r === 5) { put(x, y, z, "white_concrete"); continue; }    // storey line
      if (r === 4) { put(x, y, z, "smooth_stone"); continue; }      // lintel
      if (r >= 1 && r <= 3) {
        if (isEntrance) {
          if (r === 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (r === 2) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
          put(x, y, z, "light_blue_stained_glass"); continue;
        }
        if (isPillar(x, z, r)) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (r === 0) { put(x, y, z, "polished_andesite"); continue; } // base course
    } else {
      // interior: air gap, floor slabs and roof deck only
      if (r === 0) { put(x, y, z, "smooth_stone"); continue; }
      if (r === 5) { put(x, y, z, "smooth_stone"); continue; }
      if (r === 9) { put(x, y, z, "light_gray_concrete"); continue; }
      if (r === 10) {
        if (x % 5 === 2 && z % 4 === 1) put(x, y, z, "iron_block");   // rooftop plant
        continue;
      }
      const gl = glow.get(`${x},${y},${z}`);
      if (gl) put(x, y, z, gl);
    }
  }
}

// Shopfront glow for cells placed on the ground floor in case the glow
// cell itself sits at a foundation-free level
for (const [k, id] of glow) {
  const [x, y, z] = k.split(",").map(Number);
  if (!perim(x, z) && has(x, z) && y >= ground.get(`${x},${z}`)) put(x, y, z, id);
}

g.save(`${DIR}/${ID}.nbt`);
