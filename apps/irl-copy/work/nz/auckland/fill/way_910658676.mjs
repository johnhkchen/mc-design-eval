// Way 910658676: a 1920s stripped-classical shophouse on Karangahape-style street frontage (Eden Terrace / Newton):
// three storeys of plaster on a volcanic basalt plinth, a timber shopfront with fascia on the street (north) face,
// quartz storey lines and a cornice, a parapet, and a flat roof with a plant box. Hollow: floor slabs per storey,
// air behind every window, a lamp in some of them.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658676.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..4, z 0..7

const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };     // N = the street (z = 0) side
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const exposed = (x, z) => Object.keys(FACES).filter((d) => !inFoot(x + FACES[d][0], z + FACES[d][1]));   // faces on the outside
const interior = (x, z) => inFoot(x, z) && exposed(x, z).length === 0;

const PLINTH = "polished_basalt", PLASTER = "white_concrete", BAND = "smooth_quartz", SLAB_INT = "smooth_stone", ROOF = "smooth_stone";
const LAMP = { 1: "lantern", 2: "lantern", 3: "glowstone" };

const g = new Voxels([5, 25, 8]);
const pane = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [key, { ground, roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z), edge = faces.length > 0, top = roof - 1;   // the roof deck's top block; the parapet sits on roof
  for (let y = 0; y <= ground; y++) g.set(x, y, z, edge ? PLINTH : SLAB_INT);     // solid from the lowest ground up to this cell's ground
  for (let y = ground + 1; y <= top; y++) {
    if (y === 4 || y === 8) { g.set(x, y, z, edge ? BAND : SLAB_INT); continue; }   // storey floors (and the storey lines outside)
    if (y === top) { g.set(x, y, z, edge ? BAND : ROOF); continue; }                 // cornice / roof deck
    if (!edge) continue;                                                              // interior: air
    const idx = (d) => (d === "N" || d === "S" ? x : z);
    // a window needs air behind it (its inward neighbour is interior) and sits on every other bay
    const d = faces.find((f) => interior(x - FACES[f][0], z - FACES[f][1]) && idx(f) % 2 === 1);
    if (!d) { g.set(x, y, z, PLASTER); continue; }
    const base = y <= 3 ? ground : y <= 7 ? 4 : 8;                                    // the slab under this storey
    if (d === "N" && z === 0 && y <= 3) {                                             // street shopfront: glass, door, timber fascia
      if (y === 3) g.set(x, y, z, "dark_oak_planks");
      else if (x === 3) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "glass_pane", pane(d));
      continue;
    }
    g.set(x, y, z, "glass_pane", pane(d));
    const ix = x - FACES[d][0], iz = z - FACES[d][1];
    const floorUnder = base === ground ? cell.get(`${ix},${iz}`)?.ground === ground : true;   // the ground floor only lights where its own floor is at this level
    if (y === base + 1 && floorUnder) {                                               // one lamp per storey, on the floor behind the window
      const lamp = LAMP[base === ground ? 1 : base === 4 ? 2 : 3];
      g.set(ix, y, iz, lamp, lamp === "lantern" ? { hanging: "false", waterlogged: "false" } : undefined);
    }
  }
  if (edge) g.set(x, roof, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet, one course above the roof deck
}

g.set(2, 12, 2, "iron_block");                                                         // roof plant on the deck

// check: walls, lamps and the roof plant stand on something (floor slabs are carried by the walls around them)
const bad = [];
for (let y = 1; y < 25; y++) for (let z = 0; z < 8; z++) for (let x = 0; x < 5; x++)
  if (g.get(x, y, z) && !g.get(x, y - 1, z) && ![4, 8, 11].includes(y)) bad.push([x, y, z]);
if (bad.length) console.warn("floating:", bad);

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658676.nbt");
console.log(out);
