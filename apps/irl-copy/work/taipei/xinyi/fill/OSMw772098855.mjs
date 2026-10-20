import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw772098855";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 26 x 12, roof about 11 blocks above lowest ground.
// Reading: a two-storey low commercial block (mid-century / 1970s-80s Taipei),
// white tiled concrete frame, glass shopfront, quartz cornice, parapet, rooftop plant.
const W = 26, H = 23, D = 12;
const ROOF = 11;     // parapet top
const CORNICE = 10;  // cornice / roof slab level
const STOREY = 5;    // second-floor line

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);

const inside = (x, z) => groundOf.has(key(x, z));
const boundary = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

// Entrance centred on the street (z = 0) frontage.
const frontXs = cells.filter(([, z]) => z === 0).map(([x]) => x);
const c = frontXs.length
  ? Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2)
  : 12;

// Pass 1: foundation, ground floor, storeys, cornice, parapet.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  const bnd = boundary(x, z);

  // Ground-level floor / base course.
  g.set(x, gr, z, bnd ? "smooth_stone" : "light_gray_concrete");

  if (gr >= ROOF) continue;

  if (!bnd) {
    // Interior: floor slabs and roof slab only; air behind the glass.
    if (gr < STOREY) g.set(x, STOREY, z, "light_gray_concrete");
    g.set(x, CORNICE, z, "light_gray_concrete");
    continue;
  }

  // Boundary (facade) cell.
  // Pillar rhythm runs along the wall: x on the street and rear faces, z on the ends.
  const t = (z === 0 || z === D - 1) ? x : z;
  const pillar = t % 3 === 0;

  for (let y = gr + 1; y <= ROOF; y++) {
    let b;
    if (y === ROOF) b = "white_concrete";          // parapet
    else if (y === CORNICE) b = "quartz_block";    // cornice
    else if (y === STOREY) b = "light_gray_concrete"; // storey line
    else if (y === STOREY + 1) b = pillar ? "white_concrete" : "smooth_stone"; // upper sill
    else b = pillar ? "white_concrete" : "glass";  // window / shopfront glass
    g.set(x, y, z, b);
  }
}

// Pass 2: roof slab on interior cells (above the cornice level is parapet or air).
for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  if (!boundary(x, z)) g.set(x, CORNICE, z, "light_gray_concrete");
}

// Pass 3: entrance door and canopy on the street frontage.
for (const [x, z, gr] of cells) {
  if (z !== 0 || gr + 2 >= ROOF) continue;
  if (x === c || x === c + 1) {
    const hinge = x === c ? "left" : "right";
    g.set(x, gr + 1, z, "oak_door", {
      facing: "north", half: "lower", hinge, open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "oak_door", {
      facing: "north", half: "upper", hinge, open: "false", powered: "false",
    });
  }
}
for (let x = c - 1; x <= c + 2; x++) {
  if (!inside(x, 0)) continue;
  const gr = groundOf.get(key(x, 0));
  if (gr + 3 <= STOREY) g.set(x, gr + 3, 0, "dark_oak_planks");
}

// Pass 4: warm lanterns just behind the shopfront glass.
for (let x = 0; x < W; x++) {
  if (!inside(x, 1) || boundary(x, 1) || x % 6 !== 1) continue;
  const gr = groundOf.get(key(x, 1));
  if (gr + 2 < CORNICE) {
    g.set(x, gr + 2, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 5: rooftop plant boxes.
for (let x = 9; x <= 10; x++) {
  for (let z = 4; z <= 5; z++) {
    if (inside(x, z) && !boundary(x, z)) g.set(x, ROOF, z, "smooth_stone");
  }
}

g.save(`${dir}/${id}.nbt`);
