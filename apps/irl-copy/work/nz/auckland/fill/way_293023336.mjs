// Goodview Apartments Hotel, Mt Eden / Eden Terrace. A 1960s–70s concrete-frame apartment hotel: four storeys on the
// wings, a five-storey core, white painted concrete with light-grey bands (string courses, piers, spandrels), blue
// tinted glazing in aluminium-look frames, a glazed ground-floor lobby and shopfront, and a flat roof with plant.
//
// Massing: each footprint cell is a column from its ground (y = g) to a clean tier top (18, 20 or 23 from the lidar
// roof). Floors are full-footprint slabs at storey lines, each standing on the one below; the outer ring of cells is
// the wall, with an air gap behind the glass. The deck and cap close the top of each column.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293023336.cells.json`, "utf8"));

const W = 28, D = 30, H = 36;
const out = new Voxels([W, H, D]);

const WALL = "white_concrete", CORE = "smooth_quartz", BAND = "light_gray_concrete", BASE = "gray_concrete";
const FOUND = "stone_bricks", ROOF = "gray_concrete", GLASS = "light_blue_stained_glass_pane";

// --- footprint and tiers ---------------------------------------------------------------------------------------------
// The lidar roof (cells[3]) is clean-tiered: below 19.5 is a four-storey wing (18), 20 to 21 the five-storey podium
// and wings (20), 22 and up the core (23). Ground (cells[2]) is 0 or 1; the ground-1 side gets a foundation at y 0.
const tierOf = (r) => (r < 19.5 ? 18 : r < 22 ? 20 : 23);
const col = new Map();
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { x, z, g, top: tierOf(r) });
const inF = (x, z) => col.has(`${x},${z}`);

// outward faces of a cell: the wall runs along z for east/west faces and along x for north/south faces
const DIRS = [
  { name: "east", dx: 1, dz: 0, axis: "x" }, { name: "west", dx: -1, dz: 0, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "z" }, { name: "north", dx: 0, dz: -1, axis: "z" },
];
const facesOf = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));
const alongWall = (x, z, face) => (face.axis === "x" ? z : x);

// storey lines of a column: slabs at the ground and every four blocks (the ground storey is five), then the deck two
// below the cap and the cap itself. A slab is only added while there are at least four blocks left below the deck.
function storeys(c) {
  const slabs = [c.g];
  for (let s = c.g + 5; s <= c.top - 4; s += 4) slabs.push(s);
  return { slabs, deck: c.top - 2, cap: c.top - 1 };
}

// --- the entrance: the face with the most exposed cells, its middle cell ---------------------------------------------
const faceCount = Object.fromEntries(DIRS.map((d) => [d.name, 0]));
for (const c of col.values()) { const f = facesOf(c.x, c.z); if (f.length) faceCount[f[0].name]++; }
const entranceFace = DIRS.reduce((a, b) => (faceCount[b.name] > faceCount[a.name] ? b : a));
const onFace = [...col.values()].filter((c) => facesOf(c.x, c.z).some((f) => f.name === entranceFace.name));
const sortedAlong = onFace.map((c) => alongWall(c.x, c.z, entranceFace)).sort((a, b) => a - b);
const midAlong = sortedAlong[Math.floor(sortedAlong.length / 2)];
const entrance = onFace.find((c) => alongWall(c.x, c.z, entranceFace) === midAlong);
const entranceZone = new Set(onFace
  .filter((c) => Math.abs(alongWall(c.x, c.z, entranceFace) - midAlong) <= 1)
  .map((c) => `${c.x},${c.z}`));

// --- the building -----------------------------------------------------------------------------------------------------
const panes = new Set();

for (const c of col.values()) {
  const { x, z, g, top } = c;
  const faces = facesOf(x, z), boundary = faces.length > 0, face = faces[0];
  const { slabs, deck, cap } = storeys(c);
  const bounds = [...slabs, deck].sort((a, b) => a - b);
  const core = top === 23;
  const wall = core ? CORE : WALL;

  for (let y = 0; y < g; y++) out.set(x, y, z, FOUND);          // foundation: solid from y 0 up to the ground
  for (let y = g; y < top; y++) {
    if (slabs.includes(y) || y === deck) { out.set(x, y, z, boundary ? BAND : WALL); continue; }   // floor slab / deck
    if (y === cap) { out.set(x, y, z, boundary ? BAND : ROOF); continue; }                         // parapet / roof
    if (!boundary) continue;                                                                      // air behind the glass

    // a wall cell: find its storey (the bounds below and above) and its row in it
    const lo = Math.max(...bounds.filter((b) => b < y));
    const hi = Math.min(...bounds.filter((b) => b > y));
    const count = hi - lo - 1, k = y - lo;
    const pos = alongWall(x, z, face);
    const ground = lo === g;

    if (entrance && x === entrance.x && z === entrance.z && y <= g + 2) {          // the entrance door, two high
      out.set(x, y, z, "iron_door", { facing: face.name, half: y === g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (entranceZone.has(`${x},${z}`) && ground && k === count) {                 // canopy header over the door
      out.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue;
    }
    if (ground && k === 1) { out.set(x, y, z, BASE); continue; }                   // base course
    if (k === count) { out.set(x, y, z, BAND); continue; }                         // spandrel / fascia
    if (pos % 4 === 0) { out.set(x, y, z, BAND); continue; }                       // pier, the frame
    if (!ground && pos % 4 === 3) { out.set(x, y, z, wall); continue; }             // solid panel between windows
    out.set(x, y, z, GLASS); panes.add(`${x},${y},${z}`);                          // glazing
  }

  // roof plant on the core: a few boxes, and a lightning rod at the middle
  if (core && !boundary && x % 5 === 2 && z % 5 === 2) {
    out.set(x, top, z, "smooth_stone");
    out.set(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm lights: glowstone behind some upper windows (in the air cell inside the glass), and lanterns in the lobby
for (const c of col.values()) {
  const { x, z, g, top } = c;
  const faces = facesOf(x, z);
  if (!faces.length) continue;
  const face = faces[0];
  const pos = alongWall(x, z, face);
  const { slabs, deck } = storeys(c);
  const bounds = [...slabs, deck].sort((a, b) => a - b);
  for (let y = g + 1; y < top - 1; y++) {
    if (!panes.has(`${x},${y},${z}`)) continue;
    const lo = Math.max(...bounds.filter((b) => b < y));
    const inside = { x: x - face.dx, z: z - face.dz };
    if (!inF(inside.x, inside.z) || out.get(inside.x, y, inside.z)) continue;
    if ((pos * 3 + y) % 11 === 0 && y - lo === 1 && lo !== g) out.set(inside.x, y, inside.z, "glowstone");
    else if (lo === g && y === g + 2 && (pos + y) % 4 === 1) out.set(inside.x, y, inside.z, "glowstone");
  }
}
if (entrance) {
  const face = entranceFace;
  const inside = { x: entrance.x - face.dx, z: entrance.z - face.dz };
  if (inF(inside.x, inside.z) && !out.get(inside.x, entrance.g + 1, inside.z)) {
    out.set(inside.x, entrance.g + 1, inside.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}
// lightning rod on the core, nearest the middle of the footprint
const coreCells = [...col.values()].filter((c) => c.top === 23 && !facesOf(c.x, c.z).length);
if (coreCells.length) {
  const mx = coreCells.reduce((s, c) => s + c.x, 0) / coreCells.length, mz = coreCells.reduce((s, c) => s + c.z, 0) / coreCells.length;
  const mid = coreCells.reduce((a, b) => (Math.hypot(b.x - mx, b.z - mz) < Math.hypot(a.x - mx, a.z - mz) ? b : a));
  out.set(mid.x, 23, mid.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// glass panes connect to the solid blocks beside them, as in the game, so the frames read as a grid
for (const key of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const near = (dx, dz) => out.get(x + dx, y, z + dz) !== null;
  out.set(x, y, z, GLASS, {
    north: String(near(0, -1)), south: String(near(0, 1)), east: String(near(1, 0)), west: String(near(-1, 0)), waterlogged: "false",
  });
}

const res = out.save(`${DIR}/way_293023336.nbt`);
console.log(JSON.stringify({ entrance: { x: entrance.x, z: entrance.z, face: entranceFace.name }, ...res }));
