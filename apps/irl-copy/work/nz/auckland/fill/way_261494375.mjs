// Footprint way 261494375, Mt Eden / Newton edge of the CBD: a three-storey interwar brick-and-plaster commercial block
// (red brick shopfront piers and plaster upper storeys, sash-style glazing with dark frames, a quartz cornice and
// pinnacled parapet, a lower wing on the NW corner, a lidar-snapped roof and two rooftop plant boxes).
// Lidar roof heights snap to three flat tiers: 12 (the parapet line), 8 and 6 (lower wings). Storey lines sit at
// absolute heights 4 and 8, so every window row and floor stands on the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_261494375.cells.json`, "utf8"));

const W = 24, D = 20, H = 14;
const key = (x, z) => `${x},${z}`;

// lidar roof (above y 0) to a flat tier: 0 is no return (take the full height); 10+ is the parapet; 7-9 a setback;
// lower returns are a one-storey wing standing on its own ground
const snapTop = (r, g) => (r <= 0 || r >= 10 ? 12 : r >= 7 ? 8 : Math.max(g + 4, 6));

const F = new Map();
for (const [x, z, g, r] of cells) F.set(key(x, z), { g, T: snapTop(r, g) });
const inF = (x, z) => F.has(key(x, z));

// the face a cell looks out of (the first footprint edge with nothing beside it), or null for an interior cell
const FACES = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const outward = (x, z) => FACES.find((f) => !inF(x + f.dx, z + f.dz)) ?? null;

// the entrance: the south-facing wall cell nearest the middle of the front
const doorCell = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => outward(x, z)?.name === "south")
  .sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11) || b[1] - a[1])[0];
const DOOR = doorCell ? key(...doorCell) : null;

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// the wall of a face cell at height y (null = nothing there); bay: 0 pier, 1 or 2 glass pane; pos along the face.
// Every third column is a pier, so each window bay is two panes of glass between quartz frames.
const wallBlock = (y, g, T, bay) => {
  if (y === g) return "polished_andesite";                              // base course
  if (y < 4) {                                                          // ground storey: brick piers, shopfront glass
    if (y === 3) return bay === 0 ? "bricks" : "dark_oak_planks";       // lintel
    return bay === 0 ? "bricks" : "glass";
  }
  const rel = (y - 4) % 4;
  if (y === T - 1) return "smooth_quartz";                             // cornice on the rim
  if (rel === 0) return "smooth_quartz";                               // storey line (spandrel)
  if (rel === 3) return bay === 0 ? "smooth_quartz" : "dark_oak_planks"; // window head
  return bay === 0 ? "smooth_quartz" : "glass";                        // pier or glass
};

for (const [k, { g, T }] of F) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  if (!out) {
    // interior: a floor on the ground, a slab per storey, air between, and the roof deck; no rooms
    put(x, g, z, "smooth_stone");
    for (const fy of [4, 8]) if (fy < T - 1) put(x, fy, z, "smooth_stone");
    put(x, T - 1, z, "smooth_stone");
    if (T === 12 && x >= 5 && x <= 7 && z >= 8 && z <= 9) put(x, 12, z, "light_gray_concrete"); // rooftop plant
    continue;
  }

  // the wall: pos runs along the face (x on north and south, z on east and west)
  const pos = out.name === "north" || out.name === "south" ? x : z;
  const bay = ((pos % 3) + 3) % 3;

  if (k === DOOR) {
    // entrance: a dark oak door (two halves) in the shopfront, an open lintel above it
    const face = out.name;
    for (let y = g; y < T; y++) {
      if (y === g + 1 || y === g + 2) continue;
      const b = wallBlock(y, g, T, 0);
      if (b) put(x, y, z, b);
    }
    put(x, g, z, "polished_andesite");
    put(x, g + 1, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, g + 2, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }

  for (let y = g; y < T; y++) {
    const b = wallBlock(y, g, T, bay);
    if (b) put(x, y, z, b);
  }
  if (T === 12 && bay === 0) put(x, 12, z, "smooth_quartz");           // parapet pinnacles on the piers

  // warm light: a lantern on the floor just inside the lowest row of some windows (it stands on the slab below)
  const lowestRow = (y) => (y < 4 ? y === g + 1 : y % 4 === 1);
  for (let y = g; y < T; y++) {
    if (bay === 0 || !lowestRow(y) || (x * 7 + z * 3 + y) % 5 !== 0) continue;
    const ix = x - out.dx, iz = z - out.dz;
    if (inF(ix, iz) && !outward(ix, iz)) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const file = `${DIR}/way_261494375.nbt`;
const r = v.save(file);
console.log(`way_261494375: ${cells.length} footprint cells, ${r.blocks} blocks, ${r.palette} palette entries -> ${file}`);
