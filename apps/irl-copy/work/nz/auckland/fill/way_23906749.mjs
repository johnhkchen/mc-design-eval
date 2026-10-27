// The Civic: a 1970s civic office block on a basalt-grey plinth. The mass follows the lidar roof (5x5 median, quantised
// to 4-block storeys), so a shell of white piers, light-blue glazing and light-grey spandrels stands on a stepped core;
// a lit ground-floor lobby, a canopied entrance and rooftop plant boxes with lightning rods finish it. No interiors: the
// glass stands on an air gap, with a floor slab at each storey and a roof slab over each tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23906749.cells.json`, "utf8"));
const W = 81, D = 74, H = 60;
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r, top: 0 });
const at = (x, z) => fp.get(key(x, z));
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Massing: the roof is the median over a 7x7 window of footprint cells, quantised to 4-block storeys (so every storey
// line is absolute and the tiers line up), and at least two storeys above the cell's own ground.
for (const c of fp.values()) {
  const v = [];
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b);
  c.top = Math.max(Math.round(v[v.length >> 1] / 4) * 4, Math.ceil((c.g + 8) / 4) * 4);
}
// a cell is massed at height y between its ground and its top; a shell cell touches air or outside at its own height
const mass = (x, z, y) => { const c = at(x, z); return !!c && y >= c.g && y < c.top; };
const ring = (x, z, y) => DIRS.some(([dx, dz]) => !mass(x + dx, z + dz, y));
const outFaces = (x, z, y) => DIRS.filter(([dx, dz]) => !mass(x + dx, z + dz, y)).length;

// Entrance: the lowest street-facing wall, with the longest run of wall face
const onWall = (x, z, dx, dz) => !!at(x, z) && !at(x + dx, z + dz);
let best = null;
for (const c of fp.values()) for (const [dx, dz, name] of DIRS) {
  if (!onWall(c.x, c.z, dx, dz)) continue;
  const [px, pz] = dz ? [1, 0] : [0, 1];
  let len = 1;
  for (const s of [1, -1]) for (let k = 1; onWall(c.x + s * k * px, c.z + s * k * pz, dx, dz); k++) len++;
  const score = c.g * 10 - Math.min(len, 9);
  if (!best || score < best.score) best = { c, dx, dz, name, score };
}
const doorKey = key(best.c.x, best.c.z);
const doorDir = best;

const g = new Voxels([W, H, D]);

// Plinth and foundation, then the shell and the cored interior, storey by storey
for (const c of fp.values()) {
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "polished_andesite");
  for (let y = c.g; y < c.top; y++) {
    if (ring(c.x, c.z, y)) {
      let b = "light_blue_stained_glass";
      const outs = outFaces(c.x, c.z, y);
      if (y === c.g) b = "stone_bricks";
      else if (y === c.top - 1) b = "white_concrete";
      else if (outs >= 2 || (c.x + c.z) % 3 === 0 || y % 4 === 0) b = "white_concrete";
      else if (y % 4 === 3) b = "light_gray_concrete";
      g.set(c.x, y, c.z, b);
    } else if (y === c.g || y % 4 === 0 || y % 4 === 3) {
      // a floor slab at each storey line and a ceiling course under the next one: a lower tier's roof then meets the
      // slab of the tier beside it, instead of standing free in the air beside a higher tier
      g.set(c.x, y, c.z, "smooth_stone");
    }
  }
  // the parapet: one course on the top of every outer wall
  if (ring(c.x, c.z, c.top - 1)) g.set(c.x, c.top, c.z, "white_concrete");
}

// Warm light: a few windows on the lower band of each storey get a glowstone just behind the glass
for (const c of fp.values()) for (let y = c.g + 1; y < c.top - 1; y++) {
  if (y % 4 !== 1 || !ring(c.x, c.z, y)) continue;
  if (((c.x * 31 + c.z * 17 + y * 7) % 5) !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const nx = c.x + dx, nz = c.z + dz;
    if (!mass(nx, nz, y) || ring(nx, nz, y)) continue;
    // inward = the interior neighbour of this glass cell
    g.set(nx, y, nz, "glowstone");
    break;
  }
}

// Entrance: a recessed-style pair of doors in the chosen wall, a canopy band over them, lit lobby lantern either side
{
  const { c, dx, dz, name } = doorDir;
  const [px, pz] = dz ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const x = c.x + s * px, z = c.z + s * pz;
    if (!onWall(x, z, dx, dz)) continue;
    g.set(x, c.g + 3, z, "polished_andesite");
  }
  g.set(c.x, c.g + 1, c.z, "dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.g + 2, c.z, "dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
  // a lamp on each side of the door, on the inside, standing on the lobby floor
  for (const s of [-1, 1]) {
    const x = c.x + s * px, z = c.z + s * pz;
    if (onWall(x, z, dx, dz)) g.set(x - dx, c.g + 1, z - dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant: on each tier with room for it, a box with louvred walls, a roof and a lightning rod, on the roof slab
// and inside the tier's edge by at least one block
const tiers = new Map();
for (const c of fp.values()) tiers.set(c.top, (tiers.get(c.top) || 0) + 1);
for (const [top, area] of [...tiers].sort((a, b) => b[0] - a[0])) {
  if (area < 120 || top < 24) continue;
  const inTier = (x, z) => { const c = at(x, z); return !!c && c.top === top; };
  let pick = null;
  for (const c of fp.values()) {
    if (c.top !== top) continue;
    // d = the Chebyshev distance to the tier's edge: the square of radius d - 1 around c stays inside the tier
    let d = 1;
    for (; d < 12; d++) {
      let edge = false;
      for (let k = -d; k <= d && !edge; k++) for (const [x, z] of [[c.x + k, c.z - d], [c.x + k, c.z + d], [c.x - d, c.z + k], [c.x + d, c.z + k]]) if (!inTier(x, z)) { edge = true; break; }
      if (edge) break;
    }
    if (!pick || d > pick.d) pick = { c, d };
  }
  if (!pick || pick.d < 3) continue;
  const hx = Math.min(5, pick.d - 1), hz = Math.min(4, pick.d - 1);
  const { x: cx, z: cz } = pick.c;
  for (let x = cx - hx; x <= cx + hx; x++) for (let z = cz - hz; z <= cz + hz; z++) {
    const edge = x === cx - hx || x === cx + hx || z === cz - hz || z === cz + hz;
    if (edge) for (let y = top; y < top + 3; y++) g.set(x, y, z, (y === top + 1) ? "iron_bars" : "light_gray_concrete");
    g.set(x, top + 3, z, "light_gray_concrete");
  }
  g.set(cx, top + 4, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/way_23906749.nbt`);

// Checks: every solid block above the foundation touches a solid block below or beside it, and every solid is connected
// to the ground through solid neighbours
const solid = (x, y, z) => g.val(x, y, z) !== 0;
let floating = 0, total = 0;
const seen = new Set(); const stack = [];
g.forEachCell((i, v) => {
  total++;
  const x = i % W, r = Math.floor(i / W), y = r % H, z = Math.floor(r / H);
  if (y === 0) { stack.push(i); seen.add(i); return; }
  if (!solid(x, y - 1, z) && !solid(x - 1, y, z) && !solid(x + 1, y, z) && !solid(x, y, z - 1) && !solid(x, y, z + 1)) floating++;
});
while (stack.length) {
  const i = stack.pop(); const x = i % W, r = Math.floor(i / W), y = r % H, z = Math.floor(r / H);
  for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + a, ny = y + b, nz = z + c;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= H || nz >= D) continue;
    const j = (nz * H + ny) * W + nx;
    if (g.val(nx, ny, nz) && !seen.has(j)) { seen.add(j); stack.push(j); }
  }
}
const unreached = total - seen.size;
console.log(`blocks ${total}, floating ${floating}, unreached from ground ${unreached}, max top ${Math.max(...[...fp.values()].map(c => c.top))}, entrance at ${doorKey} facing ${doorDir.name}`);
