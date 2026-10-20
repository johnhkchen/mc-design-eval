import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541808523";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Era/type: low-rise mid-century (1960s-80s) Taipei commercial block, two storeys over a
// shopfront ground floor, white-tiled concrete walls, brick-red parapet cap, dark-wood canopy,
// flat roof with a rooftop water tank. Storey lines at y=5 and y=10 (absolute), roof deck at 10,
// parapet top at 11 (about 11 blocks above the lowest ground).

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const key = (x, z) => `${x},${z}`;

const gmap = new Map();
for (const [x, z, gr] of cells) {
  gmap.set(key(x, z), Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => gmap.has(key(x, z));

function outwardFaces(x, z) {
  return Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
}

// Build cell info
const info = [];
const byKey = new Map();
for (const [x, z] of cells) {
  const faces = outwardFaces(x, z);
  const c = {
    x, z,
    gr: gmap.get(key(x, z)),
    faces,
    perim: faces.length > 0,
    corner: faces.length > 1,
    gi: -1,
    ent: false,
    nearEnt: false,
  };
  info.push(c);
  byKey.set(key(x, z), c);
}
const isPerim = (x, z) => byKey.get(key(x, z))?.perim ?? false;

// Group single-face perimeter cells by facing for bay rhythm
const groups = { north: [], south: [], west: [], east: [] };
for (const c of info) {
  if (c.perim && !c.corner) groups[c.faces[0]].push(c);
}
for (const f of Object.keys(groups)) {
  const horiz = f === "north" || f === "south";
  groups[f].sort((a, b) => (horiz ? a.x - b.x : a.z - b.z));
  groups[f].forEach((c, i) => (c.gi = i));
}

// Entrance: middle of the south face (or first face that has cells)
const order = ["south", "north", "east", "west"];
const ef = order.find((f) => groups[f].length > 0);
let entCell = null;
if (ef) {
  const eg = groups[ef];
  const mid = Math.floor(eg.length / 2);
  entCell = eg[mid];
  entCell.ent = true;
  if (eg[mid - 1]) eg[mid - 1].nearEnt = true;
  if (eg[mid + 1]) eg[mid + 1].nearEnt = true;
}

// Rooftop tank position: interior cell nearest the footprint centroid
let cx = 0, cz = 0;
for (const c of info) { cx += c.x; cz += c.z; }
cx /= info.length; cz /= info.length;
let tankCell = null, bestD = Infinity;
for (const c of info) {
  if (c.perim) continue;
  const d = (c.x - cx) ** 2 + (c.z - cz) ** 2;
  if (d < bestD) { bestD = d; tankCell = c; }
}

const put = (x, y, z, gr, name, props) => {
  if (y < gr || y > 11) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

for (const c of info) {
  const { x, z, gr } = c;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!c.perim) {
    // Interior: floor slabs per storey and roof deck, air between
    for (const y of [gr, 5, 10]) {
      if (y >= gr && y <= 10) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter envelope
  const wall = "white_concrete";

  // Plinth course
  put(x, gr, z, gr, "polished_andesite");

  // Walls default
  for (let y = gr + 1; y <= 9; y++) put(x, y, z, gr, wall);

  // Ground-floor shopfront: glass between white piers, door at entrance
  const lo = gr + 1;
  if (!c.corner && lo <= 4) {
    const isWindowBay = c.gi % 3 === 1 && !c.ent && !c.nearEnt;
    for (let y = lo; y <= 3; y++) {
      if (c.ent) continue; // door handled below
      if (c.nearEnt && y === lo + 1) {
        put(x, y, z, gr, "lantern", { hanging: "true" });
      } else if (isWindowBay || c.nearEnt) {
        put(x, y, z, gr, "light_blue_stained_glass_pane");
      }
    }
    // Header course of the shopfront
    put(x, 4, z, gr, wall);
    // Canopy over the entrance cluster
    if (c.ent || c.nearEnt) {
      put(x, gr + 3, z, gr, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Storey line (absolute)
  put(x, 5, z, gr, "smooth_quartz");

  // Second floor: ribbon windows at 6..8, lintel at 9
  if (!c.corner) {
    const winBay = c.gi % 3 === 1 && !c.ent && !c.nearEnt;
    if (winBay) {
      for (let y = 6; y <= 8; y++) put(x, y, z, gr, "light_blue_stained_glass_pane");
      // Warm light in the air gap behind every second window
      const [dx, dz] = DIRS[c.faces[0]];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && !isPerim(ix, iz) && c.gi % 6 === 1) {
        const ig = gmap.get(key(ix, iz));
        if (7 >= ig) g.set(ix, 7, iz, "glowstone");
      }
    }
  }

  // Cornice and brick-red parapet cap
  put(x, 10, z, gr, "smooth_quartz");
  put(x, 11, z, gr, "brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door (two halves) on the entrance cell
if (entCell) {
  const lo = entCell.gr + 1;
  const facing = ef;
  if (lo <= 3) {
    g.set(entCell.x, lo, entCell.z, "dark_oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(entCell.x, lo + 1, entCell.z, "dark_oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

// Rooftop water tank (3x3) with iron cap and a lightning rod on the centre
if (tankCell) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const tx = tankCell.x + dx, tz = tankCell.z + dz;
      const tc = byKey.get(key(tx, tz));
      if (!tc || tc.perim) continue;
      g.set(tx, 11, tz, "white_concrete");
      g.set(tx, 12, tz, "white_concrete");
      g.set(tx, 13, tz, "iron_block");
    }
  }
  g.set(tankCell.x, 14, tankCell.z, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
