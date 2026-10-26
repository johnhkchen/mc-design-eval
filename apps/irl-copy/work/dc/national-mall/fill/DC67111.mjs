import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1910s-20s Federal-style brick office block with limestone trim (the Mall's Federal Triangle-era commercial stock):
// a 2-storey north block, a 2-storey wing, and a 4-storey stepped west stair-tower. Lidar roofs are snapped to three
// flat tiers (4 / 6 / 8, the tower's south setback 7). Storeys are 2 blocks: calcite spandrel rows between glass rows.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67111.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const present = (x, z) => has.has(key(x, z));

// lidar roof -> clean tier: north block 4 (the lidar's 5 at its east corner smooths down), wing 6, tower 8 with a 7 setback
const tier = (x, z) => {
  if (z <= 2) return 4;
  if (x === 0) return z === 7 ? 7 : 8;
  return 6;
};

const g = new Voxels([3, 20, 8]);
const roofs = new Map(cells.map(([x, z]) => [key(x, z), tier(x, z)]));

// interior air: the one-cell-wide room between the west and east walls behind the windows, z 3..6
const interior = (x, z) => x === 1 && z >= 3 && z <= 6 && !(xFace(x, z) || zFace(x, z));
const xFace = (x, z) => !present(x - 1, z) || !present(x + 1, z);
const zFace = (x, z) => !present(x, z - 1) || !present(x, z + 1);
const perimeter = (x, z) => xFace(x, z) || zFace(x, z);
const isCorner = (x, z) => xFace(x, z) && zFace(x, z);

const glassPane = (axis) => ({ north: axis === "x" ? "true" : "false", south: axis === "x" ? "true" : "false",
  east: axis === "z" ? "true" : "false", west: axis === "z" ? "true" : "false", waterlogged: "false" });

for (const [x, z] of cells) {
  const top = roofs.get(key(x, z)) - 1;
  for (let y = 0; y <= top; y++) {
    if (interior(x, z)) {
      if (y === 1 || y === 3) continue;                       // room air behind the glass
      g.set(x, y, z, "smooth_stone");                         // floor slabs (and the roof deck at the top)
      continue;
    }
    if (y === 0 || y === top) { g.set(x, y, z, "calcite"); continue; }   // base course and cornice
    // quoins: the corner cells of the outline keep limestone through every storey
    if (isCorner(x, z)) { g.set(x, y, z, "calcite"); continue; }
    // a window row: glass where the face is a bay (east/west faces on even z; the south/north face on the middle cell)
    if (y % 2 === 0) { g.set(x, y, z, "bricks"); continue; }   // brick spandrel between the glass rows
    if (xFace(x, z) && z % 2 === 0) g.set(x, y, z, "glass_pane", glassPane("x"));
    else if (zFace(x, z) && x === 1) g.set(x, y, z, "glass_pane", glassPane("z"));
    else g.set(x, y, z, "bricks");
  }
}

// entrance on the south face: a dark-oak door in the base, glass above it swapped for the door's upper half, with calcite
// jambs and a calcite lintel band (the spandrel row) reading as a canopy line
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(1, 0, 7, "dark_oak_door", doorState("lower"));
g.set(1, 1, 7, "dark_oak_door", doorState("upper"));
g.set(0, 1, 7, "calcite");
g.set(2, 1, 7, "calcite");
for (let x = 0; x < 3; x++) g.set(x, 2, 7, "calcite");          // the lintel band over the door reads as a canopy line

// warm light behind the glass, and a hanging lantern in the middle room
g.set(1, 1, 4, "glowstone");
g.set(1, 3, 6, "glowstone");
g.set(1, 1, 5, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant on the wing (sitting on the roof deck) and a limestone cornice slab along every perimeter roof edge
g.set(1, 6, 4, "stone_bricks");
g.set(1, 7, 4, "stone_bricks");
for (const [x, z] of cells) {
  if (!perimeter(x, z)) continue;
  const top = roofs.get(key(x, z));
  g.set(x, top, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67111.nbt";
const r = g.save(out);
console.log(JSON.stringify(r));
