import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098841";
const W = 17, H = 23, D = 21;
const TOP = 10;      // roof slab level (cornice sits here on the facade)
const PARAPET = 11;  // roof lidar height ~11 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground level
const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => map.has(`${x},${z}`);
const groundAt = (x, z) => map.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces: [dx, dz]
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. Facade cells: footprint cells with a missing neighbour
const facades = [];
for (const [x, z, gr] of cells) {
  for (const [dx, dz] of DIRS) {
    if (!has(x + dx, z + dz)) {
      const a = dx !== 0 ? z : x; // position along the face
      facades.push({ x, z, dx, dz, gr: Math.round(gr), a });
    }
  }
}

// 2. Entrance: middle of the +z (south-facing) frontage, else any frontage
let doorKey = null;
{
  let pool = facades.filter((f) => f.dz === 1 && f.dx === 0);
  if (pool.length === 0) pool = facades.slice();
  pool.sort((p, q) => p.a - q.a);
  if (pool.length) {
    const mid = pool[Math.floor(pool.length / 2)];
    doorKey = `${mid.x},${mid.z},${mid.dx},${mid.dz}`;
  }
}

// 3. Foundations, floor slabs, roof and roof equipment on every footprint cell
for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr >= TOP) {
    // too high on the slope for storeys: just cap it
    put(x, gr, z, "gray_concrete");
    continue;
  }

  put(x, gr, z, "smooth_stone");            // ground floor slab
  if (gr + 5 <= TOP - 1) put(x, gr + 5, z, "smooth_stone"); // second floor slab
  put(x, TOP, z, "gray_concrete");          // roof slab

  const edge = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
  if (!edge && x % 5 === 2 && z % 5 === 2) {
    put(x, PARAPET, z, "light_gray_concrete"); // roof plant boxes
  }
}

// 4. Facade articulation
for (const f of facades) {
  if (f.gr >= TOP) continue;
  const G = f.gr;
  const isDoorCell = doorKey === `${f.x},${f.z},${f.dx},${f.dz}`;
  const pier = f.a % 3 === 0;

  for (let y = G; y <= PARAPET; y++) {
    let id = null;
    let props = null;

    if (y === PARAPET) {
      id = "smooth_quartz";                       // parapet coping
    } else if (y === TOP) {
      id = "polished_andesite";                   // cornice
    } else if (y === G) {
      id = "polished_andesite";                   // base course
    } else if (y <= G + 3) {
      // ground floor shopfront
      if (isDoorCell && (y === G || y === G + 1)) {
        // door is set below
        continue;
      }
      id = pier ? "smooth_quartz" : "light_blue_stained_glass_pane";
    } else if (y === G + 4) {
      id = "smooth_quartz";                       // shopfront lintel
    } else if (y === G + 5) {
      id = "polished_andesite";                   // storey line
    } else if (y <= G + 8) {
      id = pier ? "smooth_quartz" : "light_blue_stained_glass_pane";
    } else if (y === G + 9) {
      id = "smooth_quartz";                       // upper lintel
    }

    if (id && y <= TOP) put(f.x, y, f.z, id);
    if (id && y === PARAPET) put(f.x, y, f.z, id);
  }

  // Entrance door (lower and upper halves)
  if (isDoorCell) {
    // player stands outside and faces inward
    const facing =
      f.dx === 1 ? "west" : f.dx === -1 ? "east" : f.dz === 1 ? "north" : "south";
    const base = { facing, hinge: "left", open: "false", powered: "false" };
    put(f.x, G, f.z, "dark_oak_door", { ...base, half: "lower" });
    put(f.x, G + 1, f.z, "dark_oak_door", { ...base, half: "upper" });
  }

  // Warm lights behind the glass, in the interior air gap
  const ix = f.x - f.dx;
  const iz = f.z - f.dz;
  if (has(ix, iz) && groundAt(ix, iz) <= G && !isDoorCell && !pier) {
    if (f.a % 6 === 4) put(ix, G + 2, iz, "glowstone");
    if (f.a % 6 === 1 && G + 7 <= TOP - 1) put(ix, G + 7, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
