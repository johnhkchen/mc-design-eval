// Way 1095572132: a 6 x 6 footprint of 23 cells on flat ground (ground 0), lidar roof 9 above y 0.
// Read as a two-storey Edwardian brick shop-house (Mt Eden village era): a stone plinth, a shopfront with a central
// door on the street (north) edge, sash-style glass panes in brick piers on the upper storey, a plaster cornice,
// a stone-brick parapet and a gravel roof. Floors are full-footprint slabs, so nothing stands over air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572132.cells.json", "utf8"));
const g = new Voxels([6, 22, 6]);

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => foot.has(`${x},${z}`);
const topOf = (x, z) => foot.get(`${x},${z}`).roof;     // lidar roof height above y 0 (9 on every cell here, so one flat tier)
const sides = (x, z) => ({ n: !inside(x, z - 1), s: !inside(x, z + 1), e: !inside(x + 1, z), w: !inside(x - 1, z) });

const perim = (x, z) => { const f = sides(x, z); return f.n || f.s || f.e || f.w; };
const corner = (x, z) => { const f = sides(x, z); return [f.n, f.s, f.e, f.w].filter(Boolean).length >= 2; };
const front = (x, z) => sides(x, z).n;                  // the street edge: the shopfront faces north
const win = (x, z) => (x + z) % 3 !== 0;                // two glazed bays, then a brick pier, along each wall

// a glass pane's arms reach the neighbours that are part of the building, so it sits in its wall line
const pane = (x, z) => ({
  north: String(inside(x, z - 1)), south: String(inside(x, z + 1)),
  east: String(inside(x + 1, z)), west: String(inside(x - 1, z)), waterlogged: "false",
});
// a parapet wall's arms, likewise, join the parapet next door
const low = (x, z) => ({
  up: "true",
  north: inside(x, z - 1) ? "low" : "none", south: inside(x, z + 1) ? "low" : "none",
  east: inside(x + 1, z) ? "low" : "none", west: inside(x - 1, z) ? "low" : "none", waterlogged: "false",
});

// the interior cells (every side inside the footprint) hold the rooms: air, with floor slabs and a ceiling per storey
const rooms = cells.map(([x, z]) => [x, z]).filter(([x, z]) => !perim(x, z));
// one warm room on the upper storey, lit behind a window: glowstone on the floor, a lantern hung from the ceiling
const lit = rooms.find(([x, z]) => [[x, z - 1], [x, z + 1], [x + 1, z], [x - 1, z]].some(([a, b]) => perim(a, b) && win(a, b)));
// the roof equipment: an air-handling box on the first interior roof cell
const plant = rooms[0];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = topOf(x, z);                              // 9: the parapet's top is the building's top, y 8
  const isPerim = perim(x, z), isFront = front(x, z), isCorner = corner(x, z), glazed = isPerim && !isCorner && win(x, z);

  // plinth and ground floor slab
  g.set(x, 0, z, "stone_bricks");

  // ground storey, y 1..3: shopfront on the street edge, brick with glazed bays elsewhere
  if (isPerim) {
    if (isFront) {
      if (x === 3) {
        g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, 1, z, "glass"); g.set(x, 2, z, "glass");
      }
      g.set(x, 3, z, "dark_oak_planks");                // fascia over the shopfront
    } else {
      for (const y of [1, 2]) g.set(x, y, z, glazed ? "glass_pane" : "bricks", glazed ? pane(x, z) : undefined);
      g.set(x, 3, z, "bricks");
    }
  }

  // y 4: the floor slab over the ground storey (a string course on the walls, sills under the upper glazing)
  g.set(x, 4, z, "smooth_stone");

  // upper storey, y 5..6: brick with glazed bays
  if (isPerim) {
    for (const y of [5, 6]) g.set(x, y, z, glazed ? "glass_pane" : "bricks", glazed ? pane(x, z) : undefined);
  }

  // y 7: cornice on the walls (plaster), ceiling slab inside
  g.set(x, 7, z, isPerim ? "white_concrete" : "smooth_stone");

  // y 8 (the lidar's roof top): parapet on the walls, gravel roof deck inside
  if (isPerim) g.set(x, top - 1, z, "stone_brick_wall", low(x, z));
  else g.set(x, top - 1, z, "gravel");
}

// the lit room and the roof plant, placed inside the footprint on the cells picked above
if (lit) {
  const [x, z] = lit;
  g.set(x, 5, z, "glowstone");
  g.set(x, 6, z, "lantern", { hanging: "true", waterlogged: "false" });
}
if (plant) g.set(plant[0], topOf(plant[0], plant[1]) - 1, plant[1], "iron_block");

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572132.nbt");
console.log(`way_1095572132.nbt: ${blocks} blocks, ${palette} palette entries`);
