// DC81005: 1775 Massachusetts Ave NW, a Commercial-Office-Large block of the 1910s-20s (the Height Act's 90 ft
// avenue limit is ~12 blocks at 0.42/m). Limestone (calcite) walls, smooth-stone string courses at each floor,
// a stone base, chiseled quoins, pale glazing in stained-glass panes with air behind, flat stone roofs with a
// calcite cornice. Lidar roof heights are median-smoothed on the 3x3 footprint and cut to three tiers: a tower (13),
// a setback (7) and the low wings (4). Every floor slab is solid across its cell, every wall stands on a slab or on
// the base, every roof deck is solid, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81005.cells.json", "utf8"));
const W = 11, H = 24, D = 12;
const fp = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const at = (x, z) => fp.get(`${x},${z}`);
const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const tierOf = (m) => (m >= 11 ? 13 : m >= 6 ? 7 : 4);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// the tier top (the roof is the layer below it) of every footprint cell, from the 5x5 median of the lidar roof: the
// 3x3 left single lidar-high cells standing alone as towers; the wider median merges them into the one tower mass
const TOP = new Map();
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number), nb = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(x + dx, z + dz); if (n) nb.push(n.r); }
  TOP.set(k, tierOf(med(nb)));
}
// a tower is a mass, not a lone lidar spike: tower-high groups under four cells step down to the setback tier
const seen = new Set();
for (const k of TOP.keys()) {
  if (TOP.get(k) !== 13 || seen.has(k)) continue;
  const group = [], stack = [k];
  seen.add(k);
  while (stack.length) {
    const c = stack.pop(); group.push(c);
    const [x, z] = c.split(",").map(Number);
    for (const [dx, dz] of Object.values(DIRS)) {
      const n = `${x + dx},${z + dz}`;
      if (TOP.get(n) === 13 && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  if (group.length < 4) for (const c of group) TOP.set(c, 7);
}
const top = (x, z) => TOP.get(`${x},${z}`);

// the sides a cell's wall faces at height y: outside the footprint, or beside a neighbour whose roof is at or below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], t = top(x + dx, z + dz);
  return t === undefined || t <= y;
});

const FLOORS = new Set([4, 6, 8, 10]);                    // floor slabs, the string courses (layer 1 is the base)
const win = (x, z) => (x + z) % 2 === 0;                  // a bay of glass, then a pier, along each face
const DOOR = [3, 10];                                     // south door, the lower-left setback
const LANTERNS = [[4, 2, 10]];                            // [x, y, z]: the wall beside the door, on the base

function glassState(ex) {
  const alongX = ex.includes("N") || ex.includes("S");    // a wall running east-west takes east and west arms
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// what a footprint cell holds at layer y (null is air): the base, slabs, roof decks, the wall pattern
function spec(x, z, y) {
  const t = top(x, z);
  if (t === undefined || y >= t) return null;
  if (y === 0) return { b: "stone_bricks" };
  if (y === 1) return { b: "polished_andesite" };
  const ex = exposed(x, z, y), perim = ex.length > 0;
  if (y === t - 1) return { b: perim ? "calcite" : "stone" };          // cornice ring, roof deck inside
  if (FLOORS.has(y)) return { b: "smooth_stone" };
  if (!perim) return null;                                             // air gap behind the glass
  const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("E") || ex.includes("W"));
  if (corner) return { b: "chiseled_stone_bricks" };
  if (y === 3) return { b: "calcite" };                                // lintel band
  if (win(x, z)) return { b: "light_blue_stained_glass_pane", s: glassState(ex) };
  return { b: "calcite" };
}

const g = new Voxels([W, H, D]);
const keys = [...fp.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of keys) for (let y = 0; y < H; y++) {
  const s = spec(x, z, y);
  if (s) g.set(x, y, z, s.b, s.s);
}

// the entrance: a two-high dark oak door in the south wall, lanterns on the flanks
const [dx0, dz0] = DOOR;
g.set(dx0, 2, dz0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, 3, dz0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const [x, y, z] of LANTERNS) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// warm light behind the glass: a glowstone in the air gap inside some upper windows, shroomlights at ground level
for (const [x, z] of keys) {
  const ex = exposed(x, z, 5);
  if (!ex.length || !win(x, z) || spec(x, z, 5)?.b !== "light_blue_stained_glass_pane") continue;
  const [ox, oz] = DIRS[ex[0]], ix = x - ox, iz = z - oz;
  if (!at(ix, iz)) continue;
  if ((x * 5 + z * 3) % 6 === 0) g.set(ix, 5, iz, "glowstone");
  if ((x * 5 + z * 3) % 6 === 3) g.set(ix, 9, iz, "glowstone");
  if ((x + 2 * z) % 7 === 0) g.set(ix, 2, iz, "shroomlight");
}

// roof plant on the tower: two light boxes stood on its roof deck
for (const [x, y, z] of [[9, 13, 4], [10, 13, 4]]) g.set(x, y, z, "light_gray_concrete");

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81005.nbt");
console.log(`DC81005: ${blocks} blocks, ${palette} palette entries`);
