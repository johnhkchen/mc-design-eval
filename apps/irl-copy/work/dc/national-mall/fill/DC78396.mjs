// 1201 Connecticut Ave NW: a 1920s-30s red-brick Georgian Revival apartment block, seven storeys at the tower,
// stepping down to six and three-storey wings. Footprint cells only; each column is solid from y0 to the cell's ground
// (foundation), then the exterior ring is walls with glass windows and stone bands, and the interior is air with a
// floor slab at each storey line and a roof layer on top.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78396.cells.json`, "utf8"));   // [x, z, ground, roof]

const H = 33;
const g = new Voxels([25, H, 22]);

// lidar roof -> clean tiers: tower 21, main body 18, wings 15 (noise absorbed by the thresholds)
const tier = (r) => (r >= 20 ? 21 : r >= 17 ? 18 : 15);
const M = new Map();
for (const [x, z, gr, r] of cells) M.set(`${x},${z}`, { g: gr, T: tier(r) });
const at = (x, z) => M.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// exposed sides: outward (prio 0) beats a setback face onto a lower tier (prio 1)
function facesOf(x, z, c) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(x + dx, z + dz);
    if (!n) out.push({ d, prio: 0 });
    else if (n.T < c.T) out.push({ d, prio: 1 });
  }
  return out.sort((a, b) => a.prio - b.prio);
}

const BAND = new Set([4, 7, 10, 13, 16, 19]);   // storey lines: stone course outside, slab inside
const WINDOW_ROWS = new Set([1, 2, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18]);
const LINTEL_Y = 3;                              // ground-floor head course
const panes = [];                               // glass panes to connect once the walls exist
const exterior = new Map();                     // "x,z" -> first exposed face

for (const [x, z, gr] of cells) {
  const c = at(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");   // foundation under the lower ground
  const faces = facesOf(x, z, c);
  if (faces.length) exterior.set(`${x},${z}`, faces[0]);
  const F = faces[0];
  // window bays on a face: piers every third block, glass between
  const along = F && (F.d === "north" || F.d === "south") ? x : z;
  const windowHere = F && along % 3 !== 0;

  for (let y = gr; y < c.T; y++) {
    if (y === c.T - 1) { g.set(x, y, z, F ? "white_concrete" : "smooth_stone"); continue; }   // cornice / roof layer
    if (!F) { if (BAND.has(y)) g.set(x, y, z, "smooth_stone"); continue; }                  // interior: floors only
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (y === LINTEL_Y || BAND.has(y)) { g.set(x, y, z, "white_concrete"); continue; }  // plinth, lintel, storey bands
    if (WINDOW_ROWS.has(y)) {
      if (windowHere) { g.set(x, y, z, "glass_pane"); panes.push({ x, y, z, d: F.d }); }
      else g.set(x, y, z, "bricks");
    }
  }
}

// main entrance: an outward-facing ground cell nearest the middle of the front, with a dark oak door and canopy
const doorCands = cells.filter(([x, z, gr]) => gr <= 1 && exterior.get(`${x},${z}`)?.prio === 0);
const [dx0, dz0, dg] = doorCands.sort((a, b) => Math.abs(a[0] - 12) - Math.abs(b[0] - 12))[0];
const dface = exterior.get(`${dx0},${dz0}`).d;
for (let i = panes.length - 1; i >= 0; i--) if (panes[i].x === dx0 && panes[i].z === dz0) panes.splice(i, 1);
g.set(dx0, dg + 1, dz0, "dark_oak_door", { facing: dface, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, dg + 2, dz0, "dark_oak_door", { facing: dface, half: "upper", hinge: "left", open: "false", powered: "false" });
const [adx, adz] = dface === "north" || dface === "south" ? [1, 0] : [0, 1];
for (const s of [-1, 0, 1]) {
  const x = dx0 + adx * s, z = dz0 + adz * s;
  if (!at(x, z)) continue;
  if (s !== 0) { g.set(x, dg + 1, z, "stone_bricks"); g.set(x, dg + 2, z, "stone_bricks"); }
  g.set(x, dg + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// warm light: glowstone on the inside of some window bays, on the storey floor, behind the glass
let lit = 0;
for (const p of panes) {
  if (![8, 14].includes(p.y)) continue;
  if ((p.x * 3 + p.z + p.y) % 4 !== 0) continue;
  const [ox, oz] = DIRS[p.d];
  const nx = p.x - ox, nz = p.z - oz, n = at(nx, nz);
  if (!n || exterior.has(`${nx},${nz}`) || p.y >= n.T - 1) continue;
  g.set(nx, p.y, nz, "glowstone"); lit++;
}

// penthouse on the tower roof: a brick box with glass and a stone cap, standing on the roof layer
for (let x = 18; x <= 20; x++) for (let z = 2; z <= 4; z++) {
  const c = at(x, z);
  if (!c || c.T !== 21) continue;
  const edge = x === 18 || x === 20 || z === 2 || z === 4;
  for (const y of [21, 22]) {
    if (edge) g.set(x, y, z, (x === 19 || z === 3) && y === 21 ? "glass" : "bricks");
  }
  g.set(x, 23, z, "white_concrete");
}

// panes connect in their wall plane only, to any solid block beside them
for (const p of panes) {
  const inPlane = p.d === "north" || p.d === "south" ? [["east", 1, 0], ["west", -1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  for (const [k, ox, oz] of inPlane) if (g.get(p.x + ox, p.y, p.z + oz)) st[k] = "true";
  g.set(p.x, p.y, p.z, "glass_pane", st);
}

const out = `${DIR}/DC78396.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ out, ...info, glowstone: lit, door: [dx0, dz0, dface] }));
