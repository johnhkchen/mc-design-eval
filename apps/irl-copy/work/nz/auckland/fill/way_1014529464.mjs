// A three-storey brick commercial block with a stone parapet, the Auckland street-front type of the 1900s-1920s:
// brick piers and glazed bays, a shopfront on the ground floor, stone string courses and a cornice. The footprint's
// lower wings (roof 8 and 10) step down from the 14-high main block. Hollow: floor slabs at each storey line, air behind
// the glass, a few lamps set just inside the windows.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529464.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..9
const g = new Voxels([10, 27, 10]);

const foot = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { gr, roof }]));
const has = (x, z) => foot.has(`${x},${z}`);
const faces = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });
const perim = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };
const solid = (x, y, z) => g.get(x, y, z) !== null;

const FLOOR = [0, 4, 8, 12];          // storey lines: floor slabs (interior) and string courses (facade)
const panes = [], walls = [], lamps = [];
const ENTRY = [6, 9];                 // the door sits on the south face, the lowest side of the lot

for (const [x, z, gr, roof] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // interior: a floor slab per storey, the ceiling under the roof deck, the deck, and air between
    for (const y of new Set([...FLOOR, roof - 2])) if (y < roof - 1) g.set(x, y, z, "smooth_stone");
    g.set(x, roof - 1, z, "smooth_stone");
    continue;
  }

  const f = faces(x, z);
  // a convex corner (both faces out, the diagonal out too): a solid pier, not a window bay; a stair-stepped edge is not a corner
  const corner = (f.N || f.S) && (f.E || f.W) && !has(x + (f.E ? 1 : -1), z + (f.S ? 1 : -1));
  const u = f.N || f.S ? x : z;       // position along the wall the cell faces
  for (let y = gr; y < roof; y++) {
    // rows from the top down: parapet, cornice; then the storeys
    if (y === roof - 1) { g.set(x, y, z, "stone_brick_wall"); walls.push([x, y, z]); continue; }
    if (y === roof - 2) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (corner) { g.set(x, y, z, "bricks"); continue; }                       // corner piers stay brick (stone is for the courses)
    if (x === ENTRY[0] && z === ENTRY[1]) {                                     // entrance: door, hood over it
      if (y === gr) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 1) { g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }
    if (gr <= 1 && z === ENTRY[1] && y === 2 && x >= 5 && x <= 7) {             // door hood: a dark oak canopy band
      g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue;
    }
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }                // plinth
    if (y === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }              // shop fascia
    if (y < 4) { glazed(x, y, z, u, f, "shop"); continue; }                    // ground floor shopfront bays
    if (y === 4 || y === 8) { g.set(x, y, z, "stone_bricks"); continue; }      // string courses
    if (y === 7 || y === 11) { g.set(x, y, z, "bricks"); continue; }          // lintel brick
    glazed(x, y, z, u, f, "upper");                                             // windows in the upper storeys
  }
}

// a pier every third block along a face, glazed bays between; panes get their connections below
function glazed(x, y, z, u, f, kind) {
  if (u % 3 === 0) { g.set(x, y, z, "bricks"); return; }
  g.set(x, y, z, "glass_pane");
  panes.push({ x, y, z, axis: f.N || f.S ? "x" : "z", kind, u, f });
}

// warm lights just inside every other window bay (interior cell next to the glass)
for (const p of panes) {
  if (p.u % 6 !== 1) continue;
  const inward = p.f.N ? [0, 1] : p.f.S ? [0, -1] : p.f.W ? [1, 0] : [-1, 0];
  const ix = p.x + inward[0], iz = p.z + inward[1];
  if (!has(ix, iz) || perim(ix, iz)) continue;
  g.set(ix, p.y, iz, p.kind === "shop" ? "glowstone" : p.y === 5 ? "shroomlight" : "glowstone");
  lamps.push([ix, p.y, iz]);
}

// the roof plant: a small stair core on the 14-high roof, interior cells only
if (has(4, 4) && has(5, 4) && has(4, 5) && has(5, 5) && [[4, 4], [5, 4], [4, 5], [5, 5]].every(([x, z]) => !perim(x, z))) {
  for (const [x, z] of [[4, 4], [5, 4], [4, 5], [5, 5]]) {
    g.set(x, 14, z, "stone_bricks"); g.set(x, 15, z, "stone_bricks");
    g.set(x, 16, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// pane connections: a pane joins the solid blocks along its wall
for (const p of panes) {
  const s = p.axis === "x"
    ? { north: "false", south: "false", east: String(solid(p.x + 1, p.y, p.z)), west: String(solid(p.x - 1, p.y, p.z)) }
    : { north: String(solid(p.x, p.y, p.z - 1)), south: String(solid(p.x, p.y, p.z + 1)), east: "false", west: "false" };
  g.set(p.x, p.y, p.z, "glass_pane", { ...s, waterlogged: "false" });
}
// parapet walls join their neighbours
for (const [x, y, z] of walls) {
  const side = (dx, dz) => (solid(x + dx, y, z + dz) ? "low" : "none");
  g.set(x, y, z, "stone_brick_wall", { up: "true", north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529464.nbt";
const info = g.save(out);
console.log(`cells ${cells.length}, panes ${panes.length}, lamps ${lamps.length}, blocks ${info.blocks}, palette ${info.palette}`);
