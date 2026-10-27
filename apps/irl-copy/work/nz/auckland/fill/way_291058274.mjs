// Mount Eden flats, way 291058274: a 1960s-70s concrete apartment block, read off the lidar roof heights.
// Roofs snap to four levels (6 = one storey, 18 = four, 22 = five, 26 = six); the six-storey core sits in the
// middle with the five-storey body around it and the four-storey wing at the north end. Brick ground storey,
// storey bands, white bays with tinted glass, a lintel-framed door on the longest street-facing run.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058274.cells.json", "utf8"));
const g = new Voxels([32, 39, 33]);
const LINES = [2, 6, 10, 14, 18, 22];                           // storey bottoms (base course, then one per storey)
const key = (x, z) => `${x},${z}`;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// lidar roof -> clean tier, then a 3x3 majority so the 2x2 lidar speckle stops showing
const tierOf = (r) => (r >= 24 ? 26 : r >= 21 ? 22 : r >= 13 ? 18 : 6);
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), tierOf(r)]));
const T = new Map();
for (const [k, t] of raw) {
  const [x, z] = k.split(",").map(Number), votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = raw.get(key(x + dx, z + dz)); if (v) votes.set(v, (votes.get(v) || 0) + 1); }
  let best = t; for (const [v, n] of votes) if (n > (votes.get(best) || 0)) best = v;
  T.set(k, best);
}
const top = (x, z) => T.get(key(x, z)) || 0;

// a cell is shell where a side faces outside the footprint or a lower tier; those sides carry the facade
const exposed = (x, z, t) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = key(x + dx, z + dz); return !T.has(n) || T.get(n) < t; });
const cellsOf = [...T.keys()].map((k) => k.split(",").map(Number));
const shell = new Map(), face = new Map();
for (const [x, z] of cellsOf) { const ex = exposed(x, z, top(x, z)); shell.set(key(x, z), ex.length > 0); face.set(key(x, z), ex); }

// the door: the longest run of ground-storey outside-facing cells on a body or tower tier (t >= 18)
const runs = {};
for (const [x, z] of cellsOf) {
  const t = top(x, z); if (t < 18 || !shell.get(key(x, z))) continue;
  for (const [dir, [dx, dz]] of face.get(key(x, z))) if (!T.has(key(x + dx, z + dz))) (runs[dir] ||= []).push(x * 100 + z);
}
const doorDir = Object.entries(runs).sort((a, b) => b[1].length - a[1].length)[0][0];
const run = runs[doorDir].sort((a, b) => (doorDir === "north" || doorDir === "south" ? Math.floor(a / 100) - Math.floor(b / 100) : a % 100 - b % 100));
const doorCell = [Math.floor(run[run.length >> 1] / 100), run[run.length >> 1] % 100];

// plinth, storey bands and window bays, roof membrane, and warm windows
const warm = [];
for (const [x, z] of cellsOf) {
  const t = top(x, z), sh = shell.get(key(x, z)), ex = face.get(key(x, z));
  const [dir] = ex[0] || ["north", null];
  const u = dir === "east" || dir === "west" ? z : x;          // bays run along the face the cell shows
  for (let y = 0; y < 2; y++) g.set(x, y, z, "stone_bricks");   // foundation to the lowest ground, plinth to the storey line
  g.set(x, t - 1, z, sh ? "smooth_stone" : "gray_concrete");   // coping on the shell, roof membrane inside
  for (let y = 2; y < t - 1; y++) {
    const L = LINES.filter((l) => l <= y).pop();
    if (!sh) { if (LINES.includes(y)) g.set(x, y, z, "smooth_stone"); continue; }   // inside: floor slabs only
    if (LINES.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; }              // storey band
    if (L === 2) { g.set(x, y, z, y === 5 ? "smooth_stone" : u % 3 === 0 ? "bricks" : "light_blue_stained_glass"); continue; }  // ground: shopfront or brick pier
    if (u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }                  // pier between bays
    g.set(x, y, z, "light_blue_stained_glass");
    if (y === L + 1 && (x * 7 + z * 3 + L) % 5 === 0) warm.push([x, y, z, dir]);      // a lit room in one bay in five
  }
}

// warm rooms: a glowstone on the floor just inside the glass (the air gap stays)
for (const [x, y, z, dir] of warm) {
  const [dx, dz] = DIRS[dir], ix = x - dx, iz = z - dz;
  if (!T.has(key(ix, iz)) || shell.get(key(ix, iz)) || top(ix, iz) - 1 <= y) continue;
  g.set(ix, y, iz, "glowstone");
}

// entrance: door in the ground storey's glass row, a lantern on the floor just inside
const [dx, dz] = DIRS[doorDir];
g.set(doorCell[0], 3, doorCell[1], "iron_door", { facing: doorDir, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorCell[0], 4, doorCell[1], "iron_door", { facing: doorDir, half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorCell[0] - dx, 3, doorCell[1] - dz, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant: a 3x3 room on the six-storey core's middle, and AC units on the five-storey terraces
const core = cellsOf.filter(([x, z]) => top(x, z) === 26 && !shell.get(key(x, z)));
const cx = core.reduce((s, c) => s + c[0], 0) / core.length, cz = core.reduce((s, c) => s + c[1], 0) / core.length;
let room = null, dist = Infinity;
for (const [x, z] of core) {
  const ok = [-1, 0, 1].every((a) => [-1, 0, 1].every((b) => top(x + a, z + b) === 26 && !shell.get(key(x + a, z + b))));
  const d = (x - cx) ** 2 + (z - cz) ** 2; if (ok && d < dist) { dist = d; room = [x, z]; }
}
if (room) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let y = 26; y <= 27; y++) g.set(room[0] + a, y, room[1] + b, "white_concrete");
if (room) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) g.set(room[0] + a, 28, room[1] + b, "light_gray_concrete");
for (const [x, z] of cellsOf) if (top(x, z) === 22 && !shell.get(key(x, z)) && x % 5 === 2 && z % 5 === 2) g.set(x, 22, z, "iron_block");

console.log("door", doorDir, doorCell, "room", room, "warm", warm.length);
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058274.nbt");
