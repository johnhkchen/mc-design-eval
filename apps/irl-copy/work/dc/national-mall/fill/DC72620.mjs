// DC72620: a Federal-era (c. 1930s) Neoclassical government office block on the Mall. Pale limestone (calcite) walls on a
// polished-andesite base, stone string courses between storeys, grey glass bays on a 3-block rhythm (piers at x or z = 0 mod 3),
// an iron-door entrance in the east face, a cornice and parapet on the perimeter, a 14-block central pavilion with a
// mechanical penthouse, and shroomlight in some first-row windows behind the glass. Each cell is built on the footprint only:
// foundation below its ground, floor slabs at each storey, an air gap between the perimeter shell and the interior.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72620.cells.json", "utf8"));
const NAME = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC72620.nbt";

const cell = new Map();
for (const [x, z, G, R] of cells) cell.set(`${x},${z}`, { G, R });
const inFp = (x, z) => cell.has(`${x},${z}`);

// exposure: a footprint cell is on the shell when a side neighbour is off the footprint
const exposed = (x, z) => ({ W: !inFp(x - 1, z), E: !inFp(x + 1, z), N: !inFp(x, z - 1), S: !inFp(x, z + 1) });
const isShell = (x, z) => { const e = exposed(x, z); return e.W || e.E || e.N || e.S; };
// pier (column of calcite) at corners and on every third cell along each face; the rest is a window bay
const isPier = (x, z) => {
  const e = exposed(x, z), ex = e.W || e.E, ez = e.N || e.S;
  if (ex && ez) return true;
  if (ex) return z % 3 === 0;
  if (ez) return x % 3 === 0;
  return false;
};
// the east-face entrance: two iron doors in the bay between the piers at z 12 and 15
const isDoor = (x, y, z, G) => x === 9 && (z === 13 || z === 14) && (y === G + 1 || y === G + 2);

// what stands at (x, y, z): a block, or null for air (the interior's air gap, or above the cell's top)
function spec(x, y, z) {
  const c = cell.get(`${x},${z}`); if (!c) return null;
  const { G, R } = c, sh = isShell(x, z);
  if (y < 0 || y >= R) return null;
  if (y < G) return { b: "stone_bricks" };                                         // foundation down to the ground
  if (y === R - 1) return sh ? { b: "smooth_stone_slab", s: { type: "bottom" } } : { b: "smooth_stone" }; // parapet cap / roof deck
  if (y === R - 2) return sh ? { b: "smooth_stone" } : null;                       // cornice
  if (y === G) return { b: sh ? "polished_andesite" : "smooth_stone" };           // base course / ground floor slab
  if (y === G + 4 || y === G + 8) return { b: "smooth_stone" };                    // storey floor slabs (string courses on the shell)
  if (!sh) return null;                                                             // interior: an air gap
  if (y === G + 3 || y === G + 7) return { b: "smooth_stone" };                    // storey string courses
  if (isDoor(x, y, z, G)) return { b: "iron_door", s: { facing: "east", half: y === G + 1 ? "lower" : "upper", hinge: z === 13 ? "left" : "right", open: "false", powered: "false" } };
  if (isPier(x, z)) return { b: "calcite" };
  // a glass bay: panes join along the wall to their neighbours in the same row
  // a neighbour joins when it is shell and standing at this row (shell is solid from its ground to its top)
  const e = exposed(x, z), along = (dz, dx) => { const n = cell.get(`${x + dx},${z + dz}`); return n && isShell(x + dx, z + dz) && y >= n.G && y < n.R ? "true" : "false"; };
  const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (e.W || e.E) { s.north = along(-1, 0); s.south = along(1, 0); } else { s.east = along(0, 1); s.west = along(0, -1); }
  return { b: "gray_stained_glass_pane", s };
}

const g = new Voxels([10, 26, 27]);
for (const [x, z, G, R] of cells) {
  for (let y = 0; y < R; y++) {
    const sp = spec(x, y, z);
    if (sp) g.set(x, y, z, sp.b, sp.s);
  }
}

// a mechanical penthouse on the 14-block pavilion's roof: calcite box, 3 x 2 x 2 with a slab cap
for (let x = 3; x <= 5; x++) for (let z = 5; z <= 6; z++) {
  g.set(x, 14, z, "calcite"); g.set(x, 15, z, "calcite"); g.set(x, 16, z, "smooth_stone_slab", { type: "bottom" });
}

// warm light: shroomlight on the first row of some storeys, in the air gap just inside a window
for (const [x, z, G] of cells) {
  if (!isShell(x, z)) continue;
  const e = exposed(x, z);
  for (const y of [G + 1, G + 5, G + 9]) {
    const sp = spec(x, y, z);
    if (!sp || sp.b !== "gray_stained_glass_pane" || (x * 5 + z * 7 + y * 3) % 4 !== 0) continue;
    const ix = e.E ? x - 1 : e.W ? x + 1 : x, iz = e.S ? z - 1 : e.N ? z + 1 : z;
    if (!inFp(ix, iz) || isShell(ix, iz)) continue;
    g.set(ix, y, iz, "shroomlight");
  }
}

const out = g.save(NAME);
console.log(JSON.stringify(out));
