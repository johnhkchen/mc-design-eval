// 35 West 54th Street, 1920 multi-family elevator building: an eight-storey red-brick front on a granite base, with
// limestone string courses, paired windows between brick piers, a stone attic band and cornice, and a parapet. The
// 6-block-wide street front (x 0-5, low z = north = 54th Street) has two shops either side of a double-door lobby under
// a black awning. The lidar roof is smoothed into two flat tiers: 24 blocks (eight storeys) on the main block, 18 on the
// rear two rows (a six-storey wing). A penthouse and a wood water tank stand on the roof. Glass sits one block out from
// a solid core, with air behind it and a floor slab in each storey (no interiors). Warm glowstone and lanterns sit in
// some windows and the shops.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034791.cells.json`, "utf8"));
const X = 7, Y = 36, Z = 23;

const cell = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundOf = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).ground : 0);
const topOf = (x, z) => (!inFoot(x, z) ? 0 : z >= 21 ? 18 : 24);   // flat tiers; 0 = nothing built
const open = (x, y, z) => topOf(x, z) <= y;                         // outside the footprint, or roof at or below y

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };      // outward, out of the building
const facesOf = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 9 === 0;         // sparse, deterministic warm windows
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);

// 1. Solid mass: granite-and-stone foundation from y 0 to each cell's ground, the core to the roof, and a smooth roof
// covering on each top (the face pass replaces it on the edges).
for (const [x, z] of cols) {
  const ground = groundOf(x, z), top = topOf(x, z);
  for (let y = 0; y < top; y++) g.set(x, y, z, y < ground ? "stone_bricks" : y === top - 1 ? "smooth_stone" : "stone");
}

// 2. Faces, by storey. Base course at each cell's ground; limestone string courses every third row; brick piers at
// the corners and every third bay, paired windows between them; an attic band and a stone cap at the top. Windows
// are recorded so their air gaps and warm lights can be set after.
const glass = [];
for (const [x, z] of cols) {
  const ground = groundOf(x, z), top = topOf(x, z);
  for (let y = ground; y < top; y++) {
    const faces = facesOf(x, y, z);
    if (!faces.length) continue;
    const d = faces[0], [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                                    // position along the face
    const pier = faces.length > 1 || u % 3 === 0;                  // corners and every third bay
    if (y === ground) { g.set(x, y, z, "polished_granite"); continue; }
    if (y >= top - 2) { g.set(x, y, z, "stone_bricks"); continue; }  // attic band and cornice
    if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }        // string course
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", dx === 0 ? NS : EW);
    glass.push([x, y, z, dx, dz, u, Object.keys(DIRS).indexOf(d)]);
  }
}

// 3. Air gap behind each pane, one block in and not itself a face, so the glass sits in a reveal. Some gaps hold a
// warm glowstone behind the glass.
for (const [x, y, z, dx, dz, u, k] of glass) {
  const ix = x - dx, iz = z - dz;
  const deep = inFoot(ix, iz) && topOf(ix, iz) > y && !facesOf(ix, y, iz).length;
  if (deep) g.set(ix, y, iz, lit(u, y, k) ? "glowstone" : "air");
}

// 4. Street lobby (x 2-3, low z): a dark double door, a vestibule of air behind it, and a black awning across the
// shopfronts over the door. The shops (x 1 and 4) have a lantern standing just inside their glass.
g.set(2, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(3, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(3, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [2, 3]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 1; x <= 4; x++) g.set(x, 3, 0, "black_concrete");
for (const x of [1, 4]) g.set(x, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// 5. Parapet: a bottom stone slab on the edge of each roof, standing on the cap below it.
for (const [x, z] of cols) {
  const top = topOf(x, z);
  if (facesOf(x, top - 1, z).length) g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 6. Roof: a brick stair-and-elevator bulkhead on the main roof, capped in stone, and a wood water tank on four
// iron-bar legs on the rear part of the roof.
for (let x = 2; x <= 3; x++) for (let z = 12; z <= 14; z++) {
  g.set(x, 24, z, "bricks"); g.set(x, 25, z, "bricks"); g.set(x, 26, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z] of [[4, 16], [5, 16], [4, 17], [5, 17]]) {
  g.set(x, 24, z, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
  g.set(x, 25, z, "iron_bars", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
  for (let y = 26; y <= 28; y++) g.set(x, y, z, "spruce_planks");
  g.set(x, 29, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(`${DIR}/NYC1034791.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMax: Math.max(...cols.map(([x, z]) => topOf(x, z))), windows: glass.length, ...stats }));
