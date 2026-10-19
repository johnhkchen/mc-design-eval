// 3550 West Pacific Avenue (Miscellaneous/Mixed-Use), Presidio Tunnel Tops frame.
// Era: 1930s Moderne mixed-use. Cream walls on a grey base course, sandstone storey bands, a tall shopfront
// storey and five two-block storeys (six storeys, roof at y 14), a stepped roof terrace with a penthouse core.
// Walls are two cells thick (ring 1 = facade, ring 2 = the cell behind it, an air gap behind the glass);
// everything inside is air except floor slabs. Built only on the footprint cells, ground-level foundation below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0000997.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill/201006.0000997.nbt";

const g = new Voxels([34, 26, 33]);

const WALL = "white_concrete", BAND = "smooth_sandstone", BASE = "polished_andesite";
const FLOOR = "stone", ROOF = "gray_concrete", GLASS = "glass_pane";
const STOREY_BANDS = [4, 6, 8, 10, 12];          // floor slabs; the window row sits one block above each
const WINDOW_ROWS = [5, 7, 9, 11, 13];
const CORNICE = 14;                              // roof deck top at y 15 (terrace walking level)

const S = new Set(CELLS.map(([x, z]) => `${x},${z}`));
const inS = (x, z) => S.has(`${x},${z}`);
const cells = CELLS.map(([x, z, ground]) => ({ x, z, ground }));
const H3 = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;   // deterministic scatter

// Ring depth from outside: 1 = facade cell, 2 = the cell behind it, and so on.
const depth = new Map();
let frontier = [];
for (const { x, z } of cells) if (!inS(x - 1, z) || !inS(x + 1, z) || !inS(x, z - 1) || !inS(x, z + 1)) { depth.set(`${x},${z}`, 1); frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (inS(nx, nz) && !depth.has(k)) { depth.set(k, d + 1); next.push([nx, nz]); }
  }
  frontier = next;
}
const dOf = (x, z) => depth.get(`${x},${z}`);
const maxD = Math.max(...depth.values());
const PT = maxD - 4;                             // penthouse walls at rings PT and PT+1; core inside

// Facade normal (outward) and the coordinate that runs along the face, which sets the bay rhythm.
function faceOf(x, z) {
  if (!inS(x - 1, z)) return { n: [-1, 0], u: z };
  if (!inS(x + 1, z)) return { n: [1, 0], u: z };
  if (!inS(x, z - 1)) return { n: [0, -1], u: x };
  return { n: [0, 1], u: x };
}

// Main entrance: the face with the most facade cells, the door at the cell nearest its middle.
const faceCount = {};
for (const { x, z } of cells) if (dOf(x, z) === 1) { const k = faceOf(x, z).n.join(); faceCount[k] = (faceCount[k] || 0) + 1; }
const mainN = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const front = cells.filter(({ x, z }) => dOf(x, z) === 1 && faceOf(x, z).n.join() === mainN);
const meanU = front.reduce((s, c) => s + faceOf(c.x, c.z).u, 0) / front.length;
const door = front.reduce((best, c) => (Math.abs(faceOf(c.x, c.z).u - meanU) < Math.abs(faceOf(best.x, best.z).u - meanU) ? c : best));
const doorU = faceOf(door.x, door.z).u;
const doorKey = `${door.x},${door.z}`;
const flank = new Set(front.filter((c) => Math.abs(faceOf(c.x, c.z).u - doorU) === 1).map((c) => `${c.x},${c.z}`));
const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const doorFacing = FACING[mainN];

const blocks = new Map();                        // "x,y,z" -> [block, state]
const put = (x, y, z, b, st) => blocks.set(`${x},${y},${z}`, [b, st]);
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);
const LANTERN_UP = { hanging: "false", waterlogged: "false" }, LANTERN_DOWN = { hanging: "true", waterlogged: "false" };

// Pass 1: facade (ring 1). Shopfront below y 3, storeys above, cornice and parapet on top.
for (const { x, z } of cells) {
  if (dOf(x, z) !== 1) continue;
  const f = faceOf(x, z), pat = ((f.u % 4) + 4) % 4, k = `${x},${z}`;
  for (let y = 0; y <= 15; y++) {
    if (y === 0 || y === 3) { put(x, y, z, BASE); continue; }
    if (y <= 2) {
      if (k === doorKey) { put(x, y, z, "dark_oak_door", { facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (flank.has(k)) { if (y === 1) put(x, y, z, BASE); else put(x, y, z, "lantern", LANTERN_DOWN); continue; }
      if (pat === 0) put(x, y, z, BASE); else put(x, y, z, GLASS);
      continue;
    }
    if (STOREY_BANDS.includes(y) || y === CORNICE) { put(x, y, z, BAND); continue; }
    if (WINDOW_ROWS.includes(y)) { if (pat === 1 || pat === 2) put(x, y, z, GLASS); else put(x, y, z, WALL); continue; }
    if (y === 15) put(x, y, z, WALL);            // parapet
  }
}

// Pass 2: the cell behind the facade (ring 2). Air behind glass (a gap), a warm light in some, wall elsewhere.
for (const { x, z } of cells) {
  if (dOf(x, z) !== 2) continue;
  for (let y = 0; y <= 14; y++) {
    const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => at(x + dx, y, z + dz)).filter(Boolean);
    if (y === 0) { put(x, y, z, BASE); continue; }
    if ((y === 1 || y === 2) && around.some((b) => b[0] === "dark_oak_door")) continue;   // inside the entrance
    if (around.some((b) => b[0] === GLASS)) {
      const h = H3(x, y, z);
      if (y === 2 && h % 13 === 0) put(x, y, z, "shroomlight");
      else if (y === 1 && h % 7 === 0) put(x, y, z, "lantern", LANTERN_UP);
      else if (y <= 2 ? h % 4 === 0 : h % 9 === 0) put(x, y, z, "glowstone");   // warm shop light, sparse upper lamps
      continue;                                  // otherwise air: the gap behind the glass
    }
    put(x, y, z, WALL);
  }
}

// Pass 3: interior (air, with floor slabs), roof deck, terrace, penthouse core.
for (const { x, z } of cells) {
  const d = dOf(x, z);
  if (d <= 2) continue;
  put(x, 0, z, FLOOR);                           // foundation / ground floor slab
  for (const y of STOREY_BANDS) put(x, y, z, FLOOR);
  put(x, CORNICE, z, ROOF);                      // roof deck; top at y 15 is the terrace
  if (d >= PT) put(x, 17, z, BAND);              // penthouse cap over walls and core
  if (d >= PT && d <= PT + 1) {                  // penthouse walls
    put(x, 15, z, WALL);
    if (d === PT && ((x + z) % 4 === 1 || (x + z) % 4 === 2)) put(x, 16, z, GLASS);
    else put(x, 16, z, WALL);
    continue;
  }
  if (d >= PT) continue;                         // core is air
  if (d === 3 && H3(x, 15, z) % 9 === 0 && (x + z) % 3 === 0) {       // fence posts with lanterns on the terrace edge
    put(x, 15, z, "oak_fence"); put(x, 16, z, "lantern", LANTERN_UP);
  } else if (d <= 4 && H3(x, 15, z) % 37 === 0) {                     // roof equipment
    put(x, 15, z, "waxed_oxidized_copper");
  } else if (H3(x, 15, z) % 11 === 0) {                                // a little planting
    put(x, 15, z, "moss_carpet");
  }
}

// Glass panes connect to the solid or glass neighbours beside them in the plane of the wall.
const side = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
for (const [k, [b]] of blocks) {
  if (b !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const st = Object.fromEntries(side.map(([name, dx, dz]) => [name, at(x + dx, y, z + dz) ? "true" : "false"]));
  blocks.set(k, [b, { ...st, waterlogged: "false" }]);
}

for (const [k, [b, st]] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, st);
}

const info = g.save(OUT);
console.log(`built 201006.0000997: footprint ${cells.length} cells, max ring ${maxD}, penthouse at ring ${PT}, entrance on ${doorFacing} face, ${info.blocks} blocks, ${info.palette} palette`);
