import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 900 10th St NW, Hotel-Large: a 1900s-1920s brick-and-limestone hotel, six storeys of 3-block bays over a stone plinth.
// The lidar roof record reads as one flat body at 17+ (18 blocks = six storeys), a penthouse core at 20 in the middle,
// and low wings at 3 and 6 at the north end and the east flank. Every tier is a solid core with a one-cell air gap just
// inside the glass, so each window has air behind it and each floor slab sits on the core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69580.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 13, D = 40, Y = 22;
const g = new Voxels([W, Y, D]);
const put = (x, y, z, id, state) => g.set(x, y, z, id, state);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inFoot = (x, z) => roof.has(key(x, z));

// the height of each footprint cell's massing, quantised to storeys: the body at 18, the penthouse core at 20, wings at 3 or 6
const CROWN = (x, z) => x >= 3 && x <= 7 && z >= 7 && z <= 31;
function topOf(x, z) {
  if (!inFoot(x, z)) return 0;
  const r = roof.get(key(x, z));
  if (r >= 17) return CROWN(x, z) ? 20 : 18;
  return r >= 5 ? 6 : 3;
}

// the band a cell's height y falls in: its own top, and the floor lines (string courses) inside it
function band(x, z, y) {
  const top = y >= 18 ? 20 : topOf(x, z) === 20 ? 18 : topOf(x, z);
  const floors = top === 18 ? [3, 6, 9, 12, 15] : top === 6 ? [3] : [];
  return { top, floors };
}
// what a row of a band is: its cap (top course), a string course at a floor line, or a window row
function kind(b, y) {
  if (y === b.top - 1) return "cap";
  if (b.floors.includes(y)) return "string";
  return "window";
}

// a neighbour is open at height y if it is off the footprint or stands lower than y
const open = (x, z, y) => !inFoot(x, z) || topOf(x, z) <= y;
const outward = (x, z, y) => DIRS.filter(([dx, dz]) => open(x + dx, z + dz, y));
const isShell = (x, z, y) => inFoot(x, z) && y >= 1 && y < topOf(x, z) && outward(x, z, y).length > 0;
const nextToShell = (x, z, y) => DIRS.some(([dx, dz]) => isShell(x + dx, z + dz, y));

// glass panes join along their wall: east-west on a z face, north-south on an x face
const pane = (zFace) => (zFace ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
const door = (y) => ({ id: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });

// the ground: a stone plinth under every footprint cell, so nothing floats on the slope
for (const [x, z] of cells) put(x, 0, z, "stone_bricks");

const lights = [];
for (const [x, z] of cells) for (let y = 1; y < topOf(x, z); y++) {
  const b = band(x, z, y), k = kind(b, y);
  const out = outward(x, z, y);

  // the entrance: two door cells in the north face of the wing, between calcite corner piers
  if (z === 0 && x === 7 && (y === 1 || y === 2)) { put(x, y, z, door(y).id, door(y).state); continue; }

  if (isShell(x, z, y)) {
    if (k === "cap" || k === "string") { put(x, y, z, "calcite"); continue; }
    if (out.length === 2) { put(x, y, z, "calcite"); continue; } // quoined corners, every storey
    const zFace = out.some(([, dz]) => dz !== 0), along = zFace ? x : z;
    if (along % 3 === 0) { put(x, y, z, "bricks"); continue; }   // brick piers between the bays
    put(x, y, z, "glass_pane", pane(zFace));
    // the window's inner air cell: a warm light in about a quarter of the bays
    const [ox, oz] = out[0], ix = x - ox, iz = z - oz;
    if (y % 3 === 1 && (along + Math.floor(y / 3)) % 4 === 1) lights.push([ix, y, iz, Math.floor(y / 3) % 2 ? "shroomlight" : "glowstone"]);
    continue;
  }
  if (nextToShell(x, z, y)) {
    // the air gap behind the glass: open at window rows, a solid floor slab or roof deck at the string and cap rows
    if (k === "window") continue;
    put(x, y, z, k === "string" ? "smooth_stone" : "stone");
    continue;
  }
  put(x, y, z, k === "string" ? "smooth_stone" : "stone");
}

// warm light just inside the glass (only where that air cell is still empty)
for (const [x, y, z, id] of lights) if (inFoot(x, z) && !g.get(x, y, z)) put(x, y, z, id);

// the entrance canopy over the two door bays, on the piers and door, and the penthouse's lanterns
for (const x of [6, 7, 8]) put(x, 3, 0, "calcite");
for (const [x, z] of [[3, 7], [7, 7], [3, 31], [7, 31]]) put(x, 20, z, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant: two iron air-handling boxes on the body's roof, clear of the penthouse
for (const [x0, z0] of [[1, 5], [8, 27]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) for (let y = 18; y <= 19; y++) put(x, y, z, "iron_block");

// checks: which blocks sit over air (floor slabs and roof deck over the gap are the only expected cases), and the height
const over = [];
for (let y = 1; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (g.get(x, y, z) && !g.get(x, y - 1, z)) over.push([x, y, z]);
let maxY = 0; for (const [x, y, z] of cells.map(([x, z]) => [x, 0, z])) for (let yy = 0; yy < Y; yy++) if (g.get(x, yy, z)) maxY = Math.max(maxY, yy + 1);
console.log(`blocks over air: ${over.length}; tallest top: ${maxY}`);
const hist = {}; for (const [x, y, z] of over) { const k = `y${y} ${g.get(x, y, z).block}`; hist[k] = (hist[k] || 0) + 1; }
console.log(Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 12));

g.save(`${DIR}/DC69580.nbt`);
