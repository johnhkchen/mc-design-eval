// FR316905356: a commercial block on the Ile de la Cite's footprint (30 x 33 cells). The lidar roof is median-smoothed on
// each cell's 3 x 3 so its noise becomes flat tiers: 6 blocks across most of the block, and a lower court at 2 cut into the
// north-west and south-east corners. Each column stands on its ground (a stone foundation up to it) and runs to its roof:
// a stone base course, one storey of shopfront glass between quartz piers, upper panes, a cornice and a stone parapet on the
// outside edge. A dark oak door sits in the south front, glowstone shows in some upper panes, and copper plant and a brick
// flue stand on the roof. The courts are paved terraces at their roof height. No interiors: every column is solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR316905356.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR316905356.nbt";

const W = 30, H = 21, D = 33;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const STONE = "stone_bricks", CORE = "stone", TERRACE = "smooth_stone", ROOF = "deepslate_tiles";
const PIER = "smooth_quartz", SHOP = "glass", PANE = "glass_pane", LAMP = "glowstone", AWNING = "red_wool";
const CORNICE = "smooth_quartz", PARAPET = "stone_bricks", PLANT = "copper_block", FLUE = "bricks", DOOR = "dark_oak_door";
const DOOR_X = 14;                       // the entrance, in the south front (z = D - 1)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const lidar = new Map();
for (const [x, z, , r] of cells) lidar.set(key(x, z), r);
const inFp = (x, z) => lidar.has(key(x, z));

// the lidar's roof noise (a lone 4 or 5 among 6s) smoothed to the median of each cell's footprint neighbourhood
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const cell = new Map();
for (const [x, z, ground] of cells) {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(lidar.get(key(x + dx, z + dz)));
  cell.set(key(x, z), { x, z, ground, R: median(around) });
}
const at = (x, z) => cell.get(key(x, z));

// the faces of a cell at height y that show: a neighbour outside the footprint, or one whose roof is below this row
const openFaces = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.R <= y; });
const onEdge = (c) => DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz));

const vox = new Voxels([W, H, D]);
const door = (r, facing) => ({ facing, half: r === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });

for (const c of cell.values()) {
  const { x, z, ground } = c;

  // a court: its roof is no higher than its ground, so the paving is its floor
  if (c.R <= ground) {
    for (let y = 0; y < ground; y++) vox.set(x, y, z, y === ground - 1 ? TERRACE : STONE);
    continue;
  }

  // foundation on the lowest ground, then the storeys to the roof
  for (let y = 0; y < ground; y++) vox.set(x, y, z, STONE);
  for (let y = ground; y < c.R; y++) {
    const r = y - ground, top = y === c.R - 1, open = openFaces(c, y);
    if (!open.length) { vox.set(x, y, z, top ? ROOF : CORE); continue; }
    if (top) { vox.set(x, y, z, CORNICE); continue; }
    if (r === 0) { vox.set(x, y, z, STONE); continue; }                   // base course
    const xFace = open.some(([dx]) => dx !== 0), zFace = open.some(([, dz]) => dz !== 0);
    if (xFace && zFace) { vox.set(x, y, z, PIER); continue; }             // corner pier
    const along = xFace ? z : x;
    if (along % 3 === 0) { vox.set(x, y, z, PIER); continue; }            // a pier between each pair of panes
    if (zFace && z === D - 1 && along === DOOR_X) {                       // the entrance, stepped up from the street
      if (r <= 1) { vox.set(x, y, z, DOOR, door(r, "north")); continue; }
      if (along >= DOOR_X - 1 && along <= DOOR_X + 1) { vox.set(x, y, z, AWNING); continue; }  // canopy over the door
      vox.set(x, y, z, SHOP); continue;
    }
    if (r === 1) { vox.set(x, y, z, SHOP); continue; }                    // shopfront glass
    vox.set(x, y, z, r === 2 && along % 6 === 4 ? LAMP : PANE);            // upper panes, a warm lamp in some
  }

  // parapet on the outside edge of the roof
  if (onEdge(c)) vox.set(x, c.R, z, PARAPET);
}

// roof plant on the flat main roof: two copper boxes and a brick flue, each only on cells whose roof is the main 6
const roofAt = (x, z) => at(x, z)?.R === 6;
const box = (x0, x1, z0, z1, y0, y1, block) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (roofAt(x, z)) for (let y = y0; y <= y1; y++) vox.set(x, y, z, block);
};
box(9, 11, 9, 10, 6, 7, PLANT);
box(19, 21, 20, 21, 6, 7, PLANT);
box(25, 25, 8, 8, 6, 8, FLUE);

const { blocks, palette } = vox.save(OUT);
console.log(`FR316905356: ${blocks} blocks, ${palette} palette entries -> ${OUT}`);
