import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618824";
const W = 7, H = 23, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (relative to lowest ground, so y 0 is the lowest ground).
const minG = Math.min(...cells.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - minG);
const has = (x, z) => ground.has(`${x},${z}`);
const baseOf = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Missing-neighbour flags: which sides of a cell face the outside.
const sides = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1),
  w: !has(x - 1, z), e: !has(x + 1, z),
});
const isPerim = (x, z) => { const m = sides(x, z); return m.n || m.s || m.w || m.e; };
const isCorner = (x, z) => { const m = sides(x, z); return (m.n || m.s) && (m.w || m.e); };

// Door: north-facing (missing z-1) perimeter cell nearest the middle of the footprint.
const xs = cells.map(c => c[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
let doorCell = null;
for (const [x, z] of cells) {
  if (!sides(x, z).n || isCorner(x, z)) continue;
  if (!doorCell || Math.abs(x - midX) < Math.abs(doorCell[0] - midX)) doorCell = [x, z];
}

// 1. Foundation, floor slabs, interior air gaps, roof deck.
for (const [x, z] of cells) {
  const b = baseOf(x, z);
  for (let y = 0; y < b; y++) put(x, y, z, "stone");          // foundation up to ground
  put(x, b, z, "smooth_stone");                               // ground floor slab
  put(x, b + 5, z, "light_gray_concrete");                    // upper floor slab
  if (isPerim(x, z)) put(x, b + 10, z, "stone_bricks");       // cornice course
  else put(x, b + 10, z, "red_terracotta");                   // roof surface
}

// 2. Perimeter walls, base course, shopfronts, upper windows.
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const b = baseOf(x, z);
  const m = sides(x, z);
  const corner = isCorner(x, z);
  const alongX = m.n || m.s; // facade runs east-west

  // Ground storey
  put(x, b + 1, z, "stone_bricks");                           // plinth / base course
  for (const dy of [2, 3]) {
    if (corner || (x + z) % 3 === 0) put(x, b + dy, z, "white_concrete");
    else put(x, b + dy, z, "glass");                          // shopfront glazing
  }
  put(x, b + 4, z, "light_gray_concrete");                    // fascia band

  // Upper storey
  put(x, b + 6, z, "light_gray_concrete");                    // sill band
  put(x, b + 9, z, "light_gray_concrete");                    // lintel band
  for (const dy of [7, 8]) {
    const isWin = !corner && (x + z) % 2 === 1;
    if (isWin) {
      const props = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, b + dy, z, "light_blue_stained_glass_pane", props);
    } else {
      put(x, b + dy, z, "white_concrete");                    // pilaster / spandrel
    }
  }

  // Parapet
  put(x, b + 11, z, "stone_bricks");
}

// 3. Warm light behind some upper windows (glowstone one cell inside the glass).
for (const [x, z] of cells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  if ((x + z) % 2 !== 1) continue;
  if ((x * 3 + z * 5) % 7 !== 0) continue;
  const b = baseOf(x, z);
  const m = sides(x, z);
  let ix = 0, iz = 0;
  if (m.n) iz = 1; else if (m.s) iz = -1; else if (m.w) ix = 1; else if (m.e) ix = -1;
  if (!has(x + ix, z + iz)) continue;
  put(x + ix, b + 7, z + iz, "glowstone");
}

// 4. Entrance door on the north face (drawn after the shopfront so it wins).
if (doorCell) {
  const [x, z] = doorCell;
  const b = baseOf(x, z);
  put(x, b + 2, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, b + 3, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 5. Roof plant: a couple of rooftop units on the interior roof.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 2 && x <= 3 && z >= 9 && z <= 10) {
    put(x, baseOf(x, z) + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
