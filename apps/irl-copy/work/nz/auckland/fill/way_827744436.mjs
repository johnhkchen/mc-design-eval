// Way 827744436: a two-storey brick commercial block of the 1920s-30s (Mt Eden / Newton shop-and-office type), built on
// its lidar footprint. The lidar roof is at most 11 blocks above y 0, so the tall part is two storeys over a parapet, and
// the lower wings step down to a single storey and then to a low deck on the downhill side. Each cell's column is solid
// from y 0 up to its own ground (foundation) and then its wall or roof, so every course stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744436.cells.json", "utf8"));

const fp = new Map();                                    // "x,z" -> { g: ground, r: lidar roof }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, r });
const has = (x, z) => fp.has(`${x},${z}`);

// lidar noise: the median of the roof over each cell and its footprint neighbours, so the massing reads as flat tiers
const top = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (has(x + dx, z + dz)) v.push(fp.get(`${x + dx},${z + dz}`).r);
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};

const g = new Voxels([15, 24, 30]);

// entrance: the west face of the tall part, where the shopfront is (cell 2,17 and the bay either side)
const DOOR = { x: 2, z: 17 };
const ENTRANCE_BAY = [16, 17, 18];

for (const [x, z] of cells) {
  const cell = fp.get(`${x},${z}`);
  const gr = cell.g;
  const T = Math.max(top(x, z), gr + 1);                   // the top block's y + 1 (the roof surface)
  const H = T - gr;                                        // blocks standing above this cell's ground
  const exp = { W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1) };
  const perim = exp.W || exp.E || exp.N || exp.S;
  // the index along the face this cell sits on: z on the west/east faces, x on the north/south faces
  const idx = exp.W || exp.E ? z : x;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let rel = 0; rel < H; rel++) {
    const y = gr + rel;
    const storey = Math.floor(rel / 4), inStorey = rel % 4;
    const top_ = rel === H - 1;
    if (!perim) {
      // interior: air, with a floor slab per storey and the roof deck on top
      if (top_) g.set(x, y, z, "stone");                   // a light tar-and-gravel deck, so the roof does not read as a black hole from the air
      else if (rel === 0 || (inStorey === 0 && rel < H - 1)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // exterior wall: one block thick
    if (top_) {                                            // coping
      g.set(x, y, z, H >= 3 ? "stone_brick_slab" : "stone_bricks", H >= 3 ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }
    if (rel === 0) { g.set(x, y, z, "polished_andesite"); continue; }   // base course
    if (inStorey === 0) { g.set(x, y, z, "smooth_stone"); continue; }   // storey line / sill
    if (inStorey === 3) { g.set(x, y, z, "stone_bricks"); continue; }   // lintel band
    // window zone, rel 1 or 2 of a storey
    if (storey === 0) {                                    // shopfront: glass with dark timber mullions
      if (exp.W && x === DOOR.x && z === DOOR.z) {
        g.set(x, y, z, "dark_oak_door", { facing: "east", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (exp.W && x === DOOR.x && ENTRANCE_BAY.includes(z)) { g.set(x, y, z, "glass_pane", paneState(exp)); continue; }
      if (idx % 3 === 0) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "glass_pane", paneState(exp));
      continue;
    }
    // upper storeys: a window per bay (every other cell), brick piers between
    if (idx % 2 === 0) {
      const lit = (x * 7 + z * 13 + storey * 5) % 9 === 0;
      if (lit) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "glass_pane", paneState(exp));
    } else g.set(x, y, z, "bricks");
  }

  // canopy over the entrance: a timber hood on the lintel band across the bay
  if (exp.W && x === DOOR.x && ENTRANCE_BAY.includes(z) && perim) {
    const y = gr + 3;
    if (y < gr + H - 1) g.set(x, y, z, "dark_oak_planks");
  }
  // a low setback cornice on the tall part, stone where it is not a window band
  if (perim && H >= 6 && (H - 2) % 4 === 3 && H - 2 >= 4) g.set(x, gr + H - 2, z, "smooth_stone");
}

// roof plant on the tall roof: a 2 x 2 unit set on the roof deck
for (const [x, z] of [[5, 16], [6, 16], [5, 17], [6, 17], [10, 20], [11, 20], [10, 21], [11, 21]]) {
  const cell = fp.get(`${x},${z}`);
  if (!cell || [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([a, b]) => !has(a, b))) continue;
  const T = Math.max(top(x, z), cell.g + 1);
  if (T >= 10) g.set(x, T, z, "light_gray_concrete");
}

// glass pane connections: along the face the pane runs with its neighbours (solid wall), across it stays open
function paneState(exp) {
  const alongZ = exp.W || exp.E;                           // on a west/east face the run goes north-south
  return { north: String(alongZ), south: String(alongZ), east: String(!alongZ), west: String(!alongZ), waterlogged: "false" };
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744436.nbt");
console.log(`way_827744436: ${res.blocks} blocks, ${res.palette} palette entries`);
