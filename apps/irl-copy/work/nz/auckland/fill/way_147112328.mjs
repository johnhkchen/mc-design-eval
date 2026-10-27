// 80 Anzac Avenue, Auckland CBD: a 1980s concrete-frame office block. Seven storeys on a podium, a higher core
// set back on the south side, lower wings on the west. Cream precast piers, light-grey spandrels and floor edges,
// tinted glass ribbons with warm lamps behind some of them, a stone plinth and a recessed lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_147112328.cells.json`, "utf8"));

const PIER = "white_concrete", SPAN = "light_gray_concrete", GLASS = "cyan_stained_glass";
const PLINTH = "stone_bricks", FOUND = "stone_bricks", LAMP = "glowstone";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

// footprint: ground (y of the cell's lowest ground) and the lidar roof height above y 0
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(k2(x, z), { g, r });
const has = (x, z) => fp.has(k2(x, z));

// roof tiers: 3x3 median of the lidar roof (kills the noise), then three flat tops: wings 22, podium 26, core 30
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const top = new Map();
for (const [x, z] of fp.keys().map((k) => k.split(",").map(Number))) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = fp.get(k2(x + dx, z + dz)); if (c) vals.push(c.r); }
  const m = median(vals);
  top.set(k2(x, z), m >= 28 ? 30 : m >= 24 ? 26 : 22);
}
const T = (x, z) => (has(x, z) ? top.get(k2(x, z)) : 0);
const G = (x, z) => fp.get(k2(x, z)).g;

// storey slabs sit on y = 1 mod 4 (1, 5, 9, 13 ...) so every tier shares one set of floor lines
const isLine = (y) => ((y % 4) + 4) % 4 === 1;

// faces: exposed walls. A cell face points at a neighbour that is outside the footprint or lower than this tier,
// and runs from that neighbour's roof (or the ground) up to this tier's top
const faces = new Map();
for (const [x, z] of fp.keys().map((k) => k.split(",").map(Number))) {
  const g = G(x, z), t = T(x, z);
  for (const d of DIRS) {
    const tn = T(x + d[0], z + d[1]);
    if (tn >= t) continue;
    for (let y = Math.max(tn, g); y < t; y++) {
      const kk = k3(x, y, z);
      if (!faces.has(kk)) faces.set(kk, []);
      faces.get(kk).push(d);
    }
  }
}
const facesAt = (x, y, z) => faces.get(k3(x, y, z)) ?? [];
const hasFaceDir = (x, y, z, d) => facesAt(x, y, z).some((f) => f[0] === d[0] && f[1] === d[1]);

// the lobby: the lowest-ground street-facing wall cell at the ground storey; its door and the bay either side of it
const entrance = (() => {
  let best = null;
  for (const [kk, fs] of faces) {
    const [x, y, z] = kk.split(",").map(Number);
    if (fs.length !== 1 || y !== G(x, z) + 1) continue;
    const along = fs[0][0] !== 0 ? z : x;
    const score = G(x, z) * 100 + Math.abs(along - 19);
    if (!best || score < best.score) best = { x, z, d: fs[0], score };
  }
  return best;
})();

const v = new Voxels([41, 43, 39]);

// 1 foundation and the structure: floor slabs on every storey line, the roof slab, and the wall faces
for (const [x, z] of fp.keys().map((k) => k.split(",").map(Number))) {
  const g = G(x, z), t = T(x, z);
  for (let y = 0; y < g; y++) v.set(x, y, z, FOUND);
  for (let y = g + 3; y < t - 1; y++) if (isLine(y)) v.set(x, y, z, SPAN);
  v.set(x, t - 1, z, SPAN);
}

// 2 the facades: plinth, spandrels, cornice, parapet, then glass in piers' bays, with the lobby cut in at the entrance
const glassCells = [];
for (const [kk, fs] of faces) {
  const [x, y, z] = kk.split(",").map(Number);
  const g = G(x, z), t = T(x, z);
  if (y === t - 1) { v.set(x, y, z, SPAN); continue; }
  if (y === g) { v.set(x, y, z, PLINTH); continue; }
  if (isLine(y) && y >= g + 3) { v.set(x, y, z, SPAN); continue; }
  let pier = fs.length >= 2;
  if (!pier) {
    const d = fs[0], along = d[0] !== 0 ? z : x;
    const tn = [d[1], d[0]];                 // the wall's tangent
    pier = along % 3 === 0 || !hasFaceDir(x + tn[0], y, z + tn[1], d) || !hasFaceDir(x - tn[0], y, z - tn[1], d);
  }
  if (pier) v.set(x, y, z, PIER);
  else { v.set(x, y, z, GLASS); glassCells.push({ x, y, z, d: fs[0] }); }
}
// parapet on top of every wall cell
for (const [kk] of faces) {
  const [x, y, z] = kk.split(",").map(Number);
  if (y === T(x, z) - 1) v.set(x, y + 1, z, PIER);
}

// the lobby: iron door at the entrance (two high), a lintel over the bay, and a lamp just inside
if (entrance) {
  const { x, z, d } = entrance, g = G(x, z), tn = [d[1], d[0]];
  const facing = FACING[`${d[0]},${d[1]}`];
  v.set(x, g, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 1, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const s of [-1, 0, 1]) v.set(x + tn[0] * s, g + 2, z + tn[1] * s, PIER);
  const ix = x - d[0], iz = z - d[1];
  if (has(ix, iz) && G(ix, iz) === g && T(ix, iz) > g + 1) v.set(ix, g, iz, LAMP);
}

// 3 warm light behind some glass: a glowstone on the floor just inside the pane, where the cell inside is open air
// and has its own floor under the lamp (the shopfront lamps stand on the ground row)
const floorUnder = (x, y, z) => has(x, z) && y >= G(x, z) + 3 && isLine(y) && y < T(x, z) - 1;
for (const { x, y, z, d } of glassCells) {
  const ix = x - d[0], iz = z - d[1];
  if (!has(ix, iz) || facesAt(ix, y, iz).length) continue;
  const along = d[0] !== 0 ? z : x, g = G(x, z);
  if (y === g + 1) {
    if (along % 4 === 2 && G(ix, iz) === g && T(ix, iz) > g) v.set(ix, g, iz, LAMP);
  } else if (isLine(y - 1) && (along + y) % 7 === 0 && floorUnder(ix, y - 1, iz)) {
    v.set(ix, y, iz, LAMP);
  }
}

// 4 roof: plant rooms on the podium, a lift overrun on the core
for (const [x, z] of fp.keys().map((k) => k.split(",").map(Number))) {
  if (T(x, z) === 26 && x % 5 === 2 && z % 5 === 2) {
    const ring = [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dz) => T(x + dx, z + dz)));
    if (ring.every((t) => t >= 26)) { v.set(x, 26, z, SPAN); v.set(x, 27, z, SPAN); }
  }
  if (T(x, z) === 30 && x % 4 === 1 && z % 4 === 1 && !facesAt(x, 29, z).length) {
    v.set(x, 30, z, SPAN); v.set(x, 31, z, GLASS);
  }
}

const stats = v.save(`${DIR}/way_147112328.nbt`);
console.log(JSON.stringify({ entrance: entrance && { x: entrance.x, z: entrance.z, d: entrance.d }, ...stats }));
