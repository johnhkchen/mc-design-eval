import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1970s-80s Xinyi low-rise: two storeys of painted concrete shophouse,
// ground-floor shopfront with glass and stallboards, red tile storey bands,
// stone cornice, flat roof with AC units and a stair housing.

const ID = "OSMw540888751";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 20, H = 23, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const cellAt = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => cellAt.has(`${x},${z}`);
const L = Math.min(...cells.map((c) => c[2])); // lowest ground under the footprint

// storey lines (absolute y)
const GT = L + 4;    // ground-floor transom band
const BAND = L + 5;  // floor line / red tile band
const UP0 = L + 6;   // upper sill
const HEAD = L + 9;  // upper lintel
const CORN = L + 10; // cornice + roof deck
// roof surface = L + 11

const DIRS = {
  N: { dx: 0, dz: -1, name: "north" },
  S: { dx: 0, dz: 1, name: "south" },
  W: { dx: -1, dz: 0, name: "west" },
  E: { dx: 1, dz: 0, name: "east" },
};
const exteriorOf = (x, z) =>
  Object.keys(DIRS).filter((d) => !has(x + DIRS[d].dx, z + DIRS[d].dz));
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);

const minU = {};
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const e = exteriorOf(x, z);
  if (e.length === 1) {
    const d = e[0];
    minU[d] = Math.min(minU[d] ?? Infinity, along(d, x, z));
  }
}
const bayK = (d, x, z) => along(d, x, z) - minU[d];

const M = {
  found: "stone_bricks",
  base: "polished_andesite",
  wall: "white_concrete",
  band: "red_terracotta",
  floor: "smooth_stone",
  sill: "polished_andesite",
  stall: "polished_andesite",
  cornice: "polished_andesite",
  glass: "glass",
  pane: "glass_pane",
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (d) =>
  d === "N" || d === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, slabs, walls
for (const [x, z, gr] of cells) {
  const ext = exteriorOf(x, z);
  const wall = ext.length > 0;

  for (let y = 0; y < gr; y++) put(x, y, z, M.found);
  put(x, gr, z, wall ? M.base : M.floor);

  if (!wall) {
    put(x, BAND, z, M.floor);
    put(x, CORN, z, M.floor);
    continue;
  }

  for (let y = gr + 1; y <= CORN; y++) {
    let id = M.wall;
    let props;
    if (y === CORN) {
      id = M.cornice;
    } else if (y === BAND || y === GT) {
      id = M.band;
    } else if (ext.length === 1) {
      const d = ext[0];
      const k = bayK(d, x, z);
      if (k % 3 === 1) {
        if (y >= gr + 1 && y <= L + 3) {
          id = y === gr + 1 ? M.stall : M.glass;
        } else if (y === UP0) {
          id = M.sill;
        } else if (y === HEAD) {
          id = M.wall;
        } else if (y >= L + 7 && y <= L + 8) {
          id = M.pane;
          props = paneProps(d);
        }
      }
    }
    put(x, y, z, id, props);
  }
}

// Entrance: central wall cell on the north face (or south if no north run)
const xs = cells.map((c) => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const d of ["N", "S"]) {
  const cands = cells.filter(([x, z]) => {
    const e = exteriorOf(x, z);
    return e.length === 1 && e[0] === d;
  });
  if (cands.length) {
    cands.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
    door = { x: cands[0][0], z: cands[0][1], gr: cands[0][2], d };
    break;
  }
}

if (door) {
  const { x, z, gr, d } = door;
  const facing = DIRS[d].name;
  put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  put(x, gr + 4, z, gr + 4 === GT ? M.band : M.wall);
}

// Pass 2: warm lights behind some windows (standing on the floor slabs)
for (const [x, z, gr] of cells) {
  const ext = exteriorOf(x, z);
  if (ext.length !== 1) continue;
  const d = ext[0];
  const k = bayK(d, x, z);
  if (k % 3 !== 1) continue;
  const ix = x - DIRS[d].dx;
  const iz = z - DIRS[d].dz;
  if (!has(ix, iz) || exteriorOf(ix, iz).length !== 0) continue;

  if (k % 6 === 1) {
    // upper floor: lantern standing on the slab at BAND
    put(ix, UP0, iz, "lantern", { hanging: "false", waterlogged: "false" });
  } else if (k % 6 === 4 && gr + 1 <= GT - 1) {
    // ground floor shop: glowstone standing on the ground slab
    put(ix, gr + 1, iz, "glowstone");
  }
}

// Roof: AC units and a stair housing
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (exteriorOf(x, z).length !== 0) continue;
  if (x % 5 === 2 && z === 3) put(x, ROOF_Y(), z, "gray_concrete");
}
function ROOF_Y() { return CORN + 1; }

const stairCells = [[15, 1], [16, 1], [15, 2], [16, 2]];
if (stairCells.every(([x, z]) => has(x, z) && exteriorOf(x, z).length === 0)) {
  for (const [x, z] of stairCells) {
    for (let y = CORN + 1; y <= CORN + 3; y++) put(x, y, z, M.wall);
    put(x, CORN + 4, z, M.band);
  }
}

g.save(`${DIR}/${ID}.nbt`);
