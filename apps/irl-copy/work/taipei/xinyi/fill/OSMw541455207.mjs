import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw541455207";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 17, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const groundAt = (x, z) => G.get(key(x, z));

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.floor((minX + maxX) / 2);

// perimeter = any side open to outside the footprint
const isPerim = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// corner = open to outside on one x side AND one z side
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// ---- palette ----------------------------------------------------------------
const FOUND = "stone_bricks";        // plinth / foundation
const BASE = "stone_bricks";         // base course at street level
const FLOOR = "smooth_stone";        // floor slabs and roof deck
const FRAME = "white_concrete";      // piers, lintels, parapet
const BAND = "light_gray_concrete";  // storey lines and cornice
const GLASS = "light_blue_stained_glass";
const CORNICE = "smooth_stone";

// ---- massing: foundation, then five-block storeys --------------------------
// h = 0 base course, 1-3 shopfront glass, 4 lintel, 5 storey line,
// 6-8 upper windows, 9 lintel, 10 cornice/roof deck, 11 parapet
for (const [x, z, gr] of cells) {
  // solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const pier = corner || (x + z) % 3 === 0;
  const isEntrance = perim && z === maxZ && x === midX;

  for (let h = 0; h <= 11; h++) {
    const y = gr + h;
    if (y >= H) continue;

    if (!perim) {
      // interior: floor slabs only, air gap otherwise
      if (h === 0 || h === 5 || h === 10) g.set(x, y, z, FLOOR);
      continue;
    }

    let b;
    if (h === 0) b = BASE;
    else if (h <= 3) {
      if (isEntrance && h <= 2) {
        // door handled below
        continue;
      }
      b = pier ? FRAME : GLASS;
    } else if (h === 4) b = FRAME;
    else if (h === 5) b = BAND;
    else if (h <= 8) b = pier ? FRAME : GLASS;
    else if (h === 9) b = FRAME;
    else if (h === 10) b = CORNICE;
    else b = FRAME; // parapet

    g.set(x, y, z, b);
  }

  // entrance: double-height door in the centre of the south front, transom above
  if (isEntrance) {
    const y1 = gr + 1, y2 = gr + 2;
    g.set(x, y1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, y2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 3, z, FRAME);
  }
}

// ---- warm light behind some upper windows -----------------------------------
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  if ((x * 7 + z * 3) % 5 !== 0) continue;
  if ((x + z) % 3 === 0) continue; // only on glass bays
  const dx = x === minX ? 1 : x === maxX ? -1 : 0;
  const dz = z === minZ ? 1 : z === maxZ ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const y = gr + 7;
  if (y < H) g.set(ix, y, iz, "shroomlight");
}

// ---- rooftop plant: two AC housings on the roof deck ------------------------
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x < 4 || x > 5 || z < 4 || z > 5) continue;
  const y = gr + 11;
  if (y + 1 >= H) continue;
  g.set(x, y, z, BAND);
  g.set(x, y + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// ---- lanterns beneath the entrance transom ----------------------------------
for (const [x, z, gr] of cells) {
  if (x === midX && z === maxZ && isPerim(x, z)) {
    const y = gr + 3;
    if (y + 1 < H) {
      g.set(x, y + 1, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
