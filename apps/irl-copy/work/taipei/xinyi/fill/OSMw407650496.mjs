import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw407650496.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw407650496.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 35, H = 23, D = 29;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground level
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Storey plan (absolute y, y 0 = lowest ground)
const STRING_1 = 5;   // string course / second-floor slab
const SILL = 9;       // band under cornice
const CORNICE = 10;   // top of walls and roof deck; roof surface at y = 11

// Materials
const GLASS = "glass_pane";
const PIER = "light_gray_concrete";   // shopfront piers and lintels
const PIER_UP = "stone_bricks";       // upper storey piers: textured relief against glass
const BASE = "polished_andesite";
const SLAB = "smooth_stone";

const paneProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Outward faces of an edge cell, in fixed priority order
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ name: "north", dx: 0, dz: -1, t: x, axis: "x" });
  if (!has(x, z + 1)) f.push({ name: "south", dx: 0, dz: 1, t: x, axis: "x" });
  if (!has(x - 1, z)) f.push({ name: "west", dx: -1, dz: 0, t: z, axis: "z" });
  if (!has(x + 1, z)) f.push({ name: "east", dx: 1, dz: 0, t: z, axis: "z" });
  return f;
}

// Entrance: south face (max z), column nearest the footprint's mean x
const n = cells.length;
const meanX = Math.round(cells.reduce((s, [x]) => s + x, 0) / n);
const meanZ = Math.round(cells.reduce((s, [, z]) => s + z, 0) / n);
const maxZ = Math.max(...cells.map(([, z]) => z));
let doorX = null;
for (const [x, z] of cells) {
  if (z !== maxZ || !isEdge(x, z)) continue;
  if (doorX === null || Math.abs(x - meanX) < Math.abs(doorX - meanX)) doorX = x;
}
const doorKey = doorX === null ? null : `${doorX},${maxZ}`;

// 1. Foundations and slabs
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (gr <= STRING_1) g.set(x, STRING_1, z, SLAB);   // second-floor slab
  g.set(x, CORNICE, z, SLAB);                          // roof deck
}

// 2. Exterior walls
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const fs = faces(x, z);
  if (fs.length === 0) continue;
  const f = fs[0];
  const t = f.t;
  const isDoorCell = doorKey === `${x},${z}`;
  const nearDoor = doorX !== null && f.name === "south" && z === maxZ && Math.abs(x - doorX) === 1;

  for (let y = gr; y <= CORNICE; y++) {
    let block = null, props;

    if (y === CORNICE) {
      block = "smooth_stone";
    } else if (y === SILL) {
      block = PIER_UP;
    } else if (y === STRING_1) {
      block = SLAB;
    } else if (y < STRING_1) {
      // Ground-floor shopfront
      if (y === gr) block = BASE;
      else if (y === STRING_1 - 1) block = PIER;
      else if (nearDoor) block = PIER;                  // stone jambs flanking the entrance
      else if (t % 6 === 0) block = PIER;
      else { block = GLASS; props = paneProps(f.axis); }
    } else {
      // Upper storey windows
      if (t % 3 === 0) block = PIER_UP;
      else { block = GLASS; props = paneProps(f.axis); }
    }

    if (block) g.set(x, y, z, block, props);
  }

  // Lit bays: glowstone just inside the upper glass
  if (t % 6 === 1 && gr <= 6) {
    const ix = x - f.dx, iz = z - f.dz;
    if (has(ix, iz) && !isEdge(ix, iz)) g.set(ix, 7, iz, "glowstone");
  }

  // Entrance: two-block oak door with stone lintel above and hanging lantern inside
  if (isDoorCell && gr + 2 < STRING_1 - 1) {
    const dprops = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
    g.set(x, gr, z, "oak_door", dprops("lower"));
    g.set(x, gr + 1, z, "oak_door", dprops("upper"));
    g.set(x, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    // Warm hanging lantern inside, under the second-floor slab
    const ix = x, iz = z - 1;
    if (has(ix, iz) && gr <= STRING_1) {
      g.set(ix, STRING_1 - 1, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// 3. Rooftop: penthouse and mechanical units
const cx = meanX, cz = meanZ;
const inBox = (x, z) => x >= cx - 3 && x <= cx + 3 && z >= cz - 2 && z <= cz + 2;
const onRing = (x, z) => inBox(x, z) && (x === cx - 3 || x === cx + 3 || z === cz - 2 || z === cz + 2);

for (const [x, z] of cells) {
  if (inBox(x, z)) {
    if (onRing(x, z)) {
      for (let y = CORNICE + 1; y <= CORNICE + 3; y++) g.set(x, y, z, PIER);
    }
    g.set(x, CORNICE + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else if (!isEdge(x, z) && x % 6 === 2 && z % 5 === 2) {
    g.set(x, CORNICE + 1, z, "iron_block");
  }
}

g.save(OUT);
