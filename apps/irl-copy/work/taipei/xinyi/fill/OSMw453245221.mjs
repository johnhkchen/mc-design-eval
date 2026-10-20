import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 鴻禧花園大廈 : 1980s Taiwanese residential tower, reinforced concrete frame,
// white-painted wall tiles, light-grey spandrel bands, glazed window bays with
// iron railings, a shopfront plinth, a parapet roof and a mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245221";
const W = 40, D = 36, H = 90;
const ROOF_Y = 76;          // roof slab level (parapet occupies 76..77)
const TOP_BODY = 75;        // last body row below the roof slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minG = Infinity;
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, g);
  minG = Math.min(minG, g);
}
if (!isFinite(minG)) minG = 0;

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

// Depth from the outside edge (1 = facade cell).
const depth = new Map();
let frontier = [];
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    depth.set(key(x, z), 1);
    frontier.push([x, z]);
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = depth.get(key(x, z));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (has(nx, nz) && !depth.has(key(nx, nz))) {
        depth.set(key(nx, nz), d + 1);
        next.push([nx, nz]);
      }
    }
  }
  frontier = next;
}
const dep = (x, z) => depth.get(key(x, z)) ?? 1;

// Facade orientation of a perimeter cell.
function faceOf(x, z) {
  const xm = !has(x - 1, z), xp = !has(x + 1, z);
  if (xm || xp) {
    return { axis: "x", coord: z, dx: xm ? 1 : -1, dz: 0 };     // inward direction
  }
  const zm = !has(x, z - 1);
  return { axis: "z", coord: x, dx: 0, dz: zm ? 1 : -1 };
}

// Entrance: north-facing edge cell nearest the middle of the frontage.
let entKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (dep(x, z) !== 1) continue;
    if (has(x, z - 1)) continue;             // needs the outward side open
    const dist = Math.abs(x - W / 2);
    if (dist < best) { best = dist; entKey = key(x, z); }
  }
}

const paneProps = (axis) =>
  axis === "x"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Lit windows: glowstone one cell inside, behind the glass.
const LIT = new Set();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (dep(x, z) !== 1) continue;
  const f = faceOf(x, z);
  for (let y = groundAt(x, z); y <= TOP_BODY; y++) {
    const r = y - minG, s = Math.floor(r / 5), o = r % 5;
    if (s < 1 || o !== 2) continue;
    const b = ((f.coord % 4) + 4) % 4;
    if (b !== 1 && b !== 2) continue;
    if (((x * 7 + z * 11 + s * 3) % 5) !== 0) continue;
    const ix = x + f.dx, iz = z + f.dz;
    if (has(ix, iz)) LIT.add(`${ix},${iz},${y}`);
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade block for a perimeter cell at height y.
function facadeBlock(f, y) {
  const r = y - minG;
  const s = Math.floor(r / 5), o = r % 5;
  const b = ((f.coord % 4) + 4) % 4;
  const pane = paneProps(f.axis);
  if (s === 0) {
    // Shopfront plinth and glazing
    if (o === 0) return ["polished_andesite"];
    if (o === 4) return ["light_gray_concrete"];
    if (b === 0) return ["dark_oak_planks"];
    return ["glass_pane", pane];
  }
  if (o === 0) return ["light_gray_concrete"];        // storey line / spandrel
  if (o === 4) return ["white_concrete"];             // wall above window
  if (b === 0 || b === 3) return ["white_concrete"];  // pier and plain wall bay
  if (o === 1) return ["iron_bars", pane];            // balcony railing at sill
  return ["glass_pane", pane];                        // glazing
}

for (const [x, z, gr] of cells) {
  const d = dep(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (d === 1) {
    const f = faceOf(x, z);
    for (let y = gr; y <= TOP_BODY; y++) {
      const [id, props] = facadeBlock(f, y);
      put(x, y, z, id, props);
    }
    // Parapet with coping
    put(x, ROOF_Y, z, "white_concrete");
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
  } else {
    // Interior: air gaps with a floor slab at each storey line.
    for (let y = gr; y <= TOP_BODY; y++) {
      const isSlab = y === gr || ((y - minG) % 5 === 0);
      if (LIT.has(`${x},${z},${y}`)) put(x, y, z, "glowstone");
      else if (isSlab) put(x, y, z, "light_gray_concrete");
    }
  }

  // Roof slab over every cell with depth >= 2 (supports penthouse and interior)
  if (d >= 2) put(x, ROOF_Y, z, "light_gray_concrete");

  // Mechanical penthouse, set back at least six cells from the edge.
  if (d >= 6) {
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 4; y++) {
      if (d === 6) {
        const louvre = ((x + z) % 4 === 1 || (x + z) % 4 === 2);
        if (louvre && (y === ROOF_Y + 2 || y === ROOF_Y + 3)) {
          put(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
        } else {
          put(x, y, z, "white_concrete");
        }
      } else {
        put(x, y, z, "gray_concrete");
      }
    }
    put(x, ROOF_Y + 5, z, "light_gray_concrete");   // penthouse cap at 81
  }

  // Water tanks on the penthouse cap
  if (d >= 7 && x % 6 === 0 && z % 6 === 0) {
    for (let y = ROOF_Y + 6; y <= ROOF_Y + 8; y++) put(x, y, z, "smooth_stone");
  }
}

// Entrance: door on the north face, lantern above it.
if (entKey) {
  const [ex, ez] = entKey.split(",").map(Number);
  const eg = groundAt(ex, ez);
  put(ex, eg, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 1, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
