// Way 162152525, Mt Eden / Eden Terrace: a 1930s reinforced-concrete commercial block. Auckland's volcanic basalt
// base course, cream plastered walls with quartz piers, steel-framed glass ribbons, stone string courses at every
// floor and a chiselled cornice. Four storeys of 4 blocks (floor slabs at y 4, 8, 12, 16; roof deck at y 19, top 20 =
// the lidar roof). Solid slabs across the footprint, a hollow shell with air behind the glass, glowstone on some
// floors behind the windows, a shopfront entrance on the downhill (south) face, and a plant room on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152525.cells.json", "utf8"));   // [x, z, ground, roof]

const W = 21, H = 33, D = 40;
const SLABS = [4, 8, 12, 16];                       // floor slabs (solid across the footprint)
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const B = {
  base: "polished_basalt", string: "stone_bricks", cornice: "chiseled_stone_bricks", deck: "gray_concrete",
  floor: "smooth_quartz", render: "smooth_quartz", pier: "quartz_pillar", glass: "light_blue_stained_glass",
  glow: "glowstone", plant: "light_gray_concrete",
};

// Roof: the lidar's 3x3 median (over the footprint) snapped to a flat tier: 20 (four storeys) or 16 (three).
const rAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const S = new Map();
for (const [x, z, g] of cells) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const q = rAt.get(`${x + dx},${z + dz}`); if (q !== undefined) v.push(q); }
  v.sort((a, b) => a - b);
  S.set(`${x},${z}`, { x, z, g, top: v[Math.floor(v.length / 2)] >= 18 ? 20 : 16 });
}
const at = (x, z) => S.get(`${x},${z}`);
for (const c of S.values()) {
  c.out = [], c.step = [];                          // out: faces onto air; step: faces onto a lower neighbour
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) c.out.push(d); else if (n.top < c.top) c.step.push(d);
  }
  c.wall = c.out.length > 0 || c.step.length > 0;
}

// Entrance: the south (downhill) face at grade, the one nearest the middle of the front.
const door = [...S.values()].filter((c) => c.out.length === 1 && c.out[0] === "s").sort((a, b) => Math.abs(a.x - 10) - Math.abs(b.x - 10))[0];

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const glow = new Set();

for (const c of S.values()) {
  const { x, z, top: T } = c;
  for (let y = 0; y < T; y++) {
    if (y < 4) { put(x, y, z, B.base); continue; }               // basalt plinth and foundation
    if (y === T - 1) { put(x, y, z, c.wall ? B.cornice : B.deck); continue; }   // cornice ring, roof deck within
    if (SLABS.includes(y)) { put(x, y, z, c.wall ? B.string : B.floor); continue; }
    if (!c.wall) continue;                                         // hollow inside: air
    if (c.out.length === 0) { put(x, y, z, B.render); continue; }   // a step face onto a lower tier: plain

    const floorLine = Math.max(...SLABS.filter((s) => s < y)), o = y - floorLine;   // 1..3 within the storey
    const primary = c.out[0], along = primary === "n" || primary === "s" ? x : z;
    if (door && x === door.x && z === door.z) {
      if (y === 5 || y === 6) { put(x, y, z, "dark_oak_door", { facing: "north", half: y === 5 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 7) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    }
    if (c.out.length > 1 || along % 3 === 0) { put(x, y, z, B.pier, { axis: "y" }); continue; }   // piers, corners
    if (o === 3) { put(x, y, z, B.render); continue; }             // header over each window
    put(x, y, z, B.glass);
    // warm light: glowstone on the floor inside, behind some windows
    const [dx, dz] = DIRS[primary], ix = x - dx, iz = z - dz, inner = at(ix, iz);
    if (inner && !inner.wall && (x * 5 + z * 3 + floorLine) % 4 === 0) glow.add(`${ix},${floorLine + 1},${iz}`);
  }
}

for (const k of glow) { const [x, y, z] = k.split(",").map(Number); put(x, y, z, B.glow); }

// Roof plant room: a block on the deck, set in from the parapet.
const zs = [...S.values()].map((c) => c.z), zc = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (const c of S.values()) {
  if (c.wall || c.top !== 20 || c.x < 7 || c.x > 13 || Math.abs(c.z - zc) > 2) continue;
  for (let y = 20; y <= 22; y++) put(c.x, y, c.z, B.plant);
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152525.nbt";
const res = v.save(out);
console.log(`way_162152525: ${res.blocks} blocks, ${res.palette} palette entries, door at (${door.x}, 5, ${door.z}) -> ${out}`);
