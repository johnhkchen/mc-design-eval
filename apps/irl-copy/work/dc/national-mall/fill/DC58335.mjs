// DC58335: a 1930s Federal-style office block on the Mall's flank, the limestone cube of the Federal Triangle style:
// a polished-andesite base course, calcite walls on a 3-bay rhythm with glass panes, smooth-quartz string course and
// cornice, a flat stone roof with plant on top. Hollow: air behind the glass, a floor slab at y 3, the roof deck at y 6.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC58335.cells.json`, "utf8"));
const g = new Voxels([7, 19, 13]);

// footprint lookup; a perimeter cell has a side open to the outside
const has = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const edge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// facade rhythm: calcite piers at the corners and every third bay on the long sides, on the south end (z 11) and
// on the end row's middle bay; the ground storey's piers are polished andesite (a rusticated base)
const pier = (x, z) => (x === 0 || x === 6) ? (z % 3 === 0 || z === 11) : (z === 0 || z === 11) ? x % 3 === 0 : false;
const PANE = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const LANTERN = (hanging) => ({ hanging: hanging ? "true" : "false", waterlogged: "false" });

for (const [x, z] of cells) {
  g.set(x, 0, z, "polished_andesite");                       // base course, and the foundation on the uphill cells
  if (!edge(x, z)) {
    g.set(x, 3, z, "smooth_stone");                           // floor slab of the upper storey (interior)
    g.set(x, 6, z, "stone_bricks");                           // roof deck (interior)
    continue;
  }
  for (const y of [1, 2, 4, 5]) {                             // two storeys of 2 blocks, windows in glass panes
    if (pier(x, z)) g.set(x, y, z, y < 3 ? "polished_andesite" : "calcite");
    else g.set(x, y, z, "glass_pane", PANE);
  }
  g.set(x, 3, z, "smooth_quartz");                            // string course between the storeys
  g.set(x, 6, z, "smooth_quartz");                            // cornice, the roof edge at y 7
}

// the two bronze entrance doors: the west face at z 5, and the one-cell south bump at (4, 12)
const door = (x, z, facing) => {
  g.set(x, 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
};
door(0, 5, "west");
door(4, 12, "south");

// warm light: standing lanterns on the ground-floor floor, hanging ones under the upper ceiling
g.set(2, 1, 2, "lantern", LANTERN(false));
g.set(4, 1, 8, "lantern", LANTERN(false));
g.set(2, 5, 4, "lantern", LANTERN(true));
g.set(4, 5, 9, "lantern", LANTERN(true));

// roof: plant and a vent, standing on the deck at y 7
g.set(1, 7, 9, "iron_block");
g.set(2, 7, 9, "iron_block");
g.set(5, 7, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// panes join their neighbours in the wall, so each pane's connections follow the wall they sit in
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, z] of cells) {
  if (!edge(x, z)) continue;
  for (const y of [1, 2, 4, 5]) {
    if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
    g.set(x, y, z, "glass_pane", {
      north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
      east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
    });
  }
}

g.save(`${dir}/DC58335.nbt`);
