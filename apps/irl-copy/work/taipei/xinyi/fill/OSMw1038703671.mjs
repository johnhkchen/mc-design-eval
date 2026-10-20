import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038703671.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038703671.nbt";

const W = 9, H = 23, D = 11;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, gr);
const has = (x, z) => foot.has(`${x},${z}`);
const groundAt = (x, z) => foot.get(`${x},${z}`);

// Safe setter: ignores anything outside the grid
function S(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Missing neighbours => outward faces. Returns list of {ox, oz}.
function missingFaces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ ox: 0, oz: -1 });
  if (!has(x, z + 1)) out.push({ ox: 0, oz: 1 });
  if (!has(x - 1, z)) out.push({ ox: -1, oz: 0 });
  if (!has(x + 1, z)) out.push({ ox: 1, oz: 0 });
  return out;
}

const faceName = (ox, oz) =>
  oz === -1 ? "north" : oz === 1 ? "south" : ox === -1 ? "west" : "east";

// Footprint extents for along-wall window parity
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Pick the entrance: single-face cell on the north (min z) face nearest the centre line
let door = null;
{
  let best = Infinity;
  for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
    const f = missingFaces(x, z);
    if (f.length !== 1 || f[0].oz !== -1) continue;
    const d = Math.abs(x - cx);
    if (d < best) { best = d; door = { x, z }; }
  }
}

const pane = (ox, oz) => {
  // Pane connects along the wall it sits in
  const alongX = oz !== 0; // wall runs east-west
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

// Door canopy cells (door cell and its along-wall neighbours)
const canopy = new Set();
if (door) {
  canopy.add(`${door.x},${door.z}`);
  canopy.add(`${door.x - 1},${door.z}`);
  canopy.add(`${door.x + 1},${door.z}`);
}

// ---- Build each footprint cell ----
for (const [x, z, gr] of cells) {
  const faces = missingFaces(x, z);
  const isEdge = faces.length > 0;
  const isCorner = faces.length >= 2;

  // Foundation under the cell
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  S(x, gr, z, isEdge ? "polished_andesite" : "smooth_stone");

  // Storey floors (also storey lines on the edges)
  S(x, gr + 5, z, "smooth_stone");
  S(x, gr + 10, z, "smooth_stone");

  if (!isEdge) continue;

  // Parapet on every edge cell
  S(x, gr + 11, z, "white_concrete");

  if (isCorner) {
    // Corner piers run full height
    for (const r of [1, 2, 3, 4, 6, 7, 8, 9]) S(x, gr + r, z, "white_concrete");
    continue;
  }

  const f = faces[0];
  const along = f.oz !== 0 ? x - minX : z - minZ;
  const isWindowCol = along % 2 === 1;
  const isDoor = door && door.x === x && door.z === z;
  const fName = faceName(f.ox, f.oz);
  const pn = pane(f.ox, f.oz);

  // Ground storey (shopfront)
  for (let r = 1; r <= 4; r++) {
    const y = gr + r;
    if (isDoor && (r === 1 || r === 2)) {
      S(x, y, z, "dark_oak_door", {
        facing: fName,
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (r === 4) {
      S(x, y, z, canopy.has(`${x},${z}`) ? "dark_oak_slab" : "white_concrete",
        canopy.has(`${x},${z}`) ? { type: "bottom", waterlogged: "false" } : undefined);
    } else if (isWindowCol && !isDoor) {
      S(x, y, z, "light_blue_stained_glass_pane", pn);
    } else {
      S(x, y, z, "white_concrete");
    }
  }

  // Upper storey (office windows)
  for (const r of [6, 7, 8, 9]) {
    const y = gr + r;
    if (r === 6 || r === 9) {
      S(x, y, z, isWindowCol ? "light_gray_concrete" : "white_concrete");
    } else if (isWindowCol) {
      S(x, y, z, "light_blue_stained_glass_pane", pn);
    } else {
      S(x, y, z, "white_concrete");
    }
  }

  // Warm lights behind some upper windows (inside the air gap)
  if (isWindowCol && ((x * 7 + z * 13 + gr) % 5 === 0)) {
    const ix = x - f.ox, iz = z - f.oz;
    if (has(ix, iz) && missingFaces(ix, iz).length === 0) {
      S(ix, gr + 7, iz, (x + z) % 2 === 0 ? "glowstone" : "shroomlight");
    }
  }
}

// ---- Roof equipment on the interior of the roof (stands on the gr+10 slab) ----
for (const [x, z, gr] of cells) {
  if (missingFaces(x, z).length !== 0) continue;
  if (x % 4 === 2 && z % 4 === 3) {
    S(x, gr + 11, z, "iron_block");
    S(x, gr + 12, z, "light_gray_concrete");
  }
}

// Ground-level interior is open air apart from the floor slab set above.
g.save(OUT);
