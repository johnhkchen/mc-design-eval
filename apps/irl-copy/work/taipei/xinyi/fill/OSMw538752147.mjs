import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752147";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Levels (absolute, y 0 = lowest ground)
const STOREY = 5;      // blocks per storey
const TOP_WALL = 9;    // last wall course
const ROOF = 10;       // roof deck
const PARAPET = 11;    // parapet course (roof reads ~11)
const CAP = 12;        // parapet cap

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Footprint and per-cell ground, normalised so the lowest ground is 0
const occ = new Set();
const raw = new Map();
for (const [x, z, h] of cells) {
  occ.add(key(x, z));
  raw.set(key(x, z), Math.round(h ?? 0));
}
const lo = Math.min(...raw.values());
const ground = new Map();
for (const [k, h] of raw) ground.set(k, Math.max(0, Math.min(9, h - lo)));

// Door: front (-z) perimeter cell nearest the middle of the facade
const frontCells = [];
for (const [x, z] of cells) {
  if (!occ.has(key(x, z - 1))) frontCells.push(x);
}
let doorX = -1;
if (frontCells.length) {
  const mid = (Math.min(...frontCells) + Math.max(...frontCells)) / 2;
  doorX = frontCells.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
}
const doorZ = (() => {
  // smallest z present at doorX
  let zz = Infinity;
  for (const [x, z] of cells) if (x === doorX && z < zz) zz = z;
  return zz;
})();

for (const [x, z] of cells) {
  const gg = ground.get(key(x, z));

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  const exposed = DIRS.filter(([dx, dz]) => !occ.has(key(x + dx, z + dz)));

  // Roof deck over every cell
  put(x, ROOF, z, "stone");

  if (exposed.length === 0) {
    // Interior: floor slabs only, air elsewhere (no interiors)
    put(x, gg, z, "smooth_stone");
    if (gg < STOREY) put(x, STOREY, z, "smooth_stone");

    // Simple roof plant: two light-grey units
    if ((x === 3 || x === 4) && (z === 5 || z === 6)) {
      put(x, PARAPET, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter
  const corner = exposed.length >= 2;
  const zFace = exposed.some(([, dz]) => dz !== 0);
  const isDoorCell = x === doorX && z === doorZ && exposed.some(([dx, dz]) => dx === 0 && dz === -1);

  // Parapet and cap
  put(x, PARAPET, z, "white_concrete");
  put(x, CAP, z, "smooth_quartz");

  for (let y = gg; y <= TOP_WALL; y++) {
    if (y === gg) {
      put(x, y, z, "polished_granite"); // base course
      continue;
    }
    const s = y < STOREY ? 0 : 1;
    const row = y - STOREY * s;

    if (corner) {
      put(x, y, z, "smooth_quartz"); // corner pillar
      continue;
    }
    if (row === 0 || row === 4) {
      put(x, y, z, "smooth_quartz"); // storey bands
      continue;
    }

    // Rows 1..3: window bays alternate with white concrete piers
    const t = zFace ? x : z;
    if (t % 2 === 1) {
      if (s === 1 && row === 2 && t % 4 === 1) {
        put(x, y, z, "shroomlight"); // warm light in a window
      } else if (zFace) {
        put(x, y, z, "light_blue_stained_glass_pane", {
          north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
        });
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", {
          north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
        });
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Entrance: double-height door on the front facade with quartz surround
  if (isDoorCell && gg + 2 <= TOP_WALL) {
    put(x, gg + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gg + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    if (x - 1 >= 0) put(x - 1, gg + 1, z, "smooth_quartz");
    if (x + 1 < W) put(x + 1, gg + 1, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
