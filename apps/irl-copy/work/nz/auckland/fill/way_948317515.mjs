// A two-storey Edwardian brick commercial block (c. 1905-1920) on the Auckland ridge: shopfronts on the ground floor,
// a stepped massing (single-storey wings, a podium terrace on the street side, a two-storey core behind), a plinth,
// storey lines, a dark fascia over the shops, a parapet, and warm lamps in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317515.cells.json", "utf8"));

// the footprint: [x, z, ground, roof]; ground is 0 everywhere, so y 0 is the floor under every cell
const fp = new Map();
for (const [x, z, , r] of cells) fp.set(`${x},${z}`, r);
const inFp = (x, z) => fp.has(`${x},${z}`);

// lidar roof heights smoothed into flat tiers: wings (<=4, a 0 is noise, so it joins the wings), a podium terrace
// (5..7 on the street side, the core's first storey) and the two-storey core (5..7 behind it), with roofs at 4, 5, 8
const TOP = { W: 4, P: 5, C: 8 };
const kind = (x, z) => {
  if (fp.get(`${x},${z}`) < 5) return "W";
  return inFp(x, z - 1) ? "C" : "P";               // a cell whose north neighbour is outside is the street-side podium
};
const top = (x, z) => TOP[kind(x, z)];

// the faces of a column at height y that are exposed: outside the footprint, or next to a column that stops below y
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function exposed(x, y, z) {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz)) out.push({ dx, dz, exterior: true });
    else if (top(nx, nz) <= y) out.push({ dx, dz, exterior: false });
  }
  return out;
}

const blocks = new Map();                 // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, [block, state]);
const GROUND = [1, 2], UPPER = [5, 6];

for (const [x, z] of [...fp.keys()].map((k) => k.split(",").map(Number))) {
  const k = kind(x, z), T = TOP[k];
  put(x, 0, z, "stone_bricks");                           // plinth and ground floor slab
  for (let y = 1; y < T; y++) {
    const out = exposed(x, y, z);
    if (!out.length) {                                    // interior: floors and roof only, air between
      if (y === T - 1 || (k === "C" && y === 4)) put(x, y, z, "smooth_stone");
      continue;
    }
    const face = out.find((f) => f.exterior) ?? out[0];
    const u = face.dz !== 0 ? x : z;                      // position along the face
    const pier = u % 3 === 0;
    if (y === 3) put(x, y, z, "dark_oak_planks");         // the shop fascia / ground-storey lintel band
    else if (y === T - 1) put(x, y, z, "smooth_stone");   // roof top
    else if (k === "C" && y === 4) put(x, y, z, "smooth_stone");   // first-floor string course
    else if (GROUND.includes(y) && face.exterior && face.dz < 0) put(x, y, z, pier ? "stone_bricks" : "glass_pane", { waterlogged: "false" });   // shopfronts on the street face only
    else if (GROUND.includes(y)) put(x, y, z, "bricks");
    else if (k === "C" && UPPER.includes(y)) put(x, y, z, pier ? "white_concrete" : "glass_pane", { waterlogged: "false" });
    else put(x, y, z, "bricks");
  }
  // parapets on the exterior edge of each roof
  if (exposed(x, T, z).some((f) => f.exterior)) put(x, T, z, "stone_bricks");
}

// the entrance: a dark oak door in the north face of the first wing, facing into the shop
put(4, 1, 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(4, 2, 1, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(4, 3, 2, "lantern", { hanging: "true", waterlogged: "false" });   // a lamp inside the door

// warm lamps behind some glass: the interior cell just inside the pane
const isInterior = (x, y, z) => inFp(x, z) && !blocks.has(`${x},${y},${z}`) && exposed(x, y, z).length === 0 && y < top(x, z);
for (const [key, [block]] of [...blocks]) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const out = exposed(x, y, z).find((f) => f.exterior);
  if (!out) continue;
  const u = out.dz !== 0 ? x : z;
  const ix = x - out.dx, iz = z - out.dz;               // inward
  if (GROUND.includes(y) && u % 6 === 1 && isInterior(ix, y, iz)) put(ix, y, iz, "glowstone");
  if (UPPER.includes(y) && u % 6 === 4 && isInterior(ix, y, iz)) put(ix, y, iz, "shroomlight");
}

// roof plant on the core's roof (at height 8): two AC units and a flue
put(6, 8, 4, "iron_block");
put(8, 8, 4, "iron_block");
put(9, 8, 5, "bricks");
put(9, 9, 5, "bricks");

// a glass pane joins each neighbour that is a block (the panes and the piers and the walls around them)
const solid = (x, y, z) => blocks.has(`${x},${y},${z}`);
for (const [key, v] of blocks) {
  if (v[0] !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const t = (b) => (b ? "true" : "false");
  v[1] = { north: t(solid(x, y, z - 1)), south: t(solid(x, y, z + 1)), east: t(solid(x + 1, y, z)), west: t(solid(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([17, 20, 9]);
for (const [key, [block, state]] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317515.nbt");
console.log(`way_948317515: ${stats.blocks} blocks, ${stats.palette} palette entries`);
