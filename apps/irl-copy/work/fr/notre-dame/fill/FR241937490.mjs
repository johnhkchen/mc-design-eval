// FR241937490: a residential house of 1676 on a 5 x 21 footprint (the Île de la Cité's ordinary stone block).
// Pale stone walls on a stone-brick plinth, storey lines every 4 blocks, tall windows with a shroomlight here and there,
// a slate roof cap with stair eaves, one door on the street end, a chimney stack on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937490.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937490.nbt";

const WALL = "smooth_sandstone", LINE = "cut_sandstone", BASE = "stone_bricks", SLATE = "deepslate_tiles", SLATE_EAVE = "deepslate_tile_stairs";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "shroomlight";

// the lidar's roof per cell, smoothed to whole storeys (4 blocks), 2 to 6 storeys
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: Math.min(24, Math.max(8, Math.round(roof / 4) * 4)) }]));
const at = (x, z) => fp.get(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z) => DIRS.filter(([, dx, dz]) => !at(x + dx, z + dz));

const g = new Voxels([5, 40, 21]);
let chimney = null;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { ground, top: T } = at(x, z);
  // a face is shell where there is no neighbour, or the neighbour's tier is lower (a setback's vertical face)
  const ex = DIRS.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < T; });
  const missing = exposed(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);            // foundation under the cell's own ground

  if (!ex.length) {
    // interior: floor slabs per storey, a ceiling under the roof, air between (no rooms)
    for (let y = ground; y < T; y++) {
      if (y === ground || y === T - 1 || y % 4 === 0) g.set(x, y, z, WALL);
    }
    g.set(x, T, z, SLATE);
    if (!chimney && T === 24 && x >= 1 && x <= 3 && z >= 3 && z <= 17) chimney = [x, T, z];
    continue;
  }

  // perimeter: a walled shell from the ground up to the cell's top
  const [face, dx, dz] = ex[0];
  const t = dx !== 0 ? z : x;                                          // position along the face
  const corner = ex.length > 1 || missing.length !== 1;                // windows only on a plain street face
  for (let y = ground; y < T; y++) {
    if (y === ground) { g.set(x, y, z, BASE); continue; }             // base course
    if (y % 4 === 0) { g.set(x, y, z, LINE); continue; }              // storey line
    const window = !corner && (y % 4 === 1 || y % 4 === 2) && t % 3 === 1 && y < T - 1;
    if (window) {
      if (y % 4 === 2 && (t + y) % 7 === 0) { g.set(x, y, z, LIGHT); continue; }
      const pane = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false" }
                            : { north: "false", south: "false", east: "true", west: "true" };
      g.set(x, y, z, GLASS, { ...pane, waterlogged: "false" });
      continue;
    }
    g.set(x, y, z, WALL);
  }
  // slate cap: a stair eave on the outside edge, flat slate inside it
  g.set(x, T, z, SLATE_EAVE, { facing: face, half: "bottom", shape: "straight", waterlogged: "false" });
}

// the street door: the +z end of the building, centre cell
const door = at(2, 20);
if (door) {
  const y0 = door.ground;
  g.set(2, y0 + 2, 20, BASE);                                          // lintel over the door
  g.set(2, y0, 20, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(2, y0 + 1, 20, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// a chimney stack on the tallest interior tier
if (chimney) {
  const [x, T, z] = chimney;
  g.set(x, T + 1, z, BASE); g.set(x, T + 2, z, BASE); g.set(x, T + 3, z, "stone_brick_wall");
}

const stats = g.save(OUT);
console.log(JSON.stringify(stats));
