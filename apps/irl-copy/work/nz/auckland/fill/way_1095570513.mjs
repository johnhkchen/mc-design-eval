// Auckland, way 1095570513: a two-storey interwar brick shop-and-flat. The lidar reads one flat roof (9 blocks) over all
// 30 cells, so there are no tiers: walls rise from the grade, a stone base, a shopfront band, a string course over the
// ground storey, a window storey, a cornice, and a brick parapet over a roof deck. Stone quoins at the corners; the door
// is set in the front wall. Only footprint cells are built; the interior is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095570513.cells.json`, "utf8"));   // [x, z, ground, roof]

const k2 = (x, z) => `${x},${z}`;
const inF = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // outward normals: north (-z), south (+z), west (-x), east (+x)
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
const interior = (x, z) => DIRS.every(([dx, dz]) => inF(x + dx, z + dz));

// Windows run along each wall line (cells sharing an outward normal and a z or x), so the piers and panes count from the
// line's end: the rel index of a cell in its run, and the run length.
const lines = new Map();
for (const [x, z] of cells) {
  const ex = exposed(x, z); if (!ex.length) continue;
  const [dx, dz] = ex[0];
  const line = dz ? `z${z}${dz}` : `x${x}${dx}`;
  if (!lines.has(line)) lines.set(line, []);
  lines.get(line).push({ i: dz ? x : z, k: k2(x, z) });
}
const face = new Map();
for (const pts of lines.values()) {
  pts.sort((a, b) => a.i - b.i);
  for (let s = 0; s < pts.length;) {
    let e = s; while (e + 1 < pts.length && pts[e + 1].i === pts[e].i + 1) e++;
    for (let r = s; r <= e; r++) face.set(pts[r].k, { rel: r - s, len: e - s + 1 });
    s = e + 1;
  }
}
// a window is any wall cell that is not a corner; on a run of four or more, every third cell from its start (and its end) is a pier.
// The staircase plan gives short runs, so most of the wall is glazed on the two storeys and the piers come from the longer runs.
const isWindow = (k) => { const f = face.get(k); return !!f && (f.len < 4 || (f.rel % 3 !== 0 && f.rel !== f.len - 1)); };

const DOOR = k2(2, 0);   // the middle of the front (north) run
const B = new Map();     // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, [block, state]);

for (const [x, z, ground, roof] of cells) {
  const k = k2(x, z), ex = exposed(x, z), wall = ex.length > 0, corner = ex.length > 1;
  for (let y = 0; y < roof; y++) {
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }   // foundation (none here: ground is 0)
    if (!wall) {                                                 // interior: air, with the floor slab and roof deck
      if (y === 4) put(x, y, z, "smooth_stone");
      else if (y === roof - 2) put(x, y, z, "stone_bricks");
      continue;
    }
    if (k === DOOR && y <= 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (k === DOOR && y === 2) { put(x, y, z, "smooth_stone"); continue; }   // lintel over the door
    if (y === 0) put(x, y, z, "polished_andesite");               // base course
    else if (y === roof - 1) put(x, y, z, "bricks");              // parapet
    else if (y === roof - 2 || y === 3 || y === 4) put(x, y, z, "smooth_stone");   // cornice, fascia, string course
    else if (!corner && isWindow(k)) put(x, y, z, "glass_pane");
    else put(x, y, z, "bricks");                                  // piers and corners
  }
}

// warm light behind some upper-storey panes: glowstone standing on the floor slab, or a lantern hung from the roof deck
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1 || !isWindow(k2(x, z))) continue;
  const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
  if (!interior(ix, iz)) continue;
  if ((x + z) % 3 === 0) put(ix, 5, iz, "glowstone");
  else if ((x + z) % 3 === 1) put(ix, 6, iz, "lantern", { hanging: "true" });
}
// the entrance lantern, hung from the upper floor slab just inside the door
put(2, 3, 1, "lantern", { hanging: "true" });

// roof plant: a light-grey box on the roof deck, at the interior cell nearest the centre
const inside = cells.filter(([x, z]) => interior(x, z));
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
const [px, pz, , pr] = inside.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
put(px, pr - 1, pz, "light_gray_concrete");
if (interior(px + 1, pz)) put(px + 1, pr - 1, pz, "light_gray_concrete");

// glass panes connect to their neighbours in the same storey: another pane or a solid block
const SOLID = new Set(["bricks", "smooth_stone", "stone_bricks", "polished_andesite", "glowstone", "light_gray_concrete", "glass_pane"]);
for (const [key, [block]] of B) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (dx, dz) => (SOLID.has(B.get(`${x + dx},${y},${z + dz}`)?.[0]) ? "true" : "false");
  B.set(key, [block, { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0) }]);
}

const g = new Voxels([8, 10, 6]);
for (const [key, [block, state]] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, block, state); }
const out = g.save(`${DIR}/way_1095570513.nbt`);
console.log(`way_1095570513: ${out.blocks} blocks, ${out.palette} palette entries`);
