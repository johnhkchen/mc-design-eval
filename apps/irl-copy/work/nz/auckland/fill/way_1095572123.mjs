// Way 1095572123, Mt Eden / Newton edge: a two-storey brick commercial block of the 1920s-30s, stripped classical,
// with a shopfront on its street face, a stone string course at each floor line, a cornice and parapet, and a flat roof.
// Lidar gives a flat roof at y 9 over every footprint cell (ground y 0), so one tier: plinth y0, storey 1 walls y1-4,
// storey 2 walls y5-8 (floor slab at y5, ceiling at y8), roof deck y9. Walls are the perimeter cells of the footprint;
// the interior is air apart from the slabs, the roof and a few lamps behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572123.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([10, 22, 9]);

const F = new Map();
for (const [x, z, gr, rf] of cells) F.set(`${x},${z}`, { gr, rf });
const inF = (x, z) => F.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// the lidar's roof is flat (9 over every cell); the parapet is the top of the walls, so one tier
const ROOF = Math.max(...cells.map((c) => c[3]));
const ground = Math.min(...cells.map((c) => c[2]));
const cellsInside = cells.map(([x, z]) => [x, z]).filter(([x, z]) => exposed(x, z).length === 0);

// --- decide the street face: the single-exposure run on the south (z+) side of the block's widest row -----------------
const perim = cells.map(([x, z]) => [x, z, exposed(x, z)]).filter(([, , e]) => e.length > 0);
const single = perim.filter(([, , e]) => e.length === 1);
// front = the face with most single-exposure cells (the long street wall)
const count = {};
for (const [, , [d]] of single) count[d] = (count[d] || 0) + 1;
const front = Object.keys(count).sort((a, b) => count[b] - count[a])[0] || "S";
const frontCells = single.filter(([, , [d]]) => d === front).sort((a, b) => (front === "N" || front === "S" ? a[0] - b[0] : a[1] - b[1]));
const doorCell = frontCells[Math.floor(frontCells.length / 2)];   // the entrance: middle of the street run

// --- foundation, floors, ceiling, roof ----------------------------------------------------------------------------
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  for (let y = ground; y <= 0; y++) g.set(x, y, z, "stone_bricks");        // plinth on the footprint
  g.set(x, 5, z, "spruce_planks");                                          // storey-2 floor slab (also under the band)
  g.set(x, 8, z, "stone");                                                  // ceiling over storey 2 (roof deck sits on it)
  g.set(x, ROOF, z, "stone");                                               // roof deck, interior
}

// --- walls: perimeter cells only -------------------------------------------------------------------------------------
const GLASS = (along) => ({ north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
  ...(along === "x" ? { east: "true", west: "true" } : { north: "true", south: "true" }) });
for (const [x, z, ex] of perim) {
  // a staircased edge makes most cells two-sided: the window pattern follows the first exposed face, every cell is brick
  const d = ex[0];
  const along = d === "N" || d === "S" ? "x" : "z";
  const idx = along === "x" ? x : z;
  const isWindow = idx % 3 === 1;
  const isShop = front === d && ex.length === 1;     // ground-floor shopfront on the street face
  const doorHere = isShop && doorCell && x === doorCell[0] && z === doorCell[1];
  const pane = (y) => g.set(x, y, z, "glass_pane", GLASS(along));
  g.set(x, 0, z, "stone_bricks");                                             // plinth
  g.set(x, 1, z, isShop ? "dark_oak_planks" : "polished_andesite");           // base course; shopfront bulkhead
  if (doorHere) {                                                             // entrance: door, transom
    const facing = FACING[d], door = { facing, hinge: "left", open: "false", powered: "false" };
    g.set(x, 1, z, "dark_oak_door", { ...door, half: "lower" });
    g.set(x, 2, z, "dark_oak_door", { ...door, half: "upper" });
    g.set(x, 3, z, "dark_oak_planks");
  } else if (isShop || isWindow) { pane(2); pane(3); }                        // shopfront glass or storey-1 window
  else { g.set(x, 2, z, "bricks"); g.set(x, 3, z, "bricks"); }
  if (isWindow) { pane(6); pane(7); } else { g.set(x, 6, z, "bricks"); g.set(x, 7, z, "bricks"); }
  g.set(x, 4, z, isShop ? "dark_oak_planks" : "smooth_stone");                // lintel band / fascia
  g.set(x, 5, z, "smooth_stone");                                             // floor line
  g.set(x, 8, z, "smooth_stone");                                             // cornice course under the parapet
  g.set(x, ROOF, z, "stone_bricks");                                          // parapet on the roof line
}

// --- lamps behind the glass: an air gap, then a warm light, on some windows -------------------------------------
for (const [x, z, ex] of perim) {
  if (ex.length !== 1) continue;
  if ((ex[0] === "N" || ex[0] === "S" ? x : z) % 3 !== 1) continue;   // window columns only
  const [dx, dz] = DIRS[ex[0]];
  const ix = x - dx, iz = z - dz;                // the cell just inside this window
  if (!inF(ix, iz)) continue;
  if (exposed(ix, iz).length) continue;           // only interior cells
  if ((x + z) % 2 === 0) g.set(ix, 2, iz, "glowstone");   // storey 1
  else g.set(ix, 6, iz, "shroomlight");                    // storey 2
}

// --- roof equipment on the roof deck: two plant units, standing on the deck ----------------------------------------
const roofCells = cellsInside.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
const mid = roofCells[Math.floor(roofCells.length / 2)];
const other = roofCells[Math.floor(roofCells.length / 4)];
if (mid) g.set(mid[0], ROOF + 1, mid[1], "iron_block");
if (other) g.set(other[0], ROOF + 1, other[1], "iron_block");

const { blocks, palette } = g.save(`${DIR}/way_1095572123.nbt`);
console.log(JSON.stringify({ front, door: doorCell, roof: ROOF, ground, blocks, palette, footprint: cells.length, interior: cellsInside.length }));
