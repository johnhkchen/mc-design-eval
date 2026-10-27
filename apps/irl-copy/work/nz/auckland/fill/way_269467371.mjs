// Way 269467371, Auckland (Mt Eden / Eden Terrace side): a 1960s stripped-concrete commercial block, three storeys
// on a sloping site. The lidar roof is a flat 12 blocks above the lowest ground everywhere (noise at the edges is
// ignored), so the massing is one flat tier with a plant room on the roof. Storey lines are global (0, 4, 8) so the
// floors run level across the slope: uphill cells (ground 4) show two storeys, downhill cells (ground 0) show three.
// Volcanic andesite plinth and shopfront piers, white concrete bays with glass panes, light-grey string courses and
// lintels, a parapet cap, a recessed entrance on the south face, and warm lanterns in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467371.cells.json", "utf8"));
const g = new Voxels([38, 27, 25]);

const ROOF = 12;            // flat roof tier (lidar mode)
const DECK = 11;            // top row of the storey 2 body: the roof deck
const FOUND = "stone_bricks", PLINTH = "polished_andesite", WALL = "white_concrete", LINE = "light_gray_concrete";
const SLAB = "smooth_stone", GLASS = "glass_pane", CAP = "smooth_stone_slab";
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane runs along x
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane runs along z
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => fp.has(key(x, z));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

// The body of each footprint cell: foundation below its ground, then the storeys up to the roof deck.
for (const [x, z, gr] of cells) {
  const exposedN = !inFp(x, z - 1), exposedS = !inFp(x, z + 1), exposedW = !inFp(x - 1, z), exposedE = !inFp(x + 1, z);
  const edge = exposedN || exposedS || exposedW || exposedE;
  const corner = (exposedN || exposedS) && (exposedW || exposedE);
  const alongX = exposedN || exposedS;                 // the exposed face runs along x
  const pier = corner || (alongX ? x : z) % 3 === 0;   // a pier every third block, and at every corner

  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  for (let y = gr; y <= DECK; y++) {
    const isSlab = y === gr || y === 4 || y === 8 || y === DECK;
    if (!edge) { if (isSlab) g.set(x, y, z, SLAB); continue; }   // interior: floor slabs only, air between
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }          // base course
    const s = Math.floor(y / 4), r = y - 4 * s;
    if (r === 0 || r === 3) { g.set(x, y, z, LINE); continue; }  // string course and storey lintel
    const ground1 = s === 0;                                      // the ground storey: shopfront
    if (pier) { g.set(x, y, z, ground1 ? PLINTH : WALL); continue; }
    g.set(x, y, z, GLASS, alongX ? PANE_X : PANE_Z);
  }

  // parapet and cap on the edge
  if (edge) { g.set(x, ROOF, z, WALL); g.set(x, ROOF + 1, z, CAP, SLAB_BOTTOM); }

  // warm lanterns just inside some windows (on the floor slab, air above)
  if (edge && !corner) {
    for (const s of [1, 2]) {
      const r = (x * 7 + z * 5 + s * 3) % 5;
      if (r !== 0) continue;
      const bay = (alongX ? x : z) % 3 !== 0;
      if (!bay) continue;
      const y = 4 * s + 1;
      const dx = exposedW ? 1 : exposedE ? -1 : 0, dz = exposedN ? 1 : exposedS ? -1 : 0;
      if (inFp(x + dx, z + dz)) g.set(x + dx, y, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Entrance: a recessed doorway on the south face, ground floor, with the lintel above it.
g.set(26, 1, 22, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(26, 2, 22, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(26, 3, 22, LINE);

// Roof plant: a solid box set back from the parapet, with a cap and two condenser units.
for (let x = 15; x <= 21; x++) for (let z = 9; z <= 14; z++) {
  const edgeCell = x === 15 || x === 21 || z === 9 || z === 14;
  for (let y = ROOF; y <= 14; y++) g.set(x, y, z, edgeCell ? LINE : SLAB);
  g.set(x, 15, z, CAP, SLAB_BOTTOM);
}
for (const [x, z] of [[23, 10], [24, 10], [23, 11], [24, 11], [28, 13], [29, 13]]) g.set(x, ROOF, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467371.nbt";
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, palette ${palette}`);
