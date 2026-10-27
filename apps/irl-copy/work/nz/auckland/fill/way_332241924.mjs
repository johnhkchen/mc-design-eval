import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 332241924, Eden Terrace side of Maungawhau. Read from the lidar roof and
// footprint: a four-storey 1920s-30s brick "stripped classical" commercial block
// with a shopfront on the downhill side, cream plaster string courses and cornice,
// a flat roof with a plant box, and a two-storey lower wing on the east edge
// (lidar roof 9-11). Roof 14-16 is the main 16-block roof; roof 17 blips are plant.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241924.cells.json", "utf8"));

const BRICK = "bricks", TRIM = "smooth_quartz", BASE = "stone_bricks", FILL = "stone_bricks";
const FLOOR = "oak_planks", DECK = "smooth_stone", PLANT = "light_gray_concrete", COLUMN = "smooth_quartz";
const DOOR_CELL = [8, 0];

const g = new Voxels([19, 30, 25]);

// one record per footprint cell; tiers snap the lidar roof to a clean 4-storey top (16) or a 2-storey wing (8)
const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { x, z, ground, tier: roof <= 11 ? 8 : 16, plant: roof >= 17 });
const cellAt = (x, z) => at.get(`${x},${z}`);
for (const c of at.values()) {
  const { x, z } = c;
  const N = !cellAt(x, z - 1), S = !cellAt(x, z + 1), W = !cellAt(x - 1, z), E = !cellAt(x + 1, z);
  c.ring = N || S || W || E;
  c.corner = (N || S) && (W || E);
  c.axis = N || S ? "x" : "z";                        // which way the wall runs
  c.along = N || S ? x : z;
  c.pier = c.corner || c.along % 3 === 0;             // brick-and-plaster piers every third block; corners full height
  c.inward = N ? [x, z + 1] : S ? [x, z - 1] : W ? [x + 1, z] : E ? [x - 1, z] : null;
}

const pane = (c) => c.axis === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// what sits at height y in a cell: null is air
function place(c, y) {
  const { x, z, ground: G, tier: T } = c;
  if (y < G) return [FILL];                           // foundation: solid from y0 up to this cell's ground
  if (y >= T) return c.plant && !c.ring && y === T ? [PLANT] : null;
  if (!c.ring) {
    if (y === T - 1) return [DECK];                   // flat roof deck
    if (x % 4 === 0 && z % 4 === 0) return [COLUMN];  // structural columns carry the deck and floors
    if (y === G || y % 4 === 0) return [FLOOR];       // a floor slab per storey, air between
    return null;
  }
  if (y === G) return [BASE];                         // base course on grade
  if (y === T - 1) return [TRIM];                     // cornice and coping
  if (y % 4 === 0) return [TRIM];                     // storey string course
  if (c.x === DOOR_CELL[0] && c.z === DOOR_CELL[1] && (y === 1 || y === 2))
    return ["oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  if (c.pier) return [TRIM];
  if (y % 4 === 3) return [y < 4 ? TRIM : BRICK];     // window head; ground-floor fascia in plaster
  return ["glass_pane", pane(c)];                     // glazing between the piers
}

for (const c of at.values()) {
  for (let y = 0; y < 30; y++) {
    const b = place(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// warm light behind some glazing: a lantern at the shopfront, glowstone upstairs, in the air gap behind the glass
for (const c of at.values()) {
  if (!c.ring || c.pier || c.corner || !c.inward) continue;
  if (c.x === DOOR_CELL[0] && c.z === DOOR_CELL[1]) continue;
  for (const y of [1, 5, 9, 13]) {
    if (y % 4 !== 1 || (c.along + y) % 3 !== 0 || place(c, y) === null) continue;
    const [ix, iz] = c.inward;
    const inner = cellAt(ix, iz);
    if (!inner || inner.ring || place(inner, y)) continue;
    if (y < 4) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else g.set(ix, y, iz, "glowstone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241924.nbt");
console.log("way_332241924: blocks", g.count(), "cells", at.size);
