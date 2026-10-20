// OSMw839833578: unrecorded commercial block, Xinyi district, Taipei.
// Read from lidar: roof about 11 blocks above the lowest ground, so two storeys
// of 5 blocks with a 1-block parapet cap. Era: 1970s-80s Taipei low-rise
// commercial block. Cream-white concrete walls, light-grey concrete bands,
// glass shopfronts under a dark awning, tinted cyan windows in the upper storey,
// and a roof water tank.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833578";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, DZ = 23;
const g = new Voxels([W, H, DZ]);

// Datum: y 0 is the lowest ground under the footprint.
const D = Math.min(...cells.map((c) => c[2]));

const key = (x, z) => `${x},${z}`;
const inSet = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inSet.has(key(x, z));

// Only footprint cells receive blocks; bounds-checked.
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= DZ) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward normals. N = z-1, S = z+1, W = x-1, E = x+1.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

function faces(x, z) {
  const f = [];
  for (const k of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[k];
    if (!has(x + dx, z + dz)) f.push(k);
  }
  return f;
}

// Prefer N/S for corners so window indexing runs along x on the long faces.
function pickFace(f) {
  for (const k of ["N", "S", "W", "E"]) if (f.includes(k)) return k;
  return null;
}

// Entrance: middle cell of the first available face in N, S, W, E order.
const faceCells = (k) => cells.filter(([x, z]) => pickFace(faces(x, z)) === k);
const entranceFace = ["N", "S", "W", "E"].find((k) => faceCells(k).length > 0);
const alongX = entranceFace === "N" || entranceFace === "S";
const fc = faceCells(entranceFace).sort((a, b) => (alongX ? a[0] - b[0] : a[1] - b[1]));
const ent = fc[Math.floor(fc.length / 2)];
const entKey = ent ? key(ent[0], ent[1]) : null;

// Pane connection states so glass runs read as continuous frames.
function paneProps(face) {
  if (face === "N" || face === "S") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Foundations and building body, cell by cell.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const perim = f.length > 0;
  const face = pickFace(f);
  const idx = face === "N" || face === "S" ? x : z;

  for (let rel = 0; rel <= 11; rel++) {
    const y = D + rel;
    if (y < gr) continue;

    if (!perim) {
      // Interior: floor slabs only, air otherwise (no interiors).
      if (rel === 0 || rel === 5) put(x, y, z, "smooth_stone");
      else if (rel === 10) put(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter shell.
    if (rel === 0) {
      put(x, y, z, "polished_andesite");
    } else if (rel >= 1 && rel <= 3) {
      // Ground-floor shopfront: pillars every 3 cells, glass between.
      if (entKey === key(x, z) && rel <= 2) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: FACING[face],
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (idx % 3 === 0) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass_pane", paneProps(face));
      }
    } else if (rel === 4) {
      // Dark awning over the shopfronts.
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    } else if (rel === 5) {
      // Storey band.
      put(x, y, z, "light_gray_concrete");
    } else if (rel >= 6 && rel <= 9) {
      // Upper storey: window every third cell, cream concrete piers between.
      const isWindow = idx % 3 === 1;
      if (!isWindow) {
        put(x, y, z, "white_concrete");
      } else if (rel === 6 || rel === 9) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "cyan_stained_glass_pane", paneProps(face));
        // Warm glowstone behind every other window, at the air gap behind the glass.
        if (rel === 7 && Math.floor(idx / 3) % 2 === 0) {
          const [dx, dz] = DIRS[face];
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && faces(ix, iz).length === 0) {
            put(ix, y, iz, "glowstone");
          }
        }
      }
    } else if (rel === 10) {
      // Parapet course.
      put(x, y, z, "white_concrete");
    } else if (rel === 11) {
      // Parapet cap.
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Roof water tank: 3x3 block of interior roof cells nearest the centroid.
{
  const interior = (x, z) => has(x, z) && faces(x, z).length === 0;
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = null, bestD = Infinity;
  for (let x = 1; x < W - 2; x++) {
    for (let z = 1; z < DZ - 2; z++) {
      let ok = true;
      for (let dx = 0; dx < 3 && ok; dx++)
        for (let dz = 0; dz < 3 && ok; dz++)
          if (!interior(x + dx, z + dz)) ok = false;
      if (!ok) continue;
      const d = (x + 1 - cx) ** 2 + (z + 1 - cz) ** 2;
      if (d < bestD) { bestD = d; best = [x, z]; }
    }
  }
  if (best) {
    const [tx, tz] = best;
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        put(tx + dx, D + 11, tz + dz, "light_gray_concrete");
        put(tx + dx, D + 12, tz + dz, "light_gray_concrete");
      }
    }
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        put(tx + dx, D + 13, tz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
