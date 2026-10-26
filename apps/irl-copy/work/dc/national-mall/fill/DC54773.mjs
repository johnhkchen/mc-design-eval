// DC54773: a 1930s Stripped-Classical federal office block on the Mall's flank. Limestone (calcite) walls, a
// smooth-quartz string course every storey, pilasters every third bay, glass set 1 block back in an air niche, a
// stone-brick plinth on the grade and a recessed entrance on the north front. The lidar roof is smoothed into four
// flat tiers (a 11 base, a 12 south wing, a 14 setback bar, a 15 central pavilion), each standing on the solid below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54773.cells.json", "utf8"));
const W = 15, D = 23, H = 27;
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const fp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// the lidar roof smoothed into flat tiers; 0 outside the footprint
function top(x, z) {
  if (!fp(x, z)) return 0;
  if (x >= 4 && x <= 10 && z >= 3 && z <= 5) return 15;   // central pavilion
  if (x >= 1 && x <= 13 && z >= 2 && z <= 6) return 14;   // setback bar
  if (x <= 8 && z >= 8) return 12;                         // south wing
  return 11;                                               // base block
}

// [dx, dz] of each outward side: north, south, west, east
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];
// a wall face on this side of cell (x, z) at height y: the cell stands higher than the one beyond it
const faceAt = (x, z, dx, dz, y) => fp(x, z) && top(x, z) > y && top(x + dx, z + dz) <= y;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const panes = new Set();   // glass panes, for their connection states
const parapet = new Set(); // coping on the exposed roof edges

// 1. solid massing from y 0 to each tier's top; plinth and foundation below the grade line
for (const [x, z, gr] of cells) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) put(x, y, z, y <= gr ? "stone_bricks" : "calcite");
}

// 2. the facades: every exposed face of every tier, from the grade (or the tier below) up to its cornice
for (const [x, z, gr] of cells) {
  const T = top(x, z);
  for (const [dx, dz] of SIDES) {
    if (top(x + dx, z + dz) >= T) continue;     // not exposed on this side
    const lo = Math.max(top(x + dx, z + dz), gr + 1);
    const along = dz !== 0 ? x : z;             // position along the face
    const [ax, az] = dz !== 0 ? [1, 0] : [0, 1];
    parapet.add(`${x},${z}`);
    for (let y = lo; y < T; y++) {
      if (y === T - 1) { put(x, y, z, "smooth_quartz"); continue; }   // cornice
      if (y % 3 === 1) { put(x, y, z, "smooth_quartz"); continue; }   // storey string course
      // window rows: a pilaster every third bay and at the corners, else a glass pane set 1 block back
      const pier = along % 3 === 0 || !faceAt(x - ax, z - az, dx, dz, y) || !faceAt(x + ax, z + az, dx, dz, y);
      const nx = x - dx, nz = z - dz;           // the cell inward of the face
      if (pier || !fp(nx, nz)) { put(x, y, z, "smooth_quartz"); continue; }
      put(x, y, z, "glass_pane");
      panes.add(`${x},${y},${z},${dz !== 0 ? "ns" : "ew"}`);
      const lit = (x + 2 * y + 3 * z + along) % 6 === 0;   // about one window in six, so the warm lights read as a scatter, not a grid of blobs
      put(nx, y, nz, lit ? "glowstone" : "air");   // air gap behind the glass, glowstone in some windows
    }
  }
}

// 3. the coping: a stone-brick wall on the exposed roof edges, joined to its neighbours along the rim
for (const k of parapet) {
  const [x, z] = k.split(",").map(Number), T = top(x, z);
  const join = (nx, nz) => (parapet.has(`${nx},${nz}`) && top(nx, nz) === T ? "low" : "none");
  put(x, T, z, "stone_brick_wall", {
    up: "true", north: join(x, z - 1), south: join(x, z + 1), west: join(x - 1, z), east: join(x + 1, z),
  });
}

// 4. glass panes join their neighbours along the face (glass or pilaster on each side)
for (const k of panes) {
  const [x, y, z, axis] = k.split(",");
  const st = axis === "ns"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  put(+x, +y, +z, "glass_pane", st);
}

// 5. the north entrance: a recessed portal, a pair of doors on the centre bay, a lantern in the vestibule
for (const y of [2, 3]) {
  put(6, y, 0, "smooth_quartz");
  put(8, y, 0, "smooth_quartz");
  put(7, y, 1, "air");
}
const door = (y, half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(7, 2, 0, "dark_oak_door", door(2, "lower"));
put(7, 3, 0, "dark_oak_door", door(3, "upper"));
put(7, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 6. roof plant on the setback bar and the south wing (plain boxes on the flat tiers)
for (const [x, y, z] of [[2, 14, 3], [3, 14, 3], [2, 14, 4], [3, 14, 4], [2, 12, 12], [3, 12, 12], [2, 12, 13], [3, 12, 13]]) {
  put(x, y, z, "stone_bricks");
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54773.nbt");
console.log(JSON.stringify(info));
