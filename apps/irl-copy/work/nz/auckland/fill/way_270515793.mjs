// Mt Eden Road-style two-storey brick commercial block (c. 1930s), 40 x 46 footprint, flat roof on a plaster
// cornice with a coping parapet and a roof plant room. The lidar roof is 8-9 across the body; the 14-18 cells
// are an 11-cell diagonal chain along the east edge, one or two cells wide, so they read as tree or noise
// and are smoothed into the body tier rather than built as a tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_270515793.cells.json`, "utf8"));

const X = 40, Z = 46, Y = 31;
const ROOF = 9;                       // body top: lidar 8-9 median 9; the wall-top cornice is layer 8, the roof slab sits at 8
const FLOOR = 4;                      // first-floor slab and string course (layer 4)
const TOP = 8;                        // roof slab / cornice layer
const foot = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// exterior faces of a footprint cell: the sides with no footprint cell beyond them
const exteriorFaces = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([n]) => n);
const isBoundary = (x, z) => exteriorFaces(x, z).length > 0;
const pierOn = (face, x, z) => (face === "north" || face === "south" ? x : z) % 3 === 0;

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (inF(x, z)) g.set(x, y, z, block, state); };

// wall tiers: the foundation fills 0 up to the ground, the ground floor starts on a plinth at max(ground, 1)
const glass = (face) => (face === "north" || face === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z, gr] of cells) {
  const W0 = Math.max(gr, 1);                       // the ground-floor level: the wall starts on a plinth here
  const faces = exteriorFaces(x, z);
  if (!faces.length) {
    // interior: a solid foundation below, the floor slabs at FLOOR and TOP, air between (the empty room)
    for (let y = 0; y < W0; y++) put(x, y, z, "stone");
    put(x, FLOOR, z, "smooth_stone");
    put(x, TOP, z, "smooth_stone");
    continue;
  }
  const corner = faces.length > 1;
  for (let y = 0; y < W0; y++) put(x, y, z, "stone");   // foundation under the wall, up to the ground
  put(x, W0, z, "stone_bricks");                          // base course
  put(x, FLOOR, z, "smooth_quartz");                     // string course
  put(x, TOP, z, "smooth_quartz");                       // cornice
  put(x, TOP + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // coping
  // wall between the plinth and the string course: bricks, with two glass panes to every pier (ground and upper)
  for (let y = W0 + 1; y <= 7; y++) {
    if (y === FLOOR) continue;
    const ground = y <= 3;
    const upperGlass = y >= 5 && y <= 6;
    const lowerGlass = ground && y >= W0 + 1;
    const win = !corner && !pierOn(faces[0], x, z);   // a window bay, not a pier or a corner
    let block = "bricks", state;
    if (win && (upperGlass || lowerGlass)) { block = "glass_pane"; state = glass(faces[0]); }
    if (win && y === 7) block = "smooth_quartz";      // window heads are quartz frames
    put(x, y, z, block, state);
  }
}

// entrances: two doors on the largest run of ground-level exterior faces (plinth at layer 1, so door is layers 2-3)
const doorable = cells.filter(([x, z, gr]) => Math.max(gr, 1) === 1 && exteriorFaces(x, z).length === 1);
const byFace = {};
for (const [x, z] of doorable) { const f = exteriorFaces(x, z)[0]; (byFace[f] ??= []).push([x, z]); }
const doorFace = Object.entries(byFace).sort((a, b) => b[1].length - a[1].length)[0];
const doorRun = doorFace[1].sort((a, b) => (doorFace[0] === "north" || doorFace[0] === "south" ? a[0] - b[0] : a[1] - b[1]));
const doors = [doorRun[Math.floor(doorRun.length * 0.25)], doorRun[Math.floor(doorRun.length * 0.75)]];
for (const [x, z] of doors) {
  const face = doorFace[0];
  const facing = OPP[face];
  for (const [half, y] of [["lower", 2], ["upper", 3]]) {
    put(x, y, z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  }
  // a lantern standing just inside the door
  const [dx, dz] = DIRS[OPP[face]];
  put(x + dx, 1, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
}

// warm light behind glass: glowstone on the floor just inside some windows (every sixth ground window, every third upper)
let k = 0;
for (const [x, z] of cells) {
  if (!isBoundary(x, z)) continue;
  for (const face of exteriorFaces(x, z)) {
    if (exteriorFaces(x, z).length > 1 || pierOn(face, x, z)) continue;
    const [dx, dz] = DIRS[OPP[face]];
    const ix = x + dx, iz = z + dz;
    if (!inF(ix, iz) || isBoundary(ix, iz)) continue;
    k++;
    if (k % 6 === 0) put(ix, 1, iz, "glowstone");              // shopfront, on the ground-floor slab
    else if (k % 3 === 0) put(ix, 5, iz, "glowstone");         // upper storey, on the first-floor slab
  }
}

// roof plant room: stone box on the roof slab, set in from the parapet so the cornice reads
for (const [x, z] of cells) {
  const deep = x >= 13 && x <= 25 && z >= 15 && z <= 27 && [-2, -1, 0, 1, 2].every((dx) => [-2, -1, 0, 1, 2].every((dz) => inF(x + dx, z + dz)));
  if (!deep) continue;
  put(x, 9, z, "stone_bricks");
  put(x, 10, z, (x + z) % 2 ? "stone_brick_slab" : "stone_bricks", (x + z) % 2 ? { type: "bottom", waterlogged: "false" } : undefined);
}

// coping on the parapet ring
for (const [x, z] of cells) if (isBoundary(x, z)) put(x, ROOF, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

const stats = g.save(`${FILL}/way_270515793.nbt`);
console.log(`way_270515793.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries, doors ${JSON.stringify(doors)} on ${doorFace[0]}`);
