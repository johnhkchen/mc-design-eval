// 647 Fifth Avenue, NYC individual landmark, a 1905 commercial and office building: an eleven-storey Beaux-Arts block of
// brick piers and calcite belt courses with glass between, on a ground storey of shopfronts in stone. Footprint 25 x 10
// (x along the street; the two long faces, low and high z, are the street frontages). The lidar roof is read as tiers
// from its column medians: a nine-storey wing at the west end (x 0-4, lidar 26-28), a ten-storey step (x 5-7, lidar
// 31-32), and the eleven-storey main block (x 8-24, lidar 32-35) with a two-block penthouse set back 3 from the street
// faces (x 13-22, z 3-6). Each storey is a 3-block course: a calcite belt at y%3 == 0, two pane rows, brick piers every
// third column. Glass sits in a one-block air gap behind it, with a floor slab in the gap at each belt; no interiors.
// Warm glowstone sits behind some panes. The entrance (x 10-11, low z) is a pair of iron doors under a flush dark-oak awning
// on a stone lintel, with two hanging lanterns. The roof is a smooth-stone cover with a stone-brick coping at the edges
// and a mechanical box with a lantern on the main roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035480.cells.json`, "utf8"));
const X = 25, Z = 10, Y = 38;

const cell = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
if (cell.size !== X * Z) throw new Error(`expected ${X * Z} footprint cells, got ${cell.size}`);
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;
const G = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers (block heights above y 0), smoothed from the lidar's column medians. Storeys are 3 blocks, so tiers sit on
// multiples of 3 where the lidar allows: 27 (nine storeys) at the west wing, 30 (ten) at the step, 33 (eleven) on the
// main block, and a 35 penthouse set back from the street faces.
const T = (x, z) => (x <= 4 ? 27 : x <= 7 ? 30 : x >= 13 && x <= 22 && z >= 3 && z <= 6 ? 35 : 33);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const PANE = {
  N: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },   // pane on a face along x
  S: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },   // pane on a face along z
  E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
};
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm panes

// Open air beside a cell at height y: outside the footprint, or above that cell's roof. Solid foundation and building
// beside it are not open, so a face only shows where the air really is.
const open = (x, y, z) => !inFoot(x, z) || y >= T(x, z);
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// A roof edge: a neighbour that is outside the footprint or whose roof is lower than this cell's top.
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || T(x + dx, z + dz) < top);

const g = new Voxels([X, Y, Z]);

// 1. Mass: foundation from y 0 up to each cell's ground, the core to the roof, a smooth-stone roof cover on each top.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const ground = G(x, z), top = T(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "smooth_stone" : "stone");
}

// 2. Facades. Per face cell: a sill on the ground, belt courses at every third block (calcite), a calcite cornice at the
// top, brick piers every third column (stone bricks in the base), and glass in the bays. Each pane's inward neighbour is
// an air gap (lit by glowstone sometimes); each belt's inward neighbour is a floor slab. The gaps are set after the
// faces, so no face overwrites them.
const gaps = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const ground = G(x, z), top = T(x, z);
  for (let y = ground; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    const inside = inFoot(ix, iz);
    if (y === top - 1) { g.set(x, y, z, "calcite"); continue; }   // cornice
    if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }   // sill, the base course
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); if (inside) gaps.push([ix, y, iz, "smooth_stone"]); continue; }
    if (u % 3 === 0) { g.set(x, y, z, y < 6 ? "stone_bricks" : "bricks"); continue; }   // pier
    g.set(x, y, z, "glass_pane", PANE[d]);
    if (inside) gaps.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : d === "W" ? 3 : 4) ? "glowstone" : "air"]);
  }
}
for (const [x, y, z, b] of gaps) g.set(x, y, z, b);

// 3. Street entrance (x 10-11, low z): two iron doors under a flush dark-oak awning on a stone lintel, with the vestibule
// air behind them and two lanterns hanging from the awning. The awning rests on the lintel and the piers, so nothing floats.
const G0 = G(10, 0);
g.set(10, G0, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, G0 + 1, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(11, G0, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(11, G0 + 1, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [10, 11]) for (const y of [G0, G0 + 1]) g.set(x, y, 1, "air");
for (const x of [10, 11]) g.set(x, G0 + 2, 0, "stone_bricks");
for (const x of [10, 11]) g.set(x, G0 + 2, 1, "stone_bricks");
for (let x = 9; x <= 12; x++) g.set(x, G0 + 3, 0, "dark_oak_planks");
for (const x of [9, 12]) g.set(x, G0 + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Roof: a stone-brick coping on each roof's edge, standing on the cornice below it. Then the roof plant on the main
// roof: a two-block box with a lantern on it (set back from the penthouse, on the 33 tier).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const top = T(x, z);
  if (edgeAt(x, z, top)) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const x of [16, 17]) { g.set(x, 33, 8, "light_gray_concrete"); g.set(x, 34, 8, "light_gray_concrete"); }
g.set(16, 35, 8, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1035480.nbt`);
console.log(JSON.stringify({ cells: cell.size, maxTop: Math.max(...cells.map(([x, z]) => T(x, z))), ...stats }));
