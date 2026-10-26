// DC75508: a brick Federal-revival commercial block with calcite (limestone-look) trim, two storeys over a stone plinth,
// a stepped north pavilion, a lower wing on the east side and a rooftop HVAC box. Built from the lidar cells: the roof
// heights are smoothed into flat tiers (the noisy single-cell spikes are levelled to their row), and each storey stands
// on the one below, all columns solid from y 0 up to their roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75508.cells.json`, "utf8"));   // [x, z, ground, roof]

// lidar noise: single cells that sit a block off their neighbours are levelled to the tier they belong to
const LEVEL = { "6,0": 6, "7,0": 6, "6,1": 6, "7,1": 6, "7,2": 6, "1,3": 6, "6,4": 6 };
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(`${x},${z}`, g); roof.set(`${x},${z}`, LEVEL[`${x},${z}`] ?? r); }

const W = 9, H = 20, D = 6;
const at = (x, z) => ground.has(`${x},${z}`);
const top = (x, z) => roof.get(`${x},${z}`);

// pass 1: the solid massing; every column from the lowest ground to its roof, no gaps
const blk = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => blk.set(key(x, y, z), { block, state });
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!at(x, z)) continue;
  const R = top(x, z), G = ground.get(`${x},${z}`);
  for (let y = 0; y < R; y++) {
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }          // foundation to ground (no-op: ground is 0 here)
    if (y === 0) put(x, y, z, "stone_bricks");                       // plinth / base course
    else if (y === R - 1 || y === 3) put(x, y, z, "calcite");         // cornice and the storey string course
    else put(x, y, z, "bricks");
  }
}

// pass 2: articulation on the exposed faces. Bays alternate pier / window along each face; the glass has an air gap
// behind it (the pocket), a warm light sits in some pockets, and the entrance is a pair of doors in the south bay.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposedFaces = (x, y, z) => DIRS.filter(([dx, dz]) => !blk.has(key(x + dx, y, z + dz)));
const windowRow = (y, R) => y === 1 || y === 2 || (y >= 4 && y <= R - 2);
const LAMPS = {                                                       // pocket cell -> warm light behind the glass
  "3,1,4": { block: "lantern", state: { hanging: "false", waterlogged: "false" } },
  "7,1,4": { block: "lantern", state: { hanging: "false", waterlogged: "false" } },
  "1,4,4": { block: "glowstone" },
  "5,4,4": { block: "shroomlight" },
};
const pockets = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!at(x, z)) continue;
  const R = top(x, z);
  for (let y = 1; y < R - 1; y++) {
    if (y === 3) continue;                                            // string course stays solid
    const faces = exposedFaces(x, y, z);
    if (faces.length !== 1) continue;                                 // corners and tops stay piers
    const [dx, dz] = faces[0];
    const along = dz !== 0 ? x : z;
    if (dz === 1 && x === 4 && (y === 1 || y === 2)) {                // the entrance, centre of the south front
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      pockets.push([x - dx, y, z - dz]);
      continue;
    }
    if (!windowRow(y, R) || along % 2 === 0) continue;                // piers on even bays
    put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    pockets.push([x - dx, y, z - dz]);
  }
}
for (const [x, y, z] of pockets) if (blk.has(key(x, y, z))) blk.delete(key(x, y, z));
// a lamp only goes into a pocket the pass above left as air
for (const [k, lamp] of Object.entries(LAMPS)) {
  const [x, y, z] = k.split(",").map(Number);
  if (!blk.has(key(x, y, z)) && at(x, z) && y < top(x, z) - 1) put(x, y, z, lamp.block, lamp.state);
}

// pass 2b: a coping slab along each roof edge, so the cornice reads as a parapet line rather than a flat top
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!at(x, z)) continue;
  const R = top(x, z);
  if (exposedFaces(x, R - 1, z).length) put(x, R, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// pass 3: rooftop HVAC on the main roof, a box with a slab lid, each standing on the cell below
for (const x of [2, 3]) {
  put(x, 6, 3, "stone_bricks");
  put(x, 7, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// pass 4: glass panes connect to whatever is beside them (a solid wall, a lamp, another pane), not to air
for (const [k, v] of blk) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (dx, dz) => (blk.has(key(x + dx, y, z + dz)) ? "true" : "false");
  v.state = { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, v] of blk) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(`${DIR}/DC75508.nbt`);
console.log(`DC75508: ${out.blocks} blocks, ${out.palette} palette entries`);
