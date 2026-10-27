// Way 1095570505, Mt Eden / Eden Terrace: a two-storey brick shop block (interwar commercial, cream plaster bands,
// basalt plinth, shopfront at street level). Footprint and roof heights come from the lidar cells file; the facade
// is laid over the footprint's own outline, so the concave bays and the stepped edges stay where the record puts them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1095570505.cells.json`, "utf8"));

const W = 11, H = 20, D = 9;
const FOOT = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const has = (x, z) => FOOT.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const interior = (x, z) => has(x, z) && exposed(x, z).length === 0;
const LIGHT = new Set(["glowstone", "lantern"]);

// block map first, so panes can read their neighbours and carves can remove what was placed
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const carve = (x, y, z) => B.delete(`${x},${y},${z}`);

// the main street face: the single-exposure face with the most cells; its middle cell takes the door
const faceCount = {};
for (const [x, z] of [...FOOT.keys()].map((k) => k.split(",").map(Number))) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const key = FACING[`${ex[0][0]},${ex[0][1]}`];
  faceCount[key] = (faceCount[key] ?? 0) + 1;
}
const streetFace = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0]?.[0];
const doorCands = [];
for (const [k] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0];
  if (FACING[`${dx},${dz}`] !== streetFace || !interior(x - dx, z - dz)) continue;
  doorCands.push({ x, z, dx, dz, a: dx ? z : x });
}
doorCands.sort((p, q) => p.a - q.a);
const door = doorCands[Math.floor(doorCands.length / 2)] ?? null;

const upperGlass = [], shopGlass = [];
for (const [k, { g, r }] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const top = r;                                   // the lidar roof height above y 0: top layer is top-1
  const F = top - 4, U0 = top - 3, U1 = top - 2, CN = top - 1;   // fascia, upper window rows, cornice/roof
  for (let y = 0; y < g; y++) put(x, y, z, "stone");           // foundation under any sloped ground
  // interior: solid mass, a roof deck on top; the air gaps behind the glass are carved below
  for (let y = 0; y < top; y++) put(x, y, z, y === 0 ? "stone" : y === CN ? "gray_concrete" : "bricks");
  const ex = exposed(x, z);
  if (!ex.length) continue;                                     // interior cell, nothing more
  put(x, 0, z, "stone_bricks");                                 // basalt plinth course
  // a corner turns both ways; a face cell takes its pattern from its (first) outward side
  const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
  const [dx, dz] = ex[0];
  const a = dx ? z : x;                                         // position along the face
  const inward = [x - dx, z - dz];
  // a window is a pane on the wall line; its air gap is carved only where the cell behind is interior (thin walls keep the pane flush)
  const glassOK = !corner && has(...inward) && !(door && door.x === x && door.z === z);
  const gapOK = glassOK && interior(...inward);
  const shopPier = a % 3 === 0, upPier = a % 2 === 0;
  for (let y = 1; y < top; y++) {
    if (corner || y === CN || y === F) { put(x, y, z, "smooth_quartz"); continue; }
    const glass = { x, y, z, ix: inward[0], iz: inward[1], gap: gapOK, U0 };
    if (y < F) {
      if (shopPier || !glassOK) put(x, y, z, "stone_bricks");
      else { put(x, y, z, "glass_pane"); shopGlass.push(glass); }
    } else if (upPier || !glassOK) put(x, y, z, "bricks");
    else { put(x, y, z, "glass_pane"); upperGlass.push(glass); }
  }
}

// the entrance: a dark oak door on the street face, a hood of stairs over it, the air behind it carved
if (door) {
  const { x, z, dx, dz } = door;
  const facing = FACING[`${-dx},${-dz}`];
  const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(x, 1, z, "dark_oak_door", doorState("lower"));
  put(x, 2, z, "dark_oak_door", doorState("upper"));
  put(x, 3, z, "dark_oak_stairs", { facing: FACING[`${dx},${dz}`], half: "top", shape: "straight", waterlogged: "false" });
  carve(x - dx, 1, z - dz); carve(x - dx, 2, z - dz);
  // the door cell's own upper storey stays solid brick above the hood
  put(x, 4, z, "bricks"); put(x, 5, z, "bricks");
}

// windows: the air gap behind each pane; a glowstone behind every third upper window, a lantern in every other shop bay
const gapped = (ws) => ws.filter((w) => w.gap);
for (const w of gapped([...upperGlass, ...shopGlass])) carve(w.ix, w.y, w.iz);
gapped(upperGlass).filter((w) => w.y === w.U0).forEach((w, i) => { if (i % 3 === 1) put(w.ix, w.y, w.iz, "glowstone"); });
gapped(shopGlass).filter((w) => w.y === 1).forEach((w, i) => { if (i % 2 === 0) put(w.ix, 1, w.iz, "lantern", { hanging: "false", waterlogged: "false" }); });

// a pane joins its neighbours that are walls or panes (not light, not air): the glass sits in the bay, not on a post
for (const [k, v] of [...B]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const link = (nx, nz) => { const n = B.get(`${nx},${y},${nz}`); return n && n.block !== "air" && !LIGHT.has(n.block) ? "true" : "false"; };
  v.state = { north: link(x, z - 1), south: link(x, z + 1), east: link(x + 1, z), west: link(x - 1, z), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${dir}/way_1095570505.nbt`);
console.log(`way_1095570505: ${out.blocks} blocks, ${out.palette} palette entries, door on ${streetFace ?? "none"}, ${upperGlass.length} upper panes, ${shopGlass.length} shop panes`);
