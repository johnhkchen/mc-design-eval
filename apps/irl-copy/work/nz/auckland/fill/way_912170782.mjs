// A three-storey 1930s stripped-classical commercial block (cream rendered brick, polished stone bands, a parapet),
// the kind of Queen-Street-era shop-and-office building that fills Auckland's CBD ridge. Footprint from the cells;
// the massing is the lidar roof (flat at 12, the three low-edge cells read as noise and take the building's top).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170782.cells.json", "utf8"));

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// the roof top: the lidar's common value (cells under 4 are edge noise, not roof)
const TOP = (() => {
  const count = new Map();
  for (const [, , , r] of cells) if (r >= 4) count.set(r, (count.get(r) ?? 0) + 1);
  return [...count].sort((a, b) => b[1] - a[1])[0][0];
})();

// a cell is interior when all four neighbours are footprint too; the rest is the shell
const interior = (x, z) => inF(x, z) && inF(x + 1, z) && inF(x - 1, z) && inF(x, z + 1) && inF(x, z - 1);
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([k]) => k);

const g = new Voxels([9, 25, 5]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pane = (d) => ({ north: d === "E" || d === "W" ? "true" : "false", south: d === "E" || d === "W" ? "true" : "false",
  east: d === "N" || d === "S" ? "true" : "false", west: d === "N" || d === "S" ? "true" : "false", waterlogged: "false" });

// storey rows: ground-floor glass sits on the plinth (y = ground); storeys at 0/4/8, cornice at 11, parapet at 12
const glassRows = (ground) => (ground === 0 ? [1, 2] : [2, 3]);
const rowsAt = (y, ground) => (y < 4 ? glassRows(ground) : y < 8 ? [5, 6] : [9, 10]);

for (const [x, z, ground] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (interior(x, z)) {
    // no interior: a floor slab per storey and the roof deck; the air between is the room
    if (ground === 0) put(x, 0, z, "smooth_stone");
    for (const y of [4, 8, 11]) put(x, y, z, "smooth_stone");
    continue;
  }

  const exp = exposed(x, z);
  const corner = exp.length >= 2;
  const d = exp[0];
  const along = d === "N" || d === "S" ? x : z;          // position along this face
  const inward = [x - DIRS[d][0], z - DIRS[d][1]];        // the room behind this wall cell
  const roomBehind = !corner && interior(...inward);

  for (let y = ground; y <= TOP; y++) {
    if (y === ground) { put(x, y, z, "polished_andesite"); continue; }   // plinth course
    if (y === TOP) { put(x, y, z, corner ? "chiseled_quartz_block" : "smooth_quartz"); continue; }  // parapet
    if (y === TOP - 1) { put(x, y, z, "chiseled_quartz_block"); continue; }                          // cornice
    if (y === 4 || y === 8) { put(x, y, z, "polished_diorite"); continue; }                           // storey belts

    // the shopfront and entrance on the street face (north, the ground floor of the front)
    if (z === 0 && d === "N" && !corner && x >= 4 && x <= 6 && rowsAt(y, ground).includes(y)) {
      if (x === 5 && y === 2) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (x === 5 && y === 3) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 3 && x !== 5) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else put(x, y, z, "glass_pane", pane(d));
      continue;
    }

    // pilasters on the even bays and the corners; windows on the odd bays where a room stands behind the glass
    if (corner || along % 2 === 0) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (roomBehind && rowsAt(y, ground).includes(y)) { put(x, y, z, "glass_pane", pane(d)); continue; }
    put(x, y, z, "smooth_quartz");
  }
}

// roof plant room on the deck, two cells, its own parapet-height box with a slab cap
for (const [x, z] of [[2, 2], [3, 2]]) {
  put(x, 12, z, "stone_bricks"); put(x, 13, z, "stone_bricks");
  put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm lights behind some glass, each standing on its room's floor slab
for (const [x, y, z, block] of [[3, 1, 1, "glowstone"], [6, 1, 1, "glowstone"], [3, 5, 1, "shroomlight"],
  [1, 5, 3, "shroomlight"], [5, 9, 1, "glowstone"], [3, 9, 3, "glowstone"]]) put(x, y, z, block);

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170782.nbt");
console.log(`way_912170782: ${out.blocks} blocks, ${out.palette} palette entries, roof top ${TOP}`);
