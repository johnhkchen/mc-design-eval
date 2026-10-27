// Way 293020897: a two-storey brick and plaster commercial block (1920s-30s Auckland main-street type) on the
// Mt Eden side of the CBD. Its lidar roof gives two tiers: a core (roof 9-10, parapet at 10) with a setback upper storey
// and a roof terrace ring, and a single-storey wing (roof 8 and under, parapet at 7). Floors run at one datum (y 2, 6,
// 9) over the whole footprint; the plinth fills y 0..2 under every cell, so the downhill (south, ground 0) side shows
// its basement storey above grade and nothing floats on the slope.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020897.cells.json`, "utf8"));

const K = (x, z) => `${x},${z}`;
const xy = (k) => k.split(",").map(Number);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const foot = new Set(), roof = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { foot.add(K(x, z)); roof.set(K(x, z), r); ground.set(K(x, z), g); }

// the directions in which a cell's neighbour is not in `set`: its exposed faces
const facesOf = (x, z, set) => Object.entries(DIRS).filter(([, [dx, dz]]) => !set.has(K(x + dx, z + dz))).map(([d]) => d);

// massing from the lidar roof: 9-10 is the core (parapet 10), 8 and under the single-storey wing (parapet 7)
const core = new Set([...foot].filter((k) => roof.get(k) >= 9));
const wing = new Set([...foot].filter((k) => roof.get(k) < 9));
// the core's upper storey is set in one cell from its outer edge: the ring is the terrace floor at y 6
const ring = new Set([...core].filter((k) => facesOf(...xy(k), core).length > 0));
const upper = new Set([...core].filter((k) => !ring.has(k)));
const ringEdge = new Set([...ring].filter((k) => facesOf(...xy(k), foot).length > 0));

const g = new Voxels([22, 23, 37]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const BR = "bricks", ST = "stone_bricks", QZ = "smooth_quartz", SS = "smooth_stone";

// glass panes connect along the wall, so a row of windows reads as a band, not a row of posts
const pane = (along) => (along ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
  : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" });

// one perimeter cell of a storey: piers (corners doubled as pilasters) between window bays, a dark shopfront at the
// ground floor (bulkhead, then glass to the floor line), and two-high glass above
function facade(x, z, set, level) {
  const fs = facesOf(x, z, set);
  if (!fs.length) return;
  const alongX = fs[0] === "north" || fs[0] === "south";
  const along = alongX ? x : z;
  // the footprint steps, so most edge cells have two faces: only the every-third-cell pilasters are stone, the rest brick
  const pier = along % 3 === 0;
  const ys = level === "ground" ? [3, 4, 5] : [7, 8];
  for (const y of ys) {
    if (pier) { put(x, y, z, QZ); continue; }
    if (fs.length > 1) { put(x, y, z, BR); continue; }
    if (level === "ground" && y === 3) { put(x, y, z, "dark_oak_planks"); continue; }
    put(x, y, z, "glass_pane", pane(alongX));
  }
}

// 1. plinth and base course under every cell: solid from y 0 to 2 (the floor datum), no air under the building
for (const k of foot) { const [x, z] = xy(k); for (const y of [0, 1, 2]) put(x, y, z, ST); }
// 2. ground storey: walls on the footprint edge, air behind, floor slab at 6 (the terrace and the wing roof)
for (const k of foot) { const [x, z] = xy(k); facade(x, z, foot, "ground"); put(x, 6, z, QZ); }
// 3. the terrace balustrade on the ring's outer edge
for (const k of ringEdge) { const [x, z] = xy(k); put(x, 7, z, "iron_bars", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" }); }
// 4. the wing's parapet, a coping on its outer edge
for (const k of wing) { const [x, z] = xy(k); if (facesOf(x, z, foot).length) put(x, 7, z, QZ); }
// 5. upper storey of the core: walls on the setback edge, a slab at 9 and a parapet coping at 10
for (const k of upper) {
  const [x, z] = xy(k);
  facade(x, z, upper, "upper");
  put(x, 9, z, SS);
  if (facesOf(x, z, upper).length) put(x, 10, z, QZ);
}

// 6. the entrance: the north face, under the core at ground level; a stone step on the grade, a dark oak door
//    with a canopy cantilevered off the wall and a lantern under it
const DOOR = [4, 1];
const [dx0, dz0] = DOOR;
for (const x of [dx0 - 1, dx0, dx0 + 1]) if (!foot.has(K(x, dz0 - 1))) for (const y of [0, 1, 2]) put(x, y, dz0 - 1, ST);
for (const x of [dx0 - 1, dx0, dx0 + 1]) if (!foot.has(K(x, dz0 - 1))) put(x, 5, dz0 - 1, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
put(dx0, 3, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx0, 4, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dx0, 4, dz0 - 1, "lantern", { hanging: "true", waterlogged: "false" });

// 7. roof equipment: air conditioners on the wing roof and on the core's roof
const interiorOf = (set, cellsOf) => [...cellsOf].filter((k) => !facesOf(...xy(k), set).length).map(xy);
for (const [x, z] of interiorOf(foot, wing).filter(([x, z]) => (x * 5 + z * 3) % 11 === 0).slice(0, 2)) put(x, 7, z, "iron_block");
for (const [x, z] of interiorOf(upper, upper).filter(([x, z]) => (x * 7 + z * 5) % 13 === 0).slice(0, 2)) put(x, 10, z, "iron_block");

// 8. warm light: glowstone just inside some windows (the air behind the glass, so the light reads through the pane)
const storeys = [[4, foot, "ground"], [7, upper, "upper"]];
for (const [ly, set] of storeys) {
  for (const k of set) {
    const [x, z] = xy(k), fs = facesOf(x, z, set);
    if (!fs.length || (x + z * 3 + ly) % 4 !== 0) continue;
    const f = fs[0], [dx, dz] = DIRS[f];
    if (foot.has(K(x - dx, z - dz)) && !facesOf(x - dx, z - dz, set).length) put(x - dx, ly, z - dz, "glowstone");
  }
}

const info = g.save(`${DIR}/way_293020897.nbt`);
console.log(`way_293020897: ${info.blocks} blocks, ${info.palette} palette entries`);
