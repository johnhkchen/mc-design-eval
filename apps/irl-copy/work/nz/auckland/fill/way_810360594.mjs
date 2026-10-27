// Australis House (OSM way 810360594): a 1970s-80s six-storey office block on a four-storey podium, its upper two storeys
// set back 2 blocks with a roof terrace between, and a plant core on the roof spine. Massing follows the lidar roof
// (about 26 over most of the footprint, 28 along the central spine), smoothed into tiers. White concrete walls, light
// grey storey lines and mullions, tinted glass panes in a 3-block bay rhythm, a stone base, a recessed west entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_810360594.cells.json`, "utf8"));

const WALL = "white_concrete", FRAME = "light_gray_concrete", BASE = "stone_bricks", GLASS = "light_blue_stained_glass_pane";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const g = new Voxels([33, 41, 41]);

// ---- footprint and its inset tiers -------------------------------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const F = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => F.has(key(x, z));
// distance in cells from the outside edge: 1 = the edge, 2 = the next ring in
const dist = new Map();
let frontier = cells.filter(([x, z]) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))).map(([x, z]) => [x, z]);
frontier.forEach(([x, z]) => dist.set(key(x, z), 1));
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !dist.has(key(nx, nz))) { dist.set(key(nx, nz), d + 1); next.push([nx, nz]); }
  }
  frontier = next;
}
const body = (x, z) => inF(x, z);                                   // podium, storeys 1-4 (and its roof ring)
const setback = (x, z) => inF(x, z) && dist.get(key(x, z)) >= 3;    // storeys 5-6, two blocks in
const core = (x, z) => setback(x, z) && x >= 14 && x <= 18 && z >= 6 && z <= 34; // plant spine, roof lidar 28
const edge = (P, x, z) => P(x, z) && DIRS.some(([dx, dz]) => !P(x + dx, z + dz));
const outwardAxis = (P, x, z) => (!P(x - 1, z) || !P(x + 1, z) ? "x" : "z");
const bayOf = (x, z, axis) => (axis === "x" ? z : x);

// ---- helpers -----------------------------------------------------------------------------------------------------
const panes = new Map();                                            // "x,y,z" -> [x, y, z, axis] for connection states
const put = (x, y, z, block, state) => { panes.delete(`${x},${y},${z}`); g.set(x, y, z, block, state); };
const glass = (x, y, z, axis) => { g.set(x, y, z, GLASS); panes.set(`${x},${y},${z}`, [x, y, z, axis]); };
const has = (x, y, z) => g.get(x, y, z) !== null;

// one storey band (walls from y = b+1 to b+3) on the edge cells of tier P
function facade(P, b, lit) {
  for (let x = 0; x < 33; x++) for (let z = 0; z < 41; z++) {
    if (!edge(P, x, z)) continue;
    const axis = outwardAxis(P, x, z), bay = bayOf(x, z, axis);
    const [ix, iz] = axis === "x" ? [!P(x - 1, z) ? 1 : -1, 0] : [0, !P(x, z - 1) ? 1 : -1];
    put(x, b + 3, z, WALL);                                         // spandrel: white band under each storey's glass
    if (bay % 3 === 0) { put(x, b + 1, z, FRAME); put(x, b + 2, z, FRAME); continue; }   // mullion
    if (bay % 9 === 5) { put(x, b + 1, z, WALL); put(x, b + 2, z, WALL); continue; }      // solid panel
    glass(x, b + 1, z, axis); glass(x, b + 2, z, axis);
    // warm light in some windows: a glowstone or shroomlight on the floor just behind the glass (air gap, slab below)
    const h = (x * 31 + z * 17 + b * 5) % 11, ax = x + ix, az = z + iz;
    if (lit && P(ax, az) && !edge(P, ax, az) && (h === 0 || (h === 6 && b >= 16))) {
      g.set(ax, b + 1, az, h === 0 ? "glowstone" : "shroomlight");
    }
  }
}

// ---- podium (storeys 1-4, y 0-15) --------------------------------------------------------------------------------
for (let x = 0; x < 33; x++) for (let z = 0; z < 41; z++) if (body(x, z)) {
  g.set(x, 0, z, BASE);                                             // plinth
  for (const y of [4, 8, 12, 16]) g.set(x, y, z, FRAME);            // floor slabs (y 16 = podium roof)
  if (!setback(x, z)) g.set(x, 16, z, "smooth_stone");              // roof terrace round the setback
}
for (const b of [0, 4, 8, 12]) facade(body, b, true);

// ---- setback (storeys 5-6, y 16-23), roof y 24 and its coping ----------------------------------------------------
for (let x = 0; x < 33; x++) for (let z = 0; z < 41; z++) if (setback(x, z)) {
  g.set(x, 20, z, FRAME); g.set(x, 24, z, FRAME);
  if (edge(setback, x, z)) g.set(x, 25, z, FRAME);                  // parapet / coping, top at 26
}
for (const b of [16, 20]) facade(setback, b, true);

// ---- plant core on the spine (y 25-28, top at 29) -----------------------------------------------------------------
for (let x = 0; x < 33; x++) for (let z = 0; z < 41; z++) if (core(x, z)) {
  g.set(x, 28, z, FRAME);
  if (!edge(core, x, z)) continue;
  const axis = outwardAxis(core, x, z), bay = bayOf(x, z, axis);
  put(x, 25, z, WALL);
  put(x, 27, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  if (bay % 3 === 0) put(x, 26, z, FRAME); else glass(x, 26, z, axis);
}

// ---- terrace railing, planters and roof plant ---------------------------------------------------------------------
for (let x = 0; x < 33; x++) for (let z = 0; z < 41; z++) {
  if (edge(body, x, z) && !setback(x, z)) put(x, 17, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  else if (body(x, z) && dist.get(key(x, z)) === 2 && (x * 3 + z * 5) % 7 === 0) put(x, 17, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
  // AC units on the setback roof, clear of the core and the coping
  if (setback(x, z) && !edge(setback, x, z) && !core(x, z) && (x * 5 + z * 3) % 13 === 0) put(x, 25, z, "smooth_stone");
}

// ---- interior warm lights: lanterns hanging from each storey's slab above (air gap under it) -----------------------
for (const [P, storeys] of [[body, [0, 4, 8, 12]], [setback, [16, 20]]]) {
  for (let x = 0; x < 33; x++) for (let z = 0; z < 41; z++) {
    if (!P(x, z) || edge(P, x, z)) continue;
    for (const b of storeys) {
      if (dist.get(key(x, z)) > 2 && (x * 7 + z * 3 + b * 5) % 31 === 0) put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// ---- entrance: recessed on the west face at z 20, iron doors, lintel, hanging lantern inside -----------------------
{
  const z = 20, xw = Math.min(...cells.filter(([, zz]) => zz === z).map(([x]) => x));
  const door = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });
  put(xw, 1, z, "iron_door", door("lower"));
  put(xw, 2, z, "iron_door", door("upper"));
  for (const dz of [-1, 1]) { put(xw, 1, z + dz, FRAME); put(xw, 2, z + dz, FRAME); }
  put(xw, 3, z, FRAME); put(xw, 3, z - 1, FRAME); put(xw, 3, z + 1, FRAME);   // lintel across the bay
  put(xw + 1, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- connection states for panes and bars: glass connects along its wall only, bars to any neighbour ---------
for (const [x, y, z, axis] of panes.values()) {
  const s = axis === "x"
    ? { north: has(x, y, z - 1), south: has(x, y, z + 1), east: false, west: false }
    : { north: false, south: false, east: has(x + 1, y, z), west: has(x - 1, y, z) };
  g.set(x, y, z, GLASS, { ...s, waterlogged: "false" });
}

// ---- checks: nothing floats, nothing sits outside the footprint --------------------------------------------------
let floating = 0, outside = 0, blocks = 0;
for (let x = 0; x < 33; x++) for (let y = 0; y < 41; y++) for (let z = 0; z < 41; z++) {
  const c = g.get(x, y, z);
  if (!c) continue;
  blocks++;
  if (!inF(x, z)) outside++;
  if (y === 0) continue;
  const below = g.get(x, y - 1, z) !== null;
  const hanging = c.block === "lantern" && c.state?.hanging === "true";
  if (hanging ? !g.get(x, y + 1, z) : !below) floating++;
}
console.log(`blocks ${blocks}, floating ${floating}, outside footprint ${outside}`);

g.save(`${DIR}/way_810360594.nbt`);
