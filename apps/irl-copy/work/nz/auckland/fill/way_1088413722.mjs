// A 1970s-80s Auckland office block on a basalt plinth, stepped in tiers (eight, seven, four and three storeys), clad in
// white precast concrete with blue glass bands and a glazed shopfront entrance. Walls are one block thick with an air gap
// behind the glass and a floor slab per storey; roof plant sits on the eight-storey tier. Storey lines are at multiples of 4.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1088413722.cells.json`, "utf8"));
const g = new Voxels([32, 45, 27]);

const key = (x, z) => `${x},${z}`;
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const at = (x, z) => fp.get(key(x, z));
// a face of cell (x, z) at height y is exposed when the cell beside it has no block there (outside, or topped below y)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.T; });
// the first storey line above the ground: the ground floor band runs from g up to here
const groundTop = (c) => 4 * Math.ceil((c.g + 1) / 4);

// Per footprint cell: g = ground (foundation top), T = top. The lidar roof is rounded to whole 4-block storeys (the tiers),
// then a 3x3 majority vote flattens the noise; a cell always keeps at least one storey above its ground.
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { x, z, g: ground, T: Math.max(4 * Math.round(roof / 4), groundTop({ g: ground })) });
const voted = new Map();
for (const c of fp.values()) {
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = at(c.x + dx, c.z + dz); if (n) votes.set(n.T, (votes.get(n.T) ?? 0) + 1);
  }
  let best = c.T;
  for (const [t, n] of votes) if (n > (votes.get(best) ?? 0)) best = t;
  voted.set(key(c.x, c.z), Math.max(best, groundTop(c)));
}
for (const c of fp.values()) c.T = voted.get(key(c.x, c.z));

// the rim at the top: the roof edge, where the neighbour is outside the footprint or topped lower
const rimmed = (c) => DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });

// one facade block at height y on an exposed cell: base course, string courses, spandrels, mullioned glass bands
function facade(c, y, faces) {
  if (y === c.g) return "polished_blackstone_bricks";
  if (y === c.T - 1) return "light_gray_concrete";
  if (y % 4 === 0) return "light_gray_concrete";
  if (y % 4 === 3) return "white_concrete";
  if (faces.length > 1) return "light_gray_concrete";
  const along = faces[0][1] ? c.x : c.z;
  if (along % 3 === 0) return "light_gray_concrete";
  return y < groundTop(c) ? "cyan_stained_glass" : "light_blue_stained_glass";
}

for (const c of fp.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, "blackstone"); continue; }     // basalt foundation, solid down to the lowest ground
    const faces = exposed(c.x, c.z, y);
    if (!faces.length) {
      if (y === c.T - 1) g.set(c.x, y, c.z, "gray_concrete");          // roof membrane
      else if (y > c.g && y % 4 === 0) g.set(c.x, y, c.z, "smooth_stone"); // floor slab per storey
      continue;
    }
    g.set(c.x, y, c.z, facade(c, y, faces));
  }
  if (rimmed(c)) g.set(c.x, c.T, c.z, "white_concrete");              // parapet
}

// warm light: a glowstone in the room behind some glass bands (interior air, not a floor or spandrel row)
for (const c of fp.values()) for (let y = c.g + 1; y < c.T - 1; y++) {
  const faces = exposed(c.x, c.z, y);
  if (!faces.length || ![1, 2].includes(y % 4) || (c.x * 3 + c.z * 5 + y) % 4) continue;
  const [dx, dz] = faces[0], n = at(c.x - dx, c.z - dz);
  if (n && y > n.g && y < n.T - 1 && !exposed(n.x, n.z, y).length) g.set(n.x, y, n.z, "glowstone");
}

// the entrance: the longest run of street-level faces (one wall line, one ground level) takes a glazed door at its middle
const lines = new Map();
for (const c of fp.values()) {
  if (c.g + 3 >= c.T) continue;
  for (const d of exposed(c.x, c.z, c.g + 1)) {
    const k = `${d[2]}:${d[1] ? c.z : c.x}`;
    if (!lines.has(k)) lines.set(k, []);
    lines.get(k).push({ c, d, along: d[1] ? c.x : c.z });
  }
}
let door = null;
for (const run of lines.values()) {
  run.sort((a, b) => a.along - b.along);
  for (let i = 0; i < run.length;) {
    let j = i + 1;
    while (j < run.length && run[j].along === run[j - 1].along + 1 && run[j].c.g === run[i].c.g) j++;
    if (!door || j - i > door.run.length) door = { run: run.slice(i, j) };
    i = j;
  }
}
if (door) {
  const mid = Math.floor(door.run.length / 2), { c, d } = door.run[mid];
  const facing = d[2];
  g.set(c.x, c.g + 1, c.z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.g + 2, c.z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const e of door.run.slice(Math.max(0, mid - 1), mid + 2)) g.set(e.c.x, e.c.g + 3, e.c.z, "stone_bricks"); // lintel over the bay
  const inner = at(c.x - d[0], c.z - d[1]);
  if (inner) g.set(inner.x, c.g + 2, inner.z, "glowstone");              // lobby light by the door
}

// roof: a lift and stair overrun, 3 x 3 on the top tier's plateau, and plant boxes on the lower tiers
const top = Math.max(...[...fp.values()].map((c) => c.T));
const tops = [...fp.values()].filter((c) => c.T === top);
const mx = tops.reduce((s, c) => s + c.x, 0) / tops.length, mz = tops.reduce((s, c) => s + c.z, 0) / tops.length;
let core = null;
for (const c of tops) {
  const ok = [0, 1, 2].every((dz) => [0, 1, 2].every((dx) => at(c.x + dx, c.z + dz)?.T === top));
  if (!ok) continue;
  const dist = Math.hypot(c.x + 1 - mx, c.z + 1 - mz);
  if (!core || dist < core.dist) core = { x0: c.x, z0: c.z, dist };
}
if (core) {
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    const edge = dx !== 1 || dz !== 1, x = core.x0 + dx, z = core.z0 + dz;
    for (let y = top; y < top + 4; y++) {
      if (y === top + 3) g.set(x, y, z, "light_gray_concrete");
      else if (!edge) continue;
      else if ((dx === 1 || dz === 1) && y > top) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "white_concrete");
    }
  }
}
for (const tier of [28, 12]) {
  const boxes = [...fp.values()].filter((c) => c.T === tier);
  const pick = boxes.find((c) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
    const n = at(c.x + dx, c.z + dz); return n && n.T === tier && !exposed(n.x, n.z, tier - 1).length;
  }));
  if (!pick) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const y of [tier, tier + 1]) g.set(pick.x + dx, y, pick.z + dz, "light_gray_concrete");
}

g.save(`${DIR}/way_1088413722.nbt`);
