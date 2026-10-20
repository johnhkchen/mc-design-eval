import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE106-0237-52F: Xinyi residential-office tower, completed 2017.
// Roof ~372 blocks (~266 m) above lowest ground: about 74 storeys of 5 blocks.
// Glass-and-white-concrete tower on a stone podium with shopfronts, a central
// entrance under a canopy, a stepped shaft with two setbacks, a crown and a lit mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0237-52F";
const W = 222, H = 384, D = 174;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmin = Math.min(...cells.map((c) => c[2]));

const ROOF = 372;   // roof height above lowest ground
const MAST = 380;   // top of the crown mast
const PODIUM = 45;  // podium roof (9 storeys)

const idx = (x, z) => x * D + z;
const G = new Int16Array(W * D).fill(-1); // ground per footprint cell (relative to y0)
const T = new Int16Array(W * D).fill(-1); // top per footprint cell

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, g0] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  G[idx(x, z)] = g0 - gmin;
}
const CX = Math.round((minX + maxX) / 2);
const CZ = Math.round((minZ + maxZ) / 2);

const inBounds = (x, z) => x >= 0 && x < W && z >= 0 && z < D;
const inFp = (x, z) => inBounds(x, z) && G[idx(x, z)] >= 0;

// Distance to the footprint's bounding edge: larger means closer to the core.
const inset = (x, z) => Math.min(x - minX, maxX - x, z - minZ, maxZ - z);

function topFor(x, z, gr) {
  const d = inset(x, z);
  let top = d >= 62 ? ROOF : d >= 44 ? 352 : d >= 22 ? 300 : PODIUM;
  if (d >= 62 && Math.abs(x - CX) <= 2 && Math.abs(z - CZ) <= 2) top = MAST;
  return Math.max(top, gr + 5);
}

for (const [x, z] of cells) {
  const i = idx(x, z);
  T[i] = topFor(x, z, G[i]);
}

const g = new Voxels([W, H, D]);

// Outward faces: 0 = west (-x), 1 = east (+x), 2 = north (-z), 3 = south (+z)
const FACE = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const PANE_PROPS = [
  { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
  { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
];

// Entrance: a six-block-wide glazed opening on the north podium face, centred on CX.
const ENT_X0 = CX - 3, ENT_X1 = CX + 2;
const isEntranceX = (x) => x >= ENT_X0 && x <= ENT_X1;
const DOOR_X_L = CX - 1, DOOR_X_R = CX; // two doors in the middle of the opening

const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

function facade(x, z, y, gr, top, f) {
  const [dx, dz] = FACE[f];
  const alongX = f < 2;
  const coord = alongX ? z : x;
  const podium = top === PODIUM;
  const frontEntry = podium && f === 2;

  if (y === gr) {
    g.set(x, y, z, "stone_bricks"); // base course
  } else if (frontEntry && isEntranceX(x) && (y === gr + 1 || y === gr + 2)) {
    if (x === DOOR_X_L || x === DOOR_X_R) {
      // Double doors in the middle of the opening.
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: x === DOOR_X_L ? "left" : "right",
        open: "false",
        powered: "false",
      });
    } else {
      // Glazed opening either side of the doors.
      g.set(x, y, z, "light_blue_stained_glass_pane", PANE_PROPS[f]);
    }
  } else if (frontEntry && isEntranceX(x) && y === gr + 3) {
    g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // canopy edge
  } else if (frontEntry && isEntranceX(x) && y === gr + 4) {
    g.set(x, y, z, "white_concrete"); // canopy soffit / lintel
  } else if (y % 5 === 0) {
    g.set(x, y, z, "white_concrete"); // storey line / spandrel
  } else if (coord % 4 === 0) {
    g.set(x, y, z, "light_gray_concrete"); // mullion frame
  } else {
    const glass = podium && y < gr + 5 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
    g.set(x, y, z, glass, PANE_PROPS[f]);
  }

  // Warm light in the air gap just behind the glass.
  if ((y % 5 === 2 || y % 5 === 3) && hash(x, y, z) % 6 === 0) {
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz)) {
      const ii = idx(ix, iz);
      if (y >= G[ii] && y < T[ii] - 1) g.set(ix, y, iz, "glowstone");
    }
  }
}

for (const [x, z] of cells) {
  const i = idx(x, z);
  const gr = G[i];
  const top = T[i];

  // Solid foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Crown mast: a solid 5x5 column above the crown roof.
  if (top === MAST) {
    for (let y = gr; y < top; y++) {
      if (y >= ROOF - 1) {
        g.set(x, y, z, y === top - 1 ? "sea_lantern" : "white_concrete");
      } else if (y % 5 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
    continue;
  }

  for (let y = gr; y < top; y++) {
    // Exposure: a face is exposed if the neighbour is outside the footprint or
    // does not reach this height. Neighbours below ground are solid.
    const ex = [false, false, false, false];
    for (let f = 0; f < 4; f++) {
      const nx = x + FACE[f][0], nz = z + FACE[f][1];
      if (!inFp(nx, nz)) ex[f] = true;
      else ex[f] = y >= T[idx(nx, nz)];
    }
    const any = ex.some(Boolean);

    if (y === top - 1) {
      if (any) {
        g.set(x, y, z, "white_concrete"); // cornice / parapet
      } else if (top === PODIUM && (x + z) % 5 === 0) {
        g.set(x, y, z, "moss_block"); // podium roof planting
      } else {
        g.set(x, y, z, "light_gray_concrete"); // roof surface
      }
      continue;
    }

    if (any) {
      const f = ex.indexOf(true);
      facade(x, z, y, gr, top, f);
      continue;
    }

    // Interior: air gap with a floor slab per storey.
    if (y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
