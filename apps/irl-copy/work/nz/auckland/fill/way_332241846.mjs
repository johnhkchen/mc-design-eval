// Way 332241846, Mt Eden: a three-storey interwar commercial block (shops at street level, flats above), plastered
// brick with a basalt base and a stepped parapet. Lidar roofs read 13-15 across most of the footprint and 11 at
// the low wings, so the massing is two tiers (roof decks at y 11 and y 15) with a plant room on the central bay.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241846.cells.json", "utf8"));
const X = 31, Y = 28, Z = 21;
const FLOOR_LINES = [3, 7, 11, 15];   // slab under each storey: 3 = ground floor, then 4-block storeys

const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roof.set(key(x, z), r); }
const inS = (x, z) => roof.has(key(x, z));

// 3x3 mean of the lidar roof over the footprint: irons out the stair-stepped noise (values of 3, 6, 9 at the edges)
const smooth = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roof.get(key(x + dx, z + dz)); if (r !== undefined) { s += r; n++; } }
  return s / n;
};
// the top of the building at a cell: 11 (two storeys, the low wings) or 15 (three storeys, the body and the centre)
const topOf = (x, z) => (inS(x, z) ? (smooth(x, z) < 12.5 ? 11 : 15) : 0);

const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const exterior = (x, z) => DIRS.filter(([, dx, dz]) => !inS(x + dx, z + dz));
// a side that faces air at this storey: outside the footprint, or a neighbour that stops below it (the setback face)
const exposed = (x, z, L) => DIRS.filter(([, dx, dz]) => !inS(x + dx, z + dz) || topOf(x + dx, z + dz) <= L);

// depth from the outer edge, so the plant room sits in the middle of the block
const depth = new Map(); {
  const q = [];
  for (const [x, z] of cells.map(c => [c[0], c[1]])) if (exterior(x, z).length) { depth.set(key(x, z), 1); q.push([x, z]); }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = depth.get(key(x, z));
    for (const [, dx, dz] of DIRS) { const nx = x + dx, nz = z + dz, k = key(nx, nz); if (inS(nx, nz) && !depth.has(k)) { depth.set(k, d + 1); q.push([nx, nz]); } }
  }
}

// one block per cell and height, written into a map first so panes can be linked to their neighbours before the volume is built
const B = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) throw new Error(`outside the volume: ${x},${y},${z}`);
  B.set(`${x},${y},${z}`, { block, state });
};

// the wall face's bay: piers at corners and every third bay, panes between
const bayOf = (ex, x, z) => {
  const axes = new Set(ex.map(([n]) => (n === "north" || n === "south" ? "ns" : "ew")));
  return { pier: axes.size > 1, bay: axes.has("ns") ? x : z, face: ex[0][0] };
};

// the entrance: on the south face, the bay nearest the middle of that face
const southCells = cells.map(c => [c[0], c[1]]).filter(([x, z]) => exterior(x, z).some(d => d[0] === "south"));
const xs = southCells.map(c => c[0]).sort((a, b) => a - b), medX = xs[Math.floor(xs.length / 2)];
const door = southCells.reduce((best, c) => (!best || Math.abs(c[0] - medX) < Math.abs(best[0] - medX) ? c : best), null);

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const T = topOf(x, z), ext = exterior(x, z), perim = ext.length > 0;

  // foundation: solid from y 0 up to the floor line, so the building stands on the slope
  for (let y = 0; y <= 2; y++) put(x, y, z, "polished_basalt");

  for (const L of FLOOR_LINES) {
    if (L > T) continue;
    if (perim && L === 3) put(x, L, z, "polished_basalt");                    // base course
    else if (perim && L === T) put(x, L, z, "smooth_quartz");                   // cornice under the parapet
    else if (perim) put(x, L, z, "smooth_quartz");                              // storey line
    else if (L === T) put(x, L, z, "gray_concrete");                            // roof membrane
    else put(x, L, z, "smooth_stone");                                          // floor slab

    // the storey's walls: 3 blocks between this slab and the next (spandrel, glass, head)
    if (L >= T) continue;
    const ex = exposed(x, z, L);
    if (ex.length === 0) continue;
    const { pier, bay, face } = bayOf(ex, x, z);
    const isDoor = door && door[0] === x && door[1] === z && L === 3;

    if (L === 3) {
      if (isDoor) {
        const facing = "south";
        put(x, 4, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, 5, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier) { put(x, 4, z, "quartz_pillar"); put(x, 5, z, "quartz_pillar"); }
      else { put(x, 4, z, "glass"); put(x, 5, z, "glass"); }
      put(x, 6, z, pier ? "quartz_pillar" : "polished_blackstone");               // fascia, and the canopy lintel over the door
    } else {
      if (pier) { put(x, L + 1, z, "quartz_pillar"); put(x, L + 2, z, "quartz_pillar"); put(x, L + 3, z, "quartz_pillar"); }
      else { put(x, L + 1, z, "smooth_quartz"); put(x, L + 2, z, "glass_pane"); put(x, L + 3, z, "smooth_quartz"); }
    }

    // warm lights: a hanging lantern in the air behind some panes, hung from the slab above
    if (!pier && bay % 6 === (L === 3 ? 4 : 1)) {
      const [, dx, dz] = DIRS.find(d => d[0] === face);
      const ix = x - dx, iz = z - dz;
      if (inS(ix, iz) && exterior(ix, iz).length === 0 && topOf(ix, iz) > L)
        put(ix, L + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // parapet on the outer edge, piers rising through it
  if (perim) {
    const { pier, bay } = bayOf(ext, x, z);
    put(x, T + 1, z, pier || bay % 3 === 0 ? "quartz_pillar" : "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }

  // plant room on the central bay, one block above the roof deck
  if (T === 15 && (depth.get(key(x, z)) ?? 0) >= 6 && smooth(x, z) >= 14.5) put(x, 16, z, "stone_bricks");
}

// the glass panes connect to whatever stands beside them
for (const [k, v] of B) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const conn = (dx, dz) => (B.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  v.state = { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" };
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of B) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241846.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
