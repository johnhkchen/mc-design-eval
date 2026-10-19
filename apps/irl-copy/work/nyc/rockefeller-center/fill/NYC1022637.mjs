// 125 West 45th Street, 1928 commercial and office building: a 16-storey brick mass on a two-storey limestone-banded
// podium, stepping back in three setbacks to a 48-block main roof, a lower rear wing and a penthouse on the top tier.
// Footprint 16 x 22 (x = across the front, low z = north = the 45th Street frontage). Buff-brick walls with limestone
// storey bands and piers (the 1920s Art Deco grid), glass windows set one block back from the face with air behind
// (no interiors), warm glowstone behind some panes, a shopfront along the street and a recessed entrance with doors and
// lanterns. Lidar roof is read as clean tiers, not followed cell by cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022637.cells.json`, "utf8"));
const X = 16, Y = 61, Z = 22;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Roof tiers (block heights above y 0), flattened from the lidar medians: a 6-block street podium with a north corner
// stub (19 and 14), setbacks climbing to 18, 27 and 38, the 48 main mass (lidar 46-49) and a lower rear wing (41).
// The penthouse (52) sits on the middle of the top tier. Every tier is solid from y 0 up, so nothing hangs.
const tierAt = (x, z) => {
  if (z === 0 && x >= 9 && x <= 14) return 19;
  if (z === 1 && x >= 11 && x <= 13) return 14;
  if (z <= 1) return 6;
  if (z === 2) return 18;
  if (z <= 4) return 27;
  if (z <= 6) return 38;
  if (z <= 19) return 48;
  return 41;
};
const penthouse = (x, z) => x >= 5 && x <= 10 && z >= 9 && z <= 15;
const roofAt = (x, z) => (penthouse(x, z) ? 52 : tierAt(x, z));

// Lidar check (not used for the massing): how far the tiers sit from the measured roof, on the cells that have one.
let dev = 0, n = 0;
for (const [x, z, , roof] of cells) if (roof > 0) { dev += Math.abs(roofAt(x, z) - roof); n++; }

// Outward faces: N = low z (the street), S = rear, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// A cell is open at height y when it is outside the footprint or its roof is at or below y.
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
// A terrace or roof edge: a neighbour whose roof is lower than this cell's top, or none at all.
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => !inFoot(x + dx, z + dz) || roofAt(x + dx, z + dz) < top);

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: a foundation from y 0 up to each cell's ground (none here, the lot is level), brick to the roof, a tar deck.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), top = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < top; y++) g.set(x, y, z, y === top - 1 ? "gray_concrete" : "bricks");
}

// 2. Faces: a base course at y 0, limestone storey bands every 3 blocks, limestone piers every 3 columns, and a glass
// pane in each remaining bay (y 1-2 of each storey) where the wall is two blocks thick. Edges of the roof get a cornice.
const recesses = [];
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    const deep = inFoot(ix, iz) && roofAt(ix, iz) > y;   // solid behind the pane: a recess, not a hole through the wall
    if (y === top - 1) { if (edgeAt(x, z, top)) g.set(x, y, z, "calcite"); continue; }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y % 3 === 0 || u % 3 === 0) { g.set(x, y, z, "calcite"); continue; }
    g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);   // every bay is glazed; the thin north stub gets a pane with nothing behind it
    if (deep) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
// The air behind each pane (warm glowstone in some), set after the faces so no fill overwrites it.
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Street front (z 0, y 1-2): a shopfront of glass across the bays, and a recessed entrance in the middle (x 7-8)
// with a pair of iron doors, a lantern over them and the calcite band above as the canopy line. The vestibule is one block deep.
for (let x = 0; x < X; x++) {
  if (!inFoot(x, 0)) continue;
  if (x >= 7 && x <= 8) {
    g.set(x, 0, 0, "iron_door", { facing: "north", half: "lower", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
    g.set(x, 1, 0, "iron_door", { facing: "north", half: "upper", hinge: x === 7 ? "left" : "right", open: "false", powered: "false" });
    g.set(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
    for (let y = 0; y <= 2; y++) g.set(x, y, 1, "air");
    continue;
  }
  if (x >= 1 && x <= 5 || x >= 10 && x <= 14) {
    for (const y of [1, 2]) {
      g.set(x, y, 0, "glass_pane", NS);
      g.set(x, y, 1, lit(x, y, 4) ? "glowstone" : "air");
    }
  }
}

// 4. Rear service door on the south face (z 21), facing out, with a wall behind it.
g.set(3, 0, 21, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 1, 21, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// 5. Parapet: a half slab on the edge of each roof, standing on the cornice below it.
for (const [x, z] of cols) {
  const top = roofAt(x, z);
  if (edgeAt(x, z, top)) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/NYC1022637.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMaxBlock: Math.max(...cols.map(([x, z]) => roofAt(x, z))), meanRoofDevFromLidar: +(dev / n).toFixed(2), ...stats }));
