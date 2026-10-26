import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57270.cells.json`, "utf8"));

// 1775 K St NW: 1980s Washington office block. Light precast piers and spandrels,
// tinted glass bands, granite base, storey-tiered massing with a terraced perimeter,
// a centred street entrance with canopy, and a mechanical roof.
const W = 18, H = 33, D = 18;
const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const CARD = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.min(H - 8, Math.round(gr)));
  cellMap.set(key(x, z), { x, z, g: ground, r: Math.round(roof) });
}
const minG = Math.min(...[...cellMap.values()].map((c) => c.g));

// Smooth lidar noise (3x3 mean), then snap to 4-block storey tiers above the lowest ground.
for (const c of cellMap.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = cellMap.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.r; n++; }
  }
  const mean = sum / n;
  const storeys = Math.max(2, Math.round((mean - minG) / 4));
  c.T = Math.min(H - 3, Math.max(c.g + 5, minG + 4 * storeys));
}

// Perimeter ring steps down one storey into a terrace; the core rises to full height.
for (const c of cellMap.values()) {
  c.perim = Object.values(CARD).some(([dx, dz]) => !cellMap.has(key(c.x + dx, c.z + dz)));
  c.top = c.perim ? Math.max(c.g + 5, c.T - 4) : c.T;
}
const maxTop = Math.max(...[...cellMap.values()].map((c) => c.top));

// Exposed faces at height y, street (south) face first so corners read correctly.
const PRIORITY = ["south", "north", "east", "west"];
function exposedDirs(c, y) {
  const out = [];
  for (const name of PRIORITY) {
    const [dx, dz] = CARD[name];
    const n = cellMap.get(key(c.x + dx, c.z + dz));
    if (!n || y >= n.top) out.push(name);
  }
  return out;
}

function facade(c, y, dir) {
  const rel = y - c.g;
  const s = (dir === "north" || dir === "south") ? c.x : c.z;

  if (y === c.top - 1) return ["polished_andesite"];           // cornice / parapet
  if (rel === 0) return ["polished_granite"];                  // granite base course

  if (rel < 4) {                                               // ground-floor shopfront
    const entrance = dir === "south" && s >= 7 && s <= 10;
    if (entrance && (s === 8 || s === 9) && (rel === 1 || rel === 2)) {
      return ["door", dir, rel === 1 ? "lower" : "upper", s === 8 ? "left" : "right"];
    }
    if (entrance && rel === 3) return ["dark_oak_slab", "top"];
    if (s % 3 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass"];
  }

  if (rel % 4 === 0) return ["calcite"];                       // precast spandrel per storey
  if (s % 3 === 0) return ["white_concrete"];                  // pier
  if (s % 6 === 1 && rel % 8 === 2 && (c.x + c.z) % 3 === 0) return ["glowstone"]; // sparse warm light
  return ["gray_stained_glass"];                               // tinted bronze glass
}

function place(x, y, z, spec) {
  if (spec[0] === "door") {
    const [, dir, half, hinge] = spec;
    g.set(x, y, z, "dark_oak_door", {
      facing: dir, half, hinge, open: "false", powered: "false",
    });
    return;
  }
  if (spec[0] === "dark_oak_slab") {
    g.set(x, y, z, "dark_oak_slab", { type: spec[1], waterlogged: "false" });
    return;
  }
  g.set(x, y, z, spec[0]);
}

for (const c of cellMap.values()) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone");

  for (let y = c.g; y < c.top; y++) {
    const dirs = exposedDirs(c, y);
    if (dirs.length) {
      place(c.x, y, c.z, facade(c, y, dirs[0]));
    } else if (y === c.top - 1) {
      g.set(c.x, y, c.z, "light_gray_concrete");               // interior roof membrane
    } else if ((y - c.g) % 4 === 0) {
      g.set(c.x, y, c.z, "smooth_stone");                      // interior floor slab
    }
    // otherwise air behind the glass
  }

  // Roof plant on the main roof, set back from the perimeter.
  if (!c.perim && c.top === maxTop && c.x % 6 === 3 && c.z % 6 === 3 && c.top + 2 < H) {
    g.set(c.x, c.top, c.z, "light_gray_concrete");
    g.set(c.x, c.top + 1, c.z, "iron_bars");
  }
}

g.save(`${DIR}/DC57270.nbt`);
