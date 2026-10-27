// way 260091869: a 1930s reinforced-concrete commercial block in cream plaster on a dark volcanic (polished andesite)
// plinth, the Art Deco stepped parapet and vertical piers of the Eden Terrace / Newton streets. Four storeys (16 blocks)
// on the high side, three (14) on the low wings, a 17-block corner, all on the lidar's roof heights in clean tiers.
// The footprint carries the massing: foundation under every cell, a hollow shell (perimeter walls, slabs per storey,
// air behind the glass) and the roof deck; the entrance faces the low west side at grade.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260091869.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260091869.nbt";
const SX = 31, SZ = 30, SY = 20;
const DOOR = { x: 0, z: 6 };

// the lidar roof (above y 0) in clean tiers: <=14 three storeys and a cornice, <=16 four storeys, else the corner parapet at 17
const tierOf = (r) => (r <= 14 ? 14 : r <= 16 ? 16 : 17);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, t: tierOf(r) });
const inFp = (x, z) => fp.has(`${x},${z}`);
const exposure = (x, z) => ({ N: !inFp(x, z - 1), S: !inFp(x, z + 1), W: !inFp(x - 1, z), E: !inFp(x + 1, z) });
const perimeter = (x, z) => { const e = exposure(x, z); return e.N || e.S || e.W || e.E; };

const blocks = new Map();   // "x,y,z" -> { name, state, face }
const put = (x, y, z, name, state, face) => blocks.set(`${x},${y},${z}`, { x, y, z, name, state, face });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);

for (const [key, { g, t }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const e = exposure(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, "polished_andesite");                       // foundation up to the cell's ground
  if (!perimeter(x, z)) {
    // interior: a solid floor slab per storey and the roof deck, air between (no interiors, the glass has air behind it)
    const slabs = new Set([g, t - 2, t - 1]);
    for (let y = 4; y < t - 1; y += 4) slabs.add(y);
    for (let y = g; y < t; y++) if (slabs.has(y)) put(x, y, z, y === t - 1 ? "smooth_stone" : "smooth_quartz");
    continue;
  }
  const nsExp = e.N || e.S, ewExp = e.W || e.E;
  const corner = nsExp && ewExp;
  const idx = corner ? null : nsExp ? x : z;                                           // position along the face
  const pier = corner || idx % 3 === 0;
  const doorZone = x === DOOR.x && Math.abs(z - DOOR.z) <= 1;
  for (let y = g; y < t; y++) {
    if (doorZone) {
      if (z === DOOR.z && y === g) { put(x, y, z, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (z === DOOR.z && y === g + 1) { put(x, y, z, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === g + 3) { put(x, y, z, "polished_andesite"); continue; }                // the canopy over the entrance
      if (y <= g + 1 || (y === g + 2 && z === DOOR.z)) { put(x, y, z, "polished_andesite"); continue; }
      if (y === g + 2) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    }
    const r = y % 4;
    if (y === t - 1 || y === g) put(x, y, z, "polished_andesite");                     // parapet cap and the plinth course
    else if (y > 0 && r === 0) put(x, y, z, "quartz_bricks");                          // storey string course
    else if ((r === 1 || r === 2) && y <= t - 3) {
      if (pier) put(x, y, z, "quartz_pillar", { axis: "y" });
      else put(x, y, z, "glass_pane", null, nsExp ? "ns" : "ew");                     // window, panes joined below
    } else put(x, y, z, "smooth_quartz");                                              // spandrel
  }
}

// warm light: glowstone standing on the floor just inside some windows (the glass then has a lit room behind it)
let lights = 0;
for (const b of [...blocks.values()]) {
  if (b.name !== "glass_pane" || b.y % 4 !== 1) continue;
  const idx = b.face === "ns" ? b.x : b.z;
  if (idx % 4 !== 2) continue;
  const [dx, dz] = b.face === "ns" ? [0, exposure(b.x, b.z).N ? 1 : -1] : [exposure(b.x, b.z).W ? 1 : -1, 0];
  const ix = b.x + dx, iz = b.z + dz;
  if (!inFp(ix, iz) || perimeter(ix, iz) || has(ix, b.y, iz)) continue;
  put(ix, b.y, iz, "glowstone"); lights++;
}

// roof plant: a few units on the four-storey deck, standing on it
let plant = 0;
for (const [key, { t }] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (t !== 16 || perimeter(x, z) || x % 5 !== 2 || z % 5 !== 2) continue;
  put(x, t, z, "light_gray_concrete"); plant++;
}

// panes join their neighbours in the plane of the wall (and not into the room behind)
for (const b of blocks.values()) {
  if (b.name !== "glass_pane") continue;
  const lr = b.face === "ns" ? [has(b.x - 1, b.y, b.z), has(b.x + 1, b.y, b.z)] : [has(b.x, b.y, b.z - 1), has(b.x, b.y, b.z + 1)];
  const st = b.face === "ns"
    ? { north: "false", south: "false", east: lr[1] ? "true" : "false", west: lr[0] ? "true" : "false" }
    : { north: lr[0] ? "true" : "false", south: lr[1] ? "true" : "false", east: "false", west: "false" };
  b.state = { ...st, waterlogged: "false" };
}

// every block must stand on something: flood from the ground through solid neighbours and count what is cut off
const seen = new Set(), queue = [];
for (const b of blocks.values()) if (b.y === 0) { const k = `${b.x},${b.y},${b.z}`; seen.add(k); queue.push(b); }
for (let i = 0; i < queue.length; i++) {
  const { x, y, z } = queue[i];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const k = `${x + dx},${y + dy},${z + dz}`;
    if (!blocks.has(k) || seen.has(k)) continue;
    seen.add(k); queue.push(blocks.get(k));
  }
}
const floating = [...blocks.values()].filter((b) => !seen.has(`${b.x},${b.y},${b.z}`));

const vox = new Voxels([SX, SY, SZ]);
for (const b of blocks.values()) {
  if (b.y < 0 || b.y >= SY || b.x < 0 || b.x >= SX || b.z < 0 || b.z >= SZ) throw new Error(`out of the box: ${b.x},${b.y},${b.z}`);
  vox.set(b.x, b.y, b.z, b.name, b.state);
}
const res = vox.save(OUT);
console.log(JSON.stringify({ cells: fp.size, blocks: res.blocks, palette: res.palette, lights, plant, floating: floating.length, maxY: Math.max(...[...blocks.values()].map((b) => b.y)) + 1 }));
