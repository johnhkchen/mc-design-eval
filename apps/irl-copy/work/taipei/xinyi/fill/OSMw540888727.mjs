import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district low-rise commercial block, c. 1980s Taipei:
// two shopfront/office storeys (~5 blocks each), white-tiled quartz facade,
// tinted blue glass in mullioned bays, parapet, rooftop plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888727";
const W = 17, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of cells) ground.set(key(c[0], c[1]), c[2]);
const base = Math.min(...ground.values());          // lowest ground under footprint
const inFp = (x, z) => ground.has(key(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Which outward faces a footprint cell exposes
function facesOf(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
}
const along = (f, x, z) => (f === "N" || f === "S" ? x : z); // position along a face
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Extent of each face along its length
const range = {};
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const f of facesOf(x, z)) {
    const t = along(f, x, z);
    if (!range[f]) range[f] = { min: t, max: t };
    range[f].min = Math.min(range[f].min, t);
    range[f].max = Math.max(range[f].max, t);
  }
}
const entranceFace = range.S ? "S" : (range.N ? "N" : null);
const entranceT = entranceFace ? Math.round((range[entranceFace].min + range[entranceFace].max) / 2) : null;

// Level bookkeeping (absolute y)
const L = { lintel: base + 4, spandSt2: base + 5, spandTop: base + 9, parapet: base + 10, roofUnits: base + 11 };
const floorLevels = [base, base + 5, base + 10];

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const perim = faces.length > 0;

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors)
    for (const fl of floorLevels) if (fl >= gr && fl <= L.parapet) put(x, fl, z, "smooth_stone");
    if (base + 10 >= gr) put(x, base + 10, z, "smooth_stone"); // roof deck
    // Rooftop plant boxes on a grid
    if ((x + z) % 4 === 0) put(x, L.roofUnits, z, "light_gray_concrete");
    continue;
  }

  const f = faces[0];
  const t = along(f, x, z);
  const t0 = range[f].min, t1 = range[f].max;
  const isCorner = faces.length >= 2 || t === t0 || t === t1;
  const isMullion = isCorner || (t - t0) % 3 === 0;
  const isEntranceCell = f === entranceFace && t === entranceT;

  for (let y = gr; y <= L.parapet; y++) {
    const rel = y - base;
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; } // base course
    if (y === L.parapet) { put(x, y, z, "smooth_quartz"); continue; } // parapet
    if (y === L.lintel) { put(x, y, z, "smooth_quartz"); continue; } // ground-storey cornice band
    if (y === L.spandSt2 || y === L.spandTop) { put(x, y, z, "quartz_block"); continue; } // spandrels

    const groundStorey = rel <= 4;
    const glassRow = groundStorey ? rel >= 1 : rel >= 6 && rel <= 8;
    if (!glassRow) { put(x, y, z, "quartz_block"); continue; }

    // Entrance: glass doorway in the middle of the south face
    if (groundStorey && isEntranceCell && y <= gr + 2) { put(x, y, z, "glass"); continue; }

    if (isMullion) put(x, y, z, "quartz_pillar");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }

  // Entrance canopy lantern above the doorway
  if (isEntranceCell) put(x, gr + 3, z, "lantern", { hanging: "true" });

  // Roof terrace units on the parapet line are unnecessary; keep roof clean
  put(x, base + 10, z, "smooth_quartz");
}

// Warm lights behind glass: place in the interior cell just inside the facade
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  if (!faces.length) continue;
  const f = faces[0];
  const t = along(f, x, z);
  const t0 = range[f].min;
  const isCorner = faces.length >= 2 || t === t0 || t === range[f].max;
  if (isCorner) continue;
  const [dx, dz] = inward[f];
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz)) continue;
  if (facesOf(ix, iz).length) continue; // inner cell must be interior, not wall

  const bay = (t - t0) % 6;
  // Upper storey lamp (glowstone) behind glass
  if (bay === 1 && base + 7 >= ground.get(key(ix, iz))) put(ix, base + 7, iz, "glowstone");
  // Shopfront lamp (shroomlight) behind glass
  if (bay === 4 && base + 2 >= ground.get(key(ix, iz)) && base + 2 > gr) put(ix, base + 2, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
