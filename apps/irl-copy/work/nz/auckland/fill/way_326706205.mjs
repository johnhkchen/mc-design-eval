import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 326706205, Mt Eden / Newton: a five-storey, flat-roofed commercial block of about 1930s date, stripped
// plaster and concrete over a volcanic andesite plinth, with glazed bays, a shopfront at street level, a parapet
// and roof plant. The lidar gives one roof tier (21 or 22 above y 0: one block of noise), so the roof is flat at 22
// and the 22 core is the roof plant. The ground steps 2 to 4 under it: the foundation fills to each cell's ground,
// the ground storey is clipped where the land is higher, and the storey lines stay level across the block.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326706205.cells.json";
const SAVE_TO = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326706205.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));       // [x, z, ground, roof]

const SIZE = [41, 35, 86];
const TOP = 22;                       // the roof's top face
const ROOF = TOP - 1;                 // the cornice course and the roof deck
const FLOORS = [2, 6, 10, 14, 18];    // five storeys of four rows: a sill, two glazed rows, a head
const floorOf = (y) => FLOORS.filter((F) => F <= y).pop();

const g = new Voxels(SIZE);
const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// cells from outside the footprint: 1 = facade, 2 = backing wall, 3+ = interior (air, with the floors and the roof)
const dist = new Map();
let front = [];
for (const [x, z] of cells) if (NB.some(([dx, dz]) => !has(x + dx, z + dz))) { dist.set(k2(x, z), 1); front.push([x, z]); }
for (let d = 1; front.length; d++) {
  const next = [];
  for (const [x, z] of front) for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(k2(nx, nz))) { dist.set(k2(nx, nz), d + 1); next.push([nx, nz]); }
  }
  front = next;
}
const D = (x, z) => dist.get(k2(x, z));

// the facade cells, the way each one faces, whether it is a corner, and its place along that face
const facade = cells.filter(([x, z]) => D(x, z) === 1).map(([x, z, gr]) => {
  const out = Object.keys(DIR).filter((f) => !has(x + DIR[f][0], z + DIR[f][1]));
  const face = out[0];
  return { x, z, ground: gr, face, corner: out.length > 1, along: face === "N" || face === "S" ? x : z };
});
// a column every fourth cell along each face, and at the corners (the stepped edge's cells count as corners too)
const isPier = (c) => c.corner || c.along % 4 === 0;
// a door at the middle of the ground-level run on the north and east fronts
const doors = ["N", "E"].map((f) => {
  const run = facade.filter((c) => c.face === f && !c.corner && c.ground <= 3).sort((a, b) => a.along - b.along);
  return run.length ? run[run.length >> 1] : null;
}).filter(Boolean);
const doorAt = (x, z) => doors.find((d) => d.x === x && d.z === z);

// what a facade cell holds at a row: a door (ground storey only), a glazed bay, or nothing (a pier or sill)
const bay = (c, y) => {
  const r = y - floorOf(y);
  if (!(r === 1 || r === 2) || y < c.ground) return null;
  if (doorAt(c.x, c.z)) return y <= 4 ? "door" : null;
  return isPier(c) ? null : "glass";
};
const paneState = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the glazed openings (with air behind them), so the backing wall can leave the gap
const open = new Set();
for (const c of facade) for (let y = c.ground; y < ROOF; y++) if (bay(c, y)) open.add(k3(c.x, y, c.z));

// 1. the foundation to each cell's ground, a floor slab per storey across the plan, and the roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");
  for (const F of FLOORS) if (F >= gr) g.set(x, F, z, "smooth_stone");
  g.set(x, ROOF, z, "stone");
}

// 2. the facade: andesite sills and cornice, quartz piers, glazed bays, the shopfront fascia, and the door
for (const c of facade) {
  for (let y = c.ground; y <= ROOF; y++) {
    const F = floorOf(y), r = y - F;
    if (y === ROOF || r === 0) { g.set(c.x, y, c.z, "polished_andesite"); continue; }
    if (r === 3) { g.set(c.x, y, c.z, F === 2 ? "dark_oak_planks" : "smooth_quartz"); continue; }
    const b = bay(c, y);
    if (b === "door") {
      g.set(c.x, y, c.z, "dark_oak_door", { facing: FACING[c.face], half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (b === "glass") {
      g.set(c.x, y, c.z, "light_blue_stained_glass_pane", paneState(c.face));
    } else {
      g.set(c.x, y, c.z, "smooth_quartz");
    }
  }
  g.set(c.x, TOP, c.z, "polished_andesite_slab", { type: "bottom" });    // the parapet
}

// 3. the backing wall (two cells in), with air behind each glazed bay; a lantern hangs in each doorway
for (const [x, z, gr] of cells) {
  if (D(x, z) !== 2) continue;
  for (let y = gr; y < ROOF; y++) {
    if (y - floorOf(y) === 0) continue;                                  // the slab
    if (NB.some(([dx, dz]) => open.has(k3(x + dx, y, z + dz)))) continue; // air behind the glass
    g.set(x, y, z, "smooth_quartz");
  }
}
for (const d of doors) {
  const [ox, oz] = DIR[d.face];
  g.set(d.x - ox, 5, d.z - oz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. warm light: a glowstone on the far side of about one glazed bay in four
for (const c of facade) for (let y = c.ground; y < ROOF; y++) {
  if (bay(c, y) !== "glass" || (c.x + c.z + y) % 4 !== 0) continue;
  const [ox, oz] = DIR[c.face];
  const x = c.x - 2 * ox, z = c.z - 2 * oz;
  if (has(x, z) && D(x, z) >= 3) g.set(x, y, z, "glowstone");
}

// 5. roof plant on the raised core: two plant boxes with a quartz wall and a concrete floor
const plant = [[13, 26, 34, 46], [24, 33, 10, 17]];   // x0, x1, z0, z1
for (const [x0, x1, z0, z1] of plant) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
  if (!has(x, z) || D(x, z) < 4) continue;
  const edge = x === x0 || x === x1 || z === z0 || z === z1;
  g.set(x, TOP, z, edge ? "smooth_quartz" : "light_gray_concrete");
  if (edge) g.set(x, TOP + 1, z, "smooth_quartz");
}

const { blocks, palette } = g.save(SAVE_TO);
console.log(`way_326706205: ${blocks} blocks, ${palette} palette entries`);
