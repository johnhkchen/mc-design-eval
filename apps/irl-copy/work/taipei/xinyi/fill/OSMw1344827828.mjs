import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no identity. Read as a 1960s-80s Taipei low-rise commercial block:
// one tall ground storey (shopfront), one partial upper storey, flat roof with
// a stone-capped parapet, white tiled-concrete walls, aluminium-framed glazing.
// Roof sits ~7 blocks above lowest ground (TOP = minGround + 7).

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw1344827828.cells.json`, "utf8"));

const W = 9, H = 19, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inFp = (x, z) => ground.has(key(x, z));
const minG = Math.min(...cells.map((c) => c[2]));
const TOP = Math.min(H - 2, minG + 7); // roof surface level (parapet top)

// Which exterior faces a footprint cell has (N: z-1, S: z+1, W: x-1, E: x+1)
function faces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
}

const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const slabTop = { type: "top", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) set(x, y, z, "stone_bricks");

  // Cells at or above the roof level: solid column only
  if (gr >= TOP) {
    continue;
  }

  const f = faces(x, z);

  // Interior cell: floor slabs, roof deck, air elsewhere
  if (f.length === 0) {
    set(x, gr, z, "smooth_stone");                 // ground floor slab
    if (gr + 4 < TOP) set(x, gr + 4, z, "smooth_stone"); // storey line slab
    set(x, TOP, z, "light_gray_concrete");          // roof deck
    // small rooftop plant box
    if (x >= 3 && x <= 5 && z >= 4 && z <= 5 && TOP + 1 < H) {
      set(x, TOP + 1, z, "gray_concrete");
    }
    continue;
  }

  // Perimeter cell
  const corner = f.length > 1;
  const face = f[0];
  const alongNS = face === "N" || face === "S";
  const along = alongNS ? x : z;
  const last = alongNS ? W - 1 : D - 1;
  const windowable = !corner && along > 0 && along < last && along % 3 !== 0;
  const isDoor = !corner && face === "S" && x === 4;
  // inward offset for glowstone placed behind glass (interior neighbour)
  const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[face];

  for (let y = gr; y <= TOP && y < H; y++) {
    const rel = y - gr;

    if (y === TOP) {
      set(x, y, z, "stone_brick_slab", slabTop);   // parapet cornice cap
      continue;
    }
    if (rel === 0) {
      set(x, y, z, "polished_andesite");           // base course / plinth
      continue;
    }
    if (rel === 4) {
      set(x, y, z, "smooth_stone");                // storey line
      continue;
    }

    if (rel <= 3) {
      // Ground storey: shopfront glazing, central entrance on south face
      if (isDoor && rel === 1) { set(x, y, z, "dark_oak_door", doorProps("lower")); continue; }
      if (isDoor && rel === 2) { set(x, y, z, "dark_oak_door", doorProps("upper")); continue; }
      if (isDoor && rel === 3) { set(x, y, z, "white_concrete"); continue; }
      if (windowable && !isDoor) {
        set(x, y, z, "light_blue_stained_glass");
        // warm light behind some shopfront glass, standing on the ground slab
        if (rel === 1 && along % 2 === 0) {
          const ix = x + inward[0], iz = z + inward[1];
          if (inFp(ix, iz)) set(ix, y, iz, "glowstone");
        }
      } else {
        set(x, y, z, "white_concrete");              // piers
      }
      continue;
    }

    // Upper storey (rel 5..TOP-1): window grid with piers
    if (windowable && y < TOP) {
      set(x, y, z, "light_blue_stained_glass");
      if (rel === 5 && along % 2 === 1) {
        const ix = x + inward[0], iz = z + inward[1];
        if (inFp(ix, iz)) set(ix, y, iz, "shroomlight");
      }
    } else {
      set(x, y, z, "white_concrete");
    }
  }
}

g.save(`${dir}/OSMw1344827828.nbt`);
