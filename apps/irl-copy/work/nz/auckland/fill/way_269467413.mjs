// Way 269467413: a 1930s brick-and-concrete commercial block (Stripped Classical, the inner-city shop-and-office
// type of Auckland's Eden Terrace and Newton): a 4-block plinth on the uphill side, brick piers and glazed bays
// between white storey bands, a parapet, and a three-tier massing from the lidar roof (11 tower, 9 podium, 7 wings).
// Every footprint column is solid from its ground up; the shell is walled and the floors are hollow with a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467413.cells.json", "utf8"));
const H = 25;
const g = new Voxels([51, H, 27]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, roof] of cells) { ground.set(key(x, z), gr); lidar.set(key(x, z), roof); }

// Flat tiers instead of lidar noise: 11 (tower), 9 (podium), 7 (wings); then a 3x3 vote to drop stray cells.
const tierOf = (r) => (r >= 11 ? 11 : r >= 9 ? 9 : 7);
const raw = new Map([...lidar].map(([k, r]) => [k, tierOf(r)]));
const tier = new Map();
for (const [k, t0] of raw) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = raw.get(key(x + dx, z + dz)); if (t === undefined) continue;
    votes.set(t, (votes.get(t) ?? 0) + (dx || dz ? 1 : 1.5));
  }
  let best = t0, bestN = 0;
  for (const [t, n] of votes) if (n > bestN) { best = t; bestN = n; }
  tier.set(k, best);
}

const top = (x, z) => tier.get(key(x, z)) ?? -Infinity;   // outside the footprint there is no roof
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outsideDirs = (x, z) => Object.keys(DIRS).filter((d) => !tier.has(key(x + DIRS[d][0], z + DIRS[d][1])));
// a wall faces the outside or a lower tier (the riser of a setback)
const shellDirs = (x, z) => Object.keys(DIRS).filter((d) => top(x + DIRS[d][0], z + DIRS[d][1]) < top(x, z));

const PLINTH = "stone_bricks", BRICK = "bricks", TRIM = "white_concrete", SLAB = "smooth_stone";
const isFloor = (y) => y === 4 || y === 8;                 // storey lines; storeys are 0-4, 4-8, 8-12
const floorOf = (y) => (y >= 8 ? 8 : y >= 4 ? 4 : 0);
const paneState = (alongX) => (alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// The street entrance: the largest run of outward-facing walls at the uphill ground level (y 4).
const faces = {};
for (const k of tier.keys()) {
  const [x, z] = k.split(",").map(Number);
  const od = outsideDirs(x, z), sd = shellDirs(x, z);
  if (ground.get(k) !== 4 || od.length !== 1 || sd.length !== 1 || sd[0] !== od[0]) continue;
  (faces[od[0]] ??= []).push({ x, z, idx: od[0] === "north" || od[0] === "south" ? x : z });
}
let door = null;
const bestFace = Object.keys(faces).sort((a, b) => faces[b].length - faces[a].length)[0];
if (bestFace) { const run = faces[bestFace].sort((a, b) => a.idx - b.idx); door = { face: bestFace, ...run[Math.floor(run.length / 2)] }; }

const windows = [];   // facade glass, for the lights behind some panes
for (const k of tier.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr = ground.get(k), T = tier.get(k);
  const sd = shellDirs(x, z);
  for (let y = 0; y < T; y++) {
    if (y <= gr) { g.set(x, y, z, PLINTH); continue; }                       // foundation and base course
    if (y === T - 1) { g.set(x, y, z, sd.length ? TRIM : SLAB); continue; }   // parapet cap or roof deck
    if (!sd.length) { if (isFloor(y)) g.set(x, y, z, SLAB); continue; }     // hollow floors: slab per storey, air between
    const rel = y - floorOf(y);
    if (isFloor(y)) { g.set(x, y, z, TRIM); continue; }                     // storey line
    if (rel === 3) { g.set(x, y, z, BRICK); continue; }                     // spandrel under the next storey's sill
    if (door && door.x === x && door.z === z && (y === 5 || y === 6)) {      // the entrance
      g.set(x, y, z, "dark_oak_door", { facing: door.face, half: y === 5 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (sd.length > 1) { g.set(x, y, z, TRIM); continue; }                  // corner quoins
    const alongX = sd[0] === "north" || sd[0] === "south";
    const idx = alongX ? x : z;
    if (idx % 4 === 0 || idx % 4 === 3) { g.set(x, y, z, BRICK); continue; } // brick piers, two wide
    g.set(x, y, z, "glass_pane", paneState(alongX));
    if (rel === 1) windows.push({ x, y, z, dir: sd[0], idx });
  }
}

// Canopy over the entrance bay, then warm glowstone behind some panes (in the hollow room inside the glass).
if (door) {
  for (const k of tier.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (ground.get(k) !== 4 || shellDirs(x, z).join() !== door.face || outsideDirs(x, z).join() !== door.face) continue;
    const idx = door.face === "north" || door.face === "south" ? x : z;
    if (Math.abs(idx - (door.face === "north" || door.face === "south" ? door.x : door.z)) <= 1) g.set(x, 7, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (const w of windows) {
  const alongX = w.dir === "north" || w.dir === "south";
  if ((w.idx + w.y + (alongX ? 1 : 0)) % 5 !== 0) continue;
  const [dx, dz] = DIRS[w.dir];
  const ix = w.x - dx, iz = w.z - dz;                                       // the room behind the glass
  if (!tier.has(key(ix, iz)) || shellDirs(ix, iz).length || w.y <= ground.get(key(ix, iz)) || w.y >= top(ix, iz) - 1) continue;
  g.set(ix, w.y, iz, "glowstone");
}

// Roof plant on the tower: a 5 x 3 block of light-grey plant rooms, two high, on the interior of the 11 tier.
const core = [...tier].filter(([, t]) => t === 11).map(([k]) => k.split(",").map(Number));
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
let plant = null;
for (const [x0, z0] of core) {
  const ok = [...Array(5 * 3)].every((_, i) => {
    const x = x0 + (i % 5), z = z0 + Math.floor(i / 5);
    return top(x, z) === 11 && shellDirs(x, z).length === 0;
  });
  if (!ok) continue;
  const d = Math.hypot(x0 + 2 - cx, z0 + 1 - cz);
  if (!plant || d < plant.d) plant = { x0, z0, d };
}
if (plant) for (let y = 11; y <= 12; y++) for (let i = 0; i < 15; i++) g.set(plant.x0 + (i % 5), y, plant.z0 + Math.floor(i / 5), "light_gray_concrete");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467413.nbt");
console.log(`way_269467413: ${cells.length} footprint cells, tiers ${[11, 9, 7].map((t) => [...tier.values()].filter((v) => v === t).length).join("/")}, door ${door ? door.face : "none"}, plant ${plant ? "yes" : "no"}, ${stats.blocks} blocks, palette ${stats.palette}`);
