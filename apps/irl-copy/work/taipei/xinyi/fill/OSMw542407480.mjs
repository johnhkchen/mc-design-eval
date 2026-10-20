import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407480";
const W = 18, H = 47, D = 24;

// Record: no name. Reads as a late-1990s/2000s Taipei Xinyi-style office block:
// seven 5-block storeys, white-concrete frame with mullions, blue-tinted glazing,
// light-grey spandrels, a polished base course, a shopfront ground floor with a
// central entrance, a parapet, and a central mechanical penthouse on the roof.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const TOP = minG + 35; // roof deck level (about 35 blocks above lowest ground)

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward normals of a footprint cell (faces with no neighbour in the footprint).
function normals(x, z) {
  const n = [];
  if (!has(x - 1, z)) n.push([-1, 0]);
  if (!has(x + 1, z)) n.push([1, 0]);
  if (!has(x, z - 1)) n.push([0, -1]);
  if (!has(x, z + 1)) n.push([0, 1]);
  return n;
}

// Main entrance on the north face (z min), at the cell nearest the centre line.
let doorX = null;
for (const [x, z] of cells) {
  if (!has(x, z - 1)) {
    if (doorX === null || Math.abs(x - 8.5) < Math.abs(doorX - 8.5)) doorX = x;
  }
}

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Roof deck over every footprint cell.
  put(x, TOP, z, "light_gray_concrete");

  const ns = normals(x, z);
  const perim = ns.length > 0;

  for (let y = gr; y < TOP; y++) {
    const rel = y - minG;
    const s = Math.floor(rel / 5);
    const ly = rel % 5;

    // Floor slab at the base of every storey (and at the ground line).
    if (y === gr || ly === 0) {
      put(x, y, z, s === 0 && ly === 0 ? "polished_andesite" : "white_concrete");
      continue;
    }

    if (!perim) continue; // interior: air gap

    // Re-entrant corners: solid concrete column.
    if (ns.length >= 2) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const [nx, nz] = ns[0];
    const p = nx !== 0 ? z : x; // position along the facade
    const mull = p % 3 === 0;

    // Spandrel at the top of each storey.
    if (ly === 4) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Main entrance: double door in storey 0, lintel above.
    if (s === 0 && nz === -1 && x === doorX) {
      const facing = "north";
      if (ly === 1) {
        put(x, y, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (ly === 2) {
        put(x, y, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Frame mullions between glazed bays.
    if (mull) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Glazing, connected along the facade direction.
    put(x, y, z, "light_blue_stained_glass_pane", nx !== 0 ? PANE_NS : PANE_EW);

    // Warm light behind some panes, in the interior air gap.
    if (ly === 2 && (p + s * 2) % 5 === 1) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && normals(ix, iz).length === 0) put(ix, y, iz, "glowstone");
    }
  }

  // Parapet ring on the roof edge.
  if (perim) {
    put(x, TOP + 1, z, "white_concrete");
    put(x, TOP + 2, z, "white_concrete");
  }

  // Central mechanical penthouse on the roof.
  if (!perim && x >= 4 && x <= 13 && z >= 6 && z <= 17) {
    for (let y = TOP + 1; y <= TOP + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, TOP + 4, z, "white_concrete");
  }

  // Lightning rod on top of the penthouse.
  if (x === 9 && z === 12) {
    for (let y = TOP + 5; y <= TOP + 7; y++) {
      put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
