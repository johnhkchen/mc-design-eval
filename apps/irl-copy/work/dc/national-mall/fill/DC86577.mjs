import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 815 16th St NW, Washington DC: 1960s-70s Washington office block.
// Portland-cream piers and spandrels, bronze-tinted punched window bays set
// one block back in reveals, a stone base course, a dark-bronze entrance and
// a stepped roof on storey-aligned tiers with parapets and mechanical penthouses.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86577";
const W = 26, H = 29, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Raw lidar values per cell.
let gMin = Infinity;
for (const [, , gr] of cells) gMin = Math.min(gMin, Math.round(gr));

const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(key(x, z), {
    x, z,
    G: Math.round(gr) - gMin,
    R: Math.round(rf),
  });
}

// Smooth roof heights: median of the 3x3 footprint neighbourhood, then snap to
// multiples of 3 so every roof sits on a storey line (clean flat tiers).
const cellMap = new Map();
for (const c of raw.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const n = raw.get(key(c.x + dx, c.z + dz));
      if (n) vals.push(n.R);
    }
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let T = 3 * Math.round(med / 3);
  T = Math.min(H - 6, Math.max(T, c.G + 3));
  cellMap.set(key(c.x, c.z), { x: c.x, z: c.z, G: c.G, T });
}

const cellList = [...cellMap.values()];
const get = (x, z) => cellMap.get(key(x, z));

const xmin = Math.min(...cellList.map(c => c.x));
const zmin = Math.min(...cellList.map(c => c.z));
const maxT = Math.max(...cellList.map(c => c.T));
const minG = Math.min(...cellList.map(c => c.G));

// Directions in which the block at height y is exposed (missing or lower neighbour).
const exposedDirs = (c, y) => {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const n = get(c.x + dx, c.z + dz);
    if (!n || y >= n.T) out.push([dx, dz]);
  }
  return out;
};

const hasOpenSide = c => DIRS.some(([dx, dz]) => !get(c.x + dx, c.z + dz));

const recesses = [];   // [x, y, z, inwardX, inwardZ] window bays set one block back
const lanterns = [];   // deferred so recess glass takes priority

// Main massing.
for (const c of cellList) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.G) {
      put(c.x, y, c.z, "stone_bricks");
      continue;
    }
    if (y === c.T - 1) {
      put(c.x, y, c.z, "smooth_stone");
      continue;
    }

    const dirs = exposedDirs(c, y);
    if (dirs.length) {
      const zFace = dirs.some(d => d[0] === 0); // wall running along x
      const xFace = dirs.some(d => d[1] === 0); // wall running along z
      const pier = (zFace && (c.x - xmin) % 3 === 0) || (xFace && (c.z - zmin) % 3 === 0);
      const rel = y % 3;

      if (c.G < 3 && y === c.G) {
        put(c.x, y, c.z, "smooth_stone");                  // base course
      } else if (rel === 0) {
        put(c.x, y, c.z, "white_concrete");                // spandrel band (projects)
      } else if (pier) {
        put(c.x, y, c.z, "light_gray_concrete");           // piers (project)
      } else {
        // Window bay: recess the glass one block inward when the wall is a
        // single straight face and the inward block is interior air.
        let recessed = false;
        if (dirs.length === 1) {
          const [dx, dz] = dirs[0];
          const ix = c.x - dx, iz = c.z - dz;
          const inn = get(ix, iz);
          if (inn && y >= inn.G && y < inn.T - 1 && exposedDirs(inn, y).length === 0) {
            recesses.push([ix, y, iz]);
            recessed = true;
          }
        }
        if (!recessed) put(c.x, y, c.z, "gray_stained_glass");
      }
    } else {
      // Interior: floor slabs only, air elsewhere.
      if (y % 3 === 0 && y > c.G) {
        put(c.x, y, c.z, "light_gray_concrete");
      } else if (y % 3 === 1 && y - 1 > c.G && y < c.T - 2 && hasOpenSide(c) && (c.x + c.z) % 4 === 0) {
        lanterns.push([c.x, y, c.z]);
      }
    }
  }
}

// Recessed window glass (set after the main pass).
for (const [x, y, z] of recesses) put(x, y, z, "gray_stained_glass");

// Warm lanterns on the floor slab behind the glass, skipping recess positions.
const recessKeys = new Set(recesses.map(([x, y, z]) => `${x},${y},${z}`));
for (const [x, y, z] of lanterns) {
  if (recessKeys.has(`${x},${y},${z}`)) continue;
  put(x, y, z, "lantern", { hanging: "false" });
}

// Parapets on every exposed roof edge (perimeter and setback edges).
for (const c of cellList) {
  if (exposedDirs(c, c.T).length) put(c.x, c.T, c.z, "white_concrete");
}

// Mechanical penthouses on the top tier, sitting on the roof slab.
for (const c of cellList) {
  if (c.T !== maxT) continue;
  if ((c.x - xmin) % 9 !== 4 || (c.z - zmin) % 9 !== 4) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => get(c.x + dx, c.z + dz));
  if (block.some(n => !n || n.T !== maxT)) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    for (let y = c.T; y < c.T + 3; y++) {
      put(c.x + dx, y, c.z + dz, "light_gray_concrete");
    }
    put(c.x + dx, c.T + 3, c.z + dz, "smooth_stone_slab", { type: "top" });
  }
}

// Entrance: on the north (-z) street face at ground level, nearest the centre.
const midX = (xmin + Math.max(...cellList.map(c => c.x))) / 2;
const entranceCands = cellList
  .filter(c => c.G === minG && !get(c.x, c.z - 1))
  .sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX));
if (entranceCands.length) {
  const e = entranceCands[0];
  const doorProps = half => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(e.x, e.G, e.z, "dark_oak_door", doorProps("lower"));
  put(e.x, e.G + 1, e.z, "dark_oak_door", doorProps("upper"));
  put(e.x, e.G + 2, e.z, "smooth_stone");                  // lintel over the door
  for (const dx of [-2, 2]) {
    const n = get(e.x + dx, e.z);
    if (n && n.G === e.G) put(n.x, e.G + 1, n.z, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
