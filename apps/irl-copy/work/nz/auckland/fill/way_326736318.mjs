// Two-storey brick shop block with a parapet, on a volcanic-stone plinth: the Auckland commercial type of the 1900s-1920s
// (red brick over Auckland bluestone, timber stallboards, a shopfront at street level, sash-like window grids above).
// Lidar: ground 0 under every cell; roof 9-10, mode 10 (the 9s are the west-edge noise), so the parapet top is y=10.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const name = "way_326736318";
const cells = JSON.parse(readFileSync(join(here, `${name}.cells.json`), "utf8"));

const W = 10, H = 23, D = 29;
const TOP = 10;                                    // flat parapet top: the lidar roof's mode, the 9s smoothed up

const g = new Voxels([W, H, D]);
const F = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => F.has(`${x},${z}`);
const FACE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// the outward face of an edge cell (z-facing first, so corners take the street face); bay = position along that face
const edgeOf = (x, z) => {
  const outs = Object.keys(FACE).filter((k) => !inF(x + FACE[k][0], z + FACE[k][1]));
  if (!outs.length) return null;
  const face = outs.find((k) => k === "north" || k === "south") ?? outs[0];
  return { face, bay: face === "north" || face === "south" ? x : z };
};

const DOOR = { x: 7, z: 0 };                       // the middle bay of the north street face
const panes = [];

for (const [x, z, ground, roof] of cells) {
  // foundation up to the lidar ground (0 here: nothing to fill)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  const e = edgeOf(x, z);

  // y0 plinth (edge) / floor, y4 string course (edge) / upper floor, y8 cornice (edge) / flat roof deck
  g.set(x, 0, z, e ? "polished_andesite" : "stone_bricks");
  g.set(x, 4, z, e ? "stone_bricks" : "spruce_planks");
  g.set(x, 8, z, e ? "chiseled_stone_bricks" : "smooth_stone");
  if (!e) continue;

  const pier = e.bay % 3 === 0;
  const dx = FACE[e.face][0], dz = FACE[e.face][1];

  if (x === DOOR.x && z === DOOR.z) {
    // entrance: a door in the middle bay, a timber lintel above it
    g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "dark_oak_planks");
  } else if (pier) {
    // ground floor: brick piers framing the shopfront
    for (let y = 1; y <= 3; y++) g.set(x, y, z, "bricks");
    if (x === DOOR.x - 1 && z === DOOR.z) g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    // shopfront: timber stallboard, then glazing to the string course
    g.set(x, 1, z, "dark_oak_planks");
    g.set(x, 2, z, "glass_pane"); g.set(x, 3, z, "glass_pane");
    panes.push([x, 2, z], [x, 3, z]);
  }

  // upper floor: brick piers, and a window grid of two glazed rows under a brick lintel
  if (pier) {
    for (let y = 5; y <= 7; y++) g.set(x, y, z, "bricks");
  } else {
    g.set(x, 5, z, "glass_pane"); g.set(x, 6, z, "glass_pane"); g.set(x, 7, z, "bricks");
    panes.push([x, 5, z], [x, 6, z]);
    // a warm light just inside, on the floor: shopfront bays, and fewer upstairs so they don't read as stray blocks
    const ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && !edgeOf(ix, iz)) {
      if (e.bay % 6 === 1) g.set(ix, 1, iz, "glowstone");
      if (e.bay % 12 === 1) g.set(ix, 5, iz, "glowstone");
    }
  }

  // parapet on the roof line (the flat top at TOP)
  for (let y = 9; y < TOP; y++) g.set(x, y, z, "bricks");
}

// glass panes connect to their neighbours in the wall, as vanilla does: a pane joins any non-air block beside it
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  const st = {};
  for (const [k, [dx, dz]] of Object.entries(FACE)) st[k] = String(solid(x + dx, y, z + dz));
  g.set(x, y, z, "glass_pane", st);
}

// roof plant: a 2x2 air-handling unit on the flat roof, on interior cells away from the parapet
const interior = (x, z) => inF(x, z) && !edgeOf(x, z);
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let best = null;
for (const [x, z] of cells) {
  if (![[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => interior(a, b))) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  g.set(best.x + a, 9, best.z + b, "iron_block");
  g.set(best.x + a, 10, best.z + b, "iron_block");
}

g.save(join(here, `${name}.nbt`));
console.log(`built ${name}: ${g.count()} blocks, top y=${TOP}, ${panes.length} panes`);
