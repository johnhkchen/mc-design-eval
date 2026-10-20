import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376809.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541376809.nbt";

// Two-storey commercial/office block, mid-1990s Taipei: white tiled/concrete
// facade, polished granite base and pillars, glass bays, quartz cornice band,
// parapet and a rooftop plant room.
const W = 15, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const minG = Math.min(...raw.map(c => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.round(gr) - minG);
}

const inFP = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];
const exteriorFaces = (x, z) => DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz));

const cellList = raw.map(([x, z]) => [x, z]);

// Pass 1: foundation, floor slabs, storey band, cornice, parapet, facades.
for (const [x, z] of cellList) {
  const B = G(x, z);
  const fc = exteriorFaces(x, z);
  const edge = fc.length > 0;
  const corner = fc.length >= 2;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");
  // Ground floor slab
  g.set(x, B, z, "smooth_stone");
  // Storey line at the first floor level
  g.set(x, B + 5, z, edge ? "smooth_quartz" : "light_gray_concrete");
  // Roof slab / cornice band
  g.set(x, B + 10, z, edge ? "smooth_quartz" : "light_gray_concrete");
  // Parapet
  if (edge) g.set(x, B + 11, z, "white_concrete");

  if (!edge) continue;

  if (corner) {
    // Pillars at the corners
    for (let y = B + 1; y <= B + 4; y++) g.set(x, y, z, "polished_granite");
    for (let y = B + 6; y <= B + 9; y++) g.set(x, y, z, "white_concrete");
    continue;
  }

  const [dx, dz] = fc[0];
  const a = dx !== 0 ? z : x; // position along the facade
  const [ix, iz] = [x - dx, z - dz]; // interior neighbour

  // Ground floor: granite base course, shopfront glass bays with granite mullions
  g.set(x, B + 1, z, "polished_granite");
  for (let y = B + 2; y <= B + 4; y++) {
    g.set(x, y, z, a % 3 === 0 ? "polished_granite" : "glass_pane");
  }

  // Upper floor: light spandrels top and bottom, glass bays, white mullions
  g.set(x, B + 6, z, "light_gray_concrete");
  g.set(x, B + 9, z, "light_gray_concrete");
  for (let y = B + 7; y <= B + 8; y++) {
    g.set(x, y, z, a % 3 === 0 ? "white_concrete" : "glass_pane");
  }

  // Warm lights behind some upper windows
  if (a % 3 !== 0 && a % 4 === 1 && inFP(ix, iz)) {
    g.set(ix, B + 7, iz, "glowstone");
  }
}

// Pass 2: entrance on the north face (z = 0), nearest to the middle.
{
  const mid = Math.floor(W / 2);
  let best = null;
  for (const [x, z] of cellList) {
    if (z !== 0 && inFP(x, z - 1)) continue;
    const fc = exteriorFaces(x, z);
    if (!fc.some(([dx, dz]) => dz === -1)) continue;
    if (fc.length >= 2) continue;
    if (best === null || Math.abs(x - mid) < Math.abs(best - mid)) best = x;
  }
  if (best !== null) {
    const B = G(best, 0);
    g.set(best, B + 1, 0, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(best, B + 2, 0, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(best, B + 3, 0, "glass_pane");
    g.set(best, B + 4, 0, "lantern", { hanging: "true" });
  }
}

// Pass 3: rooftop plant room, set back from the parapet.
{
  const mx = Math.floor(W / 2), mz = Math.floor(D / 2);
  for (let x = mx - 3; x <= mx + 3; x++) {
    for (let z = mz - 4; z <= mz + 4; z++) {
      if (!inFP(x, z)) continue;
      if (exteriorFaces(x, z).length > 0) continue;
      const B = G(x, z);
      if (B + 13 >= H) continue;
      g.set(x, B + 11, z, "light_gray_concrete");
      g.set(x, B + 12, z, "light_gray_concrete");
      g.set(x, B + 13, z, "smooth_stone");
    }
  }
}

g.save(OUT);
