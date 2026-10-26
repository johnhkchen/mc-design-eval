import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60206.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60206.nbt";

const W = 18, H = 29, D = 10;
const g = new Voxels([W, H, D]);

// Palette: 1960s-70s Washington office block; brick infill, stone piers and bands, glazed bays
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const BRICK = "bricks";
const PIER = "stone_bricks";
const BELT = "smooth_sandstone";
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";
const ROOF = "smooth_stone";
const PENT = "stone_bricks";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const k = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr, rf] of raw) fp.set(k(x, z), { g: Math.round(gr), r: Math.round(rf) });
const has = (x, z) => fp.has(k(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street face = lowest-z exposed row; entrance centred on it
let doorCell = null;
{
  let minZ = Infinity;
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1) && z < minZ) minZ = z;
  }
  let best = Infinity;
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!has(x, z - 1) && z === minZ) {
      const d = Math.abs(x - (W / 2 - 0.5));
      if (d < best) { best = d; doorCell = { x, z }; }
    }
  }
}

const exposure = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});

// Pass 1: shell, foundation, floors, facade
for (const [key, { g: gr, r }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposure(x, z);
  const perim = ex.N || ex.S || ex.W || ex.E;
  const top = Math.max(r - 1, gr + 3); // cornice / roof slab course

  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  if (!perim) {
    put(x, gr, z, FLOOR);
    for (let b = gr + 4; b < top; b += 3) put(x, b, z, FLOOR);
    put(x, top, z, ROOF);
    continue;
  }

  const idx = (ex.N || ex.S) ? x : z;
  const corner = (ex.N || ex.S) && (ex.W || ex.E);
  const pier = corner || idx % 3 === 0;

  // Base course
  put(x, gr, z, BASE);
  // Ground storey: glazed shopfront bays between stone piers
  put(x, gr + 1, z, pier ? PIER : GLASS);
  put(x, gr + 2, z, pier ? PIER : GLASS);
  put(x, gr + 3, z, BELT);

  // Upper storeys: 3-course bays, belt at the head of each storey
  for (let y = gr + 4; y < top; y++) {
    const rel = (y - (gr + 4)) % 3;
    if (rel === 0) put(x, y, z, BELT);
    else put(x, y, z, pier ? PIER : GLASS);
  }
  // Infill brick where a bay is solid (ground storey walls between piers are glazed above)
  // Piers keep stone; non-pier upper storeys already glazed; brick fills the ground-storey base
  // and any remaining perimeter course to give the wall its mass.
  if (!pier) {
    for (let y = gr; y < gr + 1; y++) put(x, y, z, BRICK);
  }

  // Cornice cap
  put(x, top, z, BELT);
  // Parapet pilasters rise one course over the cornice on pier cells
  if (pier && !corner) put(x, top + 1, z, PIER);
  if (corner) put(x, top + 1, z, PIER);
}

// Pass 2: warm lights, entrance, rooftop penthouse
for (const [key, { g: gr, r }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposure(x, z);
  const perim = ex.N || ex.S || ex.W || ex.E;
  const top = Math.max(r - 1, gr + 3);

  if (perim) {
    const idx = (ex.N || ex.S) ? x : z;
    const corner = (ex.N || ex.S) && (ex.W || ex.E);
    const pier = corner || idx % 3 === 0;
    if (!pier && idx % 2 === 0) {
      let ix = x, iz = z;
      if (ex.N) iz = z + 1;
      else if (ex.S) iz = z - 1;
      else if (ex.W) ix = x + 1;
      else if (ex.E) ix = x - 1;
      if (has(ix, iz)) {
        const ly = gr + 5;
        if (ly >= gr + 4 && ly < top) put(ix, ly, iz, "glowstone");
      }
    }
  } else {
    // Rooftop penthouse on the central interior roof cells, sitting on the roof slab
    if (x >= 6 && x <= 11 && z >= 3 && z <= 6) {
      put(x, top + 1, z, PENT);
      put(x, top + 2, z, GLASS);
    }
  }
}

// Entrance: recessed surround, pilasters, door, lantern
if (doorCell) {
  const { x, z } = doorCell;
  const gr = fp.get(k(x, z)).g;
  const facing = "north";
  put(x, gr, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  for (const dx of [-1, 1]) {
    if (has(x + dx, z)) {
      put(x + dx, gr + 1, z, BASE);
      put(x + dx, gr + 2, z, BASE);
    }
  }
}

g.save(OUT);
