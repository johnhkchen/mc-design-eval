import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 20 x 17, roof ~11 blocks above lowest ground.
// Reading: two storeys of about 5 blocks each plus a parapet, so a low-rise
// commercial block of the 1970s to 1990s in Taipei's Xinyi district. Light
// concrete and white tile facade, glazed shopfronts at street level, a
// stone plinth, a centred dark-oak entrance on the south (street) face, and
// a small mechanical penthouse on the flat roof. Warm glowstone sits behind
// some panes so the building reads at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298923";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Normalise ground so the lowest footprint ground is y 0.
const gmin = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - gmin);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

// Safe setter: stays in bounds and only writes footprint cells when asked.
const S = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Outward face of a perimeter cell (north first, so corners pick north/south).
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

const GLASS = { north: "true", east: "true", south: "true", west: "true", waterlogged: "false" };

// Storey levels (absolute, lowest ground = 0):
//  y 0..G       stone foundation under each cell
//  y 1..4       ground storey (plinth y1, glazed shopfront y2-3, transom y4)
//  y 5          floor slab (light concrete)
//  y 6..9       upper storey (spandrel y6, glazing y7-8, head y9)
//  y 10         roof slab / cornice
//  y 11         parapet

// Pass 1: foundations, slabs and roof for every footprint cell.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = gr(x, z);
  const perim = outward(x, z) !== null;

  for (let y = 0; y <= G; y++) S(x, y, z, "stone_bricks");

  if (5 > G) S(x, 5, z, "light_gray_concrete");

  if (G < 10) {
    S(x, 10, z, perim ? "stone_bricks" : "gray_concrete");
  }
}

// Pass 2: perimeter walls, shopfronts, upper glazing and the parapet.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = gr(x, z);
  const face = outward(x, z);
  if (!face) continue;
  const i = face === "north" || face === "south" ? x : z;

  // Ground storey
  for (let y = G + 1; y <= 4; y++) {
    if (y === 1) S(x, y, z, "polished_andesite");
    else if (y === 4) S(x, y, z, "white_concrete");
    else if (i % 4 === 0) S(x, y, z, "white_concrete");
    else if (i % 8 === 5 && y === 3) S(x, y, z, "glowstone");
    else S(x, y, z, "glass_pane", GLASS);
  }

  // Floor slab line
  if (5 > G) S(x, 5, z, "light_gray_concrete");

  // Upper storey
  for (let y = Math.max(G + 1, 6); y <= 9; y++) {
    if (y === 6 || y === 9) S(x, y, z, "white_concrete");
    else if (i % 3 === 0) S(x, y, z, "white_concrete");
    else if (i % 6 === 4 && y === 8) S(x, y, z, "glowstone");
    else S(x, y, z, "glass_pane", GLASS);
  }

  // Parapet with alternating quartz caps
  if (G < 10) {
    S(x, 11, z, i % 2 === 0 ? "smooth_quartz" : "white_concrete");
  }
}

// Pass 3: centred entrance on the south face.
const south = cells
  .map((c) => [c[0], c[1]])
  .filter(([x, z]) => outward(x, z) === "south");
if (south.length) {
  const cx = south.reduce((s, [x]) => s + x, 0) / south.length;
  const [dx, dz] = south.reduce((best, c) =>
    Math.abs(c[0] - cx) < Math.abs(best[0] - cx) ? c : best);
  const G = gr(dx, dz);
  S(dx, G + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(dx, G + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(dx, G + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass 4: roof penthouse for mechanical plant, centred on the roof.
const PX0 = 6, PX1 = 12, PZ0 = 5, PZ1 = 10;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z) || gr(x, z) >= 10) continue;
    const edgeX = x === PX0 || x === PX1;
    const edgeZ = z === PZ0 || z === PZ1;
    const perimP = edgeX || edgeZ;
    const corner = edgeX && edgeZ;
    for (let y = 11; y <= 13; y++) {
      if (!perimP) continue; // interior air
      if (corner) S(x, y, z, "white_concrete");
      else if (y === 12 && (x - PX0) % 3 !== 0 && z !== PZ1) S(x, y, z, "glass_pane", GLASS);
      else S(x, y, z, "white_concrete");
    }
    S(x, 14, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
