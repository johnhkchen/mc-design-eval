// A 1960s–70s stripped-modern concrete office block on a stepped massing: a 7-storey tower (lidar roof 28) at the north
// of the plot, a 6-storey shoulder (24) on the east, a 4-storey wing (16) to the south, and a single-storey shopfront
// podium (4) on the rest. Quartz piers and storey lines, light-grey spandrels, a ribbon of glass per storey, an andesite base
// course with a glazed ground-floor shopfront, one entrance with a lantern, and warm glowstone in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_439261514.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..5, z 0..4

// Each footprint column: its lidar roof, smoothed to whole storeys of 4 blocks (a 5 is a single-storey wing, 4).
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, top: Math.max(4, 4 * Math.round(roof / 4)) });
const top = (x, z) => (col.has(`${x},${z}`) ? col.get(`${x},${z}`).top : 0);   // outside the footprint: 0, so always exposed

const g = new Voxels([6, 41, 5]);

// Sides of a cell at layer y that face open air: outside the footprint, or over a neighbour that stands lower than y.
const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y).map(([, , face]) => face);

const DOOR = [2, 4];   // the south face (z = 4), one of the single-storey shopfront cells
const LANTERN = [2, 3, 4];

// --- the columns: ground (none here, every ground is 0) up to the roof ---
for (const [key, { ground, top: T }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");
  for (let y = ground; y < T; y++) {
    const ex = exposed(x, z, y);
    const row = y % 4;                     // 0 storey line, 1-2 glazing, 3 spandrel/parapet
    const isRoof = y === T - 1;
    const ground1 = y < 4;                 // the shopfront storey
    const corner = ex.length >= 2;
    if (isRoof) {
      // the top course: a parapet on the open edges, roof membrane inside
      g.set(x, y, z, ex.length ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (row === 0) {
      // storey line: an andesite base course at street level, quartz bands above; interior floor slab
      g.set(x, y, z, ex.length ? (ground1 ? "polished_andesite" : "smooth_quartz") : "smooth_stone");
      continue;
    }
    if (row === 3) {
      // spandrel panels under each storey's glazing; the shop fascia is quartz
      if (ex.length) g.set(x, y, z, ground1 ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (!ex.length) continue;              // interior air behind the glass
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }   // corner piers
    const face = ex[0];
    const isDoor = x === DOOR[0] && z === DOOR[1] && face === "south";
    if (isDoor) {
      if (y === 1) g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      if (y === 2) g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // glazing: a ribbon of glass between the quartz storey lines and the spandrels, piers only at the corners
    g.set(x, y, z, "light_blue_stained_glass_pane");
  }
}

// --- the entrance lantern under the lintel, and a roof plant box on the tower ---
g.set(LANTERN[0], LANTERN[1], LANTERN[2], "lantern", { hanging: "true", waterlogged: "false" });
g.set(2, 28, 1, "iron_block");

// --- warm windows: a glowstone just behind a few glass panes, in the air behind the glazing ---
for (const [key, { top: T }] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < T - 1; y += 4) {
    const ex = exposed(x, z, y);
    if (ex.length !== 1 || ex[0] === "south" && x === DOOR[0] && z === DOOR[1]) continue;
    const pane = g.get(x, y, z)?.block === "minecraft:light_blue_stained_glass_pane";
    if (!pane || (x + 2 * z + y) % 3 !== 0) continue;
    const [dx, dz] = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[ex[0]];
    const bx = x + dx, bz = z + dz;
    if (top(bx, bz) > y && !exposed(bx, bz, y).length) g.set(bx, y, bz, "glowstone");
  }
}

// --- glass panes: connect to their neighbours (panes and full blocks) so the bands read as continuous glazing ---
const FULL = new Set(["smooth_quartz", "polished_andesite", "light_gray_concrete", "smooth_stone", "glowstone", "iron_block", "stone"]);
const name = (b) => (b ? b.replace("minecraft:", "") : null);
const linked = (x, y, z, dx, dz) => {
  const b = name(g.get(x + dx, y, z + dz)?.block);
  return b && (b === "light_blue_stained_glass_pane" || FULL.has(b)) ? "true" : "false";
};
for (let y = 0; y < 41; y++) for (let z = 0; z < 5; z++) for (let x = 0; x < 6; x++) {
  if (name(g.get(x, y, z)?.block) !== "light_blue_stained_glass_pane") continue;
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: linked(x, y, z, 0, -1), south: linked(x, y, z, 0, 1),
    east: linked(x, y, z, 1, 0), west: linked(x, y, z, -1, 0), waterlogged: "false",
  });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_439261514.nbt";
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries`);
