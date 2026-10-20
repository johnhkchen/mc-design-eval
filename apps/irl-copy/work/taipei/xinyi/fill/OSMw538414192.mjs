import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~11 blocks above lowest ground.
// Read as a 1990s-2000s Xinyi mid-rise commercial block: pale quartz-clad
// walls, a stone base, a dark-glass shopfront at street level, two upper
// storeys of window bands, a cornice, a parapet and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414192";
const W = 23, H = 23, D = 18;
const ROOF = 11;      // roof deck level (top surface of the building body)
const LINE_1 = 5;     // storey line: floor deck of storey 2
const LINE_2 = 10;    // storey line: cornice deck under the roof

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), Math.max(0, Math.round(g))]));

const isEdge = (x, z, dx, dz) => !inside.has(key(x + dx, z + dz));
const edgeX = (x, z) => isEdge(x, z, 1, 0) || isEdge(x, z, -1, 0);
const edgeZ = (x, z) => isEdge(x, z, 0, 1) || isEdge(x, z, 0, -1);
const perim = (x, z) => edgeX(x, z) || edgeZ(x, z);
const corner = (x, z) => edgeX(x, z) && edgeZ(x, z);

// Entrance: on the +z (south) edge, nearest the middle of the frontage.
let door = null;
{
  const cands = cells
    .map(([x, z]) => [x, z])
    .filter(([x, z]) => isEdge(x, z, 0, 1));
  cands.sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11));
  if (cands.length) door = cands[0];
}
const isDoor = (x, z) => door && door[0] === x && door[1] === z;

const g = new Voxels([W, H, D]);

const glassPane = (x, z) => {
  // A pane on a wall running along z connects north/south; along x, east/west.
  const alongZ = edgeX(x, z);
  return {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };
};
const pier = (x, z) => (x + z) % 3 === 0;

for (const [x, z, gr0] of cells) {
  const gy = ground.get(key(x, z));
  const edge = perim(x, z);
  const cor = corner(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab (base course on the perimeter).
  g.set(x, gy, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground storey: shopfront glass, piers, lintel band at y=4.
  if (edge) {
    for (let y = gy + 1; y <= 4; y++) {
      if (isDoor(x, z) && y <= gy + 2) {
        const half = y === gy + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (y === 4 || isDoor(x, z) || cor || pier(x, z)) {
        g.set(x, y, z, "quartz_block");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", glassPane(x, z));
      }
    }
  }

  // Storey line 1 deck.
  if (LINE_1 > gy) g.set(x, LINE_1, z, edge ? "stone_bricks" : "smooth_stone");

  // Upper storey: sill/spandrel bands at y=6 and y=9, windows at y=7..8.
  if (edge) {
    for (let y = Math.max(6, gy + 1); y <= 9; y++) {
      if (y === 6 || y === 9 || cor || pier(x, z)) {
        g.set(x, y, z, "quartz_block");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", glassPane(x, z));
      }
    }
  }

  // Cornice deck and roof deck.
  if (LINE_2 > gy) g.set(x, LINE_2, z, edge ? "smooth_quartz" : "smooth_stone");
  g.set(x, ROOF, z, "smooth_stone");

  // Parapet around the roof edge.
  if (edge) g.set(x, ROOF + 1, z, "quartz_block");

  // Warm lights in the interior, standing on the floor decks.
  if (!edge) {
    const h = (x * 5 + z * 7) % 13;
    if (h === 0 && gy + 1 <= 4) g.set(x, gy + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (h === 6 && 6 > gy) g.set(x, 6, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (h === 3 && 6 > gy) g.set(x, 6, z, "shroomlight");
  }

  // Rooftop plant: small stone boxes on the roof deck, kept off the parapet.
  if (!edge && x % 5 === 2 && z % 4 === 1) {
    g.set(x, ROOF + 1, z, "stone_bricks");
    g.set(x, ROOF + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
