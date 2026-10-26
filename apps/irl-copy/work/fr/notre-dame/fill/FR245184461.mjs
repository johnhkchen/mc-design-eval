// FR245184461: a 7 x 19 block of stone, five storeys at its two ends and a one-storey wing between them, on a
// notched plan (the east side is set back at z 10-16). Lidar roofs are snapped to storey tiers of 5 blocks (min 5); a
// roof under 3 is a courtyard or low wall (paved, with a 3-block garden wall on its edge). Walls are one block thick
// with air behind them and a stone floor slab every storey: calcite walls, polished-andesite string courses, a calcite
// lintel row and cornice, stone-brick pilasters every third block, glass panes in the window band, a deepslate-tile
// roof (flush with the cornice, no crenellated parapet), brick chimneys, and a dark-oak door on the west front. Some
// windows have glowstone in the air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184461.cells.json`, "utf8"));

const W = 7, Y = 42, D = 19;
const S = 5;                                          // storey height in blocks
const g = new Voxels([W, Y, D]);

// Massing: each footprint cell gets a height. Under 3 of lidar roof = courtyard floor (1); on the edge, a garden wall (3).
const roofOf = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inFoot = (x, z) => roofOf.has(`${x},${z}`);
const H = new Map();
for (const [key, r] of roofOf) {
  const [x, z] = key.split(",").map(Number);
  const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFoot(x + dx, z + dz));
  if (r < 3) H.set(key, edge ? 3 : 1);
  else H.set(key, Math.max(S, S * Math.round(r / S)));
}
const h = (x, z) => H.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => y >= 0 && y < h(x, z);

// Interior air: a cell whose four sides and both vertical neighbours are solid, not a floor slab, not the roof row.
// That leaves a one-block shell with an air gap inside, and the glass has air behind it.
const hollow = (x, y, z) => {
  if (h(x, z) < S || y % S === 0 || y >= h(x, z) - 1) return false;
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => solid(x + dx, y, z + dz));
};

const sides = (x, y, z) => ({
  w: !solid(x - 1, y, z), e: !solid(x + 1, y, z), n: !solid(x, y, z - 1), s: !solid(x, y, z + 1),
});

// Entrance on the west front, at the middle of the street run of the footprint's west edge.
const DOOR = [0, 9];

// Lit windows: a deterministic few, so the dusk read is even and the build is reproducible.
const lit = (x, y, z) => (x * 31 + y * 17 + z * 7) % 5 === 0;

const glass = (axis) => ({ block: "glass_pane", state: axis === "ns" ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" } });

function wallAt(x, y, z, sd) {
  const hz = h(x, z);
  if (hz === 1 || hz === 3) return { block: "stone_bricks" };             // courtyard paving and garden wall
  const ew = sd.w || sd.e;
  const u = ew ? z : x;                                                  // position along the face
  const ly = y % S;
  if (y === 0) return { block: "stone_bricks" };                           // plinth course
  if (ly === 0) return { block: "polished_andesite" };                     // storey string course
  if (ly === 4) return { block: "calcite" };                               // lintel row
  if (u % 3 === 0) return { block: "stone_bricks" };                       // pilaster between bays
  return glass(ew ? "ns" : "ew");
}

for (const [key, hz] of H) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < hz; y++) {
    if (hollow(x, y, z)) continue;
    const sd = sides(x, y, z);
    const exterior = sd.w || sd.e || sd.n || sd.s;
    const top = !solid(x, y + 1, z);
    let b;
    if (hz === 1) b = { block: "stone_bricks" };
    else if (hz === 3) b = { block: "stone_bricks" };
    else if (top) b = { block: exterior ? "calcite" : "deepslate_tiles" };        // cornice ring, else roof
    else if (exterior) b = wallAt(x, y, z, sd);
    else b = { block: "oak_planks" };                                          // floor slab inside
    g.set(x, y, z, b.block, b.state);
  }
}

// Glowstone behind some glass in the window band: the air inside the wall, on the glass's far side.
for (const [key, hz] of H) {
  if (hz < S) continue;
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < hz - 1; y++) {
    if (y % S === 0 || y % S === 4) continue;
    const sd = sides(x, y, z);
    if (!lit(x, y, z) || !sd.w && !sd.e && !sd.n && !sd.s) continue;
    // the window's pane is on the face that is exposed; its air is one step in, on the same axis
    const ew = sd.w || sd.e;
    const u = ew ? z : x;
    if (u % 3 === 0) continue;                                             // a pilaster, not a window
    const [ix, iz] = ew ? [sd.w ? 1 : -1, 0] : [0, sd.n ? 1 : -1];
    if (hollow(x + ix, y, z + iz)) g.set(x + ix, y, z + iz, "glowstone");
  }
}

// Chimneys: brick stacks on a few roof cells of the tall ends, set on the roof itself (not on a parapet).
for (const [key, hz] of H) {
  if (hz < 15) continue;
  const [x, z] = key.split(",").map(Number);
  const sd = sides(x, hz - 1, z);
  if (sd.w || sd.e || sd.n || sd.s) continue;
  if ((x + 2 * z) % 7 !== 3) continue;
  g.set(x, hz, z, "bricks");
  g.set(x, hz + 1, z, "bricks");
}

// Entrance: a dark-oak door on the west front, two blocks high, opening onto the air inside.
const [doorX, doorZ] = DOOR;
g.set(doorX, 0, doorZ, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, 1, doorZ, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

const out = `${DIR}/FR245184461.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries`);
