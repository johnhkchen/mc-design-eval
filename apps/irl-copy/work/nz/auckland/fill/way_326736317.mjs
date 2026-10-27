// Way 326736317: a two-storey brick commercial block of the 1920s-30s, the kind that lines the streets below Mt Eden
// (red brick, cream plaster quoins and string courses, a timber shopfront with a fascia, a plain parapet, a plant box on
// the flat roof). The lidar roof reads 7 or 8 blocks over a flat lowest ground of 0; that is lidar noise, so the whole
// roof is one tier at 8 (the parapet top is the 9th block above ground).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_326736317.cells.json`, "utf8"));

const W = 8, D = 15, H = 21;
const ROOF = 8;                                   // one flat tier (lidar 7s are noise)
const BASE = Math.min(...cells.map((c) => c[2])); // lowest ground under the footprint: y 0
const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => fp.has(key(x, z));
const NB = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
// the faces of a cell that open onto the air (outside the footprint)
const exposed = (x, z) => Object.keys(NB).filter((d) => !inFp(x + NB[d][0], z + NB[d][1]));
const pane = (d) => (d === "n" || d === "s"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lantern = { hanging: "true", waterlogged: "false" };

const g = new Voxels([W, H, D]);

for (const [x, z, ground] of cells) {
  if (ground !== BASE) continue;
  const exp = exposed(x, z);
  const edge = exp.length > 0;
  const corner = exp.length >= 2;
  const front = exp.includes("n") || exp.includes("e");   // the street frontage: north and east faces
  // floors: the base course / ground floor, the storey slab, the roof deck
  g.set(x, BASE, z, "stone_bricks");
  g.set(x, 4, z, edge ? "smooth_quartz" : "smooth_stone");        // string course on the edge, slab inside
  g.set(x, ROOF, z, edge ? "smooth_quartz" : "smooth_stone");     // parapet coping on the edge, roof deck inside
  if (!edge) {
    // warm lanterns hang from the slabs inside, seen through the glass
    if ((x + z) % 3 === 0) g.set(x, 3, z, "lantern", lantern);
    if ((x + z) % 4 === 0) g.set(x, 7, z, "lantern", lantern);
    continue;
  }
  const d = exp[0];
  // the bay along the face: pilasters on every third block, windows between
  const a = d === "n" || d === "s" ? x : z;
  const pilaster = corner || a % 3 === 0;
  // ground storey: a shopfront of glass on the front, windows elsewhere; brick piers, plaster quoins
  for (const y of [1, 2]) {
    if (corner) g.set(x, y, z, "smooth_quartz");
    else if (pilaster) g.set(x, y, z, front ? "dark_oak_planks" : "bricks");
    else g.set(x, y, z, "glass_pane", pane(d));
  }
  g.set(x, 3, z, corner ? "smooth_quartz" : front ? "dark_oak_planks" : "bricks");
  // upper storey: two-high windows under a brick lintel, brick piers, a plaster cap course at the top
  for (const y of [5, 6]) {
    if (corner) g.set(x, y, z, "smooth_quartz");
    else if (pilaster) g.set(x, y, z, "bricks");
    else g.set(x, y, z, "glass_pane", pane(d));
  }
  g.set(x, 7, z, corner || pilaster ? "smooth_quartz" : "bricks");
}

// the shop door on the north frontage, in the pilaster bay at (6,1), under a dark fascia
g.set(6, 1, 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(6, 3, 1, "dark_oak_planks");

// roof plant: a 2x2 galvanised box on the deck, inside the parapet
for (const [x, z] of [[4, 2], [5, 2], [4, 3], [5, 3]]) g.set(x, ROOF + 1, z, "iron_block");

const out = g.save(`${HERE}/way_326736317.nbt`);
console.log(`wrote way_326736317.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
