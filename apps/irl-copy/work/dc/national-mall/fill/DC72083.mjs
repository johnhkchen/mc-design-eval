import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72083.cells.json`, "utf8"));

const W = 12, D = 17, H = 33;
const g = new Voxels([W, H, D]);

// Postmodern office tower on K Street, c. 1980s: granite base, pale precast piers,
// tinted glass bands with darker spandrels, cornice, one clean penthouse core.
// Storeys are 2 blocks; roofs quantised to even heights so the massing reads as tiers.
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rr] of cells) {
  const ground = Math.round(gr);
  let top = 2 * Math.round(Math.round(rr) / 2);
  top = Math.min(Math.max(top, ground + 4), H - 6);
  map.set(key(x, z), { g: ground, top });
}
const has = (x, z) => map.has(key(x, z));
const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));

let maxTop = 0;
for (const c of map.values()) maxTop = Math.max(maxTop, c.top);

for (const [k0, c] of map) {
  const [x, z] = k0.split(",").map(Number);
  const { g: gr, top } = c;

  // Foundation: solid granite from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");

  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missing = (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) +
                  (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);
  const perim = missing > 0;
  const corner = missing >= 2;
  // Bays: a pier every third cell along each facade, glass between
  const pier = perim && !corner && (missX ? z % 3 === 0 : x % 3 === 0);
  const isWin = perim && !corner && !pier;

  for (let y = gr; y < top; y++) {
    const k = y - gr;
    if (perim) {
      if (k === 0) {
        put(x, y, z, "polished_granite");                    // base course
      } else if (y === top - 1) {
        put(x, y, z, "smooth_stone");                        // cornice
      } else if (corner) {
        put(x, y, z, "smooth_quartz");                       // corner columns
      } else if (k === 1) {
        // storefront: glazing with pier mullions
        put(x, y, z, isWin ? "cyan_stained_glass_pane" : "smooth_quartz");
      } else if (k % 2 === 0) {
        put(x, y, z, "light_gray_concrete");                 // storey-line spandrel (shadow band)
      } else {
        put(x, y, z, isWin ? "cyan_stained_glass_pane" : "smooth_quartz"); // glass band / piers
      }
    } else {
      if (y === top - 1) {
        put(x, y, z, "light_gray_concrete");                 // roof surface
      } else if (k % 2 === 0 || y === top - 2) {
        put(x, y, z, "smooth_quartz");                       // floor slab
      } else if (k > 0 && k % 4 === 1 && (x * 3 + z * 5) % 11 === 0) {
        put(x, y, z, "glowstone");                           // sparse warm light behind glass
      }
    }
  }
}

// Penthouse core on the tallest tier: a clean block with a cap, not scattered boxes
for (let x = 3; x <= 8; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z)) continue;
    const c = map.get(key(x, z));
    if (c.top !== maxTop) continue;
    const edge = x === 3 || x === 8 || z === 5 || z === 11;
    for (let y = c.top; y < c.top + 2; y++) {
      put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
    }
    if (!edge) put(x, c.top, z, "cyan_stained_glass_pane");
    put(x, c.top + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Main entrance: lobby doors on the street-facing (lowest z) edge, nearest the centre
{
  let minZ = Infinity;
  for (const k0 of map.keys()) minZ = Math.min(minZ, Number(k0.split(",")[1]));
  let best = null;
  for (const [k0, c] of map) {
    const [x, z] = k0.split(",").map(Number);
    if (z !== minZ) continue;
    if (best === null || Math.abs(x - 6) < Math.abs(best.x - 6)) best = { x, z, g: c.g, top: c.top };
  }
  if (best) {
    const { x, z, g: gr, top } = best;
    put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // lobby canopy band above the door, inside the envelope
    if (top > gr + 3) {
      put(x, gr + 2, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/DC72083.nbt`);
