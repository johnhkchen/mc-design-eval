import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752136";
const W = 24, D = 17, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const ROOF = L + 11;                              // parapet top, ~11 blocks above lowest ground
const FLOOR_A = L + 5;                            // storey 1 / storey 2 line
const FLOOR_B = L + 10;                           // roof deck / cornice

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: southernmost footprint cell nearest to x = 11 (street side, +z)
let doorX = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!has(x, z + 1) && Math.abs(x - 11) < best) {
      best = Math.abs(x - 11);
      doorX = x;
    }
  }
}

const lights = [];     // deferred warm lights (interior cells behind windows)
const canopy = [];     // deferred entrance canopy pieces

for (const [x, z, gr] of cells) {
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const perim = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);
  const alongZ = mN || mS;                  // wall runs along x
  const along = alongZ ? x : z;
  const pier = corner || along % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr + 1; y <= ROOF; y++) {
    // Floor slabs / roof deck over the whole footprint
    if (y === FLOOR_A || y === FLOOR_B) {
      put(x, y, z, "smooth_stone");
    }

    if (perim) {
      if (y === ROOF) {
        put(x, y, z, "white_concrete");                       // parapet ring
        continue;
      }
      if (y === FLOOR_A || y === FLOOR_B) {
        put(x, y, z, "smooth_quartz");                        // storey band / cornice
        continue;
      }
      if (y === L + 1) {                                      // base course
        put(x, y, z, "polished_granite");
        continue;
      }
      if (y === L + 4 || y === L + 6 || y === L + 9) {        // transoms / sills / lintels
        put(x, y, z, "white_concrete");
        continue;
      }
      if (y === L + 2 || y === L + 3 || y === L + 7 || y === L + 8) {
        // Entrance opening on the street face
        if (mS && x === doorX && (y === L + 1 || y === L + 2)) continue;
        if (pier) {
          put(x, y, z, "white_concrete");
        } else {
          const props = alongZ
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          put(x, y, z, "light_blue_stained_glass_pane", props);
          if (y === L + 7 && along % 6 === 1) {
            // warm light just inside the glass
            let ix = x, iz = z;
            if (mS) iz = z - 1;
            else if (mN) iz = z + 1;
            else if (mW) ix = x + 1;
            else if (mE) ix = x - 1;
            if (has(ix, iz) && !(!has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz))) {
              lights.push([ix, y, iz]);
            } else if (has(ix, iz)) {
              lights.push([ix, y, iz]);
            }
          }
        }
        continue;
      }
    } else {
      // Roof equipment on interior roof (stands on roof deck at L+10)
      if (y === ROOF && x % 4 === 1 && z % 3 === 1) {
        put(x, y, z, "light_gray_concrete");
      }
      if (y === ROOF + 1 && x % 4 === 1 && z % 3 === 1 && (x + z) % 2 === 0) {
        put(x, y, z, "iron_block");
      }
    }
  }

  // Entrance door and canopy on the street face
  if (mS && x === doorX) {
    put(x, L + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, L + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, L + 3, z, "white_concrete");
    for (const dx of [-1, 1]) {
      if (has(x + dx, z)) canopy.push([x + dx, z]);
    }
  }
}

// Warm lights placed after the shell so nothing overwrites them
for (const [x, y, z] of lights) put(x, y, z, "shroomlight");

// Canopy: dark awning lip over the entrance, on the ground storey top edge
for (const [x, z] of canopy) {
  put(x, L + 4, z, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
