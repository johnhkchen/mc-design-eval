import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098852";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => map.has(`${x},${z}`);
const groundOf = (x, z) => map.get(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const minG = Math.min(...map.values());
// Roof: 11 blocks above lowest ground. Top block of parapet/cornice at rel 10.
const TOP = 10;            // rel index of cornice / roof slab
const SLAB1 = 5;           // storey line between floors
const FLOOR1 = 1;          // first window row
const FLOOR2 = 6;          // second window row
const ROOF_EQUIP_TOP = 12; // plant room top (rel)

// Entrance: on the southern (max z) edge, central x
const maxZ = Math.max(...[...map.keys()].map(k => +k.split(",")[1]));
const southXs = [...map.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([, z]) => z === maxZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// ---- per-cell massing and facade -------------------------------------------
for (const [key, gr] of map) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // foundation under the cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < minG + TOP + 1; y++) {
    const rel = y - minG;

    if (!edge) {
      // interior: floor slabs and roof, air between (no interiors)
      if (y === gr || rel === SLAB1 || rel === TOP) {
        put(x, y, z, rel === TOP ? "light_gray_concrete" : "smooth_stone");
      }
      continue;
    }

    // ----- exterior shell -----
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }       // base course
    if (rel === SLAB1 || rel === TOP) { put(x, y, z, "smooth_quartz"); continue; } // storey line / cornice
    if (rel === 4 || rel === 9) { put(x, y, z, "smooth_quartz"); continue; }       // spandrel courses

    const bay = (x + z) % 3;
    const isWindowRow = rel === FLOOR1 || rel === FLOOR1 + 1 || rel === FLOOR1 + 2 ||
                        rel === FLOOR2 || rel === FLOOR2 + 1 || rel === FLOOR2 + 2;
    const ground = rel === FLOOR1 || rel === FLOOR1 + 1;

    if (ground && rel === FLOOR1) {
      // shopfront: glazed band with frames on the ground storey
      put(x, y, z, bay === 1 ? "light_blue_stained_glass" : "polished_andesite");
      continue;
    }
    if (ground && rel === FLOOR1 + 1) {
      put(x, y, z, bay === 1 ? "light_blue_stained_glass" : "polished_andesite");
      continue;
    }

    if (isWindowRow) {
      if (bay === 0) {
        put(x, y, z, "light_gray_concrete");       // mullion / frame
      } else {
        // warm light in some windows, otherwise tinted glass
        if ((x * 7 + z * 3 + rel) % 11 === 0) put(x, y, z, "shroomlight");
        else put(x, y, z, "light_blue_stained_glass_pane");
      }
    } else {
      put(x, y, z, "white_concrete");              // spandrel/wall
    }
  }
}

// ---- entrance on the south edge -------------------------------------------
if (entranceX >= 0) {
  const gr = groundOf(entranceX, maxZ);
  for (let y = gr; y < gr + 2; y++) {
    put(entranceX, y, maxZ, "glass");
  }
  // door frame and lintel
  put(entranceX - 1, gr, maxZ, "polished_andesite");
  put(entranceX + 1, gr, maxZ, "polished_andesite");
  put(entranceX - 1, gr + 1, maxZ, "light_gray_concrete");
  put(entranceX + 1, gr + 1, maxZ, "light_gray_concrete");
  put(entranceX, gr + 2, maxZ, "light_gray_concrete");
}

// ---- roof equipment: central plant room -----------------------------------
const cx = W / 2, cz = D / 2;
for (const [key, gr] of map) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) {
    for (let rel = TOP + 1; rel <= ROOF_EQUIP_TOP; rel++) {
      const y = minG + rel;
      // leave a dark vent slot on the north face for some columns
      if (rel === ROOF_EQUIP_TOP && (x + z) % 2 === 0) put(x, y, z, "iron_bars");
      else put(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
