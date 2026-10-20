import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681366.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681366.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 19, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Materials: a two-storey mid-century Taipei commercial block, pale tiled
// wall, dark-framed tinted glazing on a stone base, parapet roof.
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const WALL = "white_concrete";
const PILLAR = "smooth_quartz";
const BAND = "polished_andesite";
const CORNICE = "smooth_stone";
const PARAPET = "smooth_quartz";
const ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const TANK = "smooth_stone";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces: dz/dx = outward normal; facing = direction a player would face to enter.
const FACES = [
  { dx: 0, dz: -1, facing: "south" },
  { dx: 0, dz: 1, facing: "north" },
  { dx: -1, dz: 0, facing: "east" },
  { dx: 1, dz: 0, facing: "west" },
];

// Pass 1: foundations, floor slabs, roof, parapet, storey lines.
for (const [x, z, gg] of cells) {
  const gr = Math.min(11, Math.max(0, gg));
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Ground-level slab (base course on the perimeter).
  put(x, gr + 0, z, perim ? BASE : FLOOR);
  // Upper floor slab / storey line.
  put(x, gr + 5, z, perim ? BAND : FLOOR);
  // Roof slab and cornice.
  put(x, gr + 10, z, perim ? CORNICE : ROOF);
  if (perim) put(x, gr + 11, z, PARAPET);
}

// Pass 2: perimeter walls with window grids.
for (const [x, z, gg] of cells) {
  if (!isPerim(x, z)) continue;
  const gr = Math.min(11, Math.max(0, gg));

  for (const f of FACES) {
    if (has(x + f.dx, z + f.dz)) continue;
    const u = f.dz !== 0 ? x : z;
    const pillar = u % 3 === 0;
    const paneProps = f.dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let rel = 1; rel <= 10; rel++) {
      const y = gr + rel;
      if (rel === 2 || rel === 3 || rel === 7 || rel === 8) {
        if (pillar) put(x, y, z, PILLAR);
        else put(x, y, z, GLASS, paneProps);
      } else if (rel === 1 || rel === 4 || rel === 5 || rel === 6 || rel === 9) {
        put(x, y, z, BAND);
      } else if (rel === 10) {
        put(x, y, z, CORNICE);
      }
    }
    // Parapet already set in pass 1; re-assert for corners.
    put(x, gr + 11, z, PARAPET);
  }
}

// Pass 3: ground-floor entrance on the middle of the north-facing (outward -z) street frontage.
let doorCell = null;
{
  const northFront = cells
    .filter(([x, z]) => isPerim(x, z) && !has(x, z - 1))
    .sort((a, b) => a[0] - b[0]);
  const pool = northFront.length ? northFront : cells.filter(([x, z]) => isPerim(x, z));
  if (pool.length) doorCell = pool[Math.floor(pool.length / 2)];
}
if (doorCell) {
  const [x, z, gg] = doorCell;
  const gr = Math.min(11, Math.max(0, gg));
  // Outward normal: pick the exposed face (prefer north)
  let face = FACES.find((f) => !has(x + f.dx, z + f.dz)) || FACES[0];
  for (const f of FACES) if (!has(x + f.dx, z + f.dz) && f.dz === -1) face = f;
  const doorProps = (half) => ({
    facing: face.facing,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(x, gr + 1, z, "dark_oak_door", doorProps("lower"));
  put(x, gr + 2, z, "dark_oak_door", doorProps("upper"));
  put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: warm lights behind glass in interior cells beside the facade, and rooftop tanks.
for (const [x, z, gg] of cells) {
  const gr = Math.min(11, Math.max(0, gg));
  if (isPerim(x, z)) continue;
  const nearPerim =
    isPerim(x + 1, z) && has(x + 1, z) || isPerim(x - 1, z) && has(x - 1, z) ||
    isPerim(x, z + 1) && has(x, z + 1) || isPerim(x, z - 1) && has(x, z - 1);
  if (nearPerim && (x + z) % 3 === 1) {
    put(x, gr + 2, z, "shroomlight");
    put(x, gr + 7, z, "shroomlight");
  }
  if (x % 5 === 2 && z % 5 === 2) {
    put(x, gr + 11, z, TANK);
    put(x, gr + 12, z, TANK);
  }
}

g.save(OUT);
