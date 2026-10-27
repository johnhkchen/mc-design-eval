// A 1920s-30s brick commercial block on the Eden Terrace corner: red brick walls on a stone plinth, cream quoins,
// string courses and a cornice, a timber-framed glass shopfront on the street side, and a sash-style window grid on
// each storey with a warm glow behind some panes. The lidar roof tiers are snapped to 5 / 8 / 11 blocks (1, 2 and 3
// storeys): a 3-storey corner stepping down to a 2-storey and then 1-storey wings. Every column is solid from y 0 up
// to its roof, so each storey and tier stands on what is below it. Each window is a glass pane one block out from an
// air gap behind it, with a floor slab above and below. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const CELLS = `${DIR}/way_439089826.cells.json`;
const OUT = `${DIR}/way_439089826.nbt`;

const W = 6, D = 12, Y = 23;
const TIERS = [5, 8, 11];                                   // lidar roofs snapped to 1, 2 and 3 storeys
const snap = (r) => TIERS.reduce((a, b) => (Math.abs(b - r) < Math.abs(a - r) ? b : a));

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const col = new Map();                                      // "x,z" -> { g: ground, r: roof top }
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { g, r: snap(r) });

const inside = (x, z) => col.has(`${x},${z}`);
const top = (x, z) => (inside(x, z) ? col.get(`${x},${z}`).r : -1);   // -1 outside the footprint
const SIDES = [
  { dx: 1, dz: 0, facing: "east", ew: true },
  { dx: -1, dz: 0, facing: "west", ew: true },
  { dx: 0, dz: 1, facing: "south", ew: false },
  { dx: 0, dz: -1, facing: "north", ew: false },
];
// The sides a block at height y shows: its neighbour is outside, or lower than y.
const facesAt = (x, z, y) => SIDES.filter((s) => y >= top(x + s.dx, z + s.dz));

const put = new Map();                                      // "x,y,z" -> { block, state }; null = air
const key = (x, y, z) => `${x},${y},${z}`;
const place = (x, y, z, block, state) => put.set(key(x, y, z), { block, state });
const air = (x, y, z) => put.set(key(x, y, z), null);
const panes = [];                                           // glass windows, placed again with their connections

// 1. The body: foundation, walls by storey, cornice and roof covering.
for (const [k, { r }] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    const faces = facesAt(x, z, y), roofTop = y === r - 1;
    if (y === 0) { place(x, y, z, "stone_bricks"); continue; }            // foundation, y 0 up to the ground
    if (!faces.length) { place(x, y, z, roofTop ? "stone" : "bricks"); continue; }   // core and roof covering
    if (roofTop) {                                                        // cornice, with a coping slab above
      place(x, y, z, "smooth_quartz");
      place(x, y + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === 1) { place(x, y, z, "stone_bricks"); continue; }            // base course
    if (y % 4 === 1) { place(x, y, z, "smooth_quartz"); continue; }       // string course over each storey
    if (y % 4 === 0) { place(x, y, z, "bricks"); continue; }              // spandrel panel under each window band
    // A quoin only at a true outside corner (two sides on the footprint's edge); a step down is a face, not a corner.
    const outer = faces.filter((s) => top(x + s.dx, z + s.dz) < 0);
    if (outer.length > 1) { place(x, y, z, "smooth_quartz"); continue; }
    const f = outer[0] || faces[0], idx = f.ew ? z : x;
    if ((f.facing === "south" && y < 4) || idx % 2 === 1) {               // windows; the street shopfront is all glass
      place(x, y, z, "glass_pane");
      panes.push({ x, y, z, f, street: f.facing === "south" && y < 4 });
    } else {
      place(x, y, z, "dark_oak_planks");                                  // timber frame between the panes
    }
  }
}

// 2. Each window: an air gap one block inside the glass, and a warm glow behind some panes.
for (const { x, y, z, f } of panes) {
  const ix = x - f.dx, iz = z - f.dz;
  if (!inside(ix, iz) || top(ix, iz) <= y) continue;
  air(ix, y, iz);
  if (y === 2 && (x + z) % 4 === 0) place(ix, y, iz, "glowstone");
}

// 3. Glass panes connect to the neighbouring frame, pier or pane on their own wall.
for (const { x, y, z, f } of panes) {
  const st = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
  const link = (x2, z2) => top(x2, z2) > y;
  if (f.ew) { if (link(x, z - 1)) st.north = "true"; if (link(x, z + 1)) st.south = "true"; }
  else { if (link(x - 1, z)) st.west = "true"; if (link(x + 1, z)) st.east = "true"; }
  place(x, y, z, "glass_pane", st);
}

// 4. The entrance: a door on the south face, opening onto a hall with a hanging lantern; a timber fascia above.
const DOOR_X = 2, DOOR_Z = 11;
place(DOOR_X, 1, DOOR_Z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
place(DOOR_X, 2, DOOR_Z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
air(DOOR_X, 1, DOOR_Z - 1);
air(DOOR_X, 2, DOOR_Z - 1);
place(DOOR_X, 2, DOOR_Z - 1, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = 0; x <= 3; x++) place(x, 4, DOOR_Z, "dark_oak_planks");

// 5. Roof plant: a condenser unit on the wing roof.
place(3, 5, 8, "iron_block");

const g = new Voxels([W, Y, D]);
for (const [k, v] of put) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const { blocks, palette } = g.save(OUT);
console.log(`saved ${OUT}: ${blocks} blocks, ${palette} palette entries`);
