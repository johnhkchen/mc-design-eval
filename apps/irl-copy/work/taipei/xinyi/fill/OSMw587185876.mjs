import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw587185876: 9 x 7 footprint, roof ~55 blocks above lowest ground.
// Read as an 11-storey Xinyi-era (c. 1995-2005) office block: stone-clad base,
// white-tile piers, blue-green glass spandrel bands, cornice, parapet, and a
// central service core with a short mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587185876";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 67, D = 7;
const TOP = 54;   // top of the last storey wall
const ROOF = 55;  // cornice / roof membrane level
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));

// Exterior faces: the neighbour in that direction lies outside the footprint.
const DIRS = [
  { n: "N", dx: 0, dz: -1, axis: "x" },
  { n: "S", dx: 0, dz: 1, axis: "x" },
  { n: "W", dx: -1, dz: 0, axis: "z" },
  { n: "E", dx: 1, dz: 0, axis: "z" },
];
const exteriorOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Footprint bounds and centre cell (for the entrance and the core).
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);
const cxC = cx + 0.5 - 0.5;

// Entrance: boundary cell on the north face, nearest the centre column.
let doorCell = null;
for (const [x, z] of cells) {
  const ext = exteriorOf(x, z);
  if (ext.length === 1 && ext[0].n === "N") {
    if (!doorCell || Math.abs(x - cxC) < Math.abs(doorCell[0] - cxC)) doorCell = [x, z];
  }
}

// Pass 1: foundation, body, floors, windows, roof.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const ext = exteriorOf(x, z);
  const isB = ext.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Body from ground up to the top storey wall.
  for (let y = gr; y <= TOP; y++) {
    const m = y % 5;
    const slab = m === 0 || y === gr;
    if (slab) {
      let id;
      if (!isB) id = "smooth_stone";
      else if (y === gr) id = "polished_granite";
      else id = "light_gray_concrete";
      g.set(x, y, z, id);
      continue;
    }
    if (!isB) continue; // interior: air gap

    if (ext.length >= 2) {
      g.set(x, y, z, "white_concrete"); // corner pier
      continue;
    }
    const d = ext[0];
    const idx = d.axis === "x" ? x : z;
    if (m === 4) {
      g.set(x, y, z, "light_gray_concrete"); // spandrel
      continue;
    }
    // m = 1..3: window band. Odd index = glass, even = white mullion.
    if (idx % 2 === 1) {
      const id = y < gr + 5 ? "cyan_stained_glass" : "cyan_stained_glass_pane";
      g.set(x, y, z, id);
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Roof: cornice + membrane at ROOF, parapet on the perimeter.
  g.set(x, ROOF, z, isB ? "light_gray_concrete" : "gray_concrete");
  if (isB) g.set(x, ROOF + 1, z, "white_concrete");
}

// Entrance doorway on the north face (two blocks high, on the ground storey).
if (doorCell) {
  const [dx0, dz0] = doorCell;
  const gr = Math.max(0, Math.round(ground.get(key(dx0, dz0))));
  g.set(dx0, gr + 1, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx0, gr + 2, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Service core on the roof, centred on the footprint.
if (has(cx, cz)) {
  for (const [x, z] of cells) {
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1 && exteriorOf(x, z).length === 0) {
      const ring = Math.abs(x - cx) === 1 || Math.abs(z - cz) === 1;
      for (let y = ROOF + 1; y <= 60; y++) {
        const glass = ring && (y === 57 || y === 58);
        g.set(x, y, z, glass ? "cyan_stained_glass_pane" : "white_concrete");
      }
      g.set(x, 61, z, "light_gray_concrete");
    }
  }
  // Mast with a warm beacon at the top.
  for (let y = 62; y <= 65; y++) g.set(cx, y, cz, "iron_bars");
  g.set(cx, 66, cz, "sea_lantern");
}

// Shroomlights on the four parapet corners for dusk reading.
for (const [x, z] of cells) {
  if (exteriorOf(x, z).length >= 2) g.set(x, 57, z, "shroomlight");
}

// Pass 2: warm glowstone just behind some glass in the interior air gap.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const ext = exteriorOf(x, z);
  if (ext.length !== 1) continue;
  const d = ext[0];
  const idx = d.axis === "x" ? x : z;
  for (let y = gr; y <= TOP; y++) {
    if (y % 5 !== 2 || idx % 4 !== 1) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (has(ix, iz) && exteriorOf(ix, iz).length === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
