import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738185.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1067738185.nbt";

const W = 21, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(IN, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Lowest ground sets the datum; roof sits ~11 blocks above it (2 storeys + cornice + parapet)
const base = Math.min(...cells.map(c => c[2]));
const top = base + 11;

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Vertical facade bands; i = position along the wall (piers every 3rd tile)
function wallBlock(rel, i) {
  if (rel === 0) return "polished_andesite";                      // base course
  if (rel >= 1 && rel <= 3) return i % 3 === 0 ? "white_concrete" : "glass"; // shopfront / ground windows
  if (rel === 4 || rel === 5) return "light_gray_concrete";       // lintel and storey line
  if (rel >= 6 && rel <= 9) return i % 3 === 0 ? "white_concrete" : "glass"; // upper windows
  if (rel === 10) return "smooth_stone";                          // cornice
  return "white_concrete";                                        // parapet, rel 11
}

// Pick front facade: boundary cells facing north if any, else south, else first available
const boundary = cells.filter(([x, z]) => outwardOf(x, z).length > 0);
let frontDir = [0, -1];
if (!boundary.some(([x, z]) => outwardOf(x, z).some(([dx, dz]) => dx === 0 && dz === -1))) {
  frontDir = [0, 1];
}
const frontCells = boundary
  .filter(([x, z]) => outwardOf(x, z).some(([dx, dz]) => dx === frontDir[0] && dz === frontDir[1]))
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;
const doorFacing = FACING[`${frontDir[0]},${frontDir[1]}`];

const setSafe = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Main pass: foundation, walls, floors, roof
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) setSafe(x, y, z, "stone_bricks");

  const outs = outwardOf(x, z);
  if (outs.length > 0) {
    const [dx, dz] = outs[0];
    const i = dz !== 0 ? x : z; // position along the wall
    const isDoor = doorKey === key(x, z);
    for (let y = gr; y <= top; y++) {
      const rel = y - base;
      if (isDoor && (rel === 1 || rel === 2)) {
        const half = rel === 1 ? "lower" : "upper";
        setSafe(x, y, z, "oak_door", {
          facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      setSafe(x, y, z, wallBlock(rel, i));
    }
  } else {
    // Interior: floor slabs for ground, storey 2 and roof, air elsewhere
    if (gr <= base + 4) setSafe(x, gr, z, "smooth_stone");
    if (base + 5 > gr) setSafe(x, base + 5, z, "smooth_stone");
    if (base + 10 > gr) setSafe(x, base + 10, z, "smooth_stone");
  }
}

// Warm lights: shroomlight standing on the storey-2 slab, just inside lit windows
for (const [x, z, gr] of boundary) {
  for (const [dx, dz] of outwardOf(x, z).slice(0, 1)) {
    const i = dz !== 0 ? x : z;
    if (i % 6 !== 1) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    const ig = ground.get(key(ix, iz));
    if (outwardOf(ix, iz).length > 0) continue;   // must be interior
    if (ig >= base + 5) continue;                 // needs the storey-2 slab under it
    if (key(ix, iz) === doorKey) continue;
    setSafe(ix, base + 6, iz, "shroomlight");
  }
}

// Roof equipment: small plant blocks on the roof deck, interior cells only
for (const [x, z, gr] of cells) {
  if (outwardOf(x, z).length > 0) continue;
  if (gr >= base + 10) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    setSafe(x, base + 11, z, "iron_block");
  }
}

g.save(OUT);
