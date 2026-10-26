// FR245184485: a residential Haussmann block, 7 levels (shop, entresol, noble étage, 3rd, 4th, attic, mansard), on a
// lidar footprint. Roof heights are quantised into four flat tiers; each tier is a limestone shell with air behind the
// glass, floor slabs per storey, and a zinc-grey mansard on the top tier. Foundation fills from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184485.cells.json`, "utf8"));

// Lidar roof (above y 0) -> top surface of a flat tier.
const tierTop = (roof) => (roof >= 25 ? 27 : roof >= 17 ? 21 : roof >= 8 ? 13 : 5);
// Floor slabs (the top of each storey): shop 0-5, entresol 5-9, noble étage 9-13, 3rd 13-17, 4th 17-21, attic 21-24, mansard 24-27.
const LINES = [5, 9, 13, 17, 21, 24];
const FACES = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, ground, top: tierTop(roof) });
const at = (x, z) => cell.get(`${x},${z}`);
const key = (x, z) => `${x},${z}`;

// The faces open to the air or to a lower tier: those are the facades (and the walls stepping down to a wing).
const exposed = (c) => FACES.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; });
// The facade face a cell shows (z-faces first, so corners read along the long walls).
const faceOf = (c) => { const o = exposed(c); return o.find(([dx]) => dx === 0) ?? o[0] ?? null; };

const railState = (f) => (f[0] === 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// One row of a cell's column: [block, state] for the facade or interior, or null for air.
function skin(c, y, f, p) {
  const cap = c.top - 1;
  const win = p % 3 !== 0;                                   // two windows, then a pier, along each facade
  if (y === cap) return f ? ["smooth_stone"] : ["deepslate_tiles"];   // parapet on the walls, zinc-grey roof over the rest
  if (y < c.ground) return ["stone_bricks"];                 // foundation
  if (!f) return LINES.includes(y) ? ["smooth_stone"] : null;   // interior: floor slabs only, air between them
  if (y === c.ground) return ["polished_andesite"];          // base course
  if (y < 5) return y <= 3 && win ? ["glass"] : ["calcite"]; // shop storey: small windows under a lintel line
  if (LINES.includes(y)) return ["smooth_stone"];            // string course at every floor
  const lo = Math.max(...LINES.filter((L) => L < y));
  if (lo === 24) return p % 4 === 2 ? ["glass"] : ["deepslate_tiles"];   // mansard with dormers
  if (lo === 9 && y === lo + 1) return win ? ["iron_bars", railState(f)] : ["calcite"];   // noble étage balcony rails
  return win ? ["glass"] : ["calcite"];
}

const g = new Voxels([26, 43, 22]);
const shell = new Set();
for (const c of cell.values()) if (faceOf(c)) shell.add(key(c.x, c.z));

for (const c of cell.values()) {
  const f = faceOf(c);
  const p = f ? (f[0] === 0 ? c.x : c.z) : 0;
  const cap = c.top - 1;
  for (let y = 0; y <= cap; y++) {
    const s = skin(c, y, f, p);
    if (s) g.set(c.x, y, c.z, s[0], s[1]);
  }
}

// Entrance: the air-facing wall nearest the middle of the south front, a dark oak door with a calcite lintel.
let door = null;
for (const c of cell.values()) {
  for (const [dx, dz, name] of exposed(c)) {
    if (at(c.x + dx, c.z + dz)) continue;                    // only walls on the street
    const score = Math.abs((dz === 0 ? c.z : c.x) - (dz === 1 ? 12 : 13)) + (dz === 1 ? 0 : 50);
    if (!door || score < door.score) door = { c, score, dx, dz, name };
  }
}
if (door) {
  const { c, name } = door;
  g.set(c.x, c.ground, c.z, "dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.ground + 1, c.z, "dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.ground + 2, c.z, "calcite");
}

// Warm lights: glowstone behind some noble-étage windows, shroomlight behind some entresol windows; air behind the glass.
for (const c of cell.values()) {
  const f = faceOf(c);
  if (!f) continue;
  const p = f[0] === 0 ? c.x : c.z;
  for (const [y, block, pick] of [[11, "glowstone", (x, z) => (x + z) % 4 === 0], [7, "shroomlight", (x, z) => (x + z) % 5 === 0]]) {
    const s = skin(c, y, f, p);
    if (!s || s[0] !== "glass" || !pick(c.x, c.z)) continue;
    const ix = c.x - f[0], iz = c.z - f[1];
    if (at(ix, iz) && !shell.has(key(ix, iz))) g.set(ix, y, iz, block);
  }
}

// Chimneys on the interior of the top tier, rising above the mansard cap.
for (const c of cell.values()) {
  if (c.top === 27 && !faceOf(c) && c.x % 5 === 2 && c.z % 4 === 1) {
    g.set(c.x, 27, c.z, "bricks");
    g.set(c.x, 28, c.z, "bricks");
  }
}

const info = g.save(`${DIR}/FR245184485.nbt`);
console.log(JSON.stringify({ footprint: cells.length, shell: shell.size, ...info }));
