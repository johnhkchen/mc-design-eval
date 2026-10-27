// A two-storey interwar masonry block (1920s-30s, plastered brick with a stone base, pale cornice and parapet), a
// shopfront ground storey with a recessed entrance on the south (viewer's) side, and a sash-style pane grid above.
// Solid body on the footprint; each window is a pane with air behind it; a few are lit from behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269465568.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_269465568.nbt`;

const cell = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inFp = (x, z) => cell.has(`${x},${z}`);
const FACES = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];   // N, S, W, E (north is -z)
const exposedFaces = (x, z) => FACES.filter((f) => !inFp(x + f.dx, z + f.dz));
const edge = (x, z) => exposedFaces(x, z).length > 0;

// the front bay over the entrance rises two blocks more; elsewhere the top is the lidar roof, at least two above ground
const BAY = (x, z) => x >= 7 && x <= 10 && z >= 12 && z <= 13;
const top = (x, z) => { const { g, r } = cell.get(`${x},${z}`); return BAY(x, z) ? 10 : Math.max(r, g + 2); };
const solid = (x, y, z) => inFp(x, z) && y >= 0 && y < top(x, z);

// the exposed face a window at row y can open onto: the cell inward of it must be interior, its gap closed on every side
function windowFace(x, z, y) {
  for (const f of exposedFaces(x, z)) {
    const ix = x - f.dx, iz = z - f.dz;
    if (!inFp(ix, iz) || edge(ix, iz) || y < 1 || y >= top(ix, iz)) continue;
    if (FACES.every((n) => solid(ix + n.dx, y, iz + n.dz))) return f;
  }
  return null;
}

const blocks = new Map();   // "x,y,z" -> [block, state]
const put = (x, y, z, b, st = null) => blocks.set(`${x},${y},${z}`, [b, st]);
const panes = new Map();    // pane "x,y,z" -> "ns" (wall runs along x) | "ew" (along z)
const gaps = [];            // air gaps behind windows, filled after the body so the body does not overwrite them

// pass 1: body, foundation, base course, storey lines, cornice and roof
for (const [key, { g }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const T = top(x, z), ed = edge(x, z);
  for (let y = 0; y < T; y++) {
    let b = "bricks";
    if (y < g) b = "stone_bricks";                                        // foundation: nothing floats on a slope
    else if (y === g) b = ed ? "stone_bricks" : "bricks";                 // base course
    else if (y === T - 1) b = ed ? "smooth_quartz" : "smooth_stone";      // cornice, or the flat roof inside
    else if (ed && y === 7) b = "smooth_quartz";                          // upper storey line
    else if (ed && y === 4) b = "white_concrete";                         // sill course
    else if (ed && y === 3 && g === 0) b = "smooth_stone";                // shopfront fascia
    put(x, y, z, b);
  }
  // pass 1b: the parapet, one block above the cornice on the street edge
  if (ed && T >= 8) put(x, T, z, "white_concrete");
}

// pass 2: windows. Shopfronts in full glass on the ground storey, a pane grid (two panes to a bay, brick piers)
// above; each has air behind it, and about one in five is lit from behind.
for (const [key] of cell) {
  const [x, z] = key.split(",").map(Number);
  const T = top(x, z), g = cell.get(key).g;
  for (const y of [g + 1, g + 2, 5, 6]) {
    if (y <= g || y >= T - 1) continue;
    const f = windowFace(x, z, y);
    if (!f) continue;
    const u = f.dz !== 0 ? x : z;
    if (u % 3 === 0) continue;                                            // piers stay brick
    if (y < 4) put(x, y, z, "glass");
    else { put(x, y, z, "glass_pane"); panes.set(`${x},${y},${z}`, f.dz !== 0 ? "ns" : "ew"); }
    const ix = x - f.dx, iz = z - f.dz;
    gaps.push({ ix, y, iz, lit: (ix * 31 + iz * 17 + y * 7) % 5 === 0 });
  }
}
for (const { ix, y, iz, lit } of gaps) {
  if (lit) put(ix, y, iz, "glowstone"); else blocks.delete(`${ix},${y},${iz}`);
}

// pass 3: the entrance on the south side, a two-high oak door in a one-cell vestibule, a lintel and a hanging lantern
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
put(9, 0, 13, "oak_door", { ...DOOR, half: "lower" });
put(9, 1, 13, "oak_door", { ...DOOR, half: "upper" });
blocks.delete("9,0,12"); blocks.delete("9,1,12");
put(9, 2, 13, "lantern", { hanging: "true", waterlogged: "false" });   // an entrance lamp, hung from the fascia above

// pass 4: roof plant: a small stone box on the flat roof, away from the edge
for (let x = 5; x <= 7; x++) for (let z = 6; z <= 8; z++) {
  if (edge(x, z)) continue;
  put(x, 8, z, "stone_bricks");
  put(x, 9, z, "smooth_stone");
}

// pass 5: panes connect along their wall, to neighbouring panes and piers
for (const [k, dir] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const on = (dx, dz) => panes.get(`${x + dx},${y},${z + dz}`) !== undefined;
  const st = dir === "ns"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  blocks.get(k)[1] = st;
}

const g = new Voxels([17, 21, 15]);
for (const [k, [b, st]] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, st ?? undefined);
}
g.save(OUT);
