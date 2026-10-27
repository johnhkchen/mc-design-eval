// A 1930s reinforced-concrete commercial block, cream plaster over concrete, four storeys on a shopfront ground floor
// with a three-storey wing on the west corner and a plant room on the roof. The lidar roof (19 blocks, 16 m, over most
// of the footprint, down to 10 to 16 at the fringes) is smoothed into three flat tiers. The vertical piers and horizontal
// storey lines read as Deco at a distance; the glass is light blue with lamps set in the air gap behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_401588416.cells.json`, "utf8"));
const SIZE = [45, 32, 42];
const PANE = "light_blue_stained_glass_pane";

const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);
const ground = new Map(), raw = new Map();
for (const [x, z, g, r] of cells) {
  ground.set(key(x, z), g);
  raw.set(key(x, z), r >= 18 ? 19 : r >= 14 ? 15 : 11);       // main block, 3-storey wing, 2-storey wing
}
const inFP = (x, z) => raw.has(key(x, z));

// one pass of majority smoothing over each 3x3 (ties go up), so single lidar-noise cells drop out of the tiers
const tier = new Map();
for (const k of raw.keys()) {
  const [x, z] = parse(k), votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = raw.get(key(x + dx, z + dz)); if (t !== undefined) votes.set(t, (votes.get(t) || 0) + 1);
  }
  let best = 0, bestN = -1;
  for (const [t, n] of votes) if (n > bestN || (n === bestN && t > best)) { best = t; bestN = n; }
  tier.set(k, best);
}

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 }, { name: "west", dx: -1, dz: 0 },
];
const outsideDirs = (x, z) => DIRS.filter((d) => !inFP(x + d.dx, z + d.dz));
// a perimeter cell: its face is exposed to the outside or to a tier step
const perim = (x, z) => DIRS.some((d) => !inFP(x + d.dx, z + d.dz) || tier.get(key(x + d.dx, z + d.dz)) !== tier.get(key(x, z)));

// cells' distance in from the outside edge (1 = on the edge)
const dist = new Map(), queue = [];
for (const k of tier.keys()) { const [x, z] = parse(k); if (outsideDirs(x, z).length) { dist.set(k, 1); queue.push([x, z]); } }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const dd of DIRS) { const nx = x + dd.dx, nz = z + dd.dz, nk = key(nx, nz); if (inFP(nx, nz) && !dist.has(nk)) { dist.set(nk, d + 1); queue.push([nx, nz]); } }
}

const B = new Map();                                          // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

// entrance: the outward face with the most cells, its middle cell takes the door, the two beside it a glazed vestibule
const faceCount = new Map(), faceCells = new Map();
for (const k of tier.keys()) {
  const [x, z] = parse(k);
  for (const d of outsideDirs(x, z)) {
    faceCount.set(d.name, (faceCount.get(d.name) || 0) + 1);
    if (!faceCells.has(d.name)) faceCells.set(d.name, []);
    faceCells.get(d.name).push([x, z]);
  }
}
const face = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const along = (c) => (face === "north" || face === "south" ? c[0] : c[1]);
const fc = faceCells.get(face).sort((a, b) => along(a) - along(b));
const mid = fc[Math.floor(fc.length / 2)];
const entrance = new Map();
for (const c of fc) if (Math.abs(along(c) - along(mid)) <= 1) entrance.set(key(c[0], c[1]), c === mid ? "door" : "vestibule");

// the shell: solid foundation to each cell's ground, a base course, storey lines every 4 blocks, glazed bays between
// piers, a blind parapet and a coping; inside, only the floor slabs and the roof membrane
for (const [k, g] of ground) {
  const [x, z] = parse(k), r = tier.get(k), p = perim(x, z), pier = (x + z) % 3 === 0;
  for (let y = 0; y < r; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }
    if (y === r - 1) { put(x, y, z, p ? "smooth_quartz" : "smooth_stone"); continue; }
    if (!p) { if (y % 4 === 0) put(x, y, z, "smooth_stone"); continue; }
    if (y === g) put(x, y, z, "stone_bricks");                           // base course
    else if (y % 4 === 0) put(x, y, z, "smooth_stone");                  // storey line, and the parapet band at r-3
    else if (y === r - 2) put(x, y, z, pier ? "quartz_block" : "white_concrete");   // blind parapet
    else if (y < 4 || y % 4 !== 3) put(x, y, z, pier ? "quartz_block" : PANE);      // shopfront or window rows
    else put(x, y, z, pier ? "quartz_block" : "white_concrete");          // spandrel
  }
}

// entrance: a door (iron, lower and upper half) with a lintel over it as the canopy, and the vestibule beside
for (const [k, role] of entrance) {
  const [x, z] = parse(k), g = ground.get(k);
  if (role === "door") {
    const st = { facing: face, hinge: "left", open: "false", powered: "false" };
    put(x, g, z, "iron_door", { ...st, half: "lower" });
    put(x, g + 1, z, "iron_door", { ...st, half: "upper" });
  } else {
    put(x, g, z, "stone_bricks");
    put(x, g + 1, z, PANE);
  }
  put(x, g + 2, z, "smooth_quartz");
}

// lamps in the air gap behind some glazed bays: one inward neighbour per pane, never on a storey line
for (const [pos, v] of [...B]) {
  if (v.block !== PANE) continue;
  const [x, y, z] = parse(pos), r = tier.get(key(x, z));
  if (!r || y % 4 === 0 || y >= r - 3 || (x * 7 + z * 5 + y) % 14 !== 0) continue;
  for (const d of DIRS) {
    const nx = x + d.dx, nz = z + d.dz;
    if (inFP(nx, nz) && !perim(nx, nz) && !B.has(`${nx},${y},${nz}`)) { put(nx, y, nz, "glowstone"); break; }
  }
}

// roof: a plant room (concrete, a glazed band, a coping) and a lift overrun, both standing on the roof membrane
let cx = 0, cz = 0, n = 0;
for (const k of tier.keys()) { const [x, z] = parse(k); cx += x; cz += z; n++; }
cx /= n; cz /= n;
const boxOK = (x0, z0, w, h, minDist) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + h; z++) {
    const k = key(x, z);
    if (!inFP(x, z) || tier.get(k) !== 19 || (dist.get(k) || 0) < minDist) return false;
  }
  return true;
};
let plant = null, bestD = Infinity;
for (const k of tier.keys()) {
  const [x0, z0] = parse(k);
  if (!boxOK(x0, z0, 7, 5, 3)) continue;
  const d = (x0 + 3.5 - cx) ** 2 + (z0 + 2 - cz) ** 2;
  if (d < bestD) { bestD = d; plant = [x0, z0]; }
}
if (plant) {
  const [x0, z0] = plant;
  for (let x = x0; x < x0 + 7; x++) for (let z = z0; z < z0 + 5; z++) {
    const edge = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 4;
    for (let y = 19; y <= 21; y++) put(x, y, z, edge && y === 20 ? PANE : "light_gray_concrete");
    put(x, 22, z, "smooth_stone");
  }
  if (boxOK(x0 + 8, z0 + 1, 3, 3, 2)) {
    for (let x = x0 + 8; x < x0 + 11; x++) for (let z = z0 + 1; z < z0 + 4; z++) {
      for (let y = 19; y <= 23; y++) put(x, y, z, "light_gray_concrete");
      put(x, 24, z, "smooth_stone");
    }
  }
  if (inFP(x0 - 2, z0 + 1) && inFP(x0 - 1, z0 + 1) && tier.get(key(x0 - 1, z0 + 1)) === 19) {
    for (let x = x0 - 2; x <= x0 - 1; x++) for (let z = z0 + 1; z <= z0 + 2; z++) if (inFP(x, z)) put(x, 19, z, "iron_block");
  }
}

// pane connections: a pane joins a neighbouring pane or any solid block on that side, as the game does
for (const [pos, v] of B) {
  if (v.block !== PANE) continue;
  const [x, y, z] = parse(pos);
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const d of DIRS) if (B.has(`${x + d.dx},${y},${z + d.dz}`)) st[d.name] = "true";
  v.state = st;
}

const g = new Voxels(SIZE);
for (const [pos, v] of B) { const [x, y, z] = parse(pos); g.set(x, y, z, v.block, v.state); }
const stats = g.save(`${DIR}/way_401588416.nbt`);
console.log(JSON.stringify({ face, entrance: [...entrance.values()], plant, blocks: stats.blocks, palette: stats.palette }));
