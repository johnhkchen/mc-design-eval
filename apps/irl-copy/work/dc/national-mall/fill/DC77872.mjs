// 1600 21st St NW: a 1920s-30s limestone block (Beaux-Arts stripped classical), two storeys over a plinth,
// a stepped attic pavilion, a two-leaf entrance on the street face. Lidar: body roof 5, a core rising to 6,
// a 2-high entry porch on the street face. Cells on the outline are the shell (1 thick); the inside is air at
// ground-storey height (behind the glass), a floor slab at each storey line, and solid roof deck above.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77872.cells.json`, "utf8"));

const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => roof.has(`${x},${z}`);
const edge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const F = 2; // the street face is z = 0 (the porch cells are the only ones there)

const M = new Map(); // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const isWin = (x, z) => (x + z) % 2 === 1; // windows alternate with piers along each wall

for (const [x, z, gr, r] of cells) {
  const e = edge(x, z);
  // foundation up to the ground, then the plinth course (lowest ground is 0 here)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (z === 0) continue; // the porch cells are built below
  // the body stops at 5, the core (interior cells lidar puts at 6) steps up one more block: a setback
  const top = e ? Math.min(r, 5) : r;
  put(x, gr, z, e ? "polished_andesite" : "smooth_stone"); // plinth course on the shell, floor slab inside
  for (let y = gr + 1; y < top; y++) {
    if (y <= 2) {                                   // ground storey: glazing with air behind it
      if (e) put(x, y, z, isWin(x, z) ? "glass_pane" : "calcite");
    } else if (y === 3) {                           // upper storey: blind glazing and a floor slab over the core
      if (e) put(x, y, z, isWin(x, z) ? "gray_stained_glass" : "calcite");
      else put(x, y, z, "smooth_stone");
    } else if (y === 4) {                           // cornice course on the shell, roof deck inside
      put(x, y, z, e ? "stone_bricks" : "smooth_stone");
    } else if (y === 5) {                           // attic pavilion: one plain stone tier, reads as a setback
      put(x, y, z, "calcite");
    }
  }
}

// street face: the two-leaf entrance (lidar roof 2) with a canopy slab over the doors
for (const x of [4, 5]) {
  put(x, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
  put(x, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" });
  put(x, 2, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light: lanterns hang from the ground-storey ceiling, glowstone sits on the floor behind some windows
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (z === 0 || edge(x, z)) continue;
  if ((x + z) % 4 === 1) put(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  else if ((x * 2 + z) % 7 === 3) put(x, 1, z, "glowstone");
}

// roof equipment on the deck: a couple of plant screens (only where the deck is the body, not the pavilion)
for (const [x, z, , r] of cells) {
  if (z === 0 || edge(x, z) || r !== 5) continue;
  if ((x * 3 + z * 2) % 11 === 0) put(x, 5, z, "stone_brick_wall");
}

// glass panes connect to whatever they touch (glass, stone, or a neighbouring pane)
const solid = (x, y, z) => M.has(`${x},${y},${z}`);
for (const [key, v] of M) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  v.state = {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels([8, 18, 9]);
for (const [key, v] of M) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
g.save(`${DIR}/DC77872.nbt`);
