// Nova En Scotia (way 162652037): an 11-storey concrete-frame office block of the 1980s on Eden Terrace's slope.
// The lidar gives a flat roof 51 above y 0 under nearly every cell (the few low edge returns are noise), so the massing
// is one prism on the footprint: no setbacks, no lower wings. A rooftop plant screen sits 4 in from the edge.
// Storey lines are global (every 4 blocks, a 6-block ground floor), so the floors line up across the slope. A cell's
// plinth fills up to its own ground, and the base course, shopfront and first floor step with it.
// Facade: white precast piers, light-grey spandrels, blue-glass ribbon panes, a lit office or two behind the glass.
// No interiors: the walls are one block thick with an air gap behind the glass, and each storey has a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162652037.cells.json`, "utf8"));

const ROOF = 50;                                                    // top block layer; the roof surface is y 51
const LINES = [6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50];      // global storey lines, 4 apart
const DOOR_X = 14;                                                  // entrance nearest the footprint's middle on a south-facing wall

const at = new Map(cells.map(([x, z, g, roof]) => [`${x},${z}`, { x, z, g, roof }]));
const cellAt = (x, z) => at.get(`${x},${z}`);
const DIRS = [["E", 1, 0], ["W", -1, 0], ["S", 0, 1], ["N", 0, -1]];
const INWARD = { E: [-1, 0], W: [1, 0], S: [0, -1], N: [0, 1] };     // the step from an outer wall cell into the air gap
const FACING = { E: "west", W: "east", S: "north", N: "south" };      // a door faces the way its player stood to place it

// Outer wall cells (a neighbour outside the footprint) and each cell's depth in from the edge
for (const c of at.values()) {
  c.out = DIRS.filter(([, dx, dz]) => !cellAt(c.x + dx, c.z + dz)).map(([n]) => n);
  c.perim = c.out.length > 0;
}
const queue = [];
for (const c of at.values()) if (c.perim) { c.dist = 0; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [, dx, dz] of DIRS) { const n = cellAt(c.x + dx, c.z + dz); if (n && n.dist === undefined) { n.dist = c.dist + 1; queue.push(n); } }
}

const slabsOf = (g) => [g, ...LINES.filter((L) => L - g >= 4)];     // the ground slab, then each storey line clear of it
const bounds = (slabs, r) => {
  let a = -1, b = Infinity;
  for (const s of slabs) { if (s < r && s > a) a = s; if (s > r && s < b) b = s; }
  return { a, b };
};

// The entrance: the south-facing outer cell nearest the middle of the front
const doorCell = [...at.values()].filter((c) => c.out.includes("S"))
  .sort((p, q) => Math.abs(p.x - DOOR_X) - Math.abs(q.x - DOOR_X) || q.z - p.z)[0];

const v = new Voxels([30, 63, 25]);

for (const c of at.values()) {
  const { x, z, g } = c, slabs = slabsOf(g);

  // foundation up to the cell's own ground
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");

  // floor slabs: a string course on the outer wall, the roof's cornice on top, solid inside
  for (const s of slabs) v.set(x, s, z, c.perim ? (s === ROOF ? "white_concrete" : "light_gray_concrete") : "smooth_stone");

  if (!c.perim) continue;   // interior: slabs only, with the air gap above them

  const pierIdx = c.out.includes("N") || c.out.includes("S") ? x : z;   // piers every 3 along a face
  const pier = pierIdx % 3 === 0;

  for (let r = g + 1; r < ROOF; r++) {
    if (slabs.includes(r)) continue;
    const { a, b } = bounds(slabs, r), k = r - a, top = b - a - 1, ground = a === g;
    let block;
    if (ground && k === 1) block = "polished_andesite";                 // base course
    else if (ground && k === top) block = "white_concrete";             // shopfront header
    else if (!ground && k === 1) block = "light_gray_concrete";         // spandrel
    else if (pier) block = "white_concrete";
    else block = "light_blue_stained_glass_pane";
    v.set(x, r, z, block);
  }

  // the parapet
  v.set(x, 51, z, "white_concrete");
}

// Entrance: iron door on the south face, a hanging lantern beside it under the header
{
  const c = doorCell, g = c.g;
  const facing = FACING.S;
  v.set(c.x, g + 1, c.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(c.x, g + 2, c.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const side = cellAt(c.x + 1, c.z);
  if (side?.perim) v.set(side.x, g + 2, side.z, "lantern", { hanging: "true" });
}

// Warm lights: one office in five on the upper floors, a lantern hung from the slab above, behind the top pane row
for (const c of at.values()) {
  if (!c.perim) continue;
  const slabs = slabsOf(c.g);
  const pierIdx = c.out.includes("N") || c.out.includes("S") ? c.x : c.z;
  if (pierIdx % 3 === 0) continue;
  for (let r = c.g + 1; r < ROOF; r++) {
    if (slabs.includes(r)) continue;
    const { a, b } = bounds(slabs, r);
    if (a === c.g || r - a !== 3 || b - a !== 4) continue;     // upper storeys, the top pane row, sitting under a slab
    if ((c.x * 5 + c.z * 3 + a) % 5 !== 0) continue;
    const [dx, dz] = INWARD[c.out[0]];
    const inner = cellAt(c.x + dx, c.z + dz);
    if (!inner || inner.perim) continue;
    v.set(inner.x, r, inner.z, "lantern", { hanging: "true" });
  }
}

// Plant screen on the roof, 4 in from the edge: louvred walls, a solid plant floor, and a few lanterns on top
for (const c of at.values()) {
  if (c.dist === undefined || c.dist < 4) continue;
  const { x, z } = c;
  if (c.dist === 4) {
    v.set(x, 51, z, "light_gray_concrete");
    v.set(x, 52, z, "light_gray_concrete");
    const louvre = (x + z) % 2 === 0;
    v.set(x, 53, z, louvre ? "light_gray_concrete" : "iron_bars");
    if (louvre && (x * 3 + z) % 11 === 0) v.set(x, 54, z, "lantern", { hanging: "false" });
  } else {
    v.set(x, 51, z, "smooth_stone");
  }
}

const out = `${DIR}/way_162652037.nbt`;
const stats = v.save(out);
console.log(`way_162652037: ${stats.blocks} blocks, ${stats.palette} palette entries, door at x ${doorCell.x} z ${doorCell.z}`);
