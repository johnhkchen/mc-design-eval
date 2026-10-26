import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1000 Connecticut Ave NW: 1980s-era Class A office tower on a granite-clad base.
// Massing: base at the street, tower roof from lidar, mechanical penthouse on the tallest central tier.
// Facade: white precast piers, light-blue tinted glazing, light-grey spandrels, granite base.
// Storey grid: 3 blocks per storey, floor slabs on y % 3 == 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC57882";
const W = 39, D = 18, H = 33;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { g: gr, r: roof });
const has = (x, z) => cellMap.has(`${x},${z}`);
const keyOf = (x, z) => `${x},${z}`;

// Step 1: snap each cell's lidar roof to a 3-block storey tier.
const tierOf = new Map();
for (const [key, c] of cellMap) {
  let t = 3 * Math.round(c.r / 3) - 1;
  tierOf.set(key, t);
}

// Step 2: median filter over 3x3 neighbours, so single-cell lidar spikes vanish.
const topOf = new Map();
for (const [key, c] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const k = keyOf(x + dx, z + dz);
      if (tierOf.has(k)) vals.push(tierOf.get(k));
    }
  }
  vals.sort((a, b) => a - b);
  let top = vals[Math.floor(vals.length / 2)];
  top = Math.max(c.g + 2, Math.min(H - 5, top));
  topOf.set(key, top);
}

function sidesOf(x, z) {
  return {
    n: !has(x, z - 1), // street (front) side, facing -z
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

// Entrance centred on the middle of the front facade.
const frontXs = [];
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z - 1)) frontXs.push(x);
}
const center = frontXs.length
  ? Math.round(frontXs.reduce((a, b) => a + b, 0) / frontXs.length)
  : Math.floor(W / 2);

const g = new Voxels([W, H, D]);
function put(x, y, z, id, props) {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Inward neighbour of a single-sided perimeter cell (or null).
function inwardOf(x, z, sides) {
  const n = [sides.n, sides.s, sides.w, sides.e].filter(Boolean).length;
  if (n !== 1) return null;
  let ix = x, iz = z;
  if (sides.n) iz = z + 1;
  else if (sides.s) iz = z - 1;
  else if (sides.w) ix = x + 1;
  else if (sides.e) ix = x - 1;
  if (!has(ix, iz)) return null;
  const s2 = sidesOf(ix, iz);
  if (s2.n || s2.s || s2.w || s2.e) return null;
  return [ix, iz];
}

function facadeBlock(x, z, y, gr, top, sides, u) {
  const ent = sides.n && Math.abs(x - center) <= 2;
  if (y === top) return { id: "stone_bricks" };                 // cornice / parapet
  if (ent && y === gr + 2) return { id: "polished_granite" };     // entrance lintel
  if (ent && (y === gr || y === gr + 1)) {
    if (x === center) {
      return {
        id: "oak_door",
        props: { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
      };
    }
    return { id: "glass" };                                       // lobby glazing
  }
  if (y === gr) return { id: "stone_bricks" };                    // base course
  if (y % 3 === 0) return { id: "light_gray_concrete" };          // floor slab / spandrel
  const groundBand = y < 3;
  if (u % 3 !== 0) {                                              // glazed bay
    return { id: groundBand ? "glass" : "light_blue_stained_glass" };
  }
  return { id: groundBand ? "polished_granite" : "white_concrete" }; // pier
}

for (const [key, c] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const top = topOf.get(key);
  const sides = sidesOf(x, z);
  const per = sides.n || sides.s || sides.w || sides.e;
  const u = (sides.n || sides.s) ? x : z;
  const bayIdx = Math.floor(u / 3);

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < c.g; y++) put(x, y, z, per ? "stone_bricks" : "stone");

  for (let y = c.g; y <= top; y++) {
    if (per) {
      const f = facadeBlock(x, z, y, c.g, top, sides, u);
      put(x, y, z, f.id, f.props);
      const ent = sides.n && Math.abs(x - center) <= 2;
      const inw = inwardOf(x, z, sides);
      if (inw) {
        // Lobby lanterns just inside the entrance glazing.
        if (ent && y === c.g + 1 && x !== center) {
          put(inw[0], y, inw[1], "lantern", { hanging: "false", waterlogged: "false" });
        }
        // Warm lights just inside selected upper windows.
        if (!ent && y % 3 === 1 && y > c.g && f.id === "light_blue_stained_glass" && (bayIdx + Math.floor(y / 3)) % 3 === 0) {
          put(inw[0], y, inw[1], "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    } else {
      if (y === top || y === c.g || y % 3 === 0) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Mechanical penthouse on the tallest central tier. No loose roof blocks.
let maxTop = 0;
for (const v of topOf.values()) maxTop = Math.max(maxTop, v);
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const top = topOf.get(key);
  const sides = sidesOf(x, z);
  const per = sides.n || sides.s || sides.w || sides.e;
  if (per) continue;
  const inPent = x >= Math.round(W * 0.3) && x <= Math.round(W * 0.7) && z >= Math.round(D * 0.25) && z <= Math.round(D * 0.75);
  if (top >= maxTop - 1 && inPent && top + 3 < H) {
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "light_gray_concrete");
    put(x, top + 3, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
