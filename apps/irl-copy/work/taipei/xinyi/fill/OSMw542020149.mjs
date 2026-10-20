import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020149";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 22;
const ROOF_Y = 11;     // roof / parapet top, about 11 blocks above lowest ground
const CORNICE_Y = 10;  // top-storey ceiling and cornice line
const STOREY_Y = 5;    // storey line and floor slab between the two storeys

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const has = (x, z) => groundOf.has(key(x, z));

function missing(x, z) {
  return { w: !has(x - 1, z), e: !has(x + 1, z), n: !has(x, z - 1), s: !has(x, z + 1) };
}

// Find the front (south-facing, +z) entrance cell nearest the middle of the facade.
let cx = 0, n = 0;
for (const [x] of cells) { cx += x; n++; }
cx /= n;
let doorCell = null;
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (!m.s) continue;
  if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell[0] - cx)) doorCell = [x, z];
}

// Centre cell for roof plant and mast.
let cz = 0;
for (const [, z] of cells) cz += z;
cz /= n;
let centre = null;
for (const [x, z] of cells) {
  if (!centre || (x - cx) ** 2 + (z - cz) ** 2 < (centre[0] - cx) ** 2 + (centre[1] - cz) ** 2) centre = [x, z];
}

// Foundations and building shell, cell by cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const m = missing(x, z);
  const edge = m.w || m.e || m.n || m.s;
  const corner = (m.w || m.e) && (m.n || m.s);
  const isFront = m.s;
  const u = (m.w || m.e) ? z : x; // position along the wall the cell sits on

  for (let y = gr; y <= ROOF_Y && y < H; y++) {
    // Base course and ground floor slab.
    if (y === gr) {
      g.set(x, y, z, edge ? "polished_granite" : "smooth_stone");
      continue;
    }
    // Roof: parapet on the edge, roof slab inside.
    if (y === ROOF_Y) {
      g.set(x, y, z, edge ? "white_concrete" : "gray_concrete");
      continue;
    }
    // Cornice line and top-storey ceiling.
    if (y === CORNICE_Y) {
      g.set(x, y, z, edge ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    // Storey line and floor slab between storeys.
    if (y === STOREY_Y) {
      g.set(x, y, z, edge ? "white_concrete" : "smooth_stone");
      continue;
    }
    // Interior cells are air gaps between floor slabs.
    if (!edge) continue;

    // Ground-floor shopfront and entrance on the south facade.
    if (isFront && y <= gr + 3 && Math.abs(x - cx) <= 4) {
      const isDoor = doorCell && x === doorCell[0] && z === doorCell[1];
      if (y === gr + 3) {
        g.set(x, y, z, "dark_oak_planks"); // canopy over the shopfront
        continue;
      }
      if (isDoor) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, "glass"); // shopfront glazing
      continue;
    }

    // Window bands: piers at corners and every third bay, glass otherwise.
    if (corner || u % 3 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane");
      // Warm light just behind some ground-floor windows.
      if (y === gr + 2 && u % 6 === 1) {
        const dx = m.w ? 1 : m.e ? -1 : 0;
        const dz = m.n ? 1 : m.s ? -1 : 0;
        if (has(x + dx, z + dz)) g.set(x + dx, y, z + dz, "glowstone");
      }
    }
  }

  // Roof plant room and mast on the cells near the centre.
  if (gr <= ROOF_Y && ROOF_Y + 2 < H) {
    const d2 = (x - centre[0]) ** 2 + (z - centre[1]) ** 2;
    if (d2 <= 4) {
      g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
      g.set(x, ROOF_Y + 2, z, "light_gray_concrete");
    }
  }
}

// Antenna mast with a warm lantern at the top.
if (centre) {
  const [mx, mz] = centre;
  const base = ROOF_Y + 3;
  for (let y = base; y <= base + 4 && y < H; y++) g.set(mx, y, mz, "iron_bars");
  if (base + 5 < H) g.set(mx, base + 5, mz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
