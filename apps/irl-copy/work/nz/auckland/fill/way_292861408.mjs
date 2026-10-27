// Portland Tower, Auckland CBD: a 1980s concrete-frame office tower with tinted glazing. A 17-storey slab (68 blocks
// to the roof, lidar 67-69) on a 7-storey wing, stepped down to a podium base. The lidar roof heights are snapped to
// storey lines (4 blocks, offset so storey 0 starts at y 1) and each column is solid from y 0 to its roof. Only the
// footprint cells are built. The facade is a 1-cell shell (glass panes between white concrete piers, spandrel and
// transom bands) with an air gap behind it; the floor plates are carried by perimeter walls and a 3-cell column grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861408.cells.json", "utf8"));

const W = 36, D = 21, H = 82;
// storey-aligned roof tiers (R = 4k+1 so the last block is a head band): wing 29, mid 37/45/53/61, tower 69
const TIERS = [5, 13, 21, 29, 37, 45, 53, 61, 69];
const snap = (v) => TIERS.reduce((best, t) => (Math.abs(t - v) <= Math.abs(best - v) ? t : best), TIERS[0]);

const fp = new Map();                                  // "x,z" -> { g, R }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, R: snap(r) });
const inFp = (x, z) => fp.has(`${x},${z}`);
const R = (x, z) => (inFp(x, z) ? fp.get(`${x},${z}`).R : 0);

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
// faces of column (x,z) at height y whose neighbour is outside the footprint or has no block at y
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) <= y).map(([f]) => f);

const B = new Map();                                   // "x,y,z" -> { block, state }
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(key(x, y, z), { block, state });

const PIER = "white_concrete", SPANDREL = "light_gray_concrete", BASE = "polished_andesite", TRANSOM = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane", PARAPET = "white_concrete", FILL = "light_gray_concrete";
const COLUMN = "white_concrete";
const hash = (a, b, c) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0;

// the entrance: the first run of three storey-0 south-facing cells, centred on the middle one
let entrance = null;
for (let z = D - 1; z >= 0 && !entrance; z--) for (let x = 1; x < W - 1 && !entrance; x++) {
  const run = [-1, 0, 1].map((d) => [x + d, z]);
  if (run.every(([a, c]) => inFp(a, c) && exposed(a, c, 1).includes("south"))) entrance = { x, z, facing: "south" };
}
if (!entrance) throw new Error("no south-facing entrance run");

// the ground: solid from y 0 under every footprint cell (the plinth, or the foundation over a 1-block slope)
for (const [k, { R: r }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const edge = exposed(x, z, 0).length > 0;
  put(x, 0, z, edge ? BASE : FILL);
}

for (const [k, { R: top }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 1; y < top; y++) {
    const sy = y - 1, s = Math.floor(sy / 4), r = sy % 4;
    const faces = exposed(x, z, y);
    if (y === top - 1) {                                 // the roof cap: a cornice on the edge, roof slab inside
      put(x, y, z, faces.length ? TRANSOM : FILL);
      continue;
    }
    if (faces.length === 0) {                            // interior: a floor plate per storey, a column grid, air between
      if (r === 0) put(x, y, z, FILL);
      else if (x % 3 === 0 && z % 3 === 0) put(x, y, z, COLUMN);
      continue;
    }
    const corner = (faces.includes("north") || faces.includes("south")) && (faces.includes("east") || faces.includes("west"));
    const alongX = faces.includes("north") || faces.includes("south");   // the wall runs along x
    const along = alongX ? x : z;
    if (s === 0 && x === entrance.x && z === entrance.z) {              // the door: a 2-high opening on the floor at y 1
      if (y === 1) put(x, y, z, "dark_oak_door", { facing: entrance.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) put(x, y, z, "dark_oak_door", { facing: entrance.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, SPANDREL);                                       // the lintel over the door
      continue;
    }
    if (r === 0) { put(x, y, z, s === 0 ? BASE : SPANDREL); continue; }
    if (r === 3) { put(x, y, z, TRANSOM); continue; }
    if (corner || along % 3 === 0) { put(x, y, z, PIER); continue; }
    put(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  // the parapet on the roof edge, one block above the cap
  if (exposed(x, z, top - 1).length) put(x, top, z, PARAPET);
}

// the entrance canopy: a lintel course over the door run, and its soffit one cell in
for (const d of [-1, 0, 1]) {
  const x = entrance.x + d;
  put(x, 4, entrance.z, TRANSOM);
  const inward = [0, -1];                                // one cell into the building (north from a south wall)
  if (inFp(x, entrance.z + inward[1])) put(x, 4, entrance.z + inward[1], SPANDREL);
}

// warm light in a few windows: a glowstone on the first interior cell behind the glass (on the floor plate)
const lights = [];
for (const k of B.keys()) {
  const [x, y, z] = k.split(",").map(Number);
  const b = B.get(k);
  if (b.block !== GLASS || y % 4 !== 2) continue;
  const faces = exposed(x, z, y);
  if (!faces.length) continue;
  const f = faces[0];
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || exposed(ix, iz, y).length || B.has(key(ix, y, iz))) continue;
  if (hash(x, y, z) % 3 === 0) lights.push([ix, y, iz]);
}
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

// roof plant on the tower: a lift and plant room over a 4 x 3 patch of the top roof
for (let x = 18; x < 22; x++) for (let z = 8; z < 11; z++) {
  if (R(x, z) !== 69) continue;
  for (let y = 69; y < 72; y++) put(x, y, z, FILL);
  put(x, 72, z, "smooth_stone");
}

// glass panes connect to the neighbouring panes and full blocks, so each window runs as a frame of glass
const FULL = new Set([PIER, SPANDREL, BASE, TRANSOM, FILL, COLUMN, PARAPET, "glowstone", "stone"]);
for (const k of B.keys()) {
  const b = B.get(k);
  if (b.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  const st = { waterlogged: "false" };
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = B.get(key(x + dx, y, z + dz));
    st[d] = n && (n.block === GLASS || FULL.has(n.block)) ? "true" : "false";
  }
  b.state = st;
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861408.nbt";
const info = g.save(out);
console.log(JSON.stringify({ entrance, lights: lights.length, ...info }));
