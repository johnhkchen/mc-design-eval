import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280225";
const W = 24, H = 33, D = 21;

// Four storeys of 5 blocks, flat roof with parapet, penthouse on top.
const STOREYS = 4;
const BAND = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
let maxG = -Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  if (gr > maxG) maxG = gr;
}
const F = maxG; // building floor datum: ground floor sits level on the uphill ground
const ROOF = F + STOREYS * BAND; // roof surface y (F+20)

const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const missing = (x, z) =>
  (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) +
  (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);
const edge = (x, z) => has(x, z) && missing(x, z) > 0;
const corner = (x, z) => has(x, z) && missing(x, z) >= 2;

// Face direction for an edge cell: N = -z side, S = +z side, W = -x side, E = +x side.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  return "E";
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: middle of the south (+z) face, two cells wide.
let southXs = [];
{
  const maxZ = Math.max(...cells.map(([, z]) => z));
  southXs = cells.filter(([x, z]) => z === maxZ && edge(x, z)).map(([x]) => x).sort((a, b) => a - b);
}
const entranceMid = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -99;
const entranceZ = southXs.length ? Math.max(...cells.map(([, z]) => z)) : -99;
const isEntrance = (x, z) => z === entranceZ && (x === entranceMid || x === entranceMid + 1) && edge(x, z);

// Interior neighbour (for glowstone behind lit windows).
function inwardNeighbour(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !edge(nx, nz)) return [nx, nz];
  }
  return null;
}

// Penthouse rectangle on the roof.
const PH = { x0: 7, x1: 16, z0: 6, z1: 14 };
const inPH = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1 && has(x, z);
const phEdge = (x, z) => inPH(x, z) && (x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1);

for (const [x, z, gr] of cells) {
  // Foundation below own ground, then solid plinth up to the floor datum.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (let y = gr; y < F; y++) put(x, y, z, "stone_bricks");

  // Floor slabs for each storey (full footprint, no interior).
  for (let k = 0; k < STOREYS; k++) {
    put(x, F + k * BAND, z, "white_concrete");
  }
  // Roof surface.
  put(x, ROOF, z, "gray_concrete");

  if (!edge(x, z)) continue;

  const face = faceOf(x, z);
  const idx = (face === "N" || face === "S") ? x : z;
  const isPier = (idx % 3 === 0) || corner(x, z);

  for (let k = 0; k < STOREYS; k++) {
    const base = F + k * BAND;

    // Windows / piers in rows 1..3.
    for (let r = 1; r <= 3; r++) {
      const y = base + r;
      if (k === 0 && isEntrance(x, z)) {
        if (r === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (r === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "white_concrete");
        continue;
      }
      if (k === 0 && r === 3 && isEntrance(x, z)) continue;
      if (isPier) {
        put(x, y, z, "white_concrete");
        continue;
      }
      put(x, y, z, "light_blue_stained_glass");
      // Warm light behind some windows.
      const lit = ((x * 31 + z * 17 + k * 7 + r * 3) % 11) === 0;
      if (lit && r === 2) {
        const n = inwardNeighbour(x, z);
        if (n) put(n[0], y, n[1], "glowstone");
      }
    }

    // Spandrel line at top of each band.
    put(x, base + 4, z, "light_gray_concrete");
  }

  // Parapet on the roof edge.
  put(x, ROOF + 1, z, "white_concrete");
  if (corner(x, z)) put(x, ROOF + 2, z, "lantern");
}

// Lanterns hanging over the entrance.
for (const [x, z] of cells) {
  if (isEntrance(x, z)) {
    put(x, F + 3, z, "lantern", { hanging: "true" });
  }
}

// Penthouse on the roof: solid floor at ROOF+1, glass band at ROOF+2 on its edge, cap at ROOF+3.
for (const [x, z] of cells) {
  if (!inPH(x, z)) continue;
  put(x, ROOF + 1, z, "light_gray_concrete");
  if (phEdge(x, z)) {
    put(x, ROOF + 2, z, "light_blue_stained_glass");
  }
  put(x, ROOF + 3, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
