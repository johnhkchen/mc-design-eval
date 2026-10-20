import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099777";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, H = 71, D = 20;
const ROOF = 55;          // roof deck slab (top of the storey stack)
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isBoundary = (x, z) => outward(x, z).length > 0;
const s0Of = (x, z) => Math.ceil(ground.get(`${x},${z}`) / 5) * 5;

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Facade block for a boundary cell at height y of the storey starting at slab s.
// a = coordinate along the facade; bay = which 4-block bay it sits in.
function facadeBlock(a, y, s, s0) {
  const bay = Math.floor(a / 4);
  if (y === s + 4) return "light_gray_concrete";               // spandrel / storey line
  if (a % 4 === 0) return "white_concrete";                    // mullion
  if (y === s + 1 && s === s0) return "polished_granite";      // base course
  // Solid infill in some bays so the wall is not all see-through glass.
  if (s !== s0 && (bay + s / 5) % 3 === 2) {
    return y === s + 2 ? "light_gray_concrete" : "stone_bricks";
  }
  // Ground storey: tinted glazing for the shopfront.
  if (s === s0) return "light_blue_stained_glass_pane";
  return "light_blue_stained_glass_pane";
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // First slab at or above ground; podium fills the gap below it.
  const s0 = Math.ceil(gr / 5) * 5;
  for (let y = gr; y < s0; y++) put(x, y, z, "stone_bricks");

  const outs = outward(x, z);
  const bnd = outs.length > 0;
  const [odx, odz] = bnd ? outs[0] : [0, 0];
  const a = bnd ? (odz !== 0 ? x : z) : 0; // coordinate along the outward face

  // Storey stack: floor slabs every 5 blocks, facade walls between them.
  for (let s = s0; s <= ROOF; s += 5) {
    put(x, s, z, "light_gray_concrete", { type: "bottom" });  // floor slab
    if (s === ROOF) break;
    if (!bnd) continue; // interior: air behind the glass
    for (let y = s + 1; y <= s + 4; y++) {
      // Wide lobby on the north (z-min) face, centred, with a canopy.
      const lobby = s === s0 && odz === -1 && x >= 18 && x <= 25;
      const door = lobby && x >= 21 && x <= 22;
      if (door && (y === s + 1 || y === s + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: y === s + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (lobby && y === s + 3) {
        put(x, y, z, "stone_brick_slab", { type: "bottom" });   // canopy
      } else if (lobby && y <= s + 2) {
        put(x, y, z, a % 4 === 0 ? "white_concrete" : "light_blue_stained_glass_pane");
      } else {
        put(x, y, z, facadeBlock(a, y, s, s0));
      }
    }
  }

  // Cornice and parapet.
  if (bnd) {
    put(x, 56, z, "stone_brick_slab", { type: "bottom" });
    put(x, 57, z, "white_concrete");
    put(x, 58, z, "white_concrete");
  }
}

// Warm light behind some glazing: glowstone in the interior cell inside each window.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isBoundary(x, z)) continue;
  const [dx, dz] = outward(x, z)[0];
  const a = dz !== 0 ? x : z;
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isBoundary(ix, iz)) continue;
  const s0 = s0Of(x, z);
  for (let s = s0 + 5; s < ROOF; s += 5) {
    if (a % 4 !== 2) continue;
    if ((Math.floor(a / 4) + s / 5) % 3 === 2) continue; // solid bay, no window
    if ((a + s) % 3 !== 0) continue;
    put(ix, s + 2, iz, "glowstone");
  }
}

// Roof plant room, set back in the centre of the footprint.
for (let x = 14; x <= 29; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!has(x, z)) continue;
    const edge = x === 14 || x === 29 || z === 6 || z === 13;
    put(x, 56, z, "light_gray_concrete");
    put(x, 57, z, edge ? "iron_bars" : "light_gray_concrete");
    put(x, 58, z, "light_gray_concrete");
  }
}
if (has(21, 9)) put(21, 59, 9, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
