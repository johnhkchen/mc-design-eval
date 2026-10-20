import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038711371";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const W = 23, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Materials: a two-storey 1980s-style white-rendered concrete shophouse block
// with a stone plinth, light-blue glazing, and a parapet roof with plant.
const FOUND = "stone";
const BASE = "stone_bricks";
const WALL = "white_concrete";
const BAND = "smooth_stone";
const SLABM = "light_gray_concrete";
const ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass";
const PLANT = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));

// outward directions: [name, dx, dz]
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const missing = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundations up to each cell's ground, and the first-floor slab at y=5.
for (const [x, z, gg] of cells) {
  const top = Math.max(gg - 1, 4);
  for (let y = 0; y <= top; y++) put(x, y, z, FOUND);
  put(x, 5, z, SLABM);
}

// Pass 2: walls, plinth, shopfront and upper-storey glazing on perimeter cells.
for (const [x, z, gg] of cells) {
  const m = missing(x, z);
  if (m.length === 0) continue;
  const corner = m.length >= 2;
  const face = m.length === 1 ? m[0][0] : null;
  const along = face === "north" || face === "south" ? x : z;
  const pier = corner || along % 3 === 0;
  const win = !pier;

  // Ground floor (commercial): plinth, shopfront glazing, transom band.
  if (gg <= 4) {
    for (let y = gg; y <= 4; y++) {
      if (y === gg) put(x, y, z, BASE);
      else if (y === 4) put(x, y, z, BAND);
      else if (y >= 1 && win) put(x, y, z, GLASS);
      else put(x, y, z, WALL);
    }
  }

  // Upper storey: spandrel, glazing, cornice band under the roof line.
  for (let y = 6; y <= 10; y++) {
    if (y === 6 || y === 10) put(x, y, z, BAND);
    else if (win) put(x, y, z, GLASS);
    else put(x, y, z, WALL);
  }
}

// Pass 3: roof deck, cornice, parapet and coping on the footprint perimeter.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const perim = missing(x, z).length > 0;
  put(x, 11, z, perim ? BAND : ROOF);
  if (perim) {
    put(x, 12, z, WALL);
    put(x, 13, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

// Pass 4: warm lights behind some upper-storey windows (inner cell at y=8).
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
for (const [x, z] of cells) {
  const m = missing(x, z);
  if (m.length !== 1) continue;
  const face = m[0][0];
  const along = face === "north" || face === "south" ? x : z;
  if (along % 3 === 0) continue;
  if ((x + z) % 4 !== 0) continue;
  const [ix, iz] = INWARD[face];
  const nx = x + ix, nz = z + iz;
  if (inside(nx, nz) && missing(nx, nz).length === 0) {
    put(nx, 8, nz, "glowstone");
  }
}

// Pass 5: entrance on the south face, nearest the centre line, with door and lantern.
{
  let best = null;
  for (const [x, z, gg] of cells) {
    const m = missing(x, z);
    if (m.length !== 1 || m[0][0] !== "south") continue;
    if (gg + 2 > 3) continue;
    if (!best || Math.abs(x - 11) < Math.abs(best[0] - 11)) best = [x, z, gg];
  }
  if (best) {
    const [x, z, gg] = best;
    put(x, gg, z, BASE);
    put(x, gg + 1, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gg + 2, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gg + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 6: roof plant room (3x3 box, two blocks high) in the centre if it fits the footprint.
{
  const cx = 11, cz = 12;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (!inside(cx + dx, cz + dz)) ok = false;
  if (ok) {
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        put(cx + dx, 12, cz + dz, PLANT);
        put(cx + dx, 13, cz + dz, PLANT);
      }
    put(cx, 14, cz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${base}.nbt`);
