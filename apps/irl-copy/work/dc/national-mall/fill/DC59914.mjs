// DC59914: a 1930s stripped-Classical federal office block (Federal Triangle idiom). Pale limestone walls, a granite
// base course, a 4-storey shaft on lidar roof 12 with 13-high wings and a 14-high setback pavilion (the core) carrying
// copper plant boxes. 2-block storeys: window rows on even y, string courses on odd y, a cornice at roof-2 and a
// parapet at roof-1. Interior is air behind the glass with a floor slab per storey; a few glowstone and lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59914.cells.json", "utf8"));
const g = new Voxels([15, 26, 14]);

const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const cell = (x, z) => FP.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // +x, -x, +z, -z
// a side is exposed where there is no footprint next door, or the neighbour's roof is within two blocks above this height
// (a setback face, walled down to the neighbour's cornice so the storey slabs above it have a wall under them)
const exposed = (x, z, y) => DIRS.map(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.roof - 2 <= y; });

const WALL = "calcite", TRIM = "smooth_quartz", BASE = "polished_andesite", FLOOR = "smooth_stone";
const PILLAR = "quartz_pillar", GLASS = "light_blue_stained_glass_pane", PLANT = "waxed_oxidized_copper";
const windows = [];

for (const [k, { ground, roof }] of FP) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < roof; y++) {
    // foundation and base course: andesite from y 0 up to the cell's ground
    if (y <= ground) { g.set(x, y, z, BASE); continue; }
    const ex = exposed(x, z, y), shell = ex.some(Boolean);
    const xFace = ex[0] || ex[1], zFace = ex[2] || ex[3], corner = xFace && zFace;
    // parapet on the shell, a plant box here and there on the pavilion roof
    if (y === roof - 1) {
      if (shell) g.set(x, y, z, TRIM);
      else if (roof === 14 && (x * 3 + z * 2) % 7 === 0) g.set(x, y, z, PLANT);
      continue;
    }
    // cornice on the shell, roof slab over the interior
    if (y === roof - 2) { g.set(x, y, z, shell ? TRIM : FLOOR); continue; }
    // storey string course (odd rows), and the floor slab of every storey inside
    if (y % 2 === 1) {
      if (shell) g.set(x, y, z, corner ? PILLAR : TRIM, corner ? { axis: "y" } : undefined);
      else g.set(x, y, z, FLOOR);
      continue;
    }
    // window rows (even y): air behind the glass inside, lanterns hung from the storey slab above
    if (!shell) {
      if (y <= roof - 4 && (x * 7 + z * 3 + y) % 11 === 0) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (corner) { g.set(x, y, z, PILLAR, { axis: "y" }); continue; }
    const idx = xFace ? z : x;                       // position along the face
    if (idx % 2 === 1) {
      const join = xFace ? { north: "true", south: "true" } : { east: "true", west: "true" };
      g.set(x, y, z, GLASS, { ...join, waterlogged: "false" });
      windows.push({ x, y, z, idx, ex });
    } else g.set(x, y, z, WALL);
  }
}

// north entrance on the middle of the north face: a pair of iron doors between quartz pilasters
g.set(6, 1, 1, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 1, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [5, 7]) for (const y of [1, 2]) g.set(x, y, 1, PILLAR, { axis: "y" });

// warm light behind some windows: the inside cell of a pane gets a glowstone when it is air
let glow = 0;
for (const { x, y, z, idx, ex } of windows) {
  if ((idx + y / 2) % 3 !== 0) continue;             // idx is odd on glass, so this lights about one pane in six
  const [ix, iz] = ex[0] ? [x - 1, z] : ex[1] ? [x + 1, z] : ex[2] ? [x, z - 1] : [x, z + 1];
  if (!cell(ix, iz) || exposed(ix, iz, y).some(Boolean) || g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone"); glow++;
}

// check: every block stands on something (below, or two side neighbours at its height), nothing floats
const solid = (x, y, z) => g.val(x, y, z) !== 0;
const SIDE = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const floating = [];
let blocks = 0;
for (let y = 0; y < 26; y++) for (let z = 0; z < 14; z++) for (let x = 0; x < 15; x++) {
  if (!solid(x, y, z)) continue;
  blocks++;
  if (y === 0 || solid(x, y - 1, z)) continue;
  if (SIDE.filter(([dx, dz]) => solid(x + dx, y, z + dz)).length < 2) floating.push([x, y, z]);
}
const top = Math.max(...cells.map(([, , , r]) => r));
const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59914.nbt");
console.log(JSON.stringify({ blocks, palette: info.palette, windows: windows.length, glowstone: glow, floating: floating.length, floatingSample: floating.slice(0, 8), roofMax: top }));
