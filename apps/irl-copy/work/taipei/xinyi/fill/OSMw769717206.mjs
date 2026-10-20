import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw769717206";
const W = 13, H = 23, D = 17;
const ROOF = 10;   // roof slab / cornice band
const TOP = 11;    // parapet top, 11 blocks above lowest ground

const WALL = "white_concrete";
const BAND = "smooth_quartz";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOFCOL = "smooth_stone";
const GLASS = "light_blue_stained_glass_pane";
const FOUND = "stone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// footprint map: cell -> ground (clamped so every storey still fits below the roof)
const fp = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(key(x, z), Math.min(4, Math.max(0, Math.round(gr))));
}
const inFp = (x, z) => fp.has(key(x, z));
const missingSides = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFp(x + dx, z + dz)).length;

const vox = new Voxels([W, H, D]);

// 1. body: foundation, floors, roof, walls, windows
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  const miss = missingSides(x, z);
  const edge = miss > 0;
  const corner = miss >= 2;

  for (let y = 0; y < gr; y++) vox.set(x, y, z, FOUND);       // foundation up to ground
  vox.set(x, gr, z, edge ? BASE : FLOOR);                      // ground slab / plinth
  if (5 > gr) vox.set(x, 5, z, edge ? BAND : FLOOR);           // second-floor slab + string course
  vox.set(x, ROOF, z, edge ? BAND : ROOFCOL);                  // roof slab / cornice

  if (!edge) continue;

  // ground storey shopfront
  for (let y = gr + 1; y <= 4; y++) {
    if (corner) vox.set(x, y, z, BAND);
    else if (y === 4) vox.set(x, y, z, BAND);
    else if (y === gr + 1) vox.set(x, y, z, BASE);
    else vox.set(x, y, z, (x + z) % 3 === 0 ? WALL : GLASS);
  }

  // upper storey windows
  for (let y = 6; y <= 9; y++) {
    if (corner) vox.set(x, y, z, BAND);
    else if (y === 6 || y === 9) vox.set(x, y, z, WALL);
    else vox.set(x, y, z, (x + z) % 2 === 0 ? GLASS : WALL);
  }

  // parapet
  vox.set(x, TOP, z, corner ? BAND : WALL);
}

// 2. warm lanterns in the upper storey, on the floor slab behind the windows
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (missingSides(x, z) > 0 || gr > 4) continue;
  if ((x + z) % 4 === 1) {
    vox.set(x, 6, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. entrance on the street (+z) face, nearest the middle of the frontage
const front = [...fp.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !inFp(x, z + 1));
if (front.length) {
  const cx = front.reduce((s, [x]) => s + x, 0) / front.length;
  front.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  const [ex, ez] = front[0];
  const gr = fp.get(key(ex, ez));
  const base = gr + 1;
  vox.set(ex, base, ez, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  vox.set(ex, base + 1, ez, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  vox.set(ex, base + 2, ez, BAND);        // lintel over the door
  // small canopy band on the outer face of the entrance
  if (gr + 2 <= 4) vox.set(ex, base + 2, ez, BAND);
}

// 4. rooftop water tank: 3x3 with corners cut, sitting on the roof slab
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const tankCells = [];
for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) tankCells.push([cx + dx, cz + dz]);
if (tankCells.every(([x, z]) => inFp(x, z) && missingSides(x, z) === 0)) {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const corner = Math.abs(dx) === 1 && Math.abs(dz) === 1;
      if (corner) continue;
      vox.set(cx + dx, 11, cz + dz, "light_gray_concrete");
      vox.set(cx + dx, 12, cz + dz, "light_gray_concrete");
    }
  }
  for (const [x, z] of tankCells) vox.set(x, 13, z, "iron_block");
}

vox.save(`${DIR}/${ID}.nbt`);
