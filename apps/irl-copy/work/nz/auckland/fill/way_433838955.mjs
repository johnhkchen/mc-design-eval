// An Edwardian brick commercial block on the Eden Terrace side of the Mt Eden ridge: 2 storeys on the low side,
// 3 storeys on the middle, and a 3-storey-plus-attic parapet block on the south-east corner (lidar roofs 9-10, 11-12,
// 13-14). Brick piers and cream plaster bands frame the glass; the ground floor is a shopfront with a stone base and
// a timber-canopied door; the parapet is stone wall on the outside faces. The body is solid massing with a one-block
// air gap behind each window, floor bands every 4 blocks, and warm lights (lanterns, glowstone, shroomlight) in some gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_433838955";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 26, Y = 27, Z = 14;
const STOREY = 4;                                 // blocks per storey: band, two window rows, lintel
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // N, S, W, E
const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;

// ---- footprint and clean tiers ----------------------------------------------------------------------
// Lidar roofs step 9 to 14 cell by cell; they snap to three flat tiers: 2 storeys (roof 8, parapet to 9),
// 3 storeys (roof 12, parapet to 13), and 3 storeys plus a two-row attic (roof 14, parapet to 15).
const tierTop = (roof) => (roof <= 10 ? 8 : roof <= 12 ? 12 : 14);
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, g: ground, T: tierTop(roof), roof });
const at = (x, z) => cell.get(key(x, z));

// A side is exposed at height y when its neighbour is outside the footprint or lower than y.
function exposures(c) {
  return DIRS.map(([dx, dz]) => {
    const n = at(c.x + dx, c.z + dz);
    return { dx, dz, Tn: n ? n.T : 0 };
  }).filter((e) => e.Tn < c.T);
}
const facing = (c, y) => exposures(c).filter((e) => e.Tn <= y);

// ---- plan: every block set once, holes carved after ---------------------------------------------------
const plan = new Map();   // k3 -> { block, state }
const set = (x, y, z, block, state) => plan.set(k3(x, y, z), { block, state });
const air = new Set();    // air gaps behind glass and inside the door
const windows = [];       // { c, y, dx, dz, ground }
const parapets = new Set();

for (const c of cell.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");        // foundation under any slope
  const outside = exposures(c).some((e) => e.Tn === 0);
  if (outside) parapets.add(k3(x, T, z));
  for (let y = g; y < T; y++) {
    const ex = facing(c, y);
    if (ex.length === 0) { set(x, y, z, y === T - 1 ? "smooth_stone" : "bricks"); continue; }
    const corner = ex.length > 1;
    const u = ex[0].dz !== 0 ? x : z;                                 // position along the face
    if (y === T - 1) set(x, y, z, "smooth_quartz");                  // cornice
    else if (y === 0) set(x, y, z, "stone_bricks");                  // base course
    else if (y % STOREY === 0 || y % STOREY === 3) set(x, y, z, "smooth_quartz"); // floor band, lintel, fascia
    else if (corner || u % 3 === 0) set(x, y, z, y < STOREY ? "stone_bricks" : "bricks"); // piers
    else {
      set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      windows.push({ c, y, dx: ex[0].dx, dz: ex[0].dz, ground: y < STOREY });
    }
  }
}

// Air gap behind each window: the interior cell one step in from the glass, when that cell is not itself a face.
const carved = [];
for (const w of windows) {
  const ix = w.c.x - w.dx, iz = w.c.z - w.dz, inner = at(ix, iz);
  if (!inner || inner.T <= w.y) continue;
  if (exposures(inner).some((e) => e.Tn <= w.y)) continue;
  air.add(k3(ix, w.y, iz));
  carved.push({ ...w, ix, iz });
}

// Pane connections: a run of glass along a face joins its neighbours in that face's plane.
for (const w of windows) {
  const run = w.dz !== 0 ? "east" : "north";
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (run === "east") { state.east = "true"; state.west = "true"; } else { state.north = "true"; state.south = "true"; }
  plan.set(k3(w.c.x, w.y, w.c.z), { block: "glass_pane", state });
}

// Entrance: the middle ground-floor glass bay of the outside face with the most of them.
const doorCands = carved.filter((w) => w.ground && w.y === 1  && exposures(w.c).some((e) => e.Tn === 0) && w.c.x % 3 === 1);
const byDir = new Map();
for (const w of doorCands) { const k = key(w.dx, w.dz); byDir.set(k, [...(byDir.get(k) || []), w]); }
const [, faceRun] = [...byDir.entries()].sort((a, b) => b[1].length - a[1].length)[0];
const door = faceRun[Math.floor(faceRun.length / 2)];
const doorState = (half) => ({ facing: FACING[key(door.dx, door.dz)], half, hinge: "left", open: "false", powered: "false" });
set(door.c.x, 1, door.c.z, "dark_oak_door", doorState("lower"));
set(door.c.x, 2, door.c.z, "dark_oak_door", doorState("upper"));
air.add(k3(door.ix, 2, door.iz));   // the door's pocket is two gaps high
// timber canopy over the door bay: the lintel row becomes a dark-oak top slab across the three cells of the bay
for (const o of [-1, 0, 1]) {
  const cx = door.c.x + (door.dz !== 0 ? o : 0), cz = door.c.z + (door.dz === 0 ? o : 0);
  const cc = at(cx, cz);
  if (cc && exposures(cc).some((e) => e.dx === door.dx && e.dz === door.dz && e.Tn === 0)) {
    set(cx, 3, cz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

// Warm lights in some gaps: lanterns stand on the floor band in the lower window row; glowstone and shroomlight
// sit in the gap behind the glass (ground-floor shops and upper storeys alike).
for (const w of carved) {
  if (w === door || (w.c === door.c && w.y <= 2)) continue;
  const h = (w.c.x * 7 + w.c.z * 3 + w.y * 5) % 12;
  let light = null;
  if (w.y % STOREY === 1 && h === 0) light = ["lantern", { hanging: "false", waterlogged: "false" }];
  else if (h === 5) light = ["glowstone"];
  else if (h === 9 && w.y % STOREY === 2) light = ["shroomlight"];
  if (light) { air.delete(k3(w.ix, w.y, w.iz)); set(w.ix, w.y, w.iz, ...light); }
}

// Parapets: stone wall on the outside faces, joined to the parapet cells beside it.
for (const p of parapets) {
  const [x, y, z] = p.split(",").map(Number);
  const link = (dx, dz) => parapets.has(k3(x + dx, y, z + dz));
  set(x, y, z, "stone_brick_wall", {
    north: link(0, -1) ? "low" : "none", south: link(0, 1) ? "low" : "none",
    east: link(1, 0) ? "low" : "none", west: link(-1, 0) ? "low" : "none",
    up: "true", waterlogged: "false",
  });
}

// Roof plant on the tiers above 8: a few iron air-handling boxes on the roof membrane, away from the parapet.
for (const c of cell.values()) {
  if (c.T < 12 || exposures(c).length) continue;
  if ((c.x * 3 + c.z * 7) % 11 === 0) set(c.x, c.T, c.z, "iron_block");
}

// Apply: the plan, minus the air gaps (holes are never filled).
const g = new Voxels([X, Y, Z]);
for (const [k, b] of plan) {
  if (air.has(k)) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}

const out = `${DIR}/${NAME}.nbt`;
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ out, blocks, palette, windows: windows.length, carved: carved.length, door: [door.c.x, door.c.z] }));
