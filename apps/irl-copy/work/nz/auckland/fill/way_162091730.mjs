// Way 162091730, Auckland: a 1920s brick commercial block on the slope below Maungawhau. Two storeys where the ground
// falls away (south), one where it rises (north), a cornice and a stone parapet, shopfronts with dark-oak doors and
// hanging lanterns on the ground band, white-framed sash windows above, glowstone behind some panes, and a plant box on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091730.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091730.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 22, D = 37, H = 14;
const key = (x, z) => `${x},${z}`;
const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(key(x, z), { ground, roof });
const inside = (x, z) => at.has(key(x, z));

// Lidar roof noise into flat tiers: each cell takes the modal roof of its 3x3 neighbourhood (ties go high),
// so single low or high cells join the tier they sit in.
const roofOf = new Map();
for (const [k, { roof }] of at) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = at.get(key(x + dx, z + dz)); if (!c) continue;
    votes.set(c.roof, (votes.get(c.roof) || 0) + 1);
  }
  let best = roof, bestN = -1;
  for (const [r, n] of votes) if (n > bestN || (n === bestN && r > best)) { best = r; bestN = n; }
  roofOf.set(k, best);
}

// The outward faces of a footprint cell (north/south first, so a corner reads as the long wall)
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const parapet = [], glass = [];

// A glass pane on a wall face, connected along the wall so the panes read as one glazing line
function placeGlass(x, y, z, [dir]) {
  const along = dir === "north" || dir === "south";
  g.set(x, y, z, "glass_pane", { north: String(!along), south: String(!along), east: String(along), west: String(along), waterlogged: "false" });
  glass.push({ x, y, z, dir });
}

// Ground (shopfront) band and upper windows, by the position u along the wall
function front(x, y, z, u, face, G, bot, bandTop) {
  const [dir] = face;
  const m = ((u % 4) + 4) % 4;
  const shopBand = y < 4 || G >= 4;
  if (!shopBand) {                                     // upper sash bay: brick pier, white jamb, two glass panes
    if (m === 0) g.set(x, y, z, "bricks");
    else if (m === 1) g.set(x, y, z, "white_concrete");
    else placeGlass(x, y, z, face);
    return;
  }
  const doorCol = u % 8 === 4 && bandTop - bot >= 1;   // a door in the pier position where the band is two high
  if (doorCol && (y === bot || y === bot + 1)) {
    g.set(x, y, z, "dark_oak_door", { facing: dir, half: y === bot ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    return;
  }
  if (m === 0) {
    if (u % 8 === 0 && y === bandTop) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    else g.set(x, y, z, "stone_bricks");
    return;
  }
  placeGlass(x, y, z, face);
}

for (const [k, { ground: G }] of at) {
  const [x, z] = k.split(",").map(Number);
  const R = roofOf.get(k), T = R - 1;                  // roof: T is the cornice and the roof deck, R the parapet
  const faces = exposed(x, z), per = faces.length > 0, face = faces[0];
  const u = per && (face[0] === "north" || face[0] === "south") ? x : z;
  const bot = G < 4 ? G + 1 : 5, bandTop = G < 4 ? 3 : 6;

  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");          // foundation under the slope
  g.set(x, G, z, per ? "stone_bricks" : "smooth_stone");               // plinth on the walls, floor slab inside

  for (let y = G + 1; y <= R; y++) {
    if (y === R) { if (per) parapet.push([x, y, z]); continue; }       // parapet on the edge only
    if (y === T) { g.set(x, y, z, per ? "smooth_stone" : "stone"); continue; }   // cornice, roof deck inside
    if (y === 4 && (per || G < 4)) { g.set(x, y, z, "smooth_stone"); continue; }  // string course, floor slab inside
    if (!per) continue;                                                // interior: air behind the glass
    if (y === 7 && T > 7) { g.set(x, y, z, G >= 4 ? "dark_oak_planks" : "bricks"); continue; }  // brick header course or shop fascia
    if (y < 4 || y <= 6) front(x, y, z, u, face, G, bot, bandTop);
  }
}

// A continuous stone coping on the parapet course (a wall of posts reads as battlements)
for (const [x, y, z] of parapet) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// Warm light: glowstone just inside some upper panes (the air gap behind the glass)
for (const { x, y, z, dir } of glass) {
  if (y !== 5 || (x * 7 + z * 3) % 5 !== 0) continue;
  const [, dx, dz] = DIRS.find(([d]) => d === dir);
  const ix = x - dx, iz = z - dz;
  if (inside(ix, iz) && exposed(ix, iz).length === 0) g.set(ix, y, iz, "glowstone");
}

// Roof plant room: a 7 x 5 box on the roof deck, set in the middle of the roof (roof height = the modal roof, interior only)
const Rtop = Math.max(...roofOf.values());
const roofInterior = (x, z) => inside(x, z) && exposed(x, z).length === 0 && roofOf.get(key(x, z)) === Rtop;
let cx = 0, cz = 0; for (const [k] of at) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; }
cx /= at.size; cz /= at.size;
let pick = null, pickCost = Infinity;
for (let x0 = 0; x0 + 7 <= W; x0++) for (let z0 = 0; z0 + 5 <= D; z0++) {
  let ok = true;
  for (let x = x0; x < x0 + 7 && ok; x++) for (let z = z0; z < z0 + 5 && ok; z++) ok = roofInterior(x, z);
  if (!ok) continue;
  const cost = Math.abs(x0 + 3 - cx) + Math.abs(z0 + 2 - cz);
  if (cost < pickCost) { pick = [x0, z0]; pickCost = cost; }
}
if (pick) {
  const [x0, z0] = pick, base = Rtop;
  for (let x = x0; x < x0 + 7; x++) for (let z = z0; z < z0 + 5; z++) {
    for (let y = base; y < base + 3; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, base + 3, z, "smooth_stone");
  }
  for (const [x, z] of [[x0, z0], [x0 + 6, z0], [x0, z0 + 4], [x0 + 6, z0 + 4]])
    g.set(x, base + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
}

const info = g.save(OUT);
console.log(`way_162091730: ${cells.length} footprint cells, ${info.blocks} blocks, ${info.palette} palette entries, plant ${pick ?? "none"} -> ${OUT}`);
