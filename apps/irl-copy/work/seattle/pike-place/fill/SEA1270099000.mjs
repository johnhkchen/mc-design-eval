// PIER 59 SEATTLE AQUARIUM (1977, Alaskan Way). One low storey on a pier that drops to the bay: a concrete
// base course, a band of teal glass between gray concrete piers, a cornice and a flat roof with a parapet.
// Roof sits at y 7 (the lidar height above the lowest ground); each cell's foundation is filled up to its ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270099000.cells.json`, "utf8"));
const W = 14, H = 19, ROOF = 7;

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const perimeter = new Set(cells.filter(([x, z]) => exposed(x, z).length).map(([x, z]) => `${x},${z}`));

const g = new Voxels([W, H, W]);

// Foundation, floor slab, roof: every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");
  const edge = perimeter.has(`${x},${z}`);
  g.set(x, ROOF, z, edge ? "smooth_stone_slab" : "light_gray_concrete", edge ? { type: "bottom" } : undefined);
}

// Entrance: the north face cell with the highest ground (the landward side), with its two neighbours along the face.
const northOnly = cells.filter(([x, z]) => exposed(x, z).join() === "N");
const [ex0, ez0, eg] = northOnly.reduce((a, b) => (b[2] > a[2] || (b[2] === a[2] && b[1] < a[1]) ? b : a));
const entranceU = new Set([ex0 - 1, ex0, ex0 + 1]);
const isEntranceCell = (x, z) => z === ez0 && entranceU.has(x) && perimeter.has(`${x},${z}`) && exposed(x, z).join() === "N";

// Walls: perimeter cells only, from the floor up to the cornice. Interior stays air (no rooms).
for (const [x, z, gr] of cells) {
  if (!perimeter.has(`${x},${z}`)) continue;
  const ex = exposed(x, z);
  const corner = ex.length > 1;
  const face = ex[0];
  const u = face === "N" || face === "S" ? x : z;       // position along the face
  for (let y = gr + 1; y < ROOF; y++) {
    const h = y - gr;
    let b = "white_concrete", s;
    if (isEntranceCell(x, z)) {
      if (x === ex0) {
        if (h <= 2) { b = "dark_oak_door"; s = { facing: "north", half: h === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
        else if (h === 3) b = "stone_brick_slab", s = { type: "bottom" };
        else if (h === 4) b = "lantern", s = { hanging: "true", waterlogged: "false" };
        else b = "polished_andesite";
      } else if (h <= 2) b = "light_blue_stained_glass";
      else if (h === 3) b = "stone_brick_slab", s = { type: "bottom" };
      else b = h === 5 ? "light_gray_concrete" : "polished_andesite";
    } else if (h === 1) b = "polished_andesite";
    else if (h === 5) b = "light_gray_concrete";
    else if (h === 6) b = "polished_andesite";
    else if (corner || u % 3 === 0) b = "white_concrete";         // piers (and corners)
    else b = "light_blue_stained_glass_pane";                      // window band, h 2..4
    g.set(x, y, z, b, s);
  }
}

// Warm light behind some windows: a shroomlight in the interior air cell just inside, at the middle of the band.
for (const [x, z, gr] of cells) {
  if (!perimeter.has(`${x},${z}`) || corner(x, z)) continue;
  const [face] = exposed(x, z);
  const u = face === "N" || face === "S" ? x : z;
  if (u % 6 !== 1 || isEntranceCell(x, z)) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || perimeter.has(`${ix},${iz}`)) continue;
  g.set(ix, gr + 3, iz, "shroomlight");
}
function corner(x, z) { return exposed(x, z).length > 1; }

// Roof plant: a 2x2 oxidised-copper mechanical box on the interior roof where the deck is solid.
for (const [x, z] of [[5, 5], [6, 5], [5, 6], [6, 6]]) {
  if (!inside(x, z) || perimeter.has(`${x},${z}`)) continue;
  g.set(x, ROOF + 1, z, "oxidized_copper");
}

// Panes join neighbouring panes and solid blocks, as they do in game.
for (const [x, z, gr] of cells) {
  for (let y = gr + 1; y < ROOF; y++) {
    if (g.get(x, y, z)?.block !== "minecraft:light_blue_stained_glass_pane") continue;
    const state = {};
    for (const [d, [dx, dz]] of Object.entries(DIRS)) {
      const n = g.get(x + dx, y, z + dz);
      state[{ N: "north", S: "south", E: "east", W: "west" }[d]] = n ? "true" : "false";
    }
    g.set(x, y, z, "light_blue_stained_glass_pane", { ...state, waterlogged: "false" });
  }
}

const out = `${DIR}/SEA1270099000.nbt`;
console.log(g.save(out));
