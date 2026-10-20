import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121673";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Era: 1990s Xinyi commercial mid-rise. Two storeys of shopfront and office
// behind white tile, quartz cornice, glass curtain bands, flat parapet roof.
const W = 24, H = 23, D = 18;
const TOP = 10;      // top course index; roof top face is y = 11
const FLOOR_Y = 5;   // storey line between ground and upper floor
const CORNICE_Y = 9;
const SHOP_TOP = 4;  // last ground-storey window row

const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, gr);
const has = (x, z) => map.has(`${x},${z}`);
const ground = (x, z) => map.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const perimeter = (x, z) =>
  !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Facade orientation: returns "x" for faces running along x, "z" for faces along z.
const faceAxis = (x, z) => (!has(x, z - 1) || !has(x, z + 1) ? "x" : "z");

// Inward step from a perimeter cell toward the footprint interior.
const inward = (x, z) => {
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  return [dx, dz];
};

const pane = (x, y, z, axis) => {
  const along = axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  g.set(x, y, z, "glass_pane", { ...along, waterlogged: "false" });
};

const isDoorCell = (x, z) => z === minZ && (x === 11 || x === 12);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  // Interior floor slab at the storey line and roof deck at the top course.
  if (gr <= FLOOR_Y) g.set(x, FLOOR_Y, z, "smooth_stone");
  if (gr <= TOP && !perimeter(x, z)) g.set(x, TOP, z, "smooth_stone");

  if (!perimeter(x, z)) continue;

  const axis = faceAxis(x, z);
  const t = axis === "x" ? x : z;
  const mullion = (t - (axis === "x" ? minX : minZ)) % 3 === 0;
  const [dx, dz] = inward(x, z);
  const lit = (x + z) % 4 === 0;

  for (let y = gr; y <= TOP; y++) {
    if (y === gr) {
      g.set(x, y, z, "polished_granite");               // base course
    } else if (y <= SHOP_TOP) {
      if (isDoorCell(x, z)) {
        if (y === gr) g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" });
        else if (y === gr + 1) g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" });
        else g.set(x, y, z, "light_gray_concrete");
      } else if (mullion) {
        g.set(x, y, z, "light_gray_concrete");          // shopfront mullion
      } else {
        pane(x, y, z, axis);                            // ground-floor glazing
      }
    } else if (y === FLOOR_Y) {
      g.set(x, y, z, "quartz_block");                   // storey band
    } else if (y < CORNICE_Y) {
      if (mullion) g.set(x, y, z, "light_gray_concrete");
      else pane(x, y, z, axis);                         // upper office glazing
    } else if (y === CORNICE_Y) {
      g.set(x, y, z, "quartz_block");                   // cornice
    } else {
      g.set(x, y, z, "white_concrete");                 // parapet
    }
  }

  // Wall tile between storeys, and warm lights behind some glass.
  for (let y = Math.max(gr + 1, 0); y <= TOP; y++) {
    if (y > SHOP_TOP && y < FLOOR_Y) continue;
    if (y > FLOOR_Y && y < CORNICE_Y) continue;
  }
  if (lit && has(x + dx, z + dz) && !perimeter(x + dx, z + dz)) {
    const ly = gr + 1 <= SHOP_TOP ? gr + 1 : 7;
    if (ly > gr && ly < H && !isDoorCell(x, z)) {
      g.set(x + dx, ly, z + dz, ly <= SHOP_TOP ? "lantern" : "glowstone",
        ly <= SHOP_TOP ? { hanging: "false", waterlogged: "false" } : undefined);
    }
  }
  if (!lit && has(x + dx, z + dz) && !perimeter(x + dx, z + dz) && (x * 3 + z) % 5 === 0) {
    if (7 > gr && 7 < H) g.set(x + dx, 7, z + dz, "glowstone");
  }
}

// Fill the wall body between windows: white tile on the non-glazed courses.
for (const [x, z, gr] of cells) {
  if (!perimeter(x, z)) continue;
  const axis = faceAxis(x, z);
  const t = axis === "x" ? x : z;
  const mullion = (t - (axis === "x" ? minX : minZ)) % 3 === 0;
  for (let y = gr + 1; y <= TOP; y++) {
    const inShop = y <= SHOP_TOP;
    const inUpper = y > FLOOR_Y && y < CORNICE_Y;
    if (y === FLOOR_Y || y === CORNICE_Y || y === TOP) continue;
    if (!inShop && !inUpper) g.set(x, y, z, "white_concrete");
  }
}

// Roof plant: a few screened mechanical boxes on the roof deck.
for (const [x, z, gr] of cells) {
  if (perimeter(x, z) || gr > TOP) continue;
  const inPlant = x >= 6 && x <= 9 && z >= 5 && z <= 8;
  if (inPlant && (x === 6 || x === 9 || z === 5 || z === 8)) {
    g.set(x, TOP + 1, z, "light_gray_concrete");
  }
}
// Mechanical unit grille in the middle of the plant.
if (has(7, 6) && has(8, 6)) {
  g.set(7, TOP + 1, 6, "iron_block");
  g.set(8, TOP + 1, 6, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
