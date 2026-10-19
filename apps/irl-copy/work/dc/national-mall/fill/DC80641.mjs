// DC80641: Federal Home Loan Bank Board, 200 Constitution Ave NW. A stripped-classical limestone office block of the
// Federal Triangle era: a rusticated base storey, four storeys of glazed bays between storey lines, a stepped massing
// (the lidar's 17-block core, 14-16 wings and setbacks), a parapet and cornice, a double-door entrance on the north
// face, a penthouse on the core roof, and warm light in some windows. Shell only: the glass has air behind it and each
// storey has a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC80641.cells.json`, "utf8"));   // [x, z, ground, roof]

const at = new Map(cells.map(([x, z, gr, R]) => [`${x},${z}`, { g: gr, R }]));
const cell = (x, z) => at.get(`${x},${z}`);
// A side is exposed when the neighbour is outside the footprint or its roof is lower (a setback face).
const exposed = (x, z, dx, dz) => { const n = cell(x + dx, z + dz); return !n || n.R < cell(x, z).R; };
const perimeter = (x, z) => exposed(x, z, 1, 0) || exposed(x, z, -1, 0) || exposed(x, z, 0, 1) || exposed(x, z, 0, -1);

const FOUNDATION = "polished_andesite", BASE = "stone_bricks", WALL = "calcite", FLOOR = "smooth_stone";
const ROOF = "stone", GLASS = "light_blue_stained_glass_pane", PENTHOUSE = "light_gray_concrete";

const g = new Voxels([18, 29, 39]);

for (const [x, z, gr, R] of cells) {
  const per = perimeter(x, z);
  // facade bays run along the face: along x on the north and south faces, along z on the east and west ones
  const alongX = exposed(x, z, 0, -1) || exposed(x, z, 0, 1);
  const bay = alongX ? x : z;
  const panes = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

  if (R <= 3) {                                    // low plinths and garden walls
    for (let y = gr; y < R; y++) g.set(x, y, z, y === R - 1 ? FLOOR : BASE);
    continue;
  }
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  for (let y = gr; y < R; y++) {
    const k = y - gr, m = k % 4, ground = k < 4;   // storeys are 4 rows: floor, two glazed rows, storey line
    if (y === R - 1) { g.set(x, y, z, per ? WALL : ROOF); continue; }   // roof cap: parapet band or flat roof
    if (m === 0) { g.set(x, y, z, FLOOR); continue; }                   // floor slab, every storey
    if (!per) continue;                                                 // interior air behind the glass
    if (m === 3) { g.set(x, y, z, ground ? FLOOR : WALL, null); continue; }   // storey line
    if (bay % 3 === 0) { g.set(x, y, z, ground ? BASE : WALL); continue; }    // piers
    g.set(x, y, z, GLASS, panes);
  }
  if (per) g.set(x, R, z, FLOOR);                  // cornice over the parapet line
}

// Entrance: a double iron door in the north face, with the storey line over it.
for (const x of [7, 8]) {
  const gr = cell(x, 0).g;
  const hinge = x === 7 ? "left" : "right";
  g.set(x, gr + 1, 0, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, gr + 2, 0, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  g.set(x, gr + 3, 0, BASE);
}

// Warm light: a glowstone on the floor just behind some glazed bays, inside the shell.
for (const [x, z, gr, R] of cells) {
  if (!perimeter(x, z)) continue;
  const alongX = exposed(x, z, 0, -1) || exposed(x, z, 0, 1);
  const bay = alongX ? x : z;
  const inward = exposed(x, z, 0, -1) ? [x, z + 1] : exposed(x, z, 0, 1) ? [x, z - 1]
    : exposed(x, z, -1, 0) ? [x + 1, z] : [x - 1, z];
  const inner = cell(...inward);
  if (!inner || inner.g !== gr || perimeter(...inward)) continue;
  for (let y = gr + 1; y < R - 1; y += 4) {       // the lower glazed row of each storey
    const storey = (y - gr - 1) / 4;
    if (bay % 3 === 0 || y >= inner.R - 1) continue;
    if ((x * 7 + z * 3 + storey) % 3 !== 0) continue;
    g.set(inward[0], y, inward[1], "glowstone");
  }
}

// Penthouse on the core roof, standing on the roof cap.
for (let x = 12; x <= 14; x++) for (let z = 21; z <= 23; z++) {
  const c = cell(x, z);
  if (!c || c.R !== 17) continue;
  g.set(x, 17, z, PENTHOUSE); g.set(x, 18, z, PENTHOUSE);
}

const out = g.save(`${FILL}/DC80641.nbt`);
console.log(out);
