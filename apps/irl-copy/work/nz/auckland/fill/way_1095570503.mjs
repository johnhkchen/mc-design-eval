// A two-storey 1920s-30s brick commercial block with a three-storey stepped bay on its east side (Eden Terrace / Grafton
// street edge): brick walls on a stone plinth, cream plaster storey lines and caps, glazed bays on alternate cells,
// a shopfront with a dark timber fascia and a door on the street face (z = 0), warm glowstone behind some panes,
// and roof plant on the flat roofs. Tiers come from the lidar roof heights: 7-8 blocks merge into the two-storey tier
// (8), 9-10 is the taller bay (10), so the massing steps cleanly without lidar noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570503.cells.json", "utf8"));
const LOW = 8, TALL = 10;
const key = (x, z) => `${x},${z}`;
const top = new Map(), ground = new Map();
for (const [x, z, g0, roof] of cells) { top.set(key(x, z), roof >= 9 ? TALL : LOW); ground.set(key(x, z), g0); }
const has = (x, z) => top.has(key(x, z));
const T = (x, z) => top.get(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ext = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));              // faces onto the street or open air
const lowerNeighbour = (x, z) => DIRS.some(([dx, dz]) => has(x + dx, z + dz) && T(x + dx, z + dz) < T(x, z));
const shell = (x, z) => ext(x, z).length > 0 || lowerNeighbour(x, z);                // solid outer skin and the step walls
const win = (x, z) => ext(x, z).length > 0 && (x + z) % 2 === 1;                     // glazed bays on alternate exterior cells
const street = (x, z) => z === 0;                                                    // the row on the street face: shopfront
const DOOR = [3, 0];

const g = new Voxels([11, 23, 9]);
for (const [x, z] of cells) {
  const t = T(x, z), gr = ground.get(key(x, z));
  // foundation (none here: the lowest ground is under every cell) and the stone base course / ground floor slab
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "stone_bricks");
  if (shell(x, z)) {
    // ground storey, y 1-3
    for (let y = gr + 1; y <= 3; y++) {
      let b = "bricks";
      if (street(x, z) && y === 3) b = "dark_oak_planks";                          // shop fascia
      else if (y <= 2 && (street(x, z) || win(x, z))) b = "glass_pane";
      g.set(x, y, z, b);
    }
    if (street(x, z) && x === DOOR[0]) {                                           // the street door, centred on the shopfront
      const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
      g.set(x, 1, z, "dark_oak_door", { ...door, half: "lower" });
      g.set(x, 2, z, "dark_oak_door", { ...door, half: "upper" });
    }
    // storey line at y 4: plaster band, white sills under the glazed bays
    g.set(x, 4, z, win(x, z) ? "white_concrete" : "smooth_stone");
    // upper storey, y 5-6: glazing on the bays, brick between
    for (const y of [5, 6]) g.set(x, y, z, win(x, z) ? "glass_pane" : "bricks");
    if (t === TALL) {
      // the taller bay: y 7 brick (white lintel over the bays), y 8 plaster string course, y 9 cap
      g.set(x, 7, z, win(x, z) ? "white_concrete" : "bricks");
      g.set(x, 8, z, "smooth_stone");
      g.set(x, 9, z, "smooth_stone");
    } else {
      g.set(x, 7, z, "smooth_stone");                                              // cream cap on the two-storey parapet
    }
  } else {
    // interior: air behind the glass, one floor slab per storey, a flat roof membrane on top
    g.set(x, 4, z, "smooth_stone");
    g.set(x, t - 1, z, "gray_concrete");
  }
}

// warm light behind some upper and shopfront panes: glowstone in the air cell just inside a glazed bay
const interior = (x, z) => has(x, z) && !shell(x, z);
for (const [x, z] of cells) {
  if (!interior(x, z)) continue;
  const behindGlass = DIRS.some(([dx, dz]) => has(x + dx, z + dz) && shell(x + dx, z + dz) && win(x + dx, z + dz));
  if (behindGlass && (x + 2 * z) % 3 === 0) g.set(x, 5, z, "glowstone");
  const behindShop = DIRS.some(([dx, dz]) => has(x + dx, z + dz) && street(x + dx, z + dz));
  if (behindShop && x % 2 === 1) g.set(x, 2, z, "glowstone");
}

// roof plant: air-conditioning units on the two-storey roof, a stair and lift housing with a cap on the taller bay
const plant = [[7, 3], [9, 5]];
for (const [x, z] of plant) if (has(x, z) && T(x, z) === LOW) g.set(x, LOW, z, "iron_block");
const stack = [4, 3];
if (has(stack[0], stack[1]) && T(stack[0], stack[1]) === LOW) { g.set(stack[0], LOW, stack[1], "bricks"); g.set(stack[0], LOW + 1, stack[1], "bricks"); }
for (const [x, z] of [[4, 5], [5, 5], [4, 6], [5, 6]]) {
  if (!has(x, z) || T(x, z) !== TALL) continue;
  g.set(x, TALL, z, "bricks"); g.set(x, TALL + 1, z, "bricks");
}
for (const [x, z] of [[4, 5], [5, 5], [4, 6], [5, 6]]) if (has(x, z) && T(x, z) === TALL) g.set(x, TALL + 2, z, "smooth_stone");

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570503.nbt");
console.log(r);
