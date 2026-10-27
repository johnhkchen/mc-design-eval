// Konica Minolta, Auckland CBD. Read from the lidar record: a flat-roofed 1990s speculative office, five storeys
// (roof 20 blocks, about 16.7 m) on a stone plinth, with a 2-3 block roof-plant core over the middle of the plate and a
// ground-level plaza (roof 0-2) along the south-west edge. Concrete frame, white and light-grey precast bands, a ribbon
// of blue-tinted glazing per storey, a clear shopfront at grade, a dark-oak entrance under a quartz lintel, and warm
// lanterns hung behind some panes. Shell only: one-block facade, air behind the glass, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465513.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465513.nbt";
const [W, H, D] = [45, 36, 53];
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// lidar roof height above y 0 per footprint cell
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r);
const fp = (x, z) => roof.has(`${x},${z}`);
const PLAZA_MAX = 8;                                   // roofs 0-6 are paving, not a building (no 7-13 in the record)
const tower = (x, z) => fp(x, z) && roof.get(`${x},${z}`) > PLAZA_MAX;

const towers = [], plazas = [];
for (const [x, z, , r] of cells) (r > PLAZA_MAX ? towers : plazas).push([x, z]);

// exposure to the outside (neighbour not part of the building): N = z-1, S = z+1, W = x-1, E = x+1
const expo = (x, z) => ({ N: !tower(x, z - 1), S: !tower(x, z + 1), W: !tower(x - 1, z), E: !tower(x + 1, z) });
const perim = (e) => e.N || e.S || e.W || e.E;
const corner = (e) => (e.N || e.S) && (e.W || e.E);

// one map of final blocks; panes get their connection states last, then everything is written in one pass
const P = new Map();
const K = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return; P.set(K(x, y, z), { block, state }); };
const get = (x, y, z) => P.get(K(x, y, z));

// storeys: slab row at each base, 4 rows per storey; the top storey is two rows and a cornice under the roof deck
const SLAB = [1, 5, 9, 13, 17];
const DECK = 19, ROOF = 20;                            // deck row 19 -> roof surface at 20

// 1. foundation under every footprint cell, the plaza deck, the building
for (const [x, z] of towers) put(x, 0, z, "stone_bricks");
for (const [x, z] of plazas) { put(x, 0, z, "stone_bricks"); put(x, 1, z, "smooth_stone"); }

// the air gap: one block deep behind the glazed rows of storeys 0-3; everything else in the footprint is solid, so each
// slab and the roof deck stand on the block under them (no rooms, no floating floors)
const GAP_ROWS = new Set(SLAB.slice(0, 4).flatMap((b) => [b + 2, b + 3]));
const panes = [];                                      // facade glazing, for the connection and light passes
for (const [x, z] of towers) {
  const e = expo(x, z), per = perim(e), cor = corner(e);
  const behindGlass = !per && [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]].some(([a, c]) => tower(a, c) && perim(expo(a, c)));
  const bay = e.N || e.S ? x : z;                      // mullion rhythm along the face: every 3rd block
  const mull = bay % 3 === 0;
  if (!per) {
    for (let y = 1; y < DECK; y++) if (!(behindGlass && GAP_ROWS.has(y))) put(x, y, z, "light_gray_concrete");
    put(x, DECK, z, "stone");                          // roof deck, mid-grey membrane
    continue;
  }
  put(x, 1, z, "polished_andesite");                   // plinth course at grade
  SLAB.forEach((b, s) => {
    if (s > 0) put(x, b, z, "light_gray_concrete");    // storey line
    if (s === 0) {
      put(x, 2, z, cor ? "white_concrete" : "polished_andesite");           // shopfront bulkhead
      for (const y of [3, 4]) glaze(x, y, z, s, cor, mull, "gray_concrete", "glass_pane");
    } else if (s === 4) {
      glaze(x, 18, z, s, cor, mull, "light_gray_concrete", "light_blue_stained_glass_pane");
    } else {
      put(x, b + 1, z, "white_concrete");              // spandrel
      for (const y of [b + 2, b + 3]) glaze(x, y, z, s, cor, mull, "light_gray_concrete", "light_blue_stained_glass_pane");
    }
  });
  put(x, DECK, z, "smooth_quartz");                    // cornice on the edge of the roof
}

function glaze(x, y, z, s, cor, mull, mullBlock, paneBlock) {
  if (cor) return put(x, y, z, "white_concrete");
  if (mull) return put(x, y, z, mullBlock);
  put(x, y, z, paneBlock);
  panes.push({ x, y, z, s, b: SLAB[s] });
}

// 2. roof plant core: where the lidar roof is 22-23, the mass stands on the deck up to that height
for (const [x, z] of towers) {
  const r = roof.get(`${x},${z}`);
  if (r < 22) continue;
  for (let y = ROOF; y <= r - 2; y++) put(x, y, z, "white_concrete");
  put(x, r - 1, z, "smooth_quartz");
}

// 3. two air-handling units on the deck, spaced apart, off the core
const ahus = [];
for (let z = 2; z < D - 2 && ahus.length < 3; z += 3) for (let x = 2; x < W - 2 && ahus.length < 3; x += 3) {
  const ok = [0, 1].every((dx) => [0, 1].every((dz) => {
    const cx = x + dx, cz = z + dz;
    return tower(cx, cz) && roof.get(`${cx},${cz}`) === 20 && !perim(expo(cx, cz));
  }));
  if (!ok || ahus.some(([ax, az]) => Math.abs(ax - x) < 8 && Math.abs(az - z) < 8)) continue;
  if (Array.from({ length: 2 }, (_, i) => i).some((i) => [0, 1].some((j) => P.has(K(x + i, 20, z + j))))) continue;
  ahus.push([x, z]);
  for (const dx of [0, 1]) for (const dz of [0, 1]) {
    put(x + dx, ROOF, z + dz, "light_gray_concrete");
    put(x + dx, ROOF + 1, z + dz, dx === 0 && dz === 0 ? "smooth_stone" : "gray_concrete");
  }
}

// 4. entrance on the longest street-facing run: dark-oak door at grade under a quartz lintel
const runs = { N: [], S: [], W: [], E: [] };
for (const [x, z] of towers) {
  const e = expo(x, z);
  if (!perim(e) || corner(e)) continue;
  for (const d of Object.keys(runs)) if (e[d]) runs[d].push([x, z]);
}
const front = Object.keys(runs).reduce((a, d) => (runs[d].length > runs[a].length ? d : a), "N");
const run = runs[front].sort((a, b) => (front === "N" || front === "S" ? a[0] - b[0] : a[1] - b[1]));
const mid = Math.floor(run.length / 2);
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const doorCells = run.slice(Math.max(0, mid - 1), mid + 2);
const [dx0, dz0] = run[mid];
for (const [x, z] of doorCells) put(x, 4, z, "smooth_quartz");   // lintel across the entrance bay
put(dx0, 2, dz0, "dark_oak_door", { facing: FACING[front], half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx0, 3, dz0, "dark_oak_door", { facing: FACING[front], half: "upper", hinge: "left", open: "false", powered: "false" });
const doorKeys = new Set([K(dx0, 2, dz0), K(dx0, 3, dz0)]);

// 5. warm light behind some panes: lanterns hung from the storey slab above, and lanterns standing on the floor
const inward = (e) => (e.N ? [0, 1] : e.S ? [0, -1] : e.W ? [1, 0] : [-1, 0]);
for (const p of panes) {
  if (doorKeys.has(K(p.x, p.y, p.z))) continue;
  const e = expo(p.x, p.z);
  if (corner(e) || !perim(e)) continue;
  const [ix, iz] = inward(e).map((v, i) => (i === 0 ? p.x + v : p.z + v));
  if (!tower(ix, iz) || perim(expo(ix, iz)) || P.has(K(ix, p.y, iz))) continue;
  const h = (p.x * 5 + p.z * 3 + p.s * 7) % 4;
  if (p.y === p.b + 3 && h === 0) put(ix, p.y, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 6. connection states for the panes (they join neighbouring panes and solid blocks in their plane)
const solid = (b) => b && !/lantern|door/.test(b);
const conn = (x, y, z) => { const e = get(x, y, z); return !!e && solid(e.block); };
const str = (v) => (v ? "true" : "false");
for (const p of panes) {
  const e = get(p.x, p.y, p.z);
  if (!e || !/glass_pane$/.test(e.block)) continue;
  e.state = {
    north: str(conn(p.x, p.y, p.z - 1)), south: str(conn(p.x, p.y, p.z + 1)),
    east: str(conn(p.x + 1, p.y, p.z)), west: str(conn(p.x - 1, p.y, p.z)), waterlogged: "false",
  };
}

// 7. sanity: nothing hanging. A block needs the block under it, or a block beside it at its own level (a lintel or
// floor edge spanning a window pocket); a hung lantern needs the block above it
let loose = 0;
for (const [k, e] of P) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0) continue;
  const hung = e.block === "lantern" && e.state?.hanging === "true";
  const beside = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].some(([a, c]) => get(a, y, c));
  const ok = hung ? get(x, y + 1, z) : get(x, y - 1, z) || beside;
  if (!ok) { loose++; if (loose <= 12) console.log("loose", k, e.block); }
}
if (loose) throw new Error(`${loose} unsupported blocks`);

// write it
const g = new Voxels([W, H, D]);
for (const [k, e] of P) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, e.block, e.state); }
const out = g.save(OUT);
console.log(`built: ${towers.length} tower cells, ${plazas.length} plaza cells, ${ahus.length} roof units, ${panes.length} glazed facade cells, front ${front}; ${out.blocks} blocks, ${out.palette} palette`);
