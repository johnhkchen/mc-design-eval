// 1845 K St NW: a 1970s-80s Washington office block in pale precast concrete over a granite base, with a tinted-glass
// window grid, a stepped core and a SW stair tower. Massing from the lidar roof tiers: podium 18, core ring 18 (setback),
// core crown 20, SW tower 21, roof plant on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78215.cells.json", "utf8"));
const W = 13, D = 21, H = 34;

const F = new Map();                                  // "x,z" -> { g: ground, r: lidar roof }
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { g, r });
const inF = (x, z) => F.has(`${x},${z}`);
const groundOf = (x, z) => F.get(`${x},${z}`).g;

const GRANITE = "polished_granite", SLAB = "light_gray_concrete", SKIN = "white_concrete", CORNICE = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane", SHOPGLASS = "light_blue_stained_glass";

// snap the lidar to clean tiers: the top solid row of each cell (its cornice)
function capOf(x, z) {
  if (x <= 2 && z >= 17) return 21;                   // SW stair tower (lidar 22)
  if (x >= 4 && x <= 9 && z >= 4 && z <= 15) return 20; // core crown (lidar 21)
  return 18;                                           // podium and the core's setback ring (lidar 19 to 21)
}

// the faces of a cell that look out of the footprint
function exposed(x, z) {
  return { n: !inF(x, z - 1), s: !inF(x, z + 1), w: !inF(x - 1, z), e: !inF(x + 1, z) };
}
const isRing = (x, z) => { const f = exposed(x, z); return f.n || f.s || f.w || f.e; };

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (block) v.set(x, y, z, block, state); };   // null = air

// the 2-block storey: even rows are floor slabs / spandrels, odd rows are window rows (air behind the glass)
for (const [key, { g }] of F) {
  const [x, z] = key.split(",").map(Number);
  const top = capOf(x, z);
  const ring = isRing(x, z);
  const f = exposed(x, z);
  const corner = [f.n, f.s, f.w, f.e].filter(Boolean).length >= 2;
  const along = f.n || f.s ? x : z;                   // position along the wall it faces
  const pier = corner || along % 3 === 0;             // 2-pane bays between stone piers = window grid

  for (let y = 0; y <= top; y++) {
    if (y < g) { put(x, y, z, GRANITE); continue; }   // foundation down the slope, nothing floats
    if (y === top) { put(x, y, z, CORNICE); continue; }
    if (!ring) {
      put(x, y, z, y % 2 === 0 ? SLAB : null);         // interior: floor slabs, air between
      continue;
    }
    if (y === 0) { put(x, y, z, GRANITE); continue; }  // base course
    if (y % 2 === 0) { put(x, y, z, y === 4 && z === 20 && (x === 5 || x === 6) ? GRANITE : SKIN); continue; }
    if (pier) { put(x, y, z, SKIN); continue; }
    put(x, y, z, y === 1 ? SHOPGLASS : GLASS);         // ground floor shopfront, upper storeys glazed
  }
}

// entrance: a double door on the south face, lower and upper halves, granite lintel above
for (const x of [5, 6]) {
  const hinge = x === 5 ? "left" : "right";
  put(x, 2, 20, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 3, 20, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}

// warm light behind some glazed bays: glowstone and lanterns on the interior air side of the glass
for (const [key] of F) {
  const [x, z] = key.split(",").map(Number);
  if (!isRing(x, z) || capOf(x, z) < 4) continue;
  const f = exposed(x, z);
  const ix = f.w ? x + 1 : f.e ? x - 1 : x;
  const iz = f.n ? z + 1 : f.s ? z - 1 : z;
  if (ix === x && iz === z) continue;                 // no inward side (a corner)
  if (!inF(ix, iz) || isRing(ix, iz)) continue;
  for (let y = 3; y < capOf(x, z) - 1; y += 2) {
    const h = (x * 7 + z * 13 + y * 5) % 11;
    if (h === 0) put(ix, y, iz, "glowstone");
    else if (h === 5) put(ix, y, iz, "lantern", { hanging: "false" });
  }
}

// roof plant: condensers on the podium, a mechanical penthouse on the core crown
for (const [x, z, y0, y1] of [[5, 18, 19, 20], [6, 18, 19, 20], [9, 18, 19, 19], [10, 18, 19, 19], [9, 19, 19, 19], [10, 19, 19, 19]]) {
  for (let y = y0; y <= y1; y++) put(x, y, z, SLAB);
}
for (const x of [6, 7]) for (const z of [6, 7]) put(x, 21, z, CORNICE);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78215.nbt";
const r = v.save(out);
console.log(JSON.stringify(r));
