import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618829";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Levels: two storeys of 5 blocks on a cornice and parapet; roof deck at 10, parapet top at 11.
const FLOOR2 = 5;   // upper floor slab / first storey line
const ROOF = 10;    // roof deck / cornice
const TOP = 11;     // parapet top

const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);
const outs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

function put(x, y, z, block, state) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (state) g.set(x, y, z, block, state);
  else g.set(x, y, z, block);
}

// Pass 1: foundation, floor slabs and roof deck under every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr >= TOP) continue;
  put(x, gr, z, "light_gray_concrete");                 // ground slab
  if (gr < FLOOR2) put(x, FLOOR2, z, "light_gray_concrete"); // upper floor slab
  put(x, ROOF, z, "gray_concrete");                     // roof deck
}

// Pass 2: facade walls on perimeter cells, from ground to parapet.
for (const [x, z, gr] of cells) {
  if (gr >= TOP) continue;
  const o = outs(x, z);
  if (o.length === 0) continue;
  const corner = o.length >= 2;
  const [odx, odz] = o[0];
  const u = odz !== 0 ? x : z; // position along the facade
  const pillar = corner || u % 3 === 0;

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite");                       // base course
    } else if (y <= 3) {
      if (pillar) put(x, y, z, "white_concrete");              // shopfront mullion
      else put(x, y, z, "glass");                              // clear shopfront glass
    } else if (y === 4) {
      put(x, y, z, "dark_oak_planks");                         // shop fascia / canopy band
    } else if (y === 5) {
      put(x, y, z, "light_gray_concrete");                     // storey line
    } else if (y <= 8) {
      if (pillar) put(x, y, z, "white_concrete");              // window mullion
      else put(x, y, z, "light_blue_stained_glass");           // tinted office glass
    } else if (y === 9) {
      put(x, y, z, "white_concrete");                          // spandrel
    } else if (y === ROOF) {
      put(x, y, z, "smooth_stone");                            // cornice
    } else {
      put(x, y, z, "white_concrete");                          // parapet
    }
  }
}

// Pass 3: main entrance on the north face (outward -z), nearest the centre line.
let door = null;
for (const [x, z, gr] of cells) {
  if (gr > 2 || gr >= TOP) continue;
  if (!outs(x, z).some(([dx, dz]) => dx === 0 && dz === -1)) continue;
  if (!door || Math.abs(x - 10) < Math.abs(door.x - 10)) door = { x, z, gr };
}
if (door) {
  const st = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(door.x, door.gr + 1, door.z, "dark_oak_door", st("lower"));
  put(door.x, door.gr + 2, door.z, "dark_oak_door", st("upper"));
}

// Pass 4: warm light behind glass, on interior cells only.
for (const [x, z, gr] of cells) {
  if (gr >= TOP) continue;
  const o = outs(x, z);
  if (o.length === 0 || o.length >= 2) continue;
  const [dx, dz] = o[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || outs(ix, iz).length !== 0) continue;
  const u = dz !== 0 ? x : z;
  if (u % 3 === 0) continue; // mullion column
  // Shopfront lantern on the ground storey.
  if (gr + 1 <= 3 && u % 6 === 2 && !(door && x === door.x && z === door.z)) {
    put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Upper-storey glowstone behind some office windows.
  if (u % 6 === 1) {
    put(ix, 7, iz, "glowstone");
  }
}

// Pass 5: roof plant on interior roof cells (stands on the roof deck at 10).
for (const [x, z, gr] of cells) {
  if (gr > ROOF) continue;
  if (outs(x, z).length !== 0) continue;
  if (x >= 6 && x <= 8 && z >= 8 && z <= 10) {
    put(x, TOP, z, "light_gray_concrete");
    if (x === 7 && z === 9) put(x, TOP + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
