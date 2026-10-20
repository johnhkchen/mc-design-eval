import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿財訊大樓 (Taipei World Trade Finance/Information Building, Xinyi)
// Late-1980s/1990s Taipei speculative office tower: 12 storeys of 5 blocks,
// pale quartz-clad piers, light blue tinted glazing in white mullions,
// granite base with a clear-glass storefront and a three-bay entrance,
// flat roof with a parapet, a setback penthouse and a rooftop mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103464";
const W = 19, H = 71, D = 54;
const ROOF = 58;        // roof deck top; parapet rises to 60
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));

const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, Math.round(g - minG));

const has = (x, z) => ground.has(`${x},${z}`);
const baseOf = (x, z) => ground.get(`${x},${z}`) ?? 0;
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// the interior neighbour directly behind a facade cell
function inward(x, z) {
  if (!has(x - 1, z)) return [x + 1, z];
  if (!has(x + 1, z)) return [x - 1, z];
  if (!has(x, z - 1)) return [x, z + 1];
  return [x, z - 1];
}

// position along the wall the cell sits on: z for east/west walls, x for north/south
function alongWall(x, z) {
  const eastWest = !has(x - 1, z) || !has(x + 1, z);
  return eastWest ? z : x;
}

// deterministic pseudo-random for the few warm lights
function hash(x, y, z) {
  let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return (h >>> 0) % 15;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// entrance: north (min z) side, middle column of the footprint
const doorX = Math.floor(W / 2);
const doorZs = cells.filter((c) => c[0] === doorX).map((c) => c[1]);
const doorZ = doorZs.length ? Math.min(...doorZs) : null;
const isEntranceBay = (x, z) =>
  doorZ !== null && z === doorZ && Math.abs(x - doorX) <= 1 && has(x, z);

function facadeBlock(x, z, y) {
  const k = Math.floor(y / STOREY);
  const r = y % STOREY;
  if (r === 0) return k === 0 ? "polished_granite" : "light_gray_concrete";
  if (r === 4) return "light_gray_concrete";
  const along = alongWall(x, z);
  const mullion = ((along % 3) + 3) % 3 === 0;
  if (mullion) return "white_concrete";
  return k === 0 ? "glass" : "light_blue_stained_glass";
}

// ---- main shell -------------------------------------------------------------
for (const [x, z] of cells) {
  const gc = baseOf(x, z);
  const edge = isEdge(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // interior: floor slab per storey, air between (no interiors)
    for (let y = gc; y < ROOF; y++) {
      if (y % STOREY === 0) put(x, y, z, "smooth_quartz");
    }
  } else {
    // facade: pier / glass / spandrel bands on the wall's own grid
    for (let y = gc; y < ROOF; y++) {
      put(x, y, z, facadeBlock(x, z, y));
    }
    // a few warm lights behind the glass (interior cell just inside)
    for (let y = Math.max(gc, 1); y < ROOF; y++) {
      const r = y % STOREY;
      if (r < 1 || r > 3) continue;
      const along = alongWall(x, z);
      if (((along % 3) + 3) % 3 === 0) continue;
      if (hash(x, y, z) !== 0) continue;
      const [ix, iz] = inward(x, z);
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
    // parapet: wall course, then a capping slab
    put(x, 59, z, "white_concrete");
    put(x, 60, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }

  // roof deck
  put(x, ROOF, z, edge ? "smooth_quartz" : "smooth_stone");
}

// ---- entrance: three-bay glazed lobby with a surround and a door ------------
if (doorZ !== null && has(doorX, doorZ)) {
  for (let x = doorX - 1; x <= doorX + 1; x++) {
    if (!has(x, doorZ)) continue;
    const gc = baseOf(x, doorZ);
    // granite plinth course stays; clear glass lobby above it
    for (let y = gc + 1; y <= gc + 3; y++) {
      put(x, y, doorZ, x === doorX ? "glass" : "glass");
    }
    // light surround: a quartz lintel over the bay
    put(x, gc + 4, doorZ, "smooth_quartz");
    // warm lobby light just inside
    const [ix, iz] = inward(x, doorZ);
    if (has(ix, iz)) put(ix, gc + 2, iz, "glowstone");
  }
  // the door itself, centred
  const gc = baseOf(doorX, doorZ);
  put(doorX, gc, doorZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gc + 1, doorZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // flanking piers of the surround
  for (const dx of [-2, 2]) {
    const x = doorX + dx;
    if (!has(x, doorZ)) continue;
    const gcx = baseOf(x, doorZ);
    for (let y = gcx; y <= gcx + 4; y++) put(x, y, doorZ, "white_concrete");
  }
}

// ---- roof: setback penthouse, plant boxes, mast -----------------------------
const PX0 = 5, PX1 = 13, PZ0 = 12, PZ1 = 41;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const wall = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    if (wall) {
      for (let y = 59; y <= 62; y++) {
        if (y === 60 || y === 61) {
          const along = x === PX0 || x === PX1 ? z : x;
          const mull = ((along % 3) + 3) % 3 === 0;
          put(x, y, z, mull ? "white_concrete" : "light_blue_stained_glass");
        } else {
          put(x, y, z, "white_concrete");
        }
      }
    }
    put(x, 63, z, "smooth_quartz");
  }
}

// plant enclosures on the main roof
const plant = [[2, 4], [2, 6], [16, 47], [16, 49]];
for (const [x, z] of plant) {
  if (!has(x, z)) continue;
  for (let y = 59; y <= 60; y++) put(x, y, z, "light_gray_concrete");
}

// rooftop mast with a beacon at the top
const mx = 9, mz = 26;
for (let y = 64; y <= 68; y++) put(mx, y, mz, "iron_bars");
put(mx, 69, mz, "sea_lantern");

g.save(`${DIR}/${ID}.nbt`);
