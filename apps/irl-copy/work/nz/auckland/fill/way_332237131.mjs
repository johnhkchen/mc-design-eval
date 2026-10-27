// Way 332237131: a two-storey brick shop-top block (1920s-30s Auckland commercial, Mt Eden village) on the lidar footprint.
// Ground is 0 under every cell; the lidar roof is 10 blocks over most of it, a single 9 corner and a 5 notch at the back.
// Storeys are 4 blocks: ground y0-3 (stone plinth, shopfront glass, fascia), string course y4, upper y5-8 (sill, glass,
// lintel), coping on each cell's top row. Perimeter cells are the walls (one cell thick); the inside is air behind the
// glass, with floor slabs at y0 and y4 and a roof deck under each cell's top. A stair/lift box stands on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237131.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237131.nbt";
const SIZE = [14, 23, 13];

const DIR = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const DIRS = Object.keys(DIR);
const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const GLASS = { north: "false", south: "false", east: "false", west: "false" };

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const F = new Map();
for (const [x, z, g, r] of cells) F.set(k2(x, z), { x, z, g, r });
const has = (x, z) => F.has(k2(x, z));

// exterior faces of each cell (sides with no footprint neighbour); a cell with two or more is a corner
const ext = new Map();
for (const c of F.values()) ext.set(k2(c.x, c.z), DIRS.filter((d) => !has(c.x + DIR[d][0], c.z + DIR[d][1])));
const walls = (x, z) => ext.get(k2(x, z))?.length > 0;

// facade runs: contiguous exterior cells along one face, in order
const runs = [];
for (const d of DIRS) {
  const alongX = d === "north" || d === "south";
  const byLine = new Map();
  for (const c of F.values()) {
    if (!ext.get(k2(c.x, c.z)).includes(d)) continue;
    const line = alongX ? c.z : c.x;
    if (!byLine.has(line)) byLine.set(line, []);
    byLine.get(line).push(c);
  }
  for (const list of byLine.values()) {
    list.sort((a, b) => (alongX ? a.x - b.x : a.z - b.z));
    let run = [];
    for (const c of list) {
      const prev = run[run.length - 1];
      if (prev && (alongX ? c.x : c.z) !== (alongX ? prev.x : prev.z) + 1) { runs.push({ d, cells: run }); run = []; }
      run.push(c);
    }
    if (run.length) runs.push({ d, cells: run });
  }
}
// where each facade cell sits in its run: index and run length, keyed by cell and face
const slot = new Map();
for (const r of runs) r.cells.forEach((c, i) => slot.set(k2(c.x, c.z) + r.d, { i, len: r.cells.length }));

// the street is the longest run (the entrance goes at its middle cell)
const street = runs.reduce((best, r) => (!best || r.cells.length > best.cells.length ? r : best), null);
const doorCell = street.cells[Math.floor((street.cells.length - 1) / 2)];

const out = new Map();
const put = (x, y, z, block, state) => out.set(k3(x, y, z), { block, state });

// perimeter walls, storey by storey
for (const c of F.values()) {
  const { x, z, r } = c;
  const dirs = ext.get(k2(x, z));
  if (!dirs.length) continue;
  const corner = dirs.length > 1;
  const s = corner ? null : slot.get(k2(x, z) + dirs[0]);
  // piers at the run's ends and every third cell; windows between
  const pier = corner || !s || s.i === 0 || s.i === s.len - 1 || s.i % 3 === 0;
  const isDoor = c === doorCell && !corner;
  for (let y = 0; y < r; y++) {
    if (y === r - 1) { put(x, y, z, "stone_bricks"); continue; }               // parapet course on the top row
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                   // plinth
    if (corner) { put(x, y, z, "stone_bricks"); continue; }                    // quoins
    if (y === 4) { put(x, y, z, "stone_bricks"); continue; }                   // string course at the floor
    if (isDoor && y <= 2) continue;                                            // doorway, set below
    if (pier) { put(x, y, z, y === 3 || y === 8 ? "stone_bricks" : "bricks"); continue; }
    if (y <= 3) {                                                              // shopfront: glass, lintel at y3
      if (y === 3) put(x, y, z, "stone_bricks"); else put(x, y, z, "glass_pane", GLASS);
      continue;
    }
    if (y === 5 || y === 8) { put(x, y, z, "stone_bricks"); continue; }        // sill and lintel
    put(x, y, z, "glass_pane", GLASS);                                         // upper windows
  }
}

// interior: floor slabs at y0 and y4, a roof deck under each cell's top, air between
for (const c of F.values()) {
  if (walls(c.x, c.z)) continue;
  put(c.x, 0, c.z, "smooth_stone");
  put(c.x, 4, c.z, "smooth_stone");
  put(c.x, c.r - 1, c.z, "smooth_stone");
}

// the entrance on the street face: a door in the middle cell, a red awning over it and its neighbours
const facing = street.d;
put(doorCell.x, 1, doorCell.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorCell.x, 2, doorCell.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
const mid = street.cells.indexOf(doorCell);
for (const c of street.cells.slice(Math.max(0, mid - 1), mid + 2)) put(c.x, 3, c.z, "red_terracotta");

// warm light: a hanging lantern under the ground-floor slab and glowstone on the upper floor, behind some windows
let n = 0;
for (const r of runs) {
  r.cells.forEach((c, i) => {
    const pier = i === 0 || i === r.cells.length - 1 || i % 3 === 0;
    if (pier || ext.get(k2(c.x, c.z)).length > 1 || c === doorCell) return;
    const ix = c.x - DIR[r.d][0], iz = c.z - DIR[r.d][1];
    if (!has(ix, iz) || walls(ix, iz)) return;                                  // only interior cells behind the glass
    n++;
    if (n % 2 === 0) put(ix, 5, iz, "glowstone");
    else put(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
  });
}

// the roof: a 2x2 stair and lift box, its cap a slab
for (const [x, z] of [[9, 9], [10, 9], [9, 10], [10, 10]]) {
  for (let y = 10; y <= 12; y++) put(x, y, z, "bricks");
  put(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// glass panes join whatever stands beside them on the same course
for (const [kk, v] of out) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = kk.split(",").map(Number);
  v.state = Object.fromEntries(Object.entries(DIR).map(([name, [dx, dz]]) => [name, out.has(k3(x + dx, y, z + dz)) ? "true" : "false"]));
}

const g = new Voxels(SIZE);
for (const [kk, v] of out) {
  const [x, y, z] = kk.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const stats = g.save(OUT);
console.log(JSON.stringify({ file: OUT, ...stats, street: street.d, door: [doorCell.x, doorCell.z], runs: runs.length }));
