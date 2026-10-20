import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial block, c. 1990s: white-tiled concrete frame, bronze-tinted
// blue glass in ribbon windows, glazed shopfront at street level, a plain parapet,
// and a rooftop plant room with air-handling units. Two storeys of 5 blocks each,
// roof plate at y 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831858858";
const W = 19, H = 23, D = 27;
const ROOF = 11;          // roof plate level (about 11 blocks above lowest ground)
const TOP_WALL = 10;      // last wall course below the roof plate

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const v = Number.isFinite(gr) ? gr : 0;
  G.set(key(x, z), Math.max(0, Math.round(v)));
}
const has = (x, z) => G.has(key(x, z));

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// glass pane props, connecting along the facade direction
const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade description for a footprint cell
function facade(x, z) {
  const Nn = !has(x, z - 1), Ss = !has(x, z + 1), Ww = !has(x - 1, z), Ee = !has(x + 1, z);
  if (!(Nn || Ss || Ww || Ee)) return null;
  const zFace = Nn || Ss;
  const bay = zFace ? x : z;
  const pierEnd = zFace
    ? !(has(x - 1, z) && has(x + 1, z))
    : !(has(x, z - 1) && has(x, z + 1));
  return { bay, pierEnd, zFace, N: Nn, S: Ss, W: Ww, E: Ee };
}

// Footprint extents
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// 1. Foundations, floors, roof plate, walls
for (const [k, raw] of G) {
  const [x, z] = k.split(",").map(Number);
  const gw = Math.min(TOP_WALL, raw);     // wall base level (clamped to storey frame)

  // foundation fill up to the cell's real ground
  for (let y = 0; y < Math.min(raw, H); y++) set(x, y, z, "stone_bricks");

  const f = facade(x, z);
  if (f) {
    // base course at the wall base
    for (let y = gw; y <= TOP_WALL; y++) {
      let id, props;
      const isPier = f.pierEnd || f.bay % 4 === 0;
      if (y === gw) {
        id = "polished_andesite";
      } else if (y === 4 || y === 5 || y === TOP_WALL) {
        id = "white_concrete";                     // storey lines / spandrels
      } else if (y < 4) {
        // ground storey shopfront
        if (isPier) id = "white_concrete";
        else if ((f.bay + y) % 8 === 2) id = "glowstone";
        else id = "light_blue_stained_glass";
      } else {
        // upper storey ribbon windows
        if (isPier) id = "white_concrete";
        else if ((f.bay * 3 + y) % 11 === 0) id = "glowstone";
        else {
          id = "glass_pane";
          props = f.zFace ? paneAlongX : paneAlongZ;
        }
      }
      set(x, y, z, id, props);
    }
    // roof plate, parapet and coping
    set(x, ROOF, z, "white_concrete");
    set(x, ROOF + 1, z, "white_concrete");
    set(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // interior: floor slabs, air gap, roof plate
    set(x, gw, z, "smooth_stone");
    if (gw < 5) set(x, 5, z, "smooth_stone");
    set(x, ROOF, z, "light_gray_concrete");
  }
}

// 2. Street entrance on the north (min z) face, median cell of that row
{
  const row = [];
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === minZ) row.push(x);
  }
  row.sort((a, b) => a - b);
  const ex = row[Math.floor(row.length / 2)];
  const raw = G.get(key(ex, minZ));
  const gw = Math.min(TOP_WALL, raw);
  const doorBase = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(ex, gw + 1, minZ, "oak_door", { ...doorBase, half: "lower" });
  set(ex, gw + 2, minZ, "oak_door", { ...doorBase, half: "upper" });
  set(ex, gw + 3, minZ, "smooth_stone");     // fascia over the door
}

// 3. Rooftop plant room (penthouse) on the roof plate
const PX0 = 5, PX1 = 13, PZ0 = 8, PZ1 = 18;
const inPent = (x, z) => x >= PX0 && x <= PX1 && z >= PZ0 && z <= PZ1;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    const corner = (x === PX0 || x === PX1) && (z === PZ0 || z === PZ1);
    if (ring) {
      set(x, ROOF + 1, z, "white_concrete");
      set(x, ROOF + 2, z, "white_concrete");
      set(x, ROOF + 3, z, "white_concrete");
      if (corner || (x + z) % 3 === 0) {
        set(x, ROOF + 2, z, "white_concrete");
      } else {
        const props = (x === PX0 || x === PX1) ? paneAlongZ : paneAlongX;
        set(x, ROOF + 2, z, "glass_pane", props);
      }
    }
    set(x, ROOF + 4, z, "light_gray_concrete");   // penthouse roof
  }
}
// Mast on the plant room roof
if (has(9, 13)) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) set(9, y, 13, "lightning_rod");
}

// 4. Rooftop air-handling units on the open roof plate
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (inPent(x, z)) continue;
  if (facade(x, z)) continue;                    // interior cells only
  if (x % 4 === 1 && z % 5 === 2) set(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
